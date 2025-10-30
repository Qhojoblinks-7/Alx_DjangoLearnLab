from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet, UnreadNotificationsCountView, MarkNotificationsReadView, MarkNotificationsUnreadView

app_name = 'notifications'

router = DefaultRouter()
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),  # B-NOTIFY-01: /api/notifications/
    path('unread_count/', UnreadNotificationsCountView.as_view(), name='unread-count'),  # B-SID-21
    path('mark_read/', MarkNotificationsReadView.as_view(), name='mark-read'),  # Mark notifications as read
    path('mark_unread/', MarkNotificationsUnreadView.as_view(), name='mark-unread'),  # Mark notifications as unread
]