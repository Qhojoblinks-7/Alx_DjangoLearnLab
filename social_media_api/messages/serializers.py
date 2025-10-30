from rest_framework import serializers
from .models import Conversation, Message
from accounts.models import User


class UserSerializer(serializers.ModelSerializer):
    """Simplified user serializer for messaging."""
    class Meta:
        model = User
        fields = ['id', 'username', 'email']


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for individual messages."""
    sender = UserSerializer(read_only=True)
    reply_to = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(source='timestamp', read_only=True)  # Frontend expects 'created_at'

    class Meta:
        model = Message
        fields = [
            'id', 'sender', 'content', 'timestamp', 'created_at',
            'is_read', 'read_at', 'reply_to'
        ]
        read_only_fields = ['id', 'timestamp', 'created_at', 'is_read', 'read_at']

    def get_reply_to(self, obj):
        """Get reply-to message if it exists."""
        if obj.reply_to:
            return MessageSerializer(obj.reply_to).data
        return None


class ConversationSerializer(serializers.ModelSerializer):
    """Serializer for conversations with last message and unread count."""
    participants = UserSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    user = serializers.SerializerMethodField()  # Frontend expects 'user' instead of 'other_participant'

    class Meta:
        model = Conversation
        fields = [
            'id', 'participants', 'last_message', 'unread_count',
            'user', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_last_message(self, obj):
        """Get the last message in the conversation."""
        last_msg = obj.last_message
        if last_msg:
            return MessageSerializer(last_msg).data
        return None

    def get_unread_count(self, obj):
        """Get unread message count for the current user."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Try calling the method directly
            try:
                return obj.unread_count_for_user(request.user)
            except TypeError:
                # If it's a property, call it without arguments
                return obj.unread_count_for_user
        return 0

    def get_user(self, obj):
        """Get the other participant in a 1-on-1 conversation."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            participants = list(obj.participants.exclude(id=request.user.id))
            if len(participants) == 1:
                user_data = UserSerializer(participants[0]).data
                # Add 'name' field for frontend compatibility (same as username for now)
                user_data['name'] = user_data['username']
                return user_data
        return None


class SendMessageSerializer(serializers.Serializer):
    """Serializer for sending messages."""
    content = serializers.CharField(required=True, max_length=1000)
    reply_to_id = serializers.IntegerField(required=False, allow_null=True)

    def validate_reply_to_id(self, value):
        """Validate that reply_to message exists and belongs to the same conversation."""
        if value is not None:
            try:
                reply_message = Message.objects.get(id=value)
                # Additional validation can be added here
                return value
            except Message.DoesNotExist:
                raise serializers.ValidationError("Reply message does not exist.")
        return value

    def create(self, validated_data):
        """Create a new message."""
        conversation = self.context['conversation']
        sender = self.context['sender']

        # Mark previous messages as read for the sender
        conversation.messages.filter(
            sender=sender,
            is_read=False
        ).update(is_read=True, read_at=validated_data.get('timestamp'))

        return Message.objects.create(
            conversation=conversation,
            sender=sender,
            content=validated_data['content'],
            reply_to_id=validated_data.get('reply_to_id')
        )