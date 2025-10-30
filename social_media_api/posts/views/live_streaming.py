from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import viewsets, status, permissions, views, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models import LiveStream, LiveStreamView
from ..serializers import LiveStreamSerializer, LiveStreamCreateSerializer, LiveStreamStartSerializer
from ..streaming_service import get_streaming_service, StreamingServiceError
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import logging

logger = logging.getLogger(__name__)

User = get_user_model()


class LiveStreamViewSet(viewsets.ModelViewSet):
    """
    B-LIVE-01: Live Stream Management
    Handles creating, starting, and managing live streams.
    """
    serializer_class = LiveStreamSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Return live streams based on user permissions"""
        user = self.request.user

        # Base queryset
        queryset = LiveStream.objects.select_related('host')

        # If user is authenticated, include private streams they're allowed to view
        if user.is_authenticated:
            # Include streams hosted by user, or public streams, or private streams user is allowed to view
            queryset = queryset.filter(
                Q(host=user) |
                Q(is_private=False) |
                Q(is_private=True, allowed_users=user)
            )
        else:
            # Anonymous users only see public streams
            queryset = queryset.filter(is_private=False)

        return queryset.order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'create':
            return LiveStreamCreateSerializer
        return LiveStreamSerializer

    def perform_create(self, serializer):
        # Create the stream record first
        stream = serializer.save(host=self.request.user)

        try:
            # Create the stream in the external streaming service
            streaming_service = get_streaming_service()
            stream_data = streaming_service.create_live_stream(
                title=stream.title,
                description=stream.description or ""
            )

            # Update the stream with service-provided data
            stream.stream_key = stream_data['stream_key']
            stream.stream_url = stream_data['rtmp_url']
            stream.playback_url = stream_data['playback_url']
            stream.save()

        except StreamingServiceError as e:
            # If streaming service fails, delete the created stream and raise error
            stream.delete()
            raise serializers.ValidationError(f"Failed to create streaming service: {str(e)}")

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def start(self, request, pk=None):
        """
        B-LIVE-01: Start a live stream
        POST /api/live/stream/{id}/start/
        Updates stream URLs and marks as live.
        """
        stream = self.get_object()

        # Check if user owns the stream
        if stream.host != request.user:
            return Response(
                {'error': 'You do not have permission to start this stream'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if stream can be started
        if stream.status not in ['scheduled', 'starting']:
            return Response(
                {'error': f'Cannot start stream with status: {stream.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = LiveStreamStartSerializer(stream, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def end(self, request, pk=None):
        """
        End a live stream
        POST /api/live/stream/{id}/end/
        """
        stream = self.get_object()

        # Check if user owns the stream
        if stream.host != request.user:
            return Response(
                {'error': 'You do not have permission to end this stream'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if stream is live
        if stream.status != 'live':
            return Response(
                {'error': f'Cannot end stream with status: {stream.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        stream.end_stream()
        serializer = self.get_serializer(stream)
        return Response(serializer.data)


class LiveStreamWatchView(views.APIView):
    """
    B-LIVE-02: Watch Live Stream
    GET /api/live/stream/watch/{id}/
    Returns playback URL and metadata for watching a stream.
    """
    permission_classes = [permissions.AllowAny]  # Allow anonymous viewing for public streams

    def get(self, request, pk):
        try:
            stream = LiveStream.objects.select_related('host').get(pk=pk)

            # Check permissions for private streams
            if stream.is_private and request.user not in stream.allowed_users.all():
                if not request.user.is_authenticated or request.user != stream.host:
                    return Response(
                        {'error': 'You do not have permission to view this stream'},
                        status=status.HTTP_403_FORBIDDEN
                    )

            # Check if stream is active
            if stream.status not in ['live', 'starting']:
                return Response(
                    {'error': f'Stream is not active. Status: {stream.status}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Track view (for analytics)
            if request.user.is_authenticated:
                # Create or update view record
                view_obj, created = LiveStreamView.objects.get_or_create(
                    stream=stream,
                    user=request.user,
                    defaults={
                        'ip_address': self.get_client_ip(request),
                        'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                        'session_key': request.session.session_key
                    }
                )

                if not created:
                    # Update last seen time
                    view_obj.left_at = None
                    view_obj.save()

            # Update viewer count (simplified - in production use Redis/websockets)
            stream.viewer_count = max(0, stream.viewer_count + 1)
            stream.save()

            # Return stream data
            serializer = LiveStreamSerializer(stream, context={'request': request})
            return Response(serializer.data)

        except LiveStream.DoesNotExist:
            return Response(
                {'error': 'Stream not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip