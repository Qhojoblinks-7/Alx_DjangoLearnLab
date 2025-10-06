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


@receiver(post_save, sender=Like)
def create_like_notification(sender, instance, created, **kwargs):
    # Only create a notification if a new Like was created
    if created:
        recipient = instance.post.author
        
        # 1. Create the Database Notification
        notification = Notification.objects.create(
            recipient=recipient,
            actor=instance.user,
            verb="liked",
            target=instance.post
        )
        
        # 2. Send Real-time WebSocket Update 
        channel_layer = get_channel_layer()
        notification_data = NotificationSerializer(notification).data # Serialize the notification object

        # Group name for the recipient user
        group_name = f'user_{recipient.id}_notifications'
        
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'send_notification', # Corresponds to method in NotificationConsumer
                'data': notification_data,
                'event_type': 'new_notification'
            }
        )


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