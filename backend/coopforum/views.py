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
    return render(request, 'coopforum/index.html')
# Authentication Views
@csrf_exempt
@require_http_methods(["POST"])
def login_view(request):
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
    auth_logout(request)
    return JsonResponse({'message': 'Logged out successfully'})

@require_http_methods(["GET"])
def user_view(request):
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
    CRUD for Posts. Includes a custom action to retrieve all non-deleted comments for a given post.
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
        post = self.get_object()
        comments = post.comments.filter(is_deleted=False)
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='vote')
    def vote(self, request, pk=None):
        """Handle voting on posts"""
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
        """Search posts by text in title, content, job_title, or organization"""
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
    CRUD for Comments (nested replies supported via MPTT).
    """
    queryset = Comment.objects.filter(is_deleted=False).order_by('tree_id', 'lft')
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        """Override to automatically set the user when creating a comment"""
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'], url_path='vote')
    def vote(self, request, pk=None):
        """Handle voting on comments"""
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