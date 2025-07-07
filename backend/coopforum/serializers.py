from rest_framework import serializers
from .models import Post, Comment, Vote
from django.contrib.auth.models import User

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
    Usage (frontend):
      - Use job_* fields for job-related posts, otherwise use title/content.
    """
    user = UserSerializer(read_only=True)
    score = serializers.ReadOnlyField()
    
    class Meta:
        model = Post
        fields = ['id', 'title', 'content', 'user', 'created_at', 'updated_at', 'score', 
                 'job_id', 'job_term', 'job_title', 'organization', 'job_location']
        read_only_fields = ['user', 'created_at', 'updated_at', 'score']

class CommentSerializer(serializers.ModelSerializer):
    """
    Serializes comment data for API.
    Fields:
      - id, content, user (UserSerializer), post (id), parent (id), created_at, updated_at, score (int)
    Usage (frontend):
      - Use parent field to build nested comment trees.
    """
    user = UserSerializer(read_only=True)
    score = serializers.ReadOnlyField()
    
    class Meta:
        model = Comment
        fields = ['id', 'content', 'user', 'post', 'parent', 'created_at', 'updated_at', 'score']
        read_only_fields = ['user', 'created_at', 'updated_at', 'score']

class VoteSerializer(serializers.ModelSerializer):
    """
    Serializes vote data (not usually needed by frontend).
    """
    class Meta:
        model = Vote
        fields = ['id', 'value', 'created_at']
        read_only_fields = ['created_at']