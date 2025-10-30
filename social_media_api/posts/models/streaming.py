from django.db import models
from django.conf import settings
from django.utils import timezone


class LiveStream(models.Model):
    """Model for live streaming functionality"""

    STREAM_STATUS = [
        ('scheduled', 'Scheduled'),
        ('starting', 'Starting'),
        ('live', 'Live'),
        ('ended', 'Ended'),
        ('cancelled', 'Cancelled'),
    ]

    # Basic info
    title = models.CharField(max_length=255, help_text="Stream title")
    description = models.TextField(blank=True, help_text="Stream description")
    host = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='live_streams')

    # Stream details
    stream_key = models.CharField(max_length=100, unique=True, help_text="Unique stream key for RTMP")
    playback_url = models.URLField(blank=True, help_text="HLS playback URL")
    stream_url = models.URLField(blank=True, help_text="RTMP stream URL for broadcasting")

    # Status and timing
    status = models.CharField(max_length=20, choices=STREAM_STATUS, default='scheduled')
    scheduled_start = models.DateTimeField(null=True, blank=True)
    actual_start = models.DateTimeField(null=True, blank=True)
    actual_end = models.DateTimeField(null=True, blank=True)

    # Viewer stats
    viewer_count = models.PositiveIntegerField(default=0)
    peak_viewers = models.PositiveIntegerField(default=0)

    # Metadata
    thumbnail_url = models.URLField(blank=True, help_text="Stream thumbnail/preview image")
    tags = models.JSONField(default=list, help_text="Stream tags/categories")

    # Settings
    is_private = models.BooleanField(default=False)
    allowed_users = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='allowed_streams',
        blank=True,
        help_text="Users allowed to view private streams"
    )

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'scheduled_start']),
            models.Index(fields=['host', 'status']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.title} by {self.host.username}"

    @property
    def is_live(self):
        return self.status == 'live'

    @property
    def duration(self):
        """Calculate stream duration if ended"""
        if self.actual_start and self.actual_end:
            return self.actual_end - self.actual_start
        elif self.actual_start and self.status == 'live':
            return timezone.now() - self.actual_start
        return None

    def start_stream(self):
        """Mark stream as started"""
        if self.status == 'scheduled' or self.status == 'starting':
            self.status = 'live'
            self.actual_start = timezone.now()
            self.save()

    def end_stream(self):
        """Mark stream as ended"""
        if self.status == 'live':
            self.status = 'ended'
            self.actual_end = timezone.now()
            self.save()


class LiveStreamView(models.Model):
    """Track views for live streams"""

    VIEW_TYPES = [
        ('viewer', 'Regular Viewer'),
        ('host', 'Stream Host'),
    ]

    stream = models.ForeignKey(LiveStream, on_delete=models.CASCADE, related_name='views')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    session_key = models.CharField(max_length=40, null=True)
    view_type = models.CharField(max_length=20, choices=VIEW_TYPES, default='viewer')
    joined_at = models.DateTimeField(default=timezone.now)
    left_at = models.DateTimeField(null=True, blank=True)
    watch_duration = models.IntegerField(null=True)  # seconds

    class Meta:
        indexes = [
            models.Index(fields=['stream', 'joined_at']),
            models.Index(fields=['user', 'stream']),
        ]

    def __str__(self):
        username = self.user.username if self.user else 'Anonymous'
        return f"{username} viewed {self.stream.title}"