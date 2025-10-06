from rest_framework import serializers
from .models import Notification
from accounts.serializers import UserSerializer

class NotificationSerializer(serializers.ModelSerializer):
    actor = UserSerializer(read_only=True)
    recipient = UserSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'recipient', 'actor', 'verb', 'target', 'timestamp', 'is_read']