#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'social_media_api.settings')
django.setup()

from accounts.models import User
from chat.models import Conversation, Message
from notifications.models import Notification

def test_message_notification():
    print("Testing message notifications...")

    try:
        # Get users
        testuser = User.objects.get(username='testuser')
        blinks = User.objects.get(username='Blinks')
        print(f"Found users: {testuser.username} and {blinks.username}")

        # Create conversation if it doesn't exist
        conversation = Conversation.objects.filter(participants=testuser).filter(participants=blinks).first()
        if not conversation:
            conversation = Conversation.objects.create()
            conversation.participants.add(testuser, blinks)
            print("Created conversation")

        # Create message
        message = Message.objects.create(
            conversation=conversation,
            sender=testuser,
            content='Test message from script'
        )
        print(f"Created message: {message.id}")

        # Check if notification was created
        notifications = Notification.objects.filter(recipient=blinks, verb='messaged')
        print(f"Message notifications for Blinks: {notifications.count()}")

        if notifications.exists():
            print("SUCCESS: Message notification found!")
            for n in notifications.order_by('-timestamp')[:1]:
                print(f"  - {n.verb} by {n.actor.username} at {n.timestamp}")
        else:
            print("FAILED: No message notification found")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    test_message_notification()