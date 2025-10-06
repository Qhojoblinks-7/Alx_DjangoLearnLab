from rest_framework import serializers
from .models import Post, Comment
from accounts.serializers import UserSerializer

class CommentSerializer(serializers.ModelSerializer):
    # Read-only field to display the author's details in the CommentDrawer
    author = UserSerializer(read_only=True)
    
    class Meta:
        model = Comment
        fields = ['id', 'post', 'author', 'content', 'created_at', 'updated_at']
        read_only_fields = ['post', 'author', 'created_at', 'updated_at']

        
class PostSerializer(serializers.ModelSerializer):
    # Nested fields for the PostCard/Timeline view
    author = UserSerializer(read_only=True)
    
    likes_count = serializers.IntegerField(source='likes.count', read_only=True)
    comments_count = serializers.IntegerField(source='comments.count', read_only=True)
    
    class Meta:
        model = Post
        fields = ['id', 'author', 'title', 'content', 'video', 'image', 'created_at', 'updated_at', 'likes_count', 'comments_count']
        read_only_fields = ['author']
        
        
    def get_likes_count(self, obj):
        try:
            return obj.likes.count()
        except Exception:
            return 0 # handle case where likes relationship is not set up properly