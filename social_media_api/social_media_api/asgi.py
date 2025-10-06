# social_media_api/asgi.py
import os
from django.core.asgi import get_asgi_application


# Fetch Django's ASGI application early to prevent errors
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'social_media_api.settings')
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from notifications.routing import websocket_urlpatterns # Import from step 1D

application = ProtocolTypeRouter({
    # Django's ASGI application to handle traditional HTTP requests
    "http": django_asgi_app,

    # WebSocket protocol handler
    "websocket": AuthMiddlewareStack( # Ensures the user is authenticated in the WebSocket
        URLRouter(
            websocket_urlpatterns
        )
    ),
})