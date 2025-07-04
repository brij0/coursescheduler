from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Post, Comment

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    Minimal user representation for posts/comments.
    """
    class Meta:
        model = User
        fields = ('id', 'username')


class CommentSerializer(serializers.ModelSerializer):
    """
    Serializer for Comment model including nested replies.
    """
    user = UserSerializer(read_only=True)
    score = serializers.IntegerField(read_only=True)
    children = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = (
            'id', 'user', 'post', 'content', 'parent',
            'score', 'created_at', 'updated_at', 'children'
        )
        read_only_fields = ('id', 'user', 'score', 'created_at', 'updated_at', 'children')

    def get_children(self, obj):
        # Return non-deleted direct replies
        children_qs = obj.get_children().filter(is_deleted=False)
        return CommentSerializer(children_qs, many=True).data


class PostSerializer(serializers.ModelSerializer):
    """
    Serializer for Post model. Excludes comments by default;
    use the PostViewSet.comments action to fetch nested comments.
    """
    user = UserSerializer(read_only=True)
    score = serializers.IntegerField(read_only=True)

    class Meta:
        model = Post
        fields = (
            'id', 'user', 'title', 'content',
            'score', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'user', 'score', 'created_at', 'updated_at')
