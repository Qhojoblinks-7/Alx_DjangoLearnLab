from rest_framework import serializers
from .models import List, ListPost
from posts.serializers import PostSerializer


class ListPostSerializer(serializers.ModelSerializer):
    """Serializer for list-post relationships."""
    post = PostSerializer(read_only=True)

    class Meta:
        model = ListPost
        fields = ['id', 'post', 'added_at', 'order']


class ListSerializer(serializers.ModelSerializer):
    """Serializer for lists."""
    post_count = serializers.SerializerMethodField()
    posts = serializers.SerializerMethodField()

    class Meta:
        model = List
        fields = [
            'id', 'name', 'description', 'icon', 'is_private',
            'is_default', 'created_at', 'updated_at', 'post_count', 'posts'
        ]
        read_only_fields = ['owner', 'created_at', 'updated_at']

    def get_post_count(self, obj):
        return obj.post_count

    def get_posts(self, obj):
        # Return recent posts in the list (limit to 10 for performance)
        list_posts = obj.list_posts.select_related('post__author').order_by('-added_at')[:10]
        return ListPostSerializer(list_posts, many=True).data

    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)


class ListCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating lists."""

    class Meta:
        model = List
        fields = ['name', 'description', 'icon', 'is_private']

    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)


class ListUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating lists."""

    class Meta:
        model = List
        fields = ['name', 'description', 'icon', 'is_private']


class AddPostToListSerializer(serializers.Serializer):
    """Serializer for adding posts to lists."""
    post_id = serializers.IntegerField()

    def validate_post_id(self, value):
        from posts.models import Post
        try:
            Post.objects.get(id=value)
        except Post.DoesNotExist:
            raise serializers.ValidationError("Post does not exist.")
        return value