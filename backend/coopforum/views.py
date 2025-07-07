from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.contenttypes.models import ContentType
from .models import Post, Comment, Vote
from .serializers import PostSerializer, CommentSerializer
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
import json
from django.db.models import Q

def index(request):
    """
    Renders the CoopForum main page.
    """
    return render(request, 'coopforum/index.html')

# Authentication Views

@csrf_exempt
@require_http_methods(["POST"])
def login_view(request):
    """
    POST /api/auth/login/
    Request: JSON { "username": "...", "password": "..." }
    Response: JSON { "user": { "id": ..., "username": "...", "email": "..." } }
    Usage (frontend):
        - Call to log in user and receive user info for session.
    """
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return JsonResponse({'error': 'Username and password required'}, status=400)
        
        user = authenticate(request, username=username, password=password)
        if user is not None:
            auth_login(request, user)
            return JsonResponse({
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                }
            })
        else:
            return JsonResponse({'error': 'Invalid credentials'}, status=401)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def logout_view(request):
    """
    POST /api/auth/logout/
    Logs out the current user.
    Response: JSON { "message": "Logged out successfully" }
    Usage (frontend):
        - Call to log out user and clear session.
    """
    auth_logout(request)
    return JsonResponse({'message': 'Logged out successfully'})

@require_http_methods(["GET"])
def user_view(request):
    """
    GET /api/auth/user/
    Returns current authenticated user info.
    Response: JSON { "user": { ... } } or { "error": "Not authenticated" }
    Usage (frontend):
        - Call on page load to check if user is logged in.
    """
    if request.user.is_authenticated:
        return JsonResponse({
            'user': {
                'id': request.user.id,
                'username': request.user.username,
                'email': request.user.email
            }
        })
    else:
        return JsonResponse({'error': 'Not authenticated'}, status=401)

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
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        """Override to ensure user can only update their own posts"""
        serializer.save()

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
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='vote')
    def vote(self, request, pk=None):
        """
        POST /api/coopforum/posts/{id}/vote/
        Request: JSON { "value": 1 } or { "value": -1 }
        Response: JSON { "message": ... }
        Usage (frontend):
            - Call to upvote or downvote a post.
        """
        post = self.get_object()
        value = request.data.get('value')
        
        if value not in [1, -1]:
            return Response({'error': 'Value must be 1 or -1'}, status=status.HTTP_400_BAD_REQUEST)
        
        post_content_type = ContentType.objects.get_for_model(Post)
        
        # Get or create vote
        vote, created = Vote.objects.get_or_create(
            user=request.user,
            content_type=post_content_type,
            object_id=post.id,
            defaults={'value': value}
        )
        
        if not created:
            if vote.value == value:
                # Same vote - remove it (toggle off)
                vote.delete()
                return Response({'message': 'Vote removed'})
            else:
                # Different vote - update it
                vote.value = value
                vote.save()
                return Response({'message': 'Vote updated'})
        
        return Response({'message': 'Vote created'})

    @action(detail=False, methods=['get'], url_path='search')
    def search(self, request):
        """
        GET /api/coopforum/posts/search/?q=...
        Returns posts matching the search query in title, content, job_title, or organization.
        Response: JSON { "query": "...", "count": N, "results": [...] }
        Usage (frontend):
            - Call to implement search functionality.
        """
        query = request.query_params.get('q', '').strip().lower()
        
        if not query:
            return Response({'error': 'Search query is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Search across title, content, job_title, and organization fields
        posts = Post.objects.filter(
            is_deleted=False
        ).filter(
            Q(title__icontains=query) |
            Q(content__icontains=query) |
            Q(job_title__icontains=query) |
            Q(organization__icontains=query)
        ).order_by('-created_at')
        
        serializer = self.get_serializer(posts, many=True)
        return Response({
            'query': query,
            'count': posts.count(),
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
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'], url_path='vote')
    def vote(self, request, pk=None):
        """
        POST /api/coopforum/comments/{id}/vote/
        Request: JSON { "value": 1 } or { "value": -1 }
        Response: JSON { "message": ... }
        Usage (frontend):
            - Call to upvote or downvote a comment.
        """
        comment = self.get_object()
        value = request.data.get('value')
        
        if value not in [1, -1]:
            return Response({'error': 'Value must be 1 or -1'}, status=status.HTTP_400_BAD_REQUEST)
        
        comment_content_type = ContentType.objects.get_for_model(Comment)
        
        # Get or create vote
        vote, created = Vote.objects.get_or_create(
            user=request.user,
            content_type=comment_content_type,
            object_id=comment.id,
            defaults={'value': value}
        )
        
        if not created:
            if vote.value == value:
                # Same vote - remove it (toggle off)
                vote.delete()
                return Response({'message': 'Vote removed'})
            else:
                # Different vote - update it
                vote.value = value
                vote.save()
                return Response({'message': 'Vote updated'})
        
        return Response({'message': 'Vote created'})