from django.db import models
from django.conf import settings
from django.utils import timezone


class Like(models.Model):
    post = models.ForeignKey(
        'Post',
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
        'Comment',
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
        'Post',
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
        'Post',
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
        'Post',
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


class PostShare(models.Model):
    """Model for tracking post shares"""
    post = models.ForeignKey(
        'Post',
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