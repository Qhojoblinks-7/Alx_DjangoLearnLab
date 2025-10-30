"""
WebSocket routing for posts app.

Defines URL patterns for live streaming WebSocket consumers.
"""

from django.urls import re_path
from .consumers import LiveStreamConsumer, StreamStatusConsumer

websocket_urlpatterns = [
    # Live stream WebSocket for specific streams
    # /ws/posts/stream/<stream_id>/
    re_path(r'ws/posts/stream/(?P<stream_id>\d+)/$', LiveStreamConsumer.as_asgi()),

    # Global stream status updates for users
    # /ws/posts/streams/status/
    re_path(r'ws/posts/streams/status/$', StreamStatusConsumer.as_asgi()),
]