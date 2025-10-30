from django.db import models
from django.conf import settings
from django.utils import timezone


class Post(models.Model):
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete = models.CASCADE,
        related_name = 'posts'
        )

    # Post Fields
    title = models.CharField(max_length = 255)
    content = models.TextField()

    # Legacy media fields (for backward compatibility)
    video = models.FileField(upload_to='post_videos/', blank = True, null = True)
    image = models.ImageField(upload_to='post_images/', blank = True, null = True)

    # New media processing system
    media_file = models.ForeignKey(
        'MediaFile',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='posts',
        help_text="Processed media file with multiple sizes"
    )

    created_at = models.DateTimeField(default = timezone.now)
    updated_at = models.DateTimeField(auto_now = True)

    # Enhanced Post Features
    likes_count = models.PositiveIntegerField(default=0)
    comments_count = models.PositiveIntegerField(default=0)
    views_count = models.PositiveIntegerField(default=0)
    shares_count = models.PositiveIntegerField(default=0)
    reposts_count = models.PositiveIntegerField(default=0)
    is_pinned = models.BooleanField(default=False)
    is_highlighted = models.BooleanField(default=False)
    reply_settings = models.CharField(
        max_length=20,
        choices=[
            ('everyone', 'Everyone'),
            ('following', 'People you follow'),
            ('mentioned', 'People you mentioned')
        ],
        default='everyone'
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title[:30]} by {self.author.username}"

    @property
    def media_url(self):
        """Return a function to get media URL for specified size"""
        def get_url(size='full'):
            if self.media_file and self.media_file.processing_status == 'completed':
                return self.media_file.get_url_for_size(size)
            elif self.image:
                return self.image.url
            elif self.video:
                return self.video.url
            return None
        return get_url

    @property
    def thumbnail_url(self):
        """Get thumbnail URL"""
        return self.media_url('thumbnail')

    @property
    def preview_url(self):
        """Get preview URL"""
        return self.media_url('preview')

    @property
    def is_media_processed(self):
        """Check if media has been processed"""
        return self.media_file and self.media_file.processing_status == 'completed'


class Comment(models.Model):
    post = models.ForeignKey(
        Post,
        on_delete = models.CASCADE, related_name = 'comments'
    )

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete = models.CASCADE,
        related_name = 'comments',
        null=True,
        blank=True
    )

    parent_comment = models.ForeignKey(
        'self',
        on_delete = models.CASCADE,
        related_name = 'replies',
        null = True,
        blank = True
    )

    # comment Fields
    content = models.TextField()
    created_at = models.DateTimeField(default = timezone.now)
    updated_at = models.DateTimeField(auto_now = True)

    likes_count = models.PositiveIntegerField(default=0)
    reply_count = models.PositiveIntegerField(default=0)


    class Meta:
        ordering = ['created_at']

    def __str__(self):
        username = self.author.username if self.author else "Anonymous"
        return f"Comment by {username} on {self.post.title[:30]}"


class PostHashtag(models.Model):
    """Model to store hashtags extracted from posts for indexing and searching."""
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='hashtags'
    )

    hashtag = models.CharField(max_length=100, db_index=True)  # e.g., 'nba', 'football'

    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ('post', 'hashtag')
        indexes = [
            models.Index(fields=['hashtag', 'created_at']),
        ]

    def __str__(self):
        return f"#{self.hashtag} in post {self.post.id}"


class PostView(models.Model):
    """Detailed view tracking for advanced analytics"""
    VIEW_TYPES = [
        ('feed', 'Feed View'),
        ('detail', 'Detail Page View'),
        ('impression', 'Feed Impression'),
    ]

    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='detailed_views')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    session_key = models.CharField(max_length=40, null=True)
    view_type = models.CharField(max_length=20, choices=VIEW_TYPES, default='feed')
    viewed_at = models.DateTimeField(default=timezone.now)
    view_duration = models.IntegerField(null=True)  # milliseconds
    referrer = models.URLField(null=True)
    is_valid = models.BooleanField(default=True)  # Filtered out invalid views

    class Meta:
        indexes = [
            models.Index(fields=['post', 'viewed_at']),
            models.Index(fields=['user', 'post', 'viewed_at']),
            models.Index(fields=['ip_address', 'post', 'viewed_at']),
            models.Index(fields=['session_key', 'post', 'viewed_at']),
        ]

    def __str__(self):
        username = self.user.username if self.user else 'Anonymous'
        return f"View by {username} on post {self.post.id}"


class AnalyticsEvent(models.Model):
    """Generic analytics event logging for asynchronous processing"""
    EVENT_TYPES = [
        ('post_view', 'Post View'),
        ('post_impression', 'Post Impression'),
        ('engagement_click', 'Engagement Click'),
        ('video_play', 'Video Play'),
        ('profile_visit', 'Profile Visit'),
        ('navigation', 'Navigation Event'),
    ]

    post = models.ForeignKey(Post, on_delete=models.CASCADE, null=True, related_name='analytics_events')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL)
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    event_data = models.JSONField(default=dict)
    timestamp = models.DateTimeField(default=timezone.now)
    session_id = models.CharField(max_length=40, null=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(null=True)
    referrer = models.URLField(null=True)

    class Meta:
        indexes = [
            models.Index(fields=['event_type', 'timestamp']),
            models.Index(fields=['post', 'event_type', 'timestamp']),
            models.Index(fields=['user', 'event_type', 'timestamp']),
        ]

    def __str__(self):
        return f"{self.event_type} by {self.user.username if self.user else 'Anonymous'} at {self.timestamp}"


class PostActionLog(models.Model):
    """Model for logging all post actions from the meatball menu."""

    ACTION_TYPES = [
        ('delete_post', 'Delete Post'),
        ('pin_post', 'Pin Post'),
        ('unpin_post', 'Unpin Post'),
        ('highlight_post', 'Highlight Post'),
        ('unhighlight_post', 'Unhighlight Post'),
        ('change_reply_settings', 'Change Reply Settings'),
        ('add_to_list', 'Add to List'),
        ('remove_from_list', 'Remove from List'),
        ('request_community_note', 'Request Community Note'),
        ('view_engagements', 'View Engagements'),
        ('view_analytics', 'View Analytics'),
        ('embed_post', 'Embed Post'),
        ('share_post', 'Share Post'),
    ]

    OUTCOME_CHOICES = [
        ('success', 'Success'),
        ('failure', 'Failure'),
    ]

    timestamp = models.DateTimeField(default=timezone.now)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    action_type = models.CharField(max_length=30, choices=ACTION_TYPES)
    target_post = models.ForeignKey(Post, on_delete=models.CASCADE, null=True, blank=True)
    outcome = models.CharField(max_length=10, choices=OUTCOME_CHOICES, default='success')
    details = models.JSONField(default=dict, help_text="Additional context for the action")

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'action_type', 'timestamp']),
            models.Index(fields=['target_post', 'timestamp']),
        ]

    def __str__(self):
        return f"{self.action_type} by {self.user.username} on post {self.target_post.id if self.target_post else 'N/A'} - {self.outcome}"