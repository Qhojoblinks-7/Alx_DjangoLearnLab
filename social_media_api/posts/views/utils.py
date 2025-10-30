from rest_framework.pagination import CursorPagination
from django.contrib.auth import get_user_model
from ..models import PostActionLog
import logging

logger = logging.getLogger(__name__)

User = get_user_model()


def log_post_action(user, action_type, target_post=None, outcome='success', details=None):
    """Log a post action for auditing purposes."""
    try:
        PostActionLog.objects.create(
            user=user,
            action_type=action_type,
            target_post=target_post,
            outcome=outcome,
            details=details or {}
        )
    except Exception as e:
        # Log the error but don't fail the main operation
        logger.error(f"Failed to log post action {action_type}: {e}")


class FeedCursorPagination(CursorPagination):
    """
    B-FEED-03: Cursor-based pagination for efficient feed loading.
    Uses created_at field for ordering and provides seamless infinite scrolling.
    """
    page_size = 20
    ordering = '-created_at'
    cursor_query_param = 'cursor'