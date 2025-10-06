# notifications/routing.py
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # /ws/notifications/ - Global channel for user alerts (NotificationBell)
    re_path(r'ws/notifications/$', consumers.NotificationConsumer.as_asgi()), 
    
    # /ws/post/{pk}/ - Specific channel for real-time post updates (Like count, comments)
    re_path(r'ws/post/(?P<post_pk>\d+)/$', consumers.PostConsumer.as_asgi()), 
]