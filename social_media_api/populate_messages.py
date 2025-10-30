#!/usr/bin/env python
"""
Script to populate test data for messaging system.
"""
import os
import django
import sys
from datetime import datetime, timedelta

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'social_media_api.settings')
django.setup()

from accounts.models import User
from messages.models import Conversation, Message

def populate_messages():
    """Create test conversations and messages."""
    print("Populating messaging data...")

    # Get existing users
    users = list(User.objects.all()[:4])  # Get first 4 users
    print(f"Found {len(users)} users")

    if len(users) < 2:
        print("Need at least 2 users to create conversations")
        return

    # Create conversation between first two users
    conv1 = Conversation.objects.create()
    conv1.participants.add(users[0], users[1])

    # Create messages for conv1
    base_time = datetime.now() - timedelta(minutes=30)
    messages_data = [
        (users[0], "Hello! How are you doing?", 0),
        (users[1], "Hi! I'm doing great, thanks for asking!", 5),
        (users[0], "That's awesome! Have you seen the new features?", 10),
        (users[1], "Yes! The messaging system looks really good.", 15),
        (users[0], "Definitely! The cursor pagination is working well.", 20),
        (users[1], "Agreed! Let's test it out more.", 25),
    ]

    for sender, content, minutes_ago in messages_data:
        Message.objects.create(
            conversation=conv1,
            sender=sender,
            content=content,
            timestamp=base_time + timedelta(minutes=minutes_ago)
        )

    print(f"Created conversation 1 with {len(messages_data)} messages")

    # Create another conversation if we have more users
    if len(users) >= 3:
        conv2 = Conversation.objects.create()
        conv2.participants.add(users[0], users[2])

        Message.objects.create(
            conversation=conv2,
            sender=users[0],
            content="Hey! Want to discuss the project?",
            timestamp=datetime.now() - timedelta(minutes=15)
        )

        Message.objects.create(
            conversation=conv2,
            sender=users[2],
            content="Sure! What's on your mind?",
            timestamp=datetime.now() - timedelta(minutes=10)
        )

        print("Created conversation 2 with 2 messages")

    print("Messaging data populated successfully!")

if __name__ == '__main__':
    populate_messages()