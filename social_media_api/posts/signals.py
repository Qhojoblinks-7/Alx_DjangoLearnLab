# posts/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import mimetypes
import os

from .models import Like, Comment, MediaFile
from .serializers import CommentSerializer
from .tasks import process_image_file, process_video_file
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
        # Send update to the liked post's channel
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

        # If this is a repost post, also send aggregated likes update to the original post's channel
        try:
            from .models import Repost
            repost = Repost.objects.filter(repost_post=post).first()
            if repost:
                original_post = repost.original_post
                # Calculate aggregated likes count for the original post
                direct_likes = original_post.likes.count()
                repost_likes = sum(r.repost_post.likes.count() for r in original_post.reposts.all() if r.repost_post)
                aggregated_likes = direct_likes + repost_likes

                original_group_name = f'post_{original_post.id}'
                async_to_sync(channel_layer.group_send)(
                    original_group_name,
                    {
                        'type': 'send_post_update',
                        'data': {
                            'post_id': original_post.id,
                            'likes_count': aggregated_likes,
                            'event_type': 'likes_update'
                        }
                    }
                )
        except Exception as e:
            print(f"Error sending aggregated likes update for repost: {e}")

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


# Media Processing Signals
@receiver(post_save, sender=MediaFile)
def process_media_file(sender, instance, created, **kwargs):
    """Automatically process media files when they're created"""
    if created and instance.processing_status == 'pending':
        # Determine media type from file extension or MIME type
        file_extension = os.path.splitext(instance.file_name)[1].lower()
        mime_type, _ = mimetypes.guess_type(instance.file_name)

        if mime_type:
            if mime_type.startswith('image/'):
                instance.media_type = 'image'
                # Trigger image processing
                process_image_file.delay(instance.id)
            elif mime_type.startswith('video/'):
                instance.media_type = 'video'
                # Trigger video processing
                process_video_file.delay(instance.id)

        instance.save()