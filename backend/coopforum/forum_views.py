from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.contenttypes.models import ContentType
from .models import Post, Comment, Vote
from .serializers import PostSerializer, CommentSerializer
from django.contrib.auth import login as auth_login, logout as auth_logout
from django.contrib.auth.models import User
from django.db.models import Q
import logging

logger = logging.getLogger(__name__)
# --- API ViewSets for Posts and Comments ---

class PostViewSet(viewsets.ModelViewSet):
    """
    API endpoints for CRUD operations on Posts.
    All endpoints require authentication.
    Endpoints:
      - GET /api/coopforum/posts/ : List all posts
      - POST /api/coopforum/posts/ : Create a new post
      - GET /api/coopforum/posts/{id}/ : Retrieve post details
      - PUT/PATCH /api/coopforum/posts/{id}/ : Update post
      - DELETE /api/coopforum/posts/{id}/ : Delete post (soft delete)
      - GET /api/coopforum/posts/{id}/comments/ : List comments for a post
      - POST /api/coopforum/posts/{id}/vote/ : Upvote/downvote a post
      - GET /api/coopforum/posts/search/?q=... : Search posts by text
    Usage (frontend):
        - Use for all post-related actions, voting, and searching.
    """
    queryset = Post.objects.filter(is_deleted=False).order_by('-created_at')
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        """Override to automatically set the user when creating a post"""
        post = serializer.save(user=self.request.user)
        logger.info(f"Post created by user {self.request.user.username} (ID: {self.request.user.id}): '{post.title}' (Post ID: {post.id})")

    def perform_update(self, serializer):
        """Override to ensure user can only update their own posts"""
        post = serializer.save()
        logger.info(f"Post updated by user {self.request.user.username} (ID: {self.request.user.id}): '{post.title}' (Post ID: {post.id})")

    @action(detail=True, methods=['get'], url_path='comments')
    def comments(self, request, pk=None):
        """
        GET /api/coopforum/posts/{id}/comments/
        Returns all non-deleted comments for a post.
        Response: List of comment objects.
        Usage (frontend):
            - Call to display comments for a post.
        """
        post = self.get_object()
        comments = post.comments.filter(is_deleted=False)
        comment_count = comments.count()
        
        logger.debug(f"Comments requested for post {post.id} by user {request.user.username}: {comment_count} comments found")
        
        serializer = CommentSerializer(comments, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='vote')
    def vote(self, request, pk=None):
        """
        POST /api/coopforum/posts/{id}/vote/
        Request: JSON { "value": 1 } or { "value": -1 }
        Response: JSON with updated post data including score and userVote
        """
        post = self.get_object()
        value = request.data.get('value')
        
        logger.debug(f"Vote attempt on post {post.id} by user {request.user.username}: value={value}")
        
        if value not in [1, -1]:
            logger.warning(f"Invalid vote value {value} for post {post.id} by user {request.user.username}")
            return Response({'error': 'Value must be 1 or -1'}, status=status.HTTP_400_BAD_REQUEST)
        
        post_content_type = ContentType.objects.get_for_model(Post)
        
        # Get or create vote
        vote, created = Vote.objects.get_or_create(
            user=request.user,
            content_type=post_content_type,
            object_id=post.id,
            defaults={'value': value}
        )
        
        action_taken = ""
        if not created:
            if vote.value == value:
                # Same vote - remove it (toggle off)
                vote.delete()
                action_taken = "removed"
            else:
                # Different vote - update it
                vote.value = value
                vote.save()
                action_taken = "changed"
        else:
            action_taken = "created"
        
        logger.info(f"Vote {action_taken} on post {post.id}: value={value}")
        
        # Return updated post data using serializer
        serializer = PostSerializer(post, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='search')
    def search(self, request):
        """
        GET /api/coopforum/posts/search/?q=...
        Searches posts by text.
        Response: JSON { "query": "...", "count": ..., "results": [...] }
        Usage (frontend):
            - Use for searching posts by keywords.
        """
        query = request.query_params.get('q', '').strip()
        
        logger.info(f"Post search : query='{query}'")
        
        posts = Post.objects.filter(
            Q(title__icontains=query) |
            Q(content__icontains=query) |
            Q(job_title__icontains=query) |
            Q(organization__icontains=query),
            is_deleted = False
        ).order_by('-created_at')
        
        result_count = posts.count()
        logger.info(f"Post search completed: query='{query}', results={result_count}")
        
        serializer = PostSerializer(posts, many=True)
        return Response({
            'query': query,
            'count': result_count,
            'results': serializer.data
        })

class CommentViewSet(viewsets.ModelViewSet):
    """
    API endpoints for CRUD operations on Comments (nested replies supported).
    All endpoints require authentication.
    Endpoints:
      - GET /api/coopforum/comments/ : List all comments (rarely used)
      - POST /api/coopforum/comments/ : Create a comment or reply
      - GET /api/coopforum/comments/{id}/ : Retrieve comment details
      - POST /api/coopforum/comments/{id}/vote/ : Upvote/downvote a comment
    Usage (frontend):
        - Use for comment creation, voting, and displaying nested replies.
    """
    queryset = Comment.objects.filter(is_deleted=False).order_by('tree_id', 'lft')
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        """
        Automatically sets the user when creating a comment.
        """
        comment = serializer.save(user=self.request.user)
        post_info = f"post {comment.post.id}" if comment.post else "no post"
        parent_info = f"parent comment {comment.parent.id}" if comment.parent else "top-level"
        
        logger.info(f"Comment created by user {self.request.user.username} (ID: {self.request.user.id}): "
                   f"Comment ID {comment.id} on {post_info} ({parent_info})")

    @action(detail=True, methods=['post'], url_path='vote')
    def vote(self, request, pk=None):
        """
        POST /api/coopforum/comments/{id}/vote/
        Request: JSON { "value": 1 } or { "value": -1 }
        Response: JSON with updated comment data including score and userVote
        """
        comment = self.get_object()
        value = request.data.get('value')
        
        logger.debug(f"Vote attempt on comment {comment.id} by user {request.user.username}: value={value}")
        
        if value not in [1, -1]:
            logger.warning(f"Invalid vote value {value} for comment {comment.id} by user {request.user.username}")
            return Response({'error': 'Value must be 1 or -1'}, status=status.HTTP_400_BAD_REQUEST)
        
        comment_content_type = ContentType.objects.get_for_model(Comment)
        
        # Get or create vote
        vote, created = Vote.objects.get_or_create(
            user=request.user,
            content_type=comment_content_type,
            object_id=comment.id,
            defaults={'value': value}
        )
        
        action_taken = ""
        if not created:
            if vote.value == value:
                # Same vote - remove it (toggle off)
                vote.delete()
                action_taken = "removed"
            else:
                # Different vote - update it
                vote.value = value
                vote.save()
                action_taken = "changed"
        else:
            action_taken = "created"
        
        logger.info(f"Vote {action_taken} on comment {comment.id} by user {request.user.username}: value={value}")
        
        # Return updated comment data using serializer
        serializer = CommentSerializer(comment, context={'request': request})
        return Response(serializer.data)