# messages/routing.py
from django.urls import re_path
from .consumers import ChatConsumer

websocket_urlpatterns = [
    # /ws/chat/{username}/ - Real-time chat for conversations
    re_path(r'ws/chat/(?P<username>\w+)/$', ChatConsumer.as_asgi()),
]