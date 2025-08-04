from rest_framework import serializers
from .models import Post, Comment, Vote
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType

class UserSerializer(serializers.ModelSerializer):
    """
    Serializes user info for frontend display.
    """

    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class PostSerializer(serializers.ModelSerializer):
    """
    Serializes post data for API.
    Fields:
      - id, title, content, user (UserSerializer), created_at, updated_at, score (int)
      - job_id, job_term, job_title, organization, job_location (optional job info)
      - user_vote: current user's vote (1, -1, or None)
    """
    user = UserSerializer(read_only=True)
    score = serializers.ReadOnlyField()
    user_vote = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = ['id', 'title', 'content', 'user', 'created_at', 'updated_at', 'score', 
                 'job_id', 'job_term', 'job_title', 'organization', 'job_location', 'user_vote']
        read_only_fields = ['user', 'created_at', 'updated_at', 'score', 'user_vote']

    def get_user_vote(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            vote = Vote.objects.filter(
                user=request.user,
                content_type=ContentType.objects.get_for_model(Post),
                object_id=obj.id
            ).first()
            return vote.value if vote else None
        return None
    

class CommentSerializer(serializers.ModelSerializer):
    """
    Serializes comment data for API.
    Fields:
      - id, content, user (UserSerializer), post (id), parent (id), created_at, updated_at, score (int)
      - user_vote: current user's vote (1, -1, or None)
    """
    user = UserSerializer(read_only=True)
    score = serializers.ReadOnlyField()
    user_vote = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = ['id', 'content', 'user', 'post', 'parent', 'created_at', 'updated_at', 'score', 'user_vote']
        read_only_fields = ['user', 'created_at', 'updated_at', 'score', 'user_vote']

    def get_user_vote(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            vote = Vote.objects.filter(
                user=request.user,
                content_type=ContentType.objects.get_for_model(Comment),
                object_id=obj.id
            ).first()
            return vote.value if vote else None
        return None

class VoteSerializer(serializers.ModelSerializer):
    """
    Serializes vote data (not usually needed by frontend).
    """
    class Meta:
        model = Vote
        fields = ['id', 'value', 'created_at']
        read_only_fields = ['created_at']