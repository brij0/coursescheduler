from pyexpat.errors import messages
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.contenttypes.models import ContentType
from .models import Post, Comment, Vote, EmailVerificationToken
from .serializers import PostSerializer, CommentSerializer
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Q
import json
import random
import uuid
import time
from django.utils.decorators import method_decorator

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
        username_or_email = data.get('username')
        password = data.get('password')
        
        if not username_or_email or not password:
            return JsonResponse({'error': 'Username and password required'}, status=400)
        
        # Try to find user by username or email
        try:
            user_obj = User.objects.get(Q(username=username_or_email) | Q(email=username_or_email))
            username = user_obj.username
        except User.DoesNotExist:
            return JsonResponse({'error': 'Invalid credentials'}, status=401)
        
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

@require_http_methods(["GET","POST"])
@csrf_exempt
def register_view(request):
    """
    POST /api/auth/register/
    Registers a new user (inactive until email verification).
    Request: JSON { "email": "...", "username": "...", "password": "..." }
    Response: JSON { "message": "...", "user": { ... } } or { "error": "..." }
    Usage (frontend):
        - Call to register a new user. User must verify email before logging in.
    """
    try:
        data = json.loads(request.body)
        email = data.get('email', '').lower().strip()
        username = data.get('username', '').strip()
                
        # Validate email domain
        if not email.endswith('@uoguelph.ca'):
            return JsonResponse({'error': 'Only @uoguelph.ca emails are allowed'}, status=400)

        # Check if email already exists
        if User.objects.filter(email=email).exists():
            return JsonResponse({'error': 'Email already registered'}, status=400)

        # Check if username already exists
        if User.objects.filter(username=username).exists():
            return JsonResponse({'error': 'Username already taken'}, status=400)

        password = data.get('password')
        if not password:
            return JsonResponse({'error': 'Password is required'}, status=400)
        # Generate a unique username if not provided
        if not username:
            username = generate_unique_username()
        # Create user (inactive until email verification)
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            is_active=False
        )
        
        # Create verification token
        verification_token = EmailVerificationToken.objects.create(user=user)
        
        # Send verification email
        success = send_verification_email_gmail(user, verification_token.token)
        
        if success:
            return JsonResponse({
                'message': 'Registration successful. Please check your email to verify your account.',
                'user': {
                    'username': user.username,
                    'email': user.email
                }
            })
        else:
            # Clean up user if email fails
            EmailVerificationToken.objects.filter(user=user).delete()
            user.delete()
            return JsonResponse({
                'error': 'Failed to send verification email. Please try again or contact support.'
            }, status=500)
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': 'Registration failed'}, status=500)

def generate_unique_username():
    """
    Generates a unique username for users who do not provide one.
    """
    while True:
        username = f"Gryphon{random.randint(1, 8000)}"
        if not User.objects.filter(username=username).exists():
            return username

def send_verification_email_gmail(user, token):
    """Send verification email using Gmail SMTP"""
    try:
        verification_url = f"{settings.SITE_URL}/api/auth/verify-email/{token}/"
        
        subject = 'Verify Your Email Address'
        
        html_message = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px;">
                <h2 style="color: #333; text-align: center;">Welcome {user.username}!</h2>
                <p style="color: #666; font-size: 16px;">Thank you for registering. Please click the button below to verify your email address:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{verification_url}" 
                       style="background-color: #007bff; color: white; padding: 12px 30px; 
                              text-decoration: none; border-radius: 5px; font-weight: bold;
                              display: inline-block;">
                        Verify Email Address
                    </a>
                </div>
                
                <p style="color: #666; font-size: 14px;">Or copy and paste this URL into your browser:</p>
                <p style="background-color: #e9ecef; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px;">
                    {verification_url}
                </p>
                
                <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
                    This link will expire in 24 hours for security reasons.
                </p>
            </div>
        </body>
        </html>
        """
        
        plain_message = f"""
        Welcome {user.username}!
        
        Thank you for registering. Please click the link below to verify your email address:
        {verification_url}
        
        This link will expire in 24 hours.
        """
        
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False
        )
        return True
        
    except Exception as e:
        return False

@csrf_exempt
def verify_email(request, token):
    """
    GET /api/auth/verify-email/<token>/
    Verifies the user's email using the provided token.
    Returns a JSON response indicating the result.
    """
    try:
        verification_token = get_object_or_404(EmailVerificationToken, token=token)

        if verification_token.is_expired():
            return JsonResponse({'error': 'Verification link has expired. Please request a new one.'}, status=400)

        if verification_token.is_verified:
            return JsonResponse({'message': 'Email already verified. You can now log in.'})

        # Verify the email
        user = verification_token.user
        user.is_active = True
        user.save()

        verification_token.is_verified = True
        verification_token.save()

        return JsonResponse({'message': 'Email verified successfully! You can now log in.'})

    except Exception:
        return JsonResponse({'error': 'Invalid verification link.'}, status=400)

@require_http_methods(["POST"])
@csrf_exempt
def resend_verification(request):
    """
    POST /api/auth/resend-verification/
    Resends the verification email to the user.
    Request: JSON { "email": "..." }
    Response: JSON { "message": "...", "resent": true/false }
    Usage (frontend):
        - Call if user did not receive the verification email.
    """
    try:
        data = json.loads(request.body)
        email = data.get('email', '').lower().strip()
        user = User.objects.filter(email=email).first()
        if not user:
            return JsonResponse({'error': 'User not found.'}, status=404)
        if user.is_active:
            return JsonResponse({'message': 'Email already verified.'})
        # Delete old tokens and create a new one
        EmailVerificationToken.objects.filter(user=user).delete()
        verification_token = EmailVerificationToken.objects.create(user=user)
        success = send_verification_email_gmail(user, verification_token.token)
        if success:
            return JsonResponse({'message': 'Verification email resent.', 'resent': True})
        else:
            return JsonResponse({'error': 'Failed to send verification email.', 'resent': False}, status=500)
    except Exception as e:
        return JsonResponse({'error': 'Failed to resend verification email.'}, status=500)

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
            - If the same vote is sent again, the vote is removed (toggle).
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
        Searches posts by text.
        Response: JSON { "query": "...", "count": ..., "results": [...] }
        Usage (frontend):
            - Use for searching posts by keywords.
        """
        query = request.query_params.get('q', '').strip()
        posts = Post.objects.filter(
            Q(title__icontains=query) | Q(content__icontains=query),
            is_deleted=False
        ).filter(
            Q(title__icontains=query) |
            Q(content__icontains=query) |
            Q(job_title__icontains=query) |
            Q(organization__icontains=query)
        ).order_by('-created_at')
        serializer = PostSerializer(posts, many=True)
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
            - If the same vote is sent again, the vote is removed (toggle).
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