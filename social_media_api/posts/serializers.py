from rest_framework import serializers
from .models import Post, Comment, Repost, MediaFile, LiveStream
from accounts.serializers import UserSerializer
from .s3_utils import get_presigned_url_for_media

class CommentSerializer(serializers.ModelSerializer):
    # Read-only field to display the author's details in the CommentDrawer
    author = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    parentId = serializers.SerializerMethodField()
    timestamp = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'post', 'author', 'parent_comment', 'content', 'created_at', 'updated_at', 'replies', 'likes_count', 'reply_count', 'is_liked', 'parentId', 'timestamp']
        read_only_fields = ['post', 'created_at', 'updated_at']

    def get_replies(self, obj):
        try:
            if obj.replies.exists():
                return CommentSerializer(obj.replies.all(), many=True, context=self.context).data
            return []
        except Exception as e:
            print(f"Error getting replies for comment {obj.id}: {e}")
            return []

    def get_is_liked(self, obj):
        try:
            request = self.context.get('request')
            if request and hasattr(request, 'user') and request.user.is_authenticated:
                return obj.comment_likes.filter(user=request.user).exists()
            return False
        except Exception as e:
            print(f"Error checking if comment {obj.id} is liked: {e}")
            return False

    def get_author(self, obj):
        """Get author info, return None for anonymous users"""
        if obj.author:
            return UserSerializer(obj.author, context=self.context).data
        return None

    def get_parentId(self, obj):
        """Get the parent comment ID for threading"""
        if obj.parent_comment:
            return str(obj.parent_comment.id)
        return None

    def get_timestamp(self, obj):
        """Get the creation timestamp"""
        return obj.created_at

        
class PostSerializer(serializers.ModelSerializer):
    # Nested fields for the PostCard/Timeline view
    author = UserSerializer(read_only=True)
    reposted_by = UserSerializer(read_only=True)

    comments_count = serializers.SerializerMethodField()
    reposts_count = serializers.SerializerMethodField()
    shares_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    is_reposted = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()

    # New fields for enhanced PostCard
    views_count = serializers.SerializerMethodField()
    recent_comments = serializers.SerializerMethodField()

    # Fields for repost context in feed
    is_repost_in_feed = serializers.SerializerMethodField()
    reposted_by = serializers.SerializerMethodField()
    hasVideo = serializers.SerializerMethodField()

    # Media processing fields
    media_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    preview_url = serializers.SerializerMethodField()
    is_media_processed = serializers.SerializerMethodField()
    media_type = serializers.SerializerMethodField()

    # Repost structure fields
    type = serializers.SerializerMethodField()
    original_post = serializers.SerializerMethodField()
    repost_comment = serializers.SerializerMethodField()
    repost_timestamp = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ['id', 'type', 'author', 'title', 'content', 'video', 'image', 'created_at', 'updated_at', 'comments_count', 'likes_count', 'reposts_count', 'shares_count', 'is_liked', 'is_reposted', 'is_bookmarked', 'views_count', 'recent_comments', 'is_repost_in_feed', 'reposted_by', 'hasVideo', 'media_url', 'thumbnail_url', 'preview_url', 'is_media_processed', 'media_type', 'original_post', 'repost_comment', 'repost_timestamp']
        read_only_fields = ['author']

    def get_is_liked(self, obj):
        try:
            request = self.context.get('request')
            if request and request.user.is_authenticated:
                # For reposts, check if the repost_post is liked
                if hasattr(obj, 'original_repost') and obj.original_repost and obj.original_repost.repost_post:
                    return obj.original_repost.repost_post.likes.filter(user=request.user).exists()
                return obj.likes.filter(user=request.user).exists()
            return False
        except Exception as e:
            print(f"Error checking if post {obj.id} is liked: {e}")
            return False

    def get_is_reposted(self, obj):
        try:
            request = self.context.get('request')
            if request and request.user.is_authenticated:
                # For reposts, check if the repost_post is reposted
                if hasattr(obj, 'original_repost') and obj.original_repost and obj.original_repost.repost_post:
                    return obj.original_repost.repost_post.reposts.filter(user=request.user).exists()
                return obj.reposts.filter(user=request.user).exists()
            return False
        except Exception as e:
            print(f"Error checking if post {obj.id} is reposted: {e}")
            return False

    def get_is_bookmarked(self, obj):
        try:
            request = self.context.get('request')
            if request and request.user.is_authenticated:
                # For reposts, check if the repost_post is bookmarked
                if hasattr(obj, 'original_repost') and obj.original_repost and obj.original_repost.repost_post:
                    return obj.original_repost.repost_post.bookmarks.filter(user=request.user).exists()
                return obj.bookmarks.filter(user=request.user).exists()
            return False
        except Exception as e:
            print(f"Error checking if post {obj.id} is bookmarked: {e}")
            return False

    def get_recent_comments(self, obj):
        try:
            # Return the 2 most recent top-level comments for preview
            recent_comments = obj.comments.filter(parent_comment__isnull=True).order_by('-created_at')[:2]
            return CommentSerializer(recent_comments, many=True, context=self.context).data
        except Exception as e:
            print(f"Error getting recent comments for post {obj.id}: {e}")
            return []

    def get_is_repost_in_feed(self, obj):
        """Check if this post is shown in feed due to a repost by someone the user follows"""
        try:
            request = self.context.get('request')
            if not request or not request.user.is_authenticated:
                return False

            # Check if any followed user has reposted this post
            following_users = request.user.following.all()
            return obj.reposts.filter(user__in=following_users).exists()
        except Exception as e:
            print(f"Error checking if post {obj.id} is repost in feed: {e}")
            return False

    def get_reposted_by(self, obj):
        """Get the users who reposted this post (for feed context)"""
        try:
            request = self.context.get('request')
            if not request or not request.user.is_authenticated:
                return None

            # Find users who reposted this post (that the current user follows)
            following_users = request.user.following.all()
            reposts = obj.reposts.filter(user__in=following_users).select_related('user')

            # Return the most recent repost
            if reposts.exists():
                most_recent_repost = reposts.order_by('-created_at').first()
                return UserSerializer(most_recent_repost.user, context=self.context).data
            return None
        except Exception as e:
            print(f"Error getting reposted by for post {obj.id}: {e}")
            return None


    def get_hasVideo(self, obj):
        return obj.video is not None and obj.video != ''

    def get_likes_count(self, obj):
        try:
            # For ALL posts (original or repost): return aggregated metrics from original post
            # This ensures that metrics shown on reposts contribute to the original post's count
            if hasattr(obj, 'original_repost') and obj.original_repost:
                # This is a repost, get metrics from the original post
                original_post = obj.original_repost.original_post
                return self._get_aggregated_likes_count(original_post)
            else:
                # This is an original post, return aggregated metrics
                return self._get_aggregated_likes_count(obj)
        except Exception:
            return 0

    def get_comments_count(self, obj):
        try:
            # For ALL posts (original or repost): return aggregated metrics from original post
            if hasattr(obj, 'original_repost') and obj.original_repost:
                # This is a repost, get metrics from the original post
                original_post = obj.original_repost.original_post
                return self._get_aggregated_comments_count(original_post)
            else:
                # This is an original post, return aggregated metrics
                return self._get_aggregated_comments_count(obj)
        except Exception:
            return 0

    def get_reposts_count(self, obj):
        try:
            # For ALL posts (original or repost): return aggregated metrics from original post
            if hasattr(obj, 'original_repost') and obj.original_repost:
                # This is a repost, get metrics from the original post
                original_post = obj.original_repost.original_post
                return self._get_aggregated_reposts_count(original_post)
            else:
                # This is an original post, return aggregated metrics
                return self._get_aggregated_reposts_count(obj)
        except Exception:
            return 0

    def get_shares_count(self, obj):
        try:
            # For ALL posts (original or repost): return aggregated metrics from original post
            if hasattr(obj, 'original_repost') and obj.original_repost:
                # This is a repost, get metrics from the original post
                original_post = obj.original_repost.original_post
                return self._get_aggregated_shares_count(original_post)
            else:
                # This is an original post, return aggregated metrics
                return self._get_aggregated_shares_count(obj)
        except Exception:
            return 0

    def _get_aggregated_likes_count(self, obj):
        """Calculate aggregated likes count for original posts"""
        try:
            # Direct likes on the original post
            direct_likes = obj.likes.count()

            # Likes on all repost posts that reference this original post
            repost_likes = 0
            for repost in obj.reposts.all():
                if repost.repost_post:
                    repost_likes += repost.repost_post.likes.count()

            total_likes = direct_likes + repost_likes
            print(f"Aggregated likes for post {obj.id}: direct={direct_likes}, repost={repost_likes}, total={total_likes}")
            return total_likes
        except Exception as e:
            print(f"Error calculating aggregated likes for post {obj.id}: {e}")
            return obj.likes.count()  # Fallback to direct count

    def _get_aggregated_comments_count(self, obj):
        """Calculate aggregated comments count for original posts"""
        try:
            # Direct comments on the original post
            direct_comments = obj.comments.count()

            # Comments on all repost posts that reference this original post
            repost_comments = 0
            for repost in obj.reposts.all():
                if repost.repost_post:
                    repost_comments += repost.repost_post.comments.count()

            return direct_comments + repost_comments
        except Exception:
            return obj.comments.count()  # Fallback to direct count

    def _get_aggregated_reposts_count(self, obj):
        """Calculate aggregated reposts count for original posts"""
        try:
            # Direct reposts of the original post
            direct_reposts = obj.reposts.count()

            # Reposts of repost posts (further reposts in the chain)
            repost_reposts = 0
            for repost in obj.reposts.all():
                if repost.repost_post:
                    repost_reposts += repost.repost_post.reposts.count()

            return direct_reposts + repost_reposts
        except Exception:
            return obj.reposts.count()  # Fallback to direct count

    def _get_aggregated_shares_count(self, obj):
        """Calculate aggregated shares count for original posts"""
        try:
            # Direct shares on the original post
            direct_shares = obj.shares.count()

            # Shares on all repost posts that reference this original post
            repost_shares = 0
            for repost in obj.reposts.all():
                if repost.repost_post:
                    repost_shares += repost.repost_post.shares.count()

            return direct_shares + repost_shares
        except Exception:
            return obj.shares.count()  # Fallback to direct count

    def get_views_count(self, obj):
        try:
            # For reposts, return the count from the repost_post
            if hasattr(obj, 'original_repost') and obj.original_repost and obj.original_repost.repost_post:
                return obj.original_repost.repost_post.views_count or 0
            return obj.views_count or 0
        except Exception as e:
            print(f"Error getting views count for post {obj.id}: {e}")
            return 0

    def get_media_url(self, obj):
        """Get the main media URL (full size)"""
        try:
            url = obj.media_url('full')
            if url:
                return self._get_secure_media_url(url)
            return None
        except (AttributeError, TypeError, Exception) as e:
            print(f"Error getting media URL for post {obj.id}: {e}")
            return None

    def get_thumbnail_url(self, obj):
        """Get thumbnail URL"""
        try:
            url = obj.thumbnail_url
            return self._get_secure_media_url(url)
        except (AttributeError, Exception) as e:
            print(f"Error getting thumbnail URL for post {obj.id}: {e}")
            return None

    def get_preview_url(self, obj):
        """Get preview URL"""
        try:
            url = obj.preview_url
            return self._get_secure_media_url(url)
        except (AttributeError, Exception) as e:
            print(f"Error getting preview URL for post {obj.id}: {e}")
            return None

    def get_is_media_processed(self, obj):
        """Check if media has been processed"""
        try:
            return obj.is_media_processed
        except (AttributeError, Exception) as e:
            print(f"Error checking if media is processed for post {obj.id}: {e}")
            return False

    def get_media_type(self, obj):
        """Get media type (image/video)"""
        try:
            if hasattr(obj, 'media_file') and obj.media_file:
                return obj.media_file.media_type
            elif obj.video:
                return 'video'
            elif obj.image:
                return 'image'
            return None
        except Exception as e:
            print(f"Error getting media type for post {obj.id}: {e}")
            return None

    def _get_secure_media_url(self, url):
        """
        Return secure media URL - signed for private content, direct for public
        For now, all post media is public, so return direct URLs
        Private media (like archived streams) would use signed URLs
        """
        try:
            if not url:
                return None

            # For development mode with local media, return the URL as-is
            if url.startswith('/media/') or url.startswith('http://localhost') or url.startswith('http://127.0.0.1'):
                return url

            # For post media, return direct URLs (public access)
            # For private media (e.g., archived private streams), use signed URLs
            # This can be extended based on privacy settings

            # For videos, generate signed URLs to prevent unauthorized sharing
            if hasattr(self.instance, 'media_file') and self.instance.media_file and self.instance.media_file.media_type == 'video':
                # Extract S3 key from URL and generate signed URL
                if url.startswith('https://'):
                    # Try to extract key from CloudFront/S3 URL
                    try:
                        path_parts = url.split('/')
                        if len(path_parts) >= 4:  # https://domain.com/media/id/filename
                            media_id = path_parts[-2]  # Extract media ID
                            filename = path_parts[-1]   # Extract filename
                            s3_key = f"media/{media_id}/{filename}"
                            return self._get_signed_media_url(s3_key, 60)  # 60 seconds for video access
                    except (IndexError, ValueError):
                        pass

            return url
        except Exception as e:
            print(f"Error in _get_secure_media_url: {e}")
            return None

    def get_type(self, obj):
        """Determine if this is a repost or original post"""
        try:
            # Skip type detection for original posts to prevent recursion
            if self.context.get('is_original_post'):
                return 'post'

            # Check if this post is a repost by looking for original_repost relation
            if hasattr(obj, 'original_repost') and obj.original_repost:
                return 'repost'
            return 'post'
        except Exception as e:
            print(f"Error determining post type for {obj.id}: {e}")
            return 'post'

    def to_representation(self, instance):
        """Override to ensure reposts have all required fields"""
        data = super().to_representation(instance)

        # For reposts, ensure we have the required fields
        if data.get('type') == 'repost':
            # Ensure original_post is populated
            if not data.get('original_post'):
                original_post_data = self.get_original_post(instance)
                if original_post_data:
                    data['original_post'] = original_post_data
                else:
                    # If we can't get original post data, this might not be a valid repost
                    data['type'] = 'post'  # Fallback to regular post
                    return data

            # Ensure repost_comment is included
            if 'repost_comment' not in data:
                data['repost_comment'] = self.get_repost_comment(instance)

            # Ensure repost_timestamp is included
            if 'repost_timestamp' not in data:
                data['repost_timestamp'] = self.get_repost_timestamp(instance)

            # Ensure the repost has proper author info (the reposter)
            if not data.get('author') or not data['author'].get('username'):
                # This is a repost, so the author should be the reposter
                if hasattr(instance, 'original_repost') and instance.original_repost:
                    reposter = instance.original_repost.user
                    data['author'] = UserSerializer(reposter, context=self.context).data

            # Ensure repost has proper title and content (from the repost post itself)
            # The title/content should be from the repost_post, not the original
            if hasattr(instance, 'original_repost') and instance.original_repost.repost_post:
                repost_post = instance.original_repost.repost_post
                data['title'] = repost_post.title or ''
                data['content'] = repost_post.content or ''

        return data

    def get_original_post(self, obj):
        """Get the original post data for reposts with aggregated metrics"""
        try:
            if hasattr(obj, 'original_repost') and obj.original_repost:
                # This is a repost, return the original post data
                original_repost = obj.original_repost
                original_post = original_repost.original_post

                # Create a new context to avoid recursion issues
                context = self.context.copy()
                context['is_original_post'] = True  # Flag to prevent infinite recursion

                # Serialize the original post - it will automatically get aggregated metrics
                # since is_original_post=True prevents type detection as 'repost'
                return PostSerializer(original_post, context=context).data
            return None
        except Exception as e:
            print(f"Error getting original post for {obj.id}: {e}")
            return None

    def get_repost_comment(self, obj):
        """Get the repost comment if this is a repost"""
        try:
            if hasattr(obj, 'original_repost') and obj.original_repost:
                return obj.original_repost.comment
            return None
        except Exception as e:
            print(f"Error getting repost comment for {obj.id}: {e}")
            return None

    def get_repost_timestamp(self, obj):
        """Get the repost timestamp if this is a repost"""
        try:
            if hasattr(obj, 'original_repost') and obj.original_repost:
                return obj.original_repost.created_at
            return None
        except Exception as e:
            print(f"Error getting repost timestamp for {obj.id}: {e}")
            return None

    def _get_signed_media_url(self, s3_key, expiration=60):
        """Generate pre-signed URL for private media"""
        try:
            return get_presigned_url_for_media(s3_key, expiration)
        except Exception as e:
            # Fallback to None if signing fails
            print(f"Failed to generate signed URL for {s3_key}: {e}")
            return None


class LiveStreamSerializer(serializers.ModelSerializer):
    """
    Serializer for LiveStream model
    """
    host = UserSerializer(read_only=True)
    is_live = serializers.ReadOnlyField()
    duration = serializers.ReadOnlyField()
    secure_playback_url = serializers.SerializerMethodField()
    secure_thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = LiveStream
        fields = ['id', 'title', 'description', 'host', 'status', 'scheduled_start', 'actual_start', 'actual_end', 'viewer_count', 'peak_viewers', 'thumbnail_url', 'playback_url', 'stream_url', 'tags', 'is_private', 'is_live', 'duration', 'secure_playback_url', 'secure_thumbnail_url', 'created_at']
        read_only_fields = ['id', 'host', 'actual_start', 'actual_end', 'viewer_count', 'peak_viewers', 'created_at']

    def get_secure_playback_url(self, obj):
        """Get secure playback URL - signed for private streams"""
        if obj.is_private and obj.playback_url:
            # For private streams, return signed URL
            # Extract S3 key from playback URL if it's an S3 URL
            if 's3.' in obj.playback_url or 'amazonaws.com' in obj.playback_url:
                # This is a simplified extraction - in production you'd parse the URL properly
                s3_key = obj.playback_url.split('/')[-1]  # Simple extraction
                return self._get_signed_media_url(f"streams/{obj.id}/{s3_key}", 3600)  # 1 hour for streams
            return obj.playback_url
        # For public streams, still use signed URLs to prevent unauthorized sharing
        elif obj.playback_url and ('s3.' in obj.playback_url or 'amazonaws.com' in obj.playback_url):
            s3_key = obj.playback_url.split('/')[-1]
            return self._get_signed_media_url(f"streams/{obj.id}/{s3_key}", 3600)  # 1 hour expiration
        return obj.playback_url

    def get_secure_thumbnail_url(self, obj):
        """Get secure thumbnail URL - signed for private streams"""
        if obj.is_private and obj.thumbnail_url:
            # For private streams, return signed URL
            if 's3.' in obj.thumbnail_url or 'amazonaws.com' in obj.thumbnail_url:
                s3_key = obj.thumbnail_url.split('/')[-1]
                return self._get_signed_media_url(f"streams/{obj.id}/thumbnail/{s3_key}", 3600)
            return obj.thumbnail_url
        # For public streams, still use signed URLs to prevent unauthorized sharing
        elif obj.thumbnail_url and ('s3.' in obj.thumbnail_url or 'amazonaws.com' in obj.thumbnail_url):
            s3_key = obj.thumbnail_url.split('/')[-1]
            return self._get_signed_media_url(f"streams/{obj.id}/thumbnail/{s3_key}", 3600)
        return obj.thumbnail_url


class LiveStreamCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating live streams
    """
    class Meta:
        model = LiveStream
        fields = ['title', 'description', 'scheduled_start', 'thumbnail_url', 'tags', 'is_private']

    def validate_scheduled_start(self, value):
        """Validate and parse scheduled_start"""
        if value:
            # If it's a string, try to parse it
            if isinstance(value, str):
                from django.utils.dateparse import parse_datetime
                parsed = parse_datetime(value)
                if parsed:
                    return parsed
                else:
                    raise serializers.ValidationError("Invalid datetime format")
        return value

    def validate_tags(self, value):
        """Validate tags field"""
        if value:
            # Ensure tags is a list
            if isinstance(value, str):
                # If it's a comma-separated string, split it
                return [tag.strip() for tag in value.split(',') if tag.strip()]
            elif isinstance(value, list):
                return value
            else:
                raise serializers.ValidationError("Tags must be a list or comma-separated string")
        return value

    def create(self, validated_data):
        # Generate unique stream key
        import uuid
        stream_key = str(uuid.uuid4())[:16]

        # Set host from request user
        validated_data['host'] = self.context['request'].user
        validated_data['stream_key'] = stream_key

        return super().create(validated_data)


class LiveStreamStartSerializer(serializers.Serializer):
    """
    Serializer for starting a live stream
    """
    stream_url = serializers.URLField(required=False, help_text="RTMP stream URL for broadcasting")
    playback_url = serializers.URLField(required=False, help_text="HLS playback URL")

    def update(self, instance, validated_data):
        instance.stream_url = validated_data.get('stream_url', instance.stream_url)
        instance.playback_url = validated_data.get('playback_url', instance.playback_url)
        instance.start_stream()
        return instance