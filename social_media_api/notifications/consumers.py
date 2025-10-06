# notifications/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import async_to_sync

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Every user joins a unique group named by their user ID
        self.user = self.scope["user"]
        if self.user.is_anonymous:
            await self.close()
        
        self.user_group_name = f'user_{self.user.id}_notifications'

        # Join the unique user group
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.user_group_name,
            self.channel_name
        )

    # Receive message from room group (i.e., triggered by the signal)
    async def send_notification(self, event):
        # Send the actual data to the WebSocket (Task 4 requirement)
        await self.send(text_data=json.dumps({
            'type': event['type'],
            'data': event['data']
        }))

class PostConsumer(AsyncWebsocketConsumer):
    # This consumer handles real-time updates for a single post (likes/comments)
    async def connect(self):
        self.post_pk = self.scope['url_route']['kwargs']['post_pk']
        self.post_group_name = f'post_{self.post_pk}'
        
        # Join the post-specific group
        await self.channel_layer.group_add(
            self.post_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.post_group_name,
            self.channel_name
        )
    
    # Send post update (triggered by like/comment signal)
    async def send_post_update(self, event):
        await self.send(text_data=json.dumps({
            'type': event['type'],
            'data': event['data']
        }))