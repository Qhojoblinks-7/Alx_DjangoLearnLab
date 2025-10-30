from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings

class User(AbstractUser):
    bio = models.TextField(max_length = 500, blank = True, default = "")
    profile_image = models.ImageField(upload_to='profile_images/', blank = True)
    banner_image = models.ImageField(upload_to='banner_images/', blank = True)
    location = models.CharField(max_length = 100, blank = True, default = "")
    website = models.CharField(max_length=200, blank = True, default = "")
    birth_date = models.DateField(null = True, blank = True)
    gender = models.CharField(max_length=10, choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other')], blank=True, default='')
    is_verified = models.BooleanField(default=False)

    # Followers (Many-to-Many to itself, asymmetrical)
    followers = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        symmetrical=False,
        related_name='following',
        blank=True
    )

    # Blocked users (Many-to-Many to itself, asymmetrical)
    blocked_users = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        symmetrical=False,
        related_name='blocked_by',
        blank=True,
        help_text="Users that this user has blocked"
    )

    # Muted users (Many-to-Many to itself, asymmetrical)
    muted_users = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        symmetrical=False,
        related_name='muted_by',
        blank=True,
        help_text="Users that this user has muted"
    )
    
    def __str__(self):
        return self.username