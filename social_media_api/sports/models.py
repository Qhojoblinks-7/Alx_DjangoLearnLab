from django.db import models
from django.utils.text import slugify
import uuid

class League(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, blank=True)
    sport = models.CharField(max_length=50, help_text="e.g., basketball, football, baseball")
    description = models.TextField()
    standings = models.JSONField(default=dict, help_text="Standings data as JSON")
    feed_id = models.UUIDField(default=uuid.uuid4, unique=True, help_text="Unique ID for the league's feed")
    logo_url = models.URLField(blank=True, null=True, help_text="Cached logo URL from API-Football")
    country = models.CharField(max_length=100, blank=True, help_text="Country where league is played")
    popularity_score = models.IntegerField(default=0, help_text="Popularity score for explore page ranking")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']

class Team(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, blank=True)
    league = models.ForeignKey(League, on_delete=models.CASCADE, related_name='teams')
    abbreviation = models.CharField(max_length=10, blank=True)
    description = models.TextField()
    roster = models.JSONField(default=list, help_text="Team roster as JSON array")
    schedule = models.JSONField(default=list, help_text="Team schedule as JSON array")
    feed_id = models.UUIDField(default=uuid.uuid4, unique=True, help_text="Unique ID for the team's feed")
    logo_url = models.URLField(blank=True, null=True, help_text="Cached logo URL from API-Football")
    follower_count = models.IntegerField(default=0, help_text="Number of users following this team")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.league.name})"

    class Meta:
        ordering = ['name']

class Athlete(models.Model):
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    slug = models.SlugField(unique=True, blank=True)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='athletes', null=True, blank=True)
    position = models.CharField(max_length=50)
    nationality = models.CharField(max_length=50)
    description = models.TextField()
    feed_id = models.UUIDField(default=uuid.uuid4, unique=True, help_text="Unique ID for the athlete's feed")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(f"{self.first_name} {self.last_name}")
        super().save(*args, **kwargs)

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def __str__(self):
        return self.full_name

    class Meta:
        ordering = ['last_name', 'first_name']


class Fixture(models.Model):
    """Model for storing upcoming and recent fixtures from API-Football"""
    id = models.IntegerField(primary_key=True, help_text="API-Football fixture ID")
    home_team_name = models.CharField(max_length=100)
    away_team_name = models.CharField(max_length=100)
    home_team_id = models.IntegerField()
    away_team_id = models.IntegerField()
    league_name = models.CharField(max_length=100)
    league_id = models.IntegerField()
    scheduled_time = models.DateTimeField()
    status = models.CharField(max_length=20, help_text="Match status (e.g., NS, FT, HT)")
    home_score = models.IntegerField(null=True, blank=True)
    away_score = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.home_team_name} vs {self.away_team_name} ({self.scheduled_time.date()})"

    class Meta:
        ordering = ['scheduled_time']
        indexes = [
            models.Index(fields=['scheduled_time']),
            models.Index(fields=['status']),
            models.Index(fields=['league_id']),
        ]
