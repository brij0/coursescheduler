from rest_framework import serializers
from .models import Post, Comment, Vote
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class PostSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    score = serializers.ReadOnlyField()
    
    class Meta:
        model = Post
        fields = ['id', 'title', 'content', 'user', 'created_at', 'updated_at', 'score', 
                 'job_id', 'job_term', 'job_title', 'organization', 'job_location']
        read_only_fields = ['user', 'created_at', 'updated_at', 'score']

class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    score = serializers.ReadOnlyField()
    
    class Meta:
        model = Comment
        fields = ['id', 'content', 'user', 'post', 'parent', 'created_at', 'updated_at', 'score']
        read_only_fields = ['user', 'created_at', 'updated_at', 'score']

class VoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vote
        fields = ['id', 'value', 'created_at']
        read_only_fields = ['created_at']