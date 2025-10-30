from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator

class Post(models.Model):
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete = models.CASCADE,
        related_name = 'posts'
        )
    
    # Post Fields
    title = models.CharField(max_length=255, blank=True, default='')
    content = models.TextField(blank=True, default='')

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


class Like(models.Model):
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='likes'
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='likes',
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ('post', 'user')

    def __str__(self):
        username = self.user.username if self.user else "Anonymous"
        return f"{username} likes {self.post.title[:30]}"


class CommentLike(models.Model):
    comment = models.ForeignKey(
        Comment,
        on_delete=models.CASCADE,
        related_name='comment_likes'
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='comment_likes',
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ('comment', 'user')

    def __str__(self):
        username = self.user.username if self.user else "Anonymous"
        return f"{username} likes comment by {self.comment.author.username if self.comment.author else 'Anonymous'}"


class Repost(models.Model):
    """Model for reposts (quotes and shares)"""
    original_post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='reposts'
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reposts'
    )

    # The new post created for the repost (can be null for simple reposts)
    repost_post = models.OneToOneField(
        Post,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='original_repost',
        help_text="The new post created for this repost (for quote posts)"
    )

    # Optional comment for quote posts
    comment = models.TextField(blank=True, help_text="Optional comment for quote reposts")

    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ('original_post', 'user')

    def __str__(self):
        username = self.user.username
        return f"{username} reposted {self.original_post.title[:30]}"

    @property
    def is_quote_post(self):
        """Check if this is a quote post with additional content"""
        return self.repost_post is not None and self.comment.strip()


class Bookmark(models.Model):
    """Model for users to bookmark posts for later reading"""
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='bookmarks'
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bookmarks'
    )

    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ('post', 'user')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} bookmarked {self.post.title[:30]}"


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


class PostShare(models.Model):
    """Model for tracking post shares"""
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='shares'
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='shares'
    )

    platform = models.CharField(max_length=50, default='unknown', help_text="Platform where post was shared")
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ('post', 'user', 'platform')  # Prevent duplicate shares per platform
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['post', 'created_at']),
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['platform', 'created_at']),
        ]

    def __str__(self):
        return f"{self.user.username} shared {self.post.title[:30]} on {self.platform}"


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


# -----------------------------------------------------------------
# SPORTS ENTITIES MODELS
# -----------------------------------------------------------------

class League(models.Model):
    """Sports league/tournament model"""
    name = models.CharField(max_length=100, help_text="Full name of the league")
    slug = models.SlugField(unique=True, help_text="URL-friendly identifier")
    description = models.TextField(help_text="Detailed description of the league")
    sport = models.CharField(max_length=50, help_text="Sport type (Basketball, Soccer, etc.)")
    country = models.CharField(max_length=100, help_text="Country where league is based")

    # Media
    logo_url = models.URLField(blank=True, help_text="League logo URL")
    website_url = models.URLField(blank=True, help_text="Official league website")

    # Season info
    season_start = models.DateField(null=True, blank=True, help_text="Start date of current season")
    season_end = models.DateField(null=True, blank=True, help_text="End date of current season")

    # Data
    standings = models.JSONField(default=dict, help_text="Current league standings data")
    teams = models.ManyToManyField('Team', related_name='leagues', blank=True, help_text="Teams in this league")

    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['sport', 'country']),
            models.Index(fields=['slug']),
        ]

    def __str__(self):
        return f"{self.name} ({self.sport})"

    @property
    def feed_id(self):
        """Return feed identifier for sports feed API"""
        return f"league_{self.id}"


class Team(models.Model):
    """Sports team model"""
    name = models.CharField(max_length=100, help_text="Full team name")
    slug = models.SlugField(unique=True, help_text="URL-friendly identifier")
    abbreviation = models.CharField(max_length=10, blank=True, help_text="Team abbreviation (e.g., LAL, MCI)")
    sport = models.CharField(max_length=50, help_text="Sport type")

    # Relationships
    league = models.ForeignKey(League, on_delete=models.CASCADE, related_name='league_teams', help_text="League this team belongs to")

    # Location
    city = models.CharField(max_length=100, help_text="City where team is based")
    country = models.CharField(max_length=100, help_text="Country where team is based")
    stadium = models.CharField(max_length=100, blank=True, help_text="Home stadium name")

    # Media
    logo_url = models.URLField(blank=True, help_text="Team logo URL")
    website_url = models.URLField(blank=True, help_text="Official team website")

    # Info
    founded_year = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1800), MaxValueValidator(timezone.now().year)],
        help_text="Year the team was founded"
    )

    # Data
    roster = models.ManyToManyField('Athlete', related_name='teams', blank=True, help_text="Current team roster")
    schedule = models.JSONField(default=list, help_text="Upcoming games/matches schedule")

    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        unique_together = ['name', 'league']
        indexes = [
            models.Index(fields=['sport', 'country']),
            models.Index(fields=['league', 'name']),
            models.Index(fields=['slug']),
        ]

    def __str__(self):
        return f"{self.name} ({self.league.name})"

    @property
    def feed_id(self):
        """Return feed identifier for sports feed API"""
        return f"team_{self.id}"


class Athlete(models.Model):
    """Athlete/player model"""
    first_name = models.CharField(max_length=50, help_text="Athlete's first name")
    last_name = models.CharField(max_length=50, help_text="Athlete's last name")
    slug = models.SlugField(unique=True, help_text="URL-friendly identifier")

    # Sport info
    position = models.CharField(max_length=50, help_text="Playing position/role")
    sport = models.CharField(max_length=50, help_text="Sport type")

    # Current team (nullable for free agents/retired)
    team = models.ForeignKey(
        Team,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='current_roster',
        help_text="Current team (null for free agents)"
    )

    # Personal info
    country = models.CharField(max_length=100, help_text="Country of origin")
    birth_date = models.DateField(null=True, blank=True, help_text="Date of birth")

    # Physical stats (for applicable sports)
    height_cm = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Height in centimeters"
    )
    weight_kg = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Weight in kilograms"
    )

    # Media
    photo_url = models.URLField(blank=True, help_text="Profile photo URL")

    # Career data
    career_stats = models.JSONField(default=dict, help_text="Career statistics")
    achievements = models.JSONField(default=list, help_text="Major achievements/titles")

    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['last_name', 'first_name']
        indexes = [
            models.Index(fields=['sport', 'country']),
            models.Index(fields=['team', 'position']),
            models.Index(fields=['slug']),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self):
        """Return full name"""
        return f"{self.first_name} {self.last_name}"

    @property
    def feed_id(self):
        """Return feed identifier for sports feed API"""
        return f"athlete_{self.id}"


# -----------------------------------------------------------------
# MEDIA PROCESSING MODELS
# -----------------------------------------------------------------

class MediaFile(models.Model):
    """Enhanced media file model supporting multiple sizes and formats"""

    MEDIA_TYPES = [
        ('image', 'Image'),
        ('video', 'Video'),
    ]

    PROCESSING_STATUS = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    # Original file
    original_file = models.FileField(upload_to='media/original/', help_text="Original uploaded file")
    file_name = models.CharField(max_length=255, help_text="Original filename")
    file_size = models.PositiveBigIntegerField(help_text="File size in bytes")
    mime_type = models.CharField(max_length=100, help_text="MIME type")

    # Media metadata
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPES, help_text="Type of media")
    width = models.PositiveIntegerField(null=True, blank=True, help_text="Width in pixels")
    height = models.PositiveIntegerField(null=True, blank=True, help_text="Height in pixels")
    duration = models.FloatField(null=True, blank=True, help_text="Duration in seconds (for videos)")

    # Processing status
    processing_status = models.CharField(
        max_length=20,
        choices=PROCESSING_STATUS,
        default='pending',
        help_text="Current processing status"
    )
    processing_error = models.TextField(blank=True, help_text="Error message if processing failed")

    # Generated sizes
    thumbnail_url = models.URLField(blank=True, help_text="Thumbnail size URL (150x150)")
    preview_url = models.URLField(blank=True, help_text="Preview size URL (800x600)")
    full_url = models.URLField(blank=True, help_text="Full size URL")

    # Video specific fields
    video_thumbnail_url = models.URLField(blank=True, help_text="Video thumbnail frame")
    hls_playlist_url = models.URLField(blank=True, help_text="HLS playlist URL for streaming")

    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['media_type', 'processing_status']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.media_type.title()} - {self.file_name}"

    def get_url_for_size(self, size='full'):
        """Get URL for specific size"""
        size_urls = {
            'thumbnail': self.thumbnail_url,
            'preview': self.preview_url,
            'full': self.full_url,
        }
        return size_urls.get(size, self.full_url)

    @property
    def is_image(self):
        return self.media_type == 'image'

    @property
    def is_video(self):
        return self.media_type == 'video'

    @property
    def aspect_ratio(self):
        """Calculate aspect ratio"""
        if self.width and self.height:
            return self.width / self.height
        return None


class MediaVariant(models.Model):
    """Individual processed variants of media files"""

    VARIANT_TYPES = [
        ('thumbnail', 'Thumbnail'),
        ('preview', 'Preview'),
        ('full', 'Full Size'),
        ('hls_segment', 'HLS Segment'),
        ('hls_playlist', 'HLS Playlist'),
    ]

    media_file = models.ForeignKey(
        MediaFile,
        on_delete=models.CASCADE,
        related_name='variants',
        help_text="Parent media file"
    )

    variant_type = models.CharField(max_length=20, choices=VARIANT_TYPES, help_text="Type of variant")
    file_url = models.URLField(help_text="URL to the processed file")
    width = models.PositiveIntegerField(null=True, blank=True, help_text="Width in pixels")
    height = models.PositiveIntegerField(null=True, blank=True, help_text="Height in pixels")
    file_size = models.PositiveBigIntegerField(help_text="File size in bytes")
    format = models.CharField(max_length=10, blank=True, help_text="File format (jpg, mp4, m3u8, etc.)")

    # For HLS streaming
    segment_index = models.PositiveIntegerField(null=True, blank=True, help_text="HLS segment index")
    bitrate = models.PositiveIntegerField(null=True, blank=True, help_text="Video bitrate in kbps")

    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['variant_type', 'segment_index']
        unique_together = ['media_file', 'variant_type', 'segment_index']
        indexes = [
            models.Index(fields=['media_file', 'variant_type']),
            models.Index(fields=['variant_type', 'created_at']),
        ]

    def __str__(self):
        if self.segment_index is not None:
            return f"{self.media_file.file_name} - {self.variant_type} (segment {self.segment_index})"
        return f"{self.media_file.file_name} - {self.variant_type}"


# -----------------------------------------------------------------
# LIVE STREAMING MODELS
# -----------------------------------------------------------------

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