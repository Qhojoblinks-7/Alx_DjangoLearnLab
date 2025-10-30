# messages/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import Message


@receiver(post_save, sender=Message)
def broadcast_new_message(sender, instance, created, **kwargs):
    """
    Broadcast new messages to WebSocket clients in real-time.
    Only broadcast newly created messages.
    """
    if not created:
        return

    print(f"Broadcasting new message {instance.id} in conversation {instance.conversation.id}")

    channel_layer = get_channel_layer()
    room_group_name = f'chat_{instance.conversation.id}'

    # Prepare message data for WebSocket
    message_data = {
        'id': instance.id,
        'content': instance.content,
        'sender': {
            'id': instance.sender.id,
            'username': instance.sender.username,
            'name': instance.sender.get_full_name() or instance.sender.username
        },
        'created_at': instance.timestamp.isoformat(),
        'conversation_id': instance.conversation.id
    }

    # Broadcast to all participants in the conversation
    async_to_sync(channel_layer.group_send)(
        room_group_name,
        {
            'type': 'chat_message',
            'message': message_data,
        }
    )

    print(f"Message {instance.id} broadcasted to group {room_group_name}")