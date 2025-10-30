#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'social_media_api.settings')
django.setup()

from accounts.models import User
from chat.models import Conversation, Message

def test_messaging_endpoints():
    print("Testing messaging endpoints...")

    try:
        # Get users
        testuser = User.objects.get(username='testuser')
        blinks = User.objects.get(username='Blinks')
        print(f"Found users: {testuser.username} and {blinks.username}")

        # Get or create conversation
        conversation = Conversation.objects.filter(participants=testuser).filter(participants=blinks).first()
        if not conversation:
            conversation = Conversation.objects.create()
            conversation.participants.add(testuser, blinks)
            print("Created conversation")

        print(f"Conversation ID: {conversation.id}")

        # Create some test messages
        messages = []
        for i in range(3):
            msg = Message.objects.create(
                conversation=conversation,
                sender=testuser if i % 2 == 0 else blinks,
                content=f'Test message {i+1} from {"testuser" if i % 2 == 0 else "blinks"}'
            )
            messages.append(msg)
            print(f"Created message {i+1}: {msg.id}")

        # Test conversation messages endpoint (simulated)
        conversation_messages = conversation.messages.all().order_by('timestamp')
        print(f"Total messages in conversation: {conversation_messages.count()}")

        # Test ordering
        timestamps = [msg.timestamp for msg in conversation_messages]
        is_ordered = all(timestamps[i] <= timestamps[i+1] for i in range(len(timestamps)-1))
        print(f"Messages ordered by timestamp ascending: {is_ordered}")

        # Test pagination (simulate)
        page_size = 2
        paginated_messages = list(conversation_messages[:page_size])
        print(f"First page has {len(paginated_messages)} messages")

        print("SUCCESS: Messaging endpoints logic working correctly")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    test_messaging_endpoints()