# messages/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from asgiref.sync import async_to_sync
from django.contrib.auth.models import AnonymousUser
from django.utils import timezone
from .models import Conversation, Message


class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time messaging in chat conversations.
    Handles joining/leaving chat rooms and broadcasting messages.
    """

    async def connect(self):
        print("ChatConsumer connect called")
        try:
            # Get user from scope (authenticated by ASGI middleware)
            self.user = self.scope.get('user', AnonymousUser())
            print(f"User from scope: {self.user}, is_anonymous: {self.user.is_anonymous}")

            if self.user.is_anonymous:
                print("User is anonymous, closing connection")
                await self.close()
                return

            # Get username from URL
            self.username = self.scope['url_route']['kwargs']['username']
            print(f"Chat username: {self.username}")

            # Find conversation between current user and target username
            from accounts.models import User
            target_user = await self.get_user_by_username(self.username)

            if not target_user:
                print(f"Target user {self.username} not found")
                await self.close()
                return

            print(f"Found target user: {target_user.id} - {target_user.username}")

            conversation = await self.get_or_create_conversation(self.user, target_user)
            if not conversation:
                print("Could not find or create conversation")
                await self.close()
                return

            print(f"Found/created conversation: {conversation.id}")

            self.conversation = conversation
            self.room_group_name = f'chat_{conversation.id}'
            print(f"Joining chat room: {self.room_group_name}")

            # Join the conversation group
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )

            print("Chat WebSocket connection accepted")
            await self.accept()

        except Exception as e:
            print(f"Error in chat connect: {e}")
            import traceback
            traceback.print_exc()
            await self.close()

    async def disconnect(self, close_code):
        print(f"ChatConsumer disconnect called, close_code: {close_code}")
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
        print("ChatConsumer disconnected")

    # WebSocket consumers for chat don't need to receive messages from clients
    # Messages are sent via REST API and broadcast via signals
    async def receive(self, text_data):
        # For now, just acknowledge receipt but don't process
        pass

    # Receive message from room group
    async def chat_message(self, event):
        message = event['message']

        # Send to all connected clients in the conversation
        await self.send(text_data=json.dumps({
            'type': 'message',
            'message': message
        }))

    @database_sync_to_async
    def get_user_by_username(self, username):
        from accounts.models import User
        try:
            return User.objects.get(username=username)
        except User.DoesNotExist:
            return None

    @database_sync_to_async
    def get_or_create_conversation(self, user1, user2):
        # Find existing conversation
        conversation = Conversation.objects.filter(
            participants=user1
        ).filter(
            participants=user2
        ).first()

        if not conversation:
            # Create new conversation
            conversation = Conversation.objects.create()
            conversation.participants.add(user1, user2)

        return conversation