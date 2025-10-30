from django.db import models
from django.conf import settings
from django.utils import timezone
from posts.models import Post


class CommunityNoteRequest(models.Model):
    """Model for community note requests on posts."""

    REQUEST_STATUS = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    ]

    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='community_note_requests')
    requester = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='community_note_requests')

    reason = models.TextField(help_text="Reason why this post needs a community note")
    status = models.CharField(max_length=20, choices=REQUEST_STATUS, default='pending')

    # Review fields
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_community_notes'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(blank=True, help_text="Internal review notes")

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('post', 'requester')  # One request per post per user
        ordering = ['-created_at']

    def __str__(self):
        return f"Community note request for post {self.post.id} by {self.requester.username}"


class CommunityNote(models.Model):
    """Model for actual community notes added to posts."""

    post = models.OneToOneField(Post, on_delete=models.CASCADE, related_name='community_note')
    content = models.TextField(help_text="The community note content")

    # Metadata
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_community_notes')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    # Voting system
    helpful_votes = models.PositiveIntegerField(default=0)
    not_helpful_votes = models.PositiveIntegerField(default=0)

    # Status
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Community note for post {self.post.id}"

    @property
    def total_votes(self):
        return self.helpful_votes + self.not_helpful_votes

    @property
    def helpful_percentage(self):
        if self.total_votes == 0:
            return 0
        return (self.helpful_votes / self.total_votes) * 100
