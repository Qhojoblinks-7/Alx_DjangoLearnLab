# Sports Content Architecture Design

## Overview
This document outlines the design for implementing dedicated sports content sections in Sportisode, replacing mock data with proper database models and APIs for Leagues, Teams, and Athletes.

## Current State Analysis
- **Mock Data**: Current implementation uses hardcoded mock data in views
- **No Database Models**: No dedicated models for sports entities
- **Limited Relationships**: Posts cannot be properly tagged with sports entities
- **No Detail Pages**: No individual league/team/athlete detail views

## Requirements

### B-SPORTS-01: League Detail API
**Endpoint**: `GET /api/leagues/{slug}/`
**Response**: League data including standings, teams, and feed ID for related posts

### B-SPORTS-02: Team Detail API
**Endpoint**: `GET /api/teams/{slug}/`
**Response**: Team data including roster, schedule, and related news

### B-SPORTS-03: Sports Feed API
**Endpoint**: `GET /api/sports/feed/{id}/`
**Response**: Curated feed of posts relevant to specific League/Team/Athlete ID

## Database Model Design

### League Model
```python
class League(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    sport = models.CharField(max_length=50)
    country = models.CharField(max_length=100)

    # Media
    logo_url = models.URLField(blank=True)
    website_url = models.URLField(blank=True)

    # Season info
    season_start = models.DateField(null=True)
    season_end = models.DateField(null=True)

    # Data
    standings = models.JSONField(default=dict, help_text="Current league standings")
    teams = models.ManyToManyField('Team', related_name='leagues', blank=True)

    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.sport})"
```

### Team Model
```python
class Team(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    abbreviation = models.CharField(max_length=10, blank=True)
    sport = models.CharField(max_length=50)

    # Relationships
    league = models.ForeignKey(League, on_delete=models.CASCADE, related_name='league_teams')

    # Location
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    stadium = models.CharField(max_length=100, blank=True)

    # Media
    logo_url = models.URLField(blank=True)
    website_url = models.URLField(blank=True)

    # Info
    founded_year = models.PositiveIntegerField(null=True, blank=True,
        validators=[MinValueValidator(1800), MaxValueValidator(timezone.now().year)])

    # Data
    roster = models.ManyToManyField('Athlete', related_name='teams', blank=True)
    schedule = models.JSONField(default=list, help_text="Upcoming games/schedule")

    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        unique_together = ['name', 'league']

    def __str__(self):
        return f"{self.name} ({self.league.name})"
```

### Athlete Model
```python
class Athlete(models.Model):
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    slug = models.SlugField(unique=True)

    # Sport info
    position = models.CharField(max_length=50)
    sport = models.CharField(max_length=50)

    # Current team (nullable for free agents/retired)
    team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True,
                           related_name='current_roster')

    # Personal info
    country = models.CharField(max_length=100)
    birth_date = models.DateField(null=True, blank=True)

    # Physical stats (for applicable sports)
    height_cm = models.PositiveIntegerField(null=True, blank=True,
        help_text="Height in centimeters")
    weight_kg = models.PositiveIntegerField(null=True, blank=True,
        help_text="Weight in kilograms")

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

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
```

## Post Model Extensions
Add sports entity relationships to existing Post model:

```python
# Add to Post model
leagues = models.ManyToManyField('League', related_name='posts', blank=True)
teams = models.ManyToManyField('Team', related_name='posts', blank=True)
athletes = models.ManyToManyField('Athlete', related_name='posts', blank=True)
```

## API Design

### League Detail API (B-SPORTS-01)
**URL**: `/api/leagues/{slug}/`
**Method**: GET
**Response**:
```json
{
  "id": 1,
  "name": "NBA",
  "slug": "nba-basketball",
  "description": "National Basketball Association",
  "sport": "Basketball",
  "country": "United States",
  "logo_url": "/media/leagues/nba-logo.png",
  "website_url": "https://nba.com",
  "season_start": "2024-10-01",
  "season_end": "2025-06-30",
  "standings": {
    "eastern": [...],
    "western": [...]
  },
  "teams": [1, 2, 3, ...],  // Team IDs
  "feed_id": "league_1"     // For sports feed API
}
```

### Team Detail API (B-SPORTS-02)
**URL**: `/api/teams/{slug}/`
**Method**: GET
**Response**:
```json
{
  "id": 1,
  "name": "Los Angeles Lakers",
  "slug": "la-lakers",
  "abbreviation": "LAL",
  "sport": "Basketball",
  "league": {
    "id": 1,
    "name": "NBA",
    "slug": "nba-basketball"
  },
  "city": "Los Angeles",
  "country": "United States",
  "stadium": "Crypto.com Arena",
  "logo_url": "/media/teams/lakers-logo.png",
  "founded_year": 1947,
  "roster": [1, 2, 3, ...],  // Athlete IDs
  "schedule": [
    {
      "date": "2024-12-25",
      "opponent": "Golden State Warriors",
      "home": true
    }
  ],
  "feed_id": "team_1"
}
```

### Sports Feed API (B-SPORTS-03)
**URL**: `/api/sports/feed/{feed_id}/`
**Method**: GET
**Query Params**: `?limit=20&offset=0`
**Response**: Standard paginated post feed filtered by the sports entity

## Implementation Plan

### Phase 1: Database Models
1. Create League, Team, Athlete models
2. Add sports relationships to Post model
3. Create database migrations
4. Run migrations

### Phase 2: Serializers
1. Create LeagueSerializer
2. Create TeamSerializer
3. Create AthleteSerializer
4. Update PostSerializer to include sports relationships

### Phase 3: API Views
1. Implement LeagueDetailView
2. Implement TeamDetailView
3. Implement AthleteDetailView
4. Implement SportsFeedView
5. Update existing list views to use database models

### Phase 4: URL Routing
1. Add detail routes for leagues, teams, athletes
2. Add sports feed route
3. Update existing routes

### Phase 5: Data Population
1. Create management command to populate initial sports data
2. Update existing mock data to use real models

### Phase 6: Testing
1. Test all new APIs
2. Verify relationships work correctly
3. Test feed filtering by sports entities

## Migration Strategy
- Create new models without affecting existing functionality
- Update views gradually to use new models
- Maintain backward compatibility during transition
- Use feature flags if needed for gradual rollout

## Performance Considerations
- Add database indexes on frequently queried fields (slug, sport, etc.)
- Use select_related/prefetch_related for relationships
- Cache frequently accessed data (standings, schedules)
- Implement pagination for large datasets

## Future Enhancements
- Real-time sports data integration (scores, stats)
- Advanced search and filtering
- User favorites/following for teams/athletes
- Social features around sports events
- Analytics and engagement tracking for sports content