from rest_framework import viewsets, status, permissions, filters, views
from rest_framework.response import Response
from rest_framework.pagination import LimitOffsetPagination
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Notification
from .serializers import NotificationSerializer


def broadcast_unread_count_update(user):
    """
    Broadcast unread count update to user's WebSocket group
    """
    print(f"Broadcasting unread count update for user {user.id}")
    channel_layer = get_channel_layer()
    user_group_name = f'user_{user.id}_notifications'

    # Get updated unread count
    unread_count = Notification.objects.filter(
        recipient=user,
        is_read=False
    ).count()

    print(f"Unread count for user {user.id}: {unread_count}")

    # Broadcast to user's notification group
    async_to_sync(channel_layer.group_send)(
        user_group_name,
        {
            'type': 'send_notification',
            'data': {
                'type': 'unread_count_update',
                'unread_count': unread_count
            }
        }
    )
    print(f"WebSocket message sent to group {user_group_name}")


class NotificationViewSet(viewsets.ModelViewSet):
    """
    B-NOTIFY-01: Notifications List - GET /api/notifications/
    Returns the authenticated user's notifications with filtering support.
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = LimitOffsetPagination
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    ordering = ['-timestamp']

    def get_queryset(self):
        """
        B-NOTIFY-02: Query Params - ?filter= optional filter parameter (all, verified, mentions)
        """
        queryset = Notification.objects.filter(recipient=self.request.user).select_related('content_type')

        # Apply filter based on query parameter
        filter_param = self.request.query_params.get('filter', 'all')

        if filter_param == 'verified':
            # Filter for notifications from verified users (assuming we have a verified field)
            # For now, return all notifications (implement when user verification is added)
            pass
        elif filter_param == 'mentions':
            # Filter for mention notifications
            queryset = queryset.filter(verb__in=['mentioned', 'tagged'])

        # Default 'all' returns all notifications
        return queryset

    def perform_update(self, serializer):
        """Mark notification as read when updated."""
        instance = serializer.save()
        print(f"perform_update called for notification {instance.id}, is_read: {instance.is_read}")
        if instance.is_read:
            print(f"Marking notification {instance.id} as read, broadcasting update")
            # Broadcast unread count update
            broadcast_unread_count_update(instance.recipient)


class MarkNotificationsReadView(views.APIView):
    """
    Mark notifications as read - POST /api/notifications/mark_read/
    Body: {"notification_ids": [1, 2, 3]} or {"all": true}
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        notification_ids = request.data.get('notification_ids', [])
        mark_all = request.data.get('all', False)

        if mark_all:
            # Mark all unread notifications as read
            updated_count = Notification.objects.filter(
                recipient=request.user,
                is_read=False
            ).update(is_read=True)
        elif notification_ids:
            # Mark specific notifications as read
            updated_count = Notification.objects.filter(
                recipient=request.user,
                id__in=notification_ids,
                is_read=False
            ).update(is_read=True, read_at=timezone.now())
        else:
            return Response(
                {"error": "Either 'notification_ids' or 'all' must be provided"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Broadcast unread count update to WebSocket clients
        if updated_count > 0:
            broadcast_unread_count_update(request.user)

        return Response({"updated_count": updated_count}, status=status.HTTP_200_OK)


class MarkNotificationsUnreadView(views.APIView):
    """
    Mark all notifications as unread - POST /api/notifications/mark_unread/
    Body: {"all": true}
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        mark_all = request.data.get('all', False)

        if mark_all:
            # Mark all notifications as unread
            updated_count = Notification.objects.filter(
                recipient=request.user
            ).update(is_read=False)
        else:
            return Response(
                {"error": "'all' must be true"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Broadcast unread count update to WebSocket clients
        if updated_count > 0:
            broadcast_unread_count_update(request.user)

        return Response({"updated_count": updated_count}, status=status.HTTP_200_OK)


class UnreadNotificationsCountView(views.APIView):
    """
    B-SID-21: API - GET /api/notifications/unread_count/
    Returns the count of unread notifications for the authenticated user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        unread_count = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).count()

        return Response({"unread_count": unread_count}, status=status.HTTP_200_OK)
