from django.db import models
from django.conf import settings
from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver
from notifications.models import Notification

class Conversation(models.Model):
    """
    Represents a conversation between two users.
    """
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='messages_conversations'
    )

    # Track when the conversation was created and last updated
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        participants = list(self.participants.all())
        if len(participants) == 2:
            return f"Chat between {participants[0].username} and {participants[1].username}"
        return f"Group chat with {len(participants)} participants"

    @property
    def last_message(self):
        """Get the most recent message in this conversation."""
        return self.messages.order_by('-timestamp').first()

    def unread_count_for_user(self, user):
        """Get unread message count for a specific user."""
        return self.messages.exclude(sender=user).filter(is_read=False).count()


class Message(models.Model):
    """
    Represents a message in a conversation.
    """
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )

    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='messages_sent_messages'
    )

    content = models.TextField()

    # Message metadata
    timestamp = models.DateTimeField(default=timezone.now)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    # For message threading/replies (optional)
    reply_to = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='replies'
    )

    class Meta:
        ordering = ['timestamp']
        indexes = [
            models.Index(fields=['conversation', 'timestamp']),
            models.Index(fields=['sender', 'timestamp']),
        ]

    def __str__(self):
        return f"Message from {self.sender.username}: {self.content[:50]}..."

    def mark_as_read(self):
        """Mark message as read."""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])


@receiver(post_save, sender=Message)
def create_message_notification(sender, instance, created, **kwargs):
    """Create notification when a new message is sent."""
    if created:
        # Find the recipient (the other participant in the conversation)
        recipient = None
        for participant in instance.conversation.participants.all():
            if participant != instance.sender:
                recipient = participant
                break

        if recipient:
            Notification.objects.create(
                recipient=recipient,
                actor=instance.sender,
                verb="messaged",
                target=instance.conversation
            )
