from django.db import models
from django.conf import settings
from django.utils import timezone


class List(models.Model):
    """Model for user-created lists to organize posts."""
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='lists'
    )

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    icon = models.CharField(max_length=50, default='List')  # Icon name for frontend

    is_private = models.BooleanField(default=False)
    is_default = models.BooleanField(default=False)  # System default lists

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('owner', 'name')
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.name} by {self.owner.username}"

    @property
    def post_count(self):
        return self.list_posts.count()


class ListPost(models.Model):
    """Many-to-many relationship between lists and posts with ordering."""
    list = models.ForeignKey(
        List,
        on_delete=models.CASCADE,
        related_name='list_posts'
    )

    post = models.ForeignKey(
        'posts.Post',
        on_delete=models.CASCADE,
        related_name='list_memberships'
    )

    added_at = models.DateTimeField(default=timezone.now)
    order = models.PositiveIntegerField(default=0)  # For custom ordering

    class Meta:
        unique_together = ('list', 'post')
        ordering = ['order', '-added_at']

    def __str__(self):
        return f"{self.post.title[:30]} in {self.list.name}"
