from django.db import models
from django.utils import timezone


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