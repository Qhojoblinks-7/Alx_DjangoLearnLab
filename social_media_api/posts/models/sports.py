from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator


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