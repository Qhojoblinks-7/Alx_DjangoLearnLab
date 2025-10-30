# social_media_api/asgi.py
import os
from django.core.asgi import get_asgi_application

# Fetch Django's ASGI application early to prevent errors
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'social_media_api.settings')
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework.authtoken.models import Token
from notifications.routing import websocket_urlpatterns as notifications_websocket_urlpatterns
from messages.routing import websocket_urlpatterns as messages_websocket_urlpatterns
from posts.routing import websocket_urlpatterns as posts_websocket_urlpatterns

# Combine all WebSocket URL patterns
all_websocket_urlpatterns = notifications_websocket_urlpatterns + messages_websocket_urlpatterns + posts_websocket_urlpatterns


class TokenAuthMiddleware(BaseMiddleware):
    """
    Token authentication middleware for WebSocket connections.
    """
    def __init__(self, inner):
        super().__init__(inner)

    @database_sync_to_async
    def get_user_from_token(self, token_key):
        try:
            token = Token.objects.get(key=token_key)
            return token.user
        except Token.DoesNotExist:
            return AnonymousUser()

    async def __call__(self, scope, receive, send):
        # Extract token from query parameters
        query_string = scope.get('query_string', b'').decode()
        token = None

        if query_string:
            # Parse query parameters
            for param in query_string.split('&'):
                if param.startswith('token='):
                    token = param.split('=', 1)[1]
                    break

        print(f"TokenAuthMiddleware: query_string={query_string}, token={token}")

        # Authenticate user
        if token:
            user = await self.get_user_from_token(token)
            print(f"TokenAuthMiddleware: user from token={user}, is_anonymous={user.is_anonymous}")
            scope['user'] = user
        else:
            print("TokenAuthMiddleware: no token provided")
            scope['user'] = AnonymousUser()

        return await super().__call__(scope, receive, send)


# Custom auth stack with token support
class TokenAuthMiddlewareStack:
    def __init__(self, inner):
        self.inner = TokenAuthMiddleware(inner)

    async def __call__(self, scope, receive, send):
        return await self.inner(scope, receive, send)


application = ProtocolTypeRouter({
    # Django's ASGI application to handle traditional HTTP requests
    "http": django_asgi_app,

    # WebSocket protocol handler with token authentication
    "websocket": AllowedHostsOriginValidator(
        TokenAuthMiddlewareStack(
            URLRouter(
                all_websocket_urlpatterns
            )
        )
    ),
})