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
    video = models.FileField(upload_to='post_videos/', blank = True, null = True)
    image = models.ImageField(upload_to='post_images/', blank = True, null = True)
    created_at = models.DateTimeField(default = timezone.now)
    updated_at = models.DateTimeField(auto_now = True)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.title[:30]} by {self.author.username}"
    
    
class Comment(models.Model):
    post = models.ForeignKey(
        Post,
        on_delete = models.CASCADE, related_name = 'comments'
    )
    
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete = models.CASCADE,
        related_name = 'comments'
    )
    
    # comment Fields
    content = models.TextField()
    created_at = models.DateTimeField(default = timezone.now)
    updated_at = models.DateTimeField(auto_now = True)
    
    
    class Meta:
        ordering = ['created_at']
        
    def __str__(self):
        return f"Comment by {self.author.username} on {self.post.title[:30]}"


class Like(models.Model):
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='likes'
    )
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='likes'
    )
    
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        unique_together = ('post', 'user')
        
    def __str__(self):
        return f"{self.user.username} likes {self.post.title[:30]}"