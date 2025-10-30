from django.db import models
from django.conf import settings
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

class Notification(models.Model):

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete = models.CASCADE,
        related_name = 'notifications'
    )
    
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete = models.CASCADE,
        related_name = 'actions_made'
    )
    
    verb = models.CharField(max_length = 255)
    
    
    # Generic Foreign Key setup
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE
    )
    
    object_id = models.PositiveIntegerField()
    target = GenericForeignKey('content_type', 'object_id')
    
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default = False)

    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f'{self.actor.username} {self.verb} {self.target}'


@receiver(post_save, sender=Notification)
def broadcast_unread_count_update(sender, instance, created, **kwargs):
    """
    Broadcast unread count update when notification is_read status changes
    """
    print(f"Signal triggered: created={created}, is_read={instance.is_read}")
    if not created and instance.is_read:
        print(f"Broadcasting unread count update for user {instance.recipient.id}")
        # Only broadcast when notification is marked as read (not when created)
        channel_layer = get_channel_layer()
        user_group_name = f'user_{instance.recipient.id}_notifications'

        # Get updated unread count
        unread_count = Notification.objects.filter(
            recipient=instance.recipient,
            is_read=False
        ).count()

        print(f"New unread count: {unread_count}")

        # Broadcast to user's notification group
        async_to_sync(channel_layer.group_send)(
            user_group_name,
            {
                'type': 'send_notification',
                'data': {
                    'type': 'unread_count_update',
                    'unread_count': unread_count
                }
            }
        )
