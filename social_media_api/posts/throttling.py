from rest_framework.throttling import UserRateThrottle, AnonRateThrottle, ScopedRateThrottle
from django.core.cache import cache
from django.conf import settings
import time


class BurstRateThrottle(UserRateThrottle):
    """
    Allows short bursts of requests with a higher rate limit,
    but sustained high usage is throttled.
    """
    scope = 'burst'
    rate = '60/minute'  # Burst allowance


class SustainedRateThrottle(UserRateThrottle):
    """
    Prevents sustained high usage over longer periods.
    """
    scope = 'sustained'
    rate = '1000/hour'  # Sustained limit


class PostCreationThrottle(UserRateThrottle):
    """
    Specific throttling for post creation to prevent spam.
    Allows 10 posts per hour with burst of 2 per minute.
    """
    scope = 'post_creation'

    def get_rate(self):
        # Allow authenticated users more posts than anonymous
        # In DRF throttling, the request is passed to allow_request method
        # For get_rate, we need to check if we're in the context of a request
        # This method is called during __init__, so we can't access request yet
        # We'll handle user checking in allow_request method instead
        return '10/hour'  # Default to authenticated user rate

    def allow_request(self, request, view):
        """
        Implement burst control: max 2 posts per minute,
        but allow up to 10 per hour.
        """
        user = request.user
        if not user or not user.is_authenticated:
            # Anonymous users: very restrictive - use base throttling
            return super().allow_request(request, view)

        # Authenticated users: check burst rate
        user_id = user.id
        cache_key = f'post_burst_{user_id}'
        current_time = time.time()

        # Get recent post timestamps
        timestamps = cache.get(cache_key, [])

        # Remove timestamps older than 1 minute
        one_minute_ago = current_time - 60
        timestamps = [ts for ts in timestamps if ts > one_minute_ago]

        # Check burst limit (2 posts per minute)
        if len(timestamps) >= 2:
            return False

        # Add current timestamp
        timestamps.append(current_time)
        cache.set(cache_key, timestamps, 60)  # Cache for 1 minute

        # Also check hourly limit
        return super().allow_request(request, view)


class LiveStreamCreationThrottle(UserRateThrottle):
    """
    Throttling for live stream creation.
    Allows 3 streams per day with burst protection.
    """
    scope = 'live_stream_creation'
    rate = '3/day'

    def __init__(self):
        super().__init__()
        self.history = []

    def get_identified_user(self):
        """Get the user from the request for throttling."""
        return getattr(self, 'user', None) or getattr(self.request, 'user', None)

    def allow_request(self, request, view):
        """
        Additional check: prevent multiple active streams per user.
        """
        # Set request on self for get_identified_user to work
        self.request = request

        user = self.get_identified_user()
        if user:
            # Check if user already has an active stream
            from posts.models import LiveStream
            active_streams = LiveStream.objects.filter(
                host=user,
                status__in=['scheduled', 'starting', 'live']
            ).count()

            if active_streams >= 1:
                return False

        return super().allow_request(request, view)


class MediaUploadThrottle(UserRateThrottle):
    """
    Throttling for media upload URL generation.
    Prevents abuse of upload URL generation.
    """
    scope = 'media_upload'
    rate = '20/minute'  # Allow generating 20 upload URLs per minute


class ChatMessageThrottle(ScopedRateThrottle):
    """
    WebSocket-based throttling for chat messages.
    Limits messages per user per time window.
    """
    scope = 'chat_messages'
    rate = '5/minute'  # 5 messages per minute

    def get_cache_key(self, request, view):
        """
        Custom cache key that includes user ID for WebSocket connections.
        """
        user = getattr(request, 'user', None)
        if user and user.is_authenticated:
            return f"chat_throttle_{user.id}"
        return None

    def allow_request(self, request, view):
        """
        Check if the request should be allowed based on rate limiting.
        """
        cache_key = self.get_cache_key(request, view)
        if cache_key is None:
            return True  # Allow anonymous or unidentified requests

        current_time = time.time()
        timestamps = cache.get(cache_key, [])

        # Remove timestamps older than the rate window
        window_start = current_time - (60 / self.num_requests)  # Convert rate to window
        timestamps = [ts for ts in timestamps if ts > window_start]

        # Check if under the limit
        if len(timestamps) >= self.num_requests:
            return False

        # Add current timestamp and update cache
        timestamps.append(current_time)
        cache.set(cache_key, timestamps, 60)  # Cache for 1 minute

        return True


class FeedAccessThrottle(UserRateThrottle):
    """
    Throttling for feed access to prevent excessive API calls.
    """
    scope = 'feed_access'
    rate = '100/minute'  # Allow 100 feed requests per minute


class SearchThrottle(UserRateThrottle):
    """
    Throttling for search endpoints to prevent abuse.
    """
    scope = 'search'
    rate = '30/minute'  # Allow 30 searches per minute


class AnalyticsThrottle(UserRateThrottle):
    """
    Throttling for analytics endpoints.
    """
    scope = 'analytics'
    rate = '10/minute'  # Allow 10 analytics requests per minute


# Custom throttle classes for different user types
class PremiumUserThrottle(UserRateThrottle):
    """
    Higher limits for premium users.
    """
    scope = 'premium'

    def get_rate(self):
        user = self.get_identified_user()
        if user and hasattr(user, 'is_premium') and user.is_premium:
            return '1000/hour'  # Higher limit for premium users
        return '100/hour'  # Standard limit


class BotDetectionThrottle(UserRateThrottle):
    """
    Advanced throttling that detects potential bot behavior.
    """
    scope = 'bot_detection'

    def allow_request(self, request, view):
        """
        Check for bot-like behavior patterns.
        """
        user = self.get_identified_user()
        if not user:
            return True  # Anonymous users handled by AnonRateThrottle

        # Check for rapid successive requests
        cache_key = f'user_requests_{user.id}'
        current_time = time.time()

        request_times = cache.get(cache_key, [])
        request_times.append(current_time)

        # Keep only requests from last 10 seconds
        ten_seconds_ago = current_time - 10
        request_times = [ts for ts in request_times if ts > ten_seconds_ago]

        # If more than 5 requests in 10 seconds, throttle
        if len(request_times) > 5:
            cache.set(cache_key, request_times, 10)
            return False

        cache.set(cache_key, request_times, 10)
        return True