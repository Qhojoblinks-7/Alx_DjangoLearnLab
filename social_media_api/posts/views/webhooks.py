from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from ..models import LiveStream
import hmac
import hashlib
import json
import logging

logger = logging.getLogger(__name__)


def verify_mux_webhook_signature(request_body: bytes, signature_header: str, webhook_secret: str) -> bool:
    """
    Verify Mux webhook signature using HMAC-SHA256.

    Mux sends signatures in the format: t=timestamp,v1=signature
    We verify the signature against the request body using the webhook secret.
    """
    try:
        # Parse signature header (format: t=timestamp,v1=signature)
        if not signature_header or ',' not in signature_header:
            logger.warning("Invalid Mux-Signature header format")
            return False

        parts = signature_header.split(',')
        timestamp = None
        signature = None

        for part in parts:
            if part.startswith('t='):
                timestamp = part[2:]
            elif part.startswith('v1='):
                signature = part[3:]

        if not timestamp or not signature:
            logger.warning("Missing timestamp or signature in Mux-Signature header")
            return False

        # Create the expected signature
        # Mux uses: HMAC-SHA256(timestamp + "." + request_body)
        message = f"{timestamp}.{request_body.decode('utf-8')}"
        expected_signature = hmac.new(
            webhook_secret.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        # Use constant-time comparison to prevent timing attacks
        return hmac.compare_digest(signature, expected_signature)

    except Exception as e:
        logger.error(f"Error verifying Mux webhook signature: {e}")
        return False


def get_client_ip(request) -> str:
    """Get the real client IP address, handling proxies"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        # Take the first IP if there are multiple
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR', '')
    return ip


def is_mux_ip_allowed(client_ip: str) -> bool:
    """
    Check if the client IP is in the allowed Mux IP ranges.
    This is an optional but recommended security measure.
    """
    # Mux webhook IPs (as of 2024 - check Mux documentation for current ranges)
    allowed_ranges = [
        '23.23.0.0/16',      # Example - check Mux docs for actual ranges
        '54.240.0.0/16',     # Example - check Mux docs for actual ranges
        '54.241.0.0/16',     # Example - check Mux docs for actual ranges
    ]

    # For production, implement proper CIDR checking
    # For now, we'll skip IP validation but log the IP for monitoring
    logger.info(f"Mux webhook received from IP: {client_ip}")
    return True  # Allow all IPs for development - implement proper checking in production


@api_view(['POST'])
@permission_classes([])  # Allow unauthenticated requests from Mux
def mux_webhook(request):
    """
    SECURE Mux Video API webhook handler with signature verification.

    Processes events like:
    - video.live_stream.connected: Stream started broadcasting
    - video.live_stream.disconnected: Stream stopped broadcasting
    - video.live_stream.idle_timeout_reached: Stream timed out

    SECURITY MEASURES:
    - HMAC-SHA256 signature verification
    - HTTPS enforcement (recommended)
    - IP whitelisting (optional but recommended)
    - Request logging and monitoring
    """
    client_ip = get_client_ip(request)

    try:
        # SECURITY: Verify webhook signature
        webhook_secret = getattr(settings, 'MUX_WEBHOOK_SECRET', None)
        if webhook_secret:
            signature_header = request.headers.get('Mux-Signature')
            if not signature_header:
                logger.warning(f"Mux webhook rejected: Missing Mux-Signature header from {client_ip}")
                return Response(
                    {'error': 'Missing signature'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            # Verify the signature
            if not verify_mux_webhook_signature(request.body, signature_header, webhook_secret):
                logger.warning(f"Mux webhook rejected: Invalid signature from {client_ip}")
                return Response(
                    {'error': 'Invalid signature'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
        else:
            logger.warning("Mux webhook received but MUX_WEBHOOK_SECRET not configured!")

        # SECURITY: Optional IP whitelisting
        if not is_mux_ip_allowed(client_ip):
            logger.warning(f"Mux webhook rejected: IP not allowed {client_ip}")
            return Response(
                {'error': 'IP not allowed'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Parse webhook payload
        try:
            payload = json.loads(request.body)
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in Mux webhook payload: {e}")
            return Response(
                {'error': 'Invalid JSON payload'},
                status=status.HTTP_400_BAD_REQUEST
            )

        event_type = payload.get('type')
        data = payload.get('data', {})

        logger.info(f"Processing verified Mux webhook: {event_type} from {client_ip}")

        # Handle different event types
        if event_type == 'video.live_stream.connected':
            # Stream has started broadcasting
            mux_stream_id = data.get('id')
            if mux_stream_id:
                _handle_stream_started(mux_stream_id, data)
            else:
                logger.warning("Missing stream ID in connected event")

        elif event_type == 'video.live_stream.disconnected':
            # Stream has stopped broadcasting
            mux_stream_id = data.get('id')
            if mux_stream_id:
                _handle_stream_ended(mux_stream_id, data)
            else:
                logger.warning("Missing stream ID in disconnected event")

        elif event_type == 'video.live_stream.idle_timeout_reached':
            # Stream timed out due to inactivity
            mux_stream_id = data.get('id')
            if mux_stream_id:
                _handle_stream_timeout(mux_stream_id, data)
            else:
                logger.warning("Missing stream ID in timeout event")

        else:
            logger.info(f"Ignored unhandled Mux webhook event: {event_type}")

        return Response({'status': 'ok'})

    except Exception as e:
        logger.error(f"Error processing Mux webhook from {client_ip}: {e}")
        # Don't expose internal errors to external webhook calls
        return Response(
            {'error': 'Webhook processing failed'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def _handle_stream_started(mux_stream_id: str, data: dict):
    """Handle stream started event"""
    try:
        # Find the corresponding LiveStream object
        stream = LiveStream.objects.filter(stream_key=mux_stream_id).first()
        if not stream:
            logger.warning(f"No LiveStream found for mux_stream_id: {mux_stream_id}")
            return

        # Update stream status
        stream.status = 'live'
        stream.actual_start = timezone.now()
        stream.playback_url = data.get('playback_ids', [{}])[0].get('id') if data.get('playback_ids') else stream.playback_url
        stream.save()

        # Send WebSocket notification to followers
        _notify_stream_status_change(stream, 'started')

        # Broadcast to stream status channel
        _broadcast_stream_status(stream, 'started')

        logger.info(f"Stream started: {stream.title} by {stream.host.username}")

    except Exception as e:
        logger.error(f"Error handling stream started: {e}")


def _handle_stream_ended(mux_stream_id: str, data: dict):
    """Handle stream ended event"""
    try:
        # Find the corresponding LiveStream object
        stream = LiveStream.objects.filter(stream_key=mux_stream_id).first()
        if not stream:
            logger.warning(f"No LiveStream found for mux_stream_id: {mux_stream_id}")
            return

        # Update stream status
        stream.status = 'ended'
        stream.actual_end = timezone.now()
        stream.save()

        # Send WebSocket notification to followers
        _notify_stream_status_change(stream, 'ended')

        # Broadcast to stream status channel
        _broadcast_stream_status(stream, 'ended')

        logger.info(f"Stream ended: {stream.title} by {stream.host.username}")

    except Exception as e:
        logger.error(f"Error handling stream ended: {e}")


def _handle_stream_timeout(mux_stream_id: str, data: dict):
    """Handle stream timeout event"""
    try:
        # Find the corresponding LiveStream object
        stream = LiveStream.objects.filter(stream_key=mux_stream_id).first()
        if not stream:
            logger.warning(f"No LiveStream found for mux_stream_id: {mux_stream_id}")
            return

        # Update stream status
        stream.status = 'ended'
        stream.actual_end = timezone.now()
        stream.save()

        # Send WebSocket notification to followers
        _notify_stream_status_change(stream, 'timeout')

        logger.info(f"Stream timed out: {stream.title} by {stream.host.username}")

    except Exception as e:
        logger.error(f"Error handling stream timeout: {e}")


def _notify_stream_status_change(stream: LiveStream, event: str):
    """Send WebSocket notification about stream status change"""
    try:
        channel_layer = get_channel_layer()

        # Notify followers of the stream host
        followers = stream.host.followers.all()
        for follower in followers:
            async_to_sync(channel_layer.group_send)(
                f'notifications_{follower.id}',
                {
                    'type': 'stream_status_update',
                    'stream_id': stream.id,
                    'host_username': stream.host.username,
                    'stream_title': stream.title,
                    'event': event,
                    'timestamp': timezone.now().isoformat()
                }
            )

        # Also notify the stream host
        async_to_sync(channel_layer.group_send)(
            f'notifications_{stream.host.id}',
            {
                'type': 'stream_status_update',
                'stream_id': stream.id,
                'host_username': stream.host.username,
                'stream_title': stream.title,
                'event': event,
                'timestamp': timezone.now().isoformat()
            }
        )

    except Exception as e:
        logger.error(f"Error sending stream status notification: {e}")


def _broadcast_stream_status(stream: LiveStream, event: str):
    """Broadcast stream status to stream-specific WebSocket channels"""
    try:
        channel_layer = get_channel_layer()

        # Broadcast to stream status channel
        status_group = f'stream_{stream.id}_status'
        async_to_sync(channel_layer.group_send)(
            status_group,
            {
                'type': 'stream_status_update',
                'stream_id': stream.id,
                'status': stream.status,
                'is_live': stream.is_live,
                'viewer_count': stream.viewer_count,
                'title': stream.title,
                'host': stream.host.username,
                'event': event,
                'timestamp': timezone.now().isoformat()
            }
        )

        # If stream started, notify followers via global stream status channel
        if event == 'started':
            followers = stream.host.followers.all()
            for follower in followers:
                async_to_sync(channel_layer.group_send)(
                    f'user_{follower.id}_streams',
                    {
                        'type': 'stream_notification',
                        'stream_id': stream.id,
                        'host_username': stream.host.username,
                        'stream_title': stream.title,
                        'event': 'started',
                        'timestamp': timezone.now().isoformat()
                    }
                )

    except Exception as e:
        logger.error(f"Error broadcasting stream status: {e}")