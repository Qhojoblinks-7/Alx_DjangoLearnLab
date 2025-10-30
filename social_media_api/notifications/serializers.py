from rest_framework import serializers
from .models import Notification
from accounts.serializers import UserSerializer
from posts.serializers import PostSerializer
from posts.models import Post

class NotificationSerializer(serializers.ModelSerializer):
    """
    B-NOTIFY-03: Response Fields - JSON with id, type, source_user, related_post, created_at, is_read
    B-NOT-05R: Include target_url for frontend redirection
    """
    type = serializers.SerializerMethodField()
    source_user = UserSerializer(source='actor', read_only=True)
    related_post = serializers.SerializerMethodField()
    target_url = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(source='timestamp', read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'type', 'source_user', 'related_post', 'target_url', 'created_at', 'is_read']

    def get_type(self, obj):
        """
        Map verb to notification type
        """
        verb_mapping = {
            'liked': 'like',
            'followed': 'follow',
            'commented': 'comment',
            'mentioned': 'mention',
            'reposted': 'repost',
            'repost_interaction': 'repost_interaction'
        }
        return verb_mapping.get(obj.verb, obj.verb)

    def get_related_post(self, obj):
        """
        Return post data if the notification is related to a post
        """
        try:
            # Check if content_type and object_id are valid
            if not obj.content_type or not obj.object_id:
                return None

            # Check if the ContentType model class exists
            if not obj.content_type.model_class():
                return None

            # Try to get the target object
            target = obj.target

            # Check if target exists and is a Post instance
            if target and hasattr(target, 'id') and isinstance(target, Post):
                return PostSerializer(target, context=self.context).data
        except Exception:
            # If there's any issue accessing the target (invalid ContentType, deleted object, etc.), return None
            pass
        return None

    def get_target_url(self, obj):
        """
        B-NOT-05R: Generate target URL for frontend redirection based on Content-First Rule
        Returns the URL that the notification should redirect to
        """
        notification_type = self.get_type(obj)

        # Content-First Rule: Most notifications redirect to content
        if notification_type in ['like', 'comment', 'repost', 'repost_interaction']:
            # Post-related notifications redirect to the post
            post = self.get_related_post(obj)
            if post and isinstance(post, dict) and 'id' in post:
                return f"/post/{post['id']}"
            # Fallback: try to get post from target if related_post fails
            try:
                if obj.target and hasattr(obj.target, 'id'):
                    return f"/post/{obj.target.id}"
            except:
                pass

        elif notification_type == 'follow':
            # Follow notifications redirect to the follower's profile
            if obj.actor:
                return f"/{obj.actor.username}"

        elif notification_type == 'messaged':
            # Message notifications redirect to messages
            return "/messages"

        # Default fallback
        return f"/{obj.actor.username if obj.actor else ''}"