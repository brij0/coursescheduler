from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Post, Comment
from .serializers import PostSerializer, CommentSerializer


class PostViewSet(viewsets.ModelViewSet):
    """
    CRUD for Posts. Includes a custom action to retrieve all non-deleted comments for a given post.
    """
    queryset = Post.objects.filter(is_deleted=False).order_by('-created_at')
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['get'], url_path='comments')
    def comments(self, request, pk=None):
        post = self.get_object()
        comments = post.comments.filter(is_deleted=False)
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)


class CommentViewSet(viewsets.ModelViewSet):
    """
    CRUD for Comments (nested replies supported via MPTT).
    """
    queryset = Comment.objects.filter(is_deleted=False).order_by('tree_id', 'lft')
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

# In your urls.py, hook these up:
#
# from django.urls import path, include
# from rest_framework.routers import DefaultRouter
# from .views import PostViewSet, CommentViewSet
#
# router = DefaultRouter()
# router.register(r'posts', PostViewSet, basename='post')
# router.register(r'comments', CommentViewSet, basename='comment')
#
# urlpatterns = [
#     path('api/', include(router.urls)),
# ]
