from django.db import models
from django.conf import settings
from django.utils import timezone


class Community(models.Model):
    """
    Model for communities that users can join and follow.
    """
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='community_avatars/', blank=True, null=True)
    banner = models.ImageField(upload_to='community_banners/', blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    # Community settings
    is_private = models.BooleanField(default=False)
    allow_posting = models.BooleanField(default=True)

    # Moderation
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owned_communities'
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    @property
    def member_count(self):
        return self.members.count()


class CommunityMembership(models.Model):
    """
    Model for community memberships.
    """
    community = models.ForeignKey(
        Community,
        on_delete=models.CASCADE,
        related_name='memberships'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='community_memberships'
    )
    joined_at = models.DateTimeField(default=timezone.now)
    role = models.CharField(
        max_length=20,
        choices=[
            ('member', 'Member'),
            ('moderator', 'Moderator'),
            ('admin', 'Admin'),
        ],
        default='member'
    )

    class Meta:
        unique_together = ('community', 'user')
        ordering = ['-joined_at']

    def __str__(self):
        return f"{self.user.username} in {self.community.name}"
