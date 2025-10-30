import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.cache import cache
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Post, Comment
from .throttling import ChatMessageThrottle

logger = logging.getLogger(__name__)
User = get_user_model()


class ChatMessageThrottleConsumer:
    """
    Mixin class that adds chat message throttling to WebSocket consumers.
    """

    async def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.throttle_instance = ChatMessageThrottle()

    async def check_chat_throttle(self, user):
        """
        Check if the user is allowed to send a chat message based on throttling rules.
        """
        # Create a mock request object for throttling
        class MockRequest:
            def __init__(self, user):
                self.user = user
                self.method = 'POST'

        mock_request = MockRequest(user)

        # Check throttling
        allowed = await database_sync_to_async(self.throttle_instance.allow_request)(
            mock_request, None
        )

        return allowed

    async def handle_chat_message(self, user, message_data):
        """
        Handle incoming chat message with throttling.
        """
        # Check throttling
        allowed = await self.check_chat_throttle(user)
        if not allowed:
            await self.send_json({
                'type': 'error',
                'message': 'Message rate limit exceeded. Please wait before sending another message.',
                'code': 'RATE_LIMIT_EXCEEDED'
            })
            return

        # Process the message (implement your chat logic here)
        # For now, just broadcast it back
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'user_id': user.id,
                'username': user.username,
                'message': message_data.get('message', ''),
                'timestamp': timezone.now().isoformat()
            }
        )


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time notifications.
    """

    async def connect(self):
        self.user = self.scope['user']

        if not self.user.is_authenticated:
            await self.close()
            return

        # Join user's notification group
        self.notification_group = f'notifications_{self.user.id}'
        await self.channel_layer.group_add(
            self.notification_group,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave notification group
        if hasattr(self, 'notification_group'):
            await self.channel_layer.group_discard(
                self.notification_group,
                self.channel_name
            )

    async def receive_json(self, content):
        """
        Handle incoming WebSocket messages.
        """
        message_type = content.get('type')

        if message_type == 'ping':
            # Handle heartbeat/ping messages
            await self.send_json({
                'type': 'pong',
                'timestamp': timezone.now().isoformat()
            })

    # Notification handlers
    async def post_like_notification(self, event):
        """Send post like notification"""
        await self.send_json({
            'type': 'notification',
            'notification_type': 'post_like',
            'post_id': event['post_id'],
            'liker_username': event['liker_username'],
            'message': f"{event['liker_username']} liked your post",
            'timestamp': event['timestamp']
        })

    async def comment_notification(self, event):
        """Send comment notification"""
        await self.send_json({
            'type': 'notification',
            'notification_type': 'comment',
            'post_id': event['post_id'],
            'commenter_username': event['commenter_username'],
            'comment_content': event['comment_content'][:100],  # Truncate long comments
            'message': f"{event['commenter_username']} commented on your post",
            'timestamp': event['timestamp']
        })

    async def follow_notification(self, event):
        """Send follow notification"""
        await self.send_json({
            'type': 'notification',
            'notification_type': 'follow',
            'follower_username': event['follower_username'],
            'message': f"{event['follower_username']} started following you",
            'timestamp': event['timestamp']
        })

    async def stream_status_update(self, event):
        """Send live stream status update"""
        await self.send_json({
            'type': 'notification',
            'notification_type': 'stream_status',
            'stream_id': event['stream_id'],
            'host_username': event['host_username'],
            'stream_title': event['stream_title'],
            'event': event['event'],
            'message': f"Stream '{event['stream_title']}' {event['event']}",
            'timestamp': event['timestamp']
        })


class ChatConsumer(ChatMessageThrottleConsumer, AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time chat functionality with throttling.
    """

    async def connect(self):
        self.user = self.scope['user']
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'

        if not self.user.is_authenticated:
            await self.close()
            return

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        # Send join message
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'user_id': self.user.id,
                'username': self.user.username,
                'message': f"{self.user.username} joined the chat",
                'message_type': 'system',
                'timestamp': timezone.now().isoformat()
            }
        )

    async def disconnect(self, close_code):
        # Leave room group
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

            # Send leave message
            if hasattr(self, 'user'):
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'user_id': self.user.id,
                        'username': self.user.username,
                        'message': f"{self.user.username} left the chat",
                        'message_type': 'system',
                        'timestamp': timezone.now().isoformat()
                    }
                )

    async def receive_json(self, content):
        """
        Handle incoming chat messages with throttling.
        """
        message_type = content.get('type')

        if message_type == 'chat_message':
            # Handle chat message with throttling
            await self.handle_chat_message(self.user, content)

        elif message_type == 'ping':
            # Handle heartbeat
            await self.send_json({
                'type': 'pong',
                'timestamp': timezone.now().isoformat()
            })

    # Chat message handlers
    async def chat_message(self, event):
        """Send chat message to WebSocket"""
        # Don't send the message back to the sender
        if event.get('user_id') != self.user.id:
            await self.send_json({
                'type': 'chat_message',
                'user_id': event['user_id'],
                'username': event['username'],
                'message': event['message'],
                'message_type': event.get('message_type', 'user'),
                'timestamp': event['timestamp']
            })


class LiveStreamConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for live stream interactions.
    """

    async def connect(self):
        self.user = self.scope['user']
        self.stream_id = self.scope['url_route']['kwargs']['stream_id']
        self.stream_group_name = f'stream_{self.stream_id}'

        # Join stream group
        await self.channel_layer.group_add(
            self.stream_group_name,
            self.channel_name
        )

        await self.accept()

        # Send connection confirmation
        await self.send_json({
            'type': 'stream_connected',
            'stream_id': self.stream_id,
            'timestamp': timezone.now().isoformat()
        })

    async def disconnect(self, close_code):
        # Leave stream group
        if hasattr(self, 'stream_group_name'):
            await self.channel_layer.group_discard(
                self.stream_group_name,
                self.channel_name
            )

    async def receive_json(self, content):
        """
        Handle incoming stream interaction messages.
        """
        message_type = content.get('type')

        if message_type == 'ping':
            await self.send_json({
                'type': 'pong',
                'timestamp': timezone.now().isoformat()
            })

    # Stream event handlers
    async def stream_status_update(self, event):
        """Send stream status updates"""
        await self.send_json({
            'type': 'stream_update',
            'stream_id': event['stream_id'],
            'status': event['status'],
            'is_live': event['is_live'],
            'viewer_count': event['viewer_count'],
            'title': event['title'],
            'host': event['host'],
            'event': event['event'],
            'timestamp': event['timestamp']
        })

    async def stream_chat_message(self, event):
        """Send chat messages in stream"""
        await self.send_json({
            'type': 'stream_chat',
            'user_id': event['user_id'],
            'username': event['username'],
            'message': event['message'],
            'timestamp': event['timestamp']
        })


class StreamStatusConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for global stream status updates.
    """

    async def connect(self):
        self.user = self.scope['user']

        if not self.user.is_authenticated:
            await self.close()
            return

        # Join global stream status group
        self.stream_status_group = 'stream_status_global'
        await self.channel_layer.group_add(
            self.stream_status_group,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave stream status group
        if hasattr(self, 'stream_status_group'):
            await self.channel_layer.group_discard(
                self.stream_status_group,
                self.channel_name
            )

    async def receive_json(self, content):
        """
        Handle incoming stream status messages.
        """
        message_type = content.get('type')

        if message_type == 'ping':
            await self.send_json({
                'type': 'pong',
                'timestamp': timezone.now().isoformat()
            })

    # Stream status event handlers
    async def stream_started(self, event):
        """Send stream started notification"""
        await self.send_json({
            'type': 'stream_status',
            'event': 'started',
            'stream_id': event['stream_id'],
            'host_username': event['host_username'],
            'stream_title': event['stream_title'],
            'timestamp': event['timestamp']
        })

    async def stream_ended(self, event):
        """Send stream ended notification"""
        await self.send_json({
            'type': 'stream_status',
            'event': 'ended',
            'stream_id': event['stream_id'],
            'host_username': event['host_username'],
            'stream_title': event['stream_title'],
            'timestamp': event['timestamp']
        })


class FeedConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time feed updates.
    """

    async def connect(self):
        self.user = self.scope['user']

        if not self.user.is_authenticated:
            await self.close()
            return

        # Join user's feed group
        self.feed_group = f'feed_{self.user.id}'
        await self.channel_layer.group_add(
            self.feed_group,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave feed group
        if hasattr(self, 'feed_group'):
            await self.channel_layer.group_discard(
                self.feed_group,
                self.channel_name
            )

    async def receive_json(self, content):
        """
        Handle incoming feed interaction messages.
        """
        message_type = content.get('type')

        if message_type == 'ping':
            await self.send_json({
                'type': 'pong',
                'timestamp': timezone.now().isoformat()
            })

    # Feed event handlers
    async def new_post_notification(self, event):
        """Send new post notification"""
        await self.send_json({
            'type': 'new_post',
            'post_id': event['post_id'],
            'author_username': event['author_username'],
            'post_content': event['post_content'][:200],  # Truncate
            'timestamp': event['timestamp']
        })

    async def trending_update(self, event):
        """Send trending topics update"""
        await self.send_json({
            'type': 'trending_update',
            'trends': event['trends'],
            'timestamp': event['timestamp']
        })