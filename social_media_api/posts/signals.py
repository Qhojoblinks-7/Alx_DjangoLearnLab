# posts/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import Like, Comment
from .serializers import CommentSerializer
from notifications.models import Notification
from notifications.serializers import NotificationSerializer


# Note: Like notifications are now created directly in PostLikeView


@receiver([post_save, post_delete], sender=Like)
@receiver(post_save, sender=Comment)
def push_post_updates(sender, instance, created=None, **kwargs):
    post = instance.post
    channel_layer = get_channel_layer()
    group_name = f'post_{post.id}'
    
    # 1. Update Likes (triggered by Like save/delete)
    if sender == Like:
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'send_post_update',
                'data': {
                    'post_id': post.id,
                    'likes_count': post.likes.count(),
                    'event_type': 'likes_update'
                }
            }
        )
    
    # 2. Update Comments (triggered by Comment save)
    if sender == Comment and created:
        comment_data = CommentSerializer(instance).data
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'send_post_update',
                'data': {
                    'post_id': post.id,
                    'comment': comment_data,
                    'event_type': 'new_comment'
                }
            }
        )