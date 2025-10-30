from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination, CursorPagination
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Q, Max
from django.utils import timezone

from .models import Conversation, Message
from .serializers import (
    ConversationSerializer, MessageSerializer,
    SendMessageSerializer, UserSerializer
)
from accounts.models import User
from notifications.models import Notification


class MessagePagination(PageNumberPagination):
    """Pagination for message history."""
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 100


class MessageCursorPagination(CursorPagination):
    """Cursor-based pagination for messages ordered by timestamp ascending."""
    page_size = 30
    ordering = 'timestamp'
    cursor_query_param = 'cursor'


class ConversationListView(generics.ListAPIView):
    """
    B-MSG-01: Conversation List
    Returns a list of the user's active conversations, sorted by latest message time.
    Includes the last message snippet and unread count.
    """
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Get conversations for the authenticated user."""
        user = self.request.user
        return Conversation.objects.filter(
            participants=user
        ).annotate(
            last_message_time=Max('messages__timestamp')
        ).order_by('-last_message_time')


class MessageRequestsView(generics.ListAPIView):
    """
    B-MSG-02: Message Requests
    Returns a list of chats from non-followers (message requests).
    """
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Get conversations with users who are not followers."""
        user = self.request.user
        following_ids = user.following.values_list('id', flat=True)

        # Get conversations where the other participant is not followed
        return Conversation.objects.filter(
            participants=user
        ).exclude(
            participants__in=following_ids
        ).exclude(
            participants=user  # Exclude conversations with only the user
        ).annotate(
            last_message_time=Max('messages__timestamp')
        ).order_by('-last_message_time')


class ChatView(generics.ListCreateAPIView):
    """
    B-MSG-03: Message History (GET) & B-MSG-04: Send Message (POST)
    Combined view for getting message history and sending new messages.
    """
    permission_classes = [IsAuthenticated]
    pagination_class = MessageCursorPagination

    def get_serializer_class(self):
        """Return appropriate serializer based on HTTP method."""
        if self.request.method == 'POST':
            return SendMessageSerializer
        return MessageSerializer

    def get_queryset(self):
        """Get message history for a specific conversation."""
        username = self.kwargs['username']
        user = self.request.user

        # Get or create conversation between users
        other_user = get_object_or_404(User, username=username)

        conversation = Conversation.objects.filter(
            participants=user
        ).filter(
            participants=other_user
        ).first()

        if not conversation:
            # Return empty queryset if no conversation exists
            return Message.objects.none()

        # Mark messages from other user as read
        conversation.messages.filter(
            sender=other_user,
            is_read=False
        ).update(is_read=True, read_at=timezone.now())

        return conversation.messages.all()

    def get_serializer_context(self):
        """Add conversation and sender to serializer context for POST requests."""
        context = super().get_serializer_context()
        if self.request.method == 'POST':
            username = self.kwargs['username']
            user = self.request.user

            # Get or create conversation
            other_user = get_object_or_404(User, username=username)

            # Find existing conversation or create new one
            conversation = Conversation.objects.filter(
                participants=user
            ).filter(
                participants=other_user
            ).first()

            if not conversation:
                conversation = Conversation.objects.create()
                conversation.participants.add(user, other_user)

            context['conversation'] = conversation
            context['sender'] = user
        return context

    def perform_create(self, serializer):
        """Create the message and update conversation timestamp."""
        message = serializer.save()

        # Update conversation's updated_at timestamp
        message.conversation.save(update_fields=['updated_at'])

        # Create notification for the recipient
        recipient = None
        for participant in message.conversation.participants.all():
            if participant != message.sender:
                recipient = participant
                break

        if recipient:
            Notification.objects.create(
                recipient=recipient,
                actor=message.sender,
                verb="messaged",
                target=message.conversation
            )

        return message


class ConversationMessagesView(generics.ListAPIView):
    """
    B-MSG-08: Fetch Messages in Thread
    GET /api/messages/conversations/{conversation_id}/messages/
    Returns messages ordered by timestamp ascending with cursor-based pagination.
    """
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = MessageCursorPagination

    def get_queryset(self):
        """Get messages for a specific conversation."""
        conversation_id = self.kwargs['conversation_id']

        # Get conversation and verify user is a participant
        try:
            conversation = Conversation.objects.get(id=conversation_id)
        except Conversation.DoesNotExist:
            return Message.objects.none()

        # B-MSG-08: PERMISSION CHECK - Must ensure request.user is a participant
        if self.request.user not in conversation.participants.all():
            return Message.objects.none()

        # B-MSG-09: Ordering - Returns messages ordered by timestamp ascending
        # Cursor pagination handles ordering automatically based on MessageCursorPagination.ordering
        return conversation.messages.all()

    def list(self, request, *args, **kwargs):
        """Override list to mark messages as read after retrieval."""
        response = super().list(request, *args, **kwargs)

        # B-MSG-11: Mark as Read - Auto-update unread messages to read=True
        conversation_id = self.kwargs['conversation_id']
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            # Mark all unread messages from other participants as read
            conversation.messages.filter(
                sender__in=conversation.participants.exclude(id=request.user.id),
                is_read=False
            ).update(is_read=True, read_at=timezone.now())
        except Conversation.DoesNotExist:
            pass

        return response


class SendMessageView(APIView):
    """
    B-MSG-12: Send New Message
    POST /api/messages/send/
    Body: { "recipient_id": ID, "content": "text" } OR { "conversation_id": ID, "content": "text" }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        content = request.data.get('content')
        recipient_id = request.data.get('recipient_id')
        conversation_id = request.data.get('conversation_id')

        if not content:
            return Response(
                {"error": "content is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Determine conversation
        if conversation_id:
            # Use existing conversation
            try:
                conversation = Conversation.objects.get(id=conversation_id)
                # Verify user is a participant
                if request.user not in conversation.participants.all():
                    return Response(
                        {"error": "You are not a participant in this conversation"},
                        status=status.HTTP_403_FORBIDDEN
                    )
                recipient = None
                for participant in conversation.participants.all():
                    if participant != request.user:
                        recipient = participant
                        break
            except Conversation.DoesNotExist:
                return Response(
                    {"error": "Conversation not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
        elif recipient_id:
            # Find or create conversation with recipient
            try:
                recipient = User.objects.get(id=recipient_id)
            except User.DoesNotExist:
                return Response(
                    {"error": "Recipient not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            if recipient == request.user:
                return Response(
                    {"error": "Cannot send message to yourself"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get or create conversation
            conversation = Conversation.objects.filter(
                participants=request.user
            ).filter(
                participants=recipient
            ).first()

            if not conversation:
                conversation = Conversation.objects.create()
                conversation.participants.add(request.user, recipient)
        else:
            return Response(
                {"error": "Either recipient_id or conversation_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create message
        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content=content
        )

        # Update conversation timestamp
        conversation.save(update_fields=['updated_at'])

        serializer = MessageSerializer(message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MessageViewSet(viewsets.ViewSet):
    """
    Alternative viewset approach for messaging endpoints.
    """
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def conversations(self, request):
        """B-MSG-01: Get user's conversations."""
        queryset = Conversation.objects.filter(
            participants=request.user
        ).annotate(
            last_message_time=Max('messages__timestamp')
        ).order_by('-last_message_time')

        serializer = ConversationSerializer(
            queryset,
            many=True,
            context={'request': request}
        )
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def requests(self, request):
        """B-MSG-02: Get message requests."""
        user = request.user
        following_ids = user.following.values_list('id', flat=True)

        queryset = Conversation.objects.filter(
            participants=user
        ).exclude(
            participants__in=following_ids
        ).exclude(
            participants=user
        ).annotate(
            last_message_time=Max('messages__timestamp')
        ).order_by('-last_message_time')

        serializer = ConversationSerializer(
            queryset,
            many=True,
            context={'request': request}
        )
        return Response(serializer.data)
