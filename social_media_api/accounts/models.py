from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings

class User(AbstractUser):
    bio = models.TextField(max_length = 500, blank = True, default = "")
    profile_image = models.ImageField(upload_to='profile_images/', blank = True)
    
    
    # Followers (Many-to-Many to itself, asymmetrical)
    followers = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        symmetrical=False,
        related_name='following',
        blank=True
    )
    
    def __str__(self):
        return self.username