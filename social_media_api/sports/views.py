from rest_framework import generics
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db import models
from django.core.cache import cache
from .models import League, Team, Athlete, Fixture
from posts.models import Post
from .serializers import LeagueSerializer, TeamSerializer, AthleteSerializer
from posts.serializers import PostSerializer
from .tasks import update_league_standings, update_team_schedules, update_athlete_info, sync_api_football_fixtures
from .api_football_client import api_football_client
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class LeagueDetailView(generics.RetrieveAPIView):
    """B-SPORTS-01: GET /api/leagues/{slug}/ - Fetch official League data, standings, and a feed ID."""
    queryset = League.objects.all()
    serializer_class = LeagueSerializer
    lookup_field = 'slug'

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        cache_key = f'league_detail_{instance.slug}'

        # Check cache first
        cached_data = cache.get(cache_key)
        if cached_data:
            logger.debug(f"Cache hit for league {instance.slug}")
            return Response(cached_data)

        # Try to fetch fresh standings from API-Football using enhanced client
        try:
            standings_data = api_football_client.get_league_standings(instance.id)
            if standings_data and 'response' in standings_data and standings_data['response']:
                # API-Football returns standings in response array
                league_standings = standings_data['response'][0]['league']['standings'][0]
                instance.standings = league_standings
                instance.save(update_fields=['standings'])
                logger.info(f"Updated standings for league {instance.name}")
            else:
                logger.warning(f"No standings data available for league {instance.name}")
        except Exception as e:
            # If API fails, continue with existing data
            logger.error(f"Failed to fetch standings for league {instance.name}: {e}")

        # Trigger background update for next time (optional - don't fail if Celery is not available)
        try:
            update_league_standings.delay(instance.id)
        except Exception as e:
            # Celery broker might not be running, continue without background update
            logger.warning("Celery not available for background league updates")

        serializer = self.get_serializer(instance)
        data = serializer.data

        # Cache for 15 minutes
        cache.set(cache_key, data, 900)

        return Response(data)

class TeamDetailView(generics.RetrieveAPIView):
    """B-SPORTS-02: GET /api/teams/{slug}/ - Fetch Team roster, schedule, and related news."""
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    lookup_field = 'slug'

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        cache_key = f'team_detail_{instance.slug}'

        # Check cache first
        cached_data = cache.get(cache_key)
        if cached_data:
            logger.debug(f"Cache hit for team {instance.slug}")
            return Response(cached_data)

        # Try to fetch fresh schedule from API-Football using enhanced client
        try:
            fixtures_data = api_football_client.get_fixtures({
                'team': instance.id,
                'last': 10  # Last 10 fixtures
            })

            if fixtures_data and 'response' in fixtures_data:
                fixtures = fixtures_data['response']
                if fixtures:
                    # Transform API-Football fixture format to our expected format
                    detailed_events = []
                    for fixture in fixtures:
                        fixture_info = fixture['fixture']
                        teams_info = fixture['teams']
                        goals = fixture['goals']
                        league_info = fixture['league']

                        # Transform to our expected format
                        event = {
                            'idEvent': fixture_info['id'],
                            'strEvent': f"{teams_info['home']['name']} vs {teams_info['away']['name']}",
                            'strHomeTeam': teams_info['home']['name'],
                            'strAwayTeam': teams_info['away']['name'],
                            'intHomeScore': goals['home'],
                            'intAwayScore': goals['away'],
                            'strStatus': fixture_info['status']['short'],
                            'strVenue': fixture_info['venue']['name'] if fixture_info['venue'] else None,
                            'strTime': fixture_info['date'],
                            'strLeague': league_info['name'],
                            'strSeason': str(league_info['season']),
                            'dateEvent': fixture_info['date'].split('T')[0],
                            'strThumb': fixture_info.get('fixture', {}).get('logo')  # May not exist
                        }
                        detailed_events.append(event)

                    instance.schedule = detailed_events
                    instance.save(update_fields=['schedule'])
                    logger.info(f"Updated schedule for team {instance.name}")
                else:
                    logger.warning(f"No fixtures data available for team {instance.name}")
            else:
                logger.warning(f"Failed to fetch fixtures for team {instance.name}")
        except Exception as e:
            # If API fails, continue with existing data
            logger.error(f"Failed to fetch schedule for team {instance.name}: {e}")

        # Trigger background update for next time (optional - don't fail if Celery is not available)
        try:
            update_team_schedules.delay(instance.id)
        except Exception as e:
            # Celery broker might not be running, continue without background update
            logger.warning("Celery not available for background team updates")

        serializer = self.get_serializer(instance)
        data = serializer.data

        # Cache for 15 minutes
        cache.set(cache_key, data, 900)

        return Response(data)

class AthleteDetailView(generics.RetrieveAPIView):
    """Similar to team, for athletes."""
    queryset = Athlete.objects.all()
    serializer_class = AthleteSerializer
    lookup_field = 'slug'

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        cache_key = f'athlete_detail_{instance.slug}'

        # Check cache first
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data)

        # Athletes data is mostly static, but we could fetch additional details if needed
        # For now, just return the stored data

        # Trigger background update for next time (less frequent for athletes)
        try:
            update_athlete_info.delay(instance.id)
        except Exception as e:
            # Celery broker might not be running, continue without background update
            pass

        serializer = self.get_serializer(instance)
        data = serializer.data

        # Cache for 30 minutes (athletes change less frequently)
        cache.set(cache_key, data, 1800)

        return Response(data)

class EventDetailView(generics.RetrieveAPIView):
    """Get detailed information for a specific event"""

    def retrieve(self, request, *args, **kwargs):
        event_id = self.kwargs['event_id']
        cache_key = f'event_detail_{event_id}'

        # Check cache first
        cached_data = cache.get(cache_key)
        if cached_data:
            logger.debug(f"Cache hit for event {event_id}")
            return Response(cached_data)

        try:
            fixture_data = api_football_client.get_fixtures({'id': event_id})
            if fixture_data and fixture_data.get("response"):
                fixture = fixture_data["response"][0]
                fixture_info = fixture['fixture']
                teams_info = fixture['teams']
                goals = fixture['goals']
                league_info = fixture['league']

                # Return enhanced fixture data in our expected format
                event = {
                    'idEvent': fixture_info['id'],
                    'dateEvent': fixture_info['date'].split('T')[0],
                    'strHomeTeam': teams_info['home']['name'],
                    'strAwayTeam': teams_info['away']['name'],
                    'intHomeScore': goals['home'],
                    'intAwayScore': goals['away'],
                    'strStatus': fixture_info['status']['short'],
                    'strVenue': fixture_info['venue']['name'] if fixture_info['venue'] else None,
                    'strTime': fixture_info['date'],
                    'strLeague': league_info['name'],
                    'strSeason': str(league_info['season']),
                    'strDescriptionEN': f"{teams_info['home']['name']} vs {teams_info['away']['name']}",
                    'strThumb': fixture_info.get('fixture', {}).get('logo'),  # May not exist
                    'strVideo': None,  # API-Football doesn't provide video URLs in basic plan
                }

                # Cache for 1 hour
                cache.set(cache_key, event, 3600)
                logger.debug(f"Retrieved and cached fixture {event_id}")
                return Response(event)
            else:
                logger.warning(f"Fixture {event_id} not found in API-Football")
                return Response({'error': 'Event not found'}, status=404)
        except Exception as e:
            logger.error(f"Failed to retrieve fixture {event_id}: {e}")
            return Response({'error': str(e)}, status=500)


class SportsFeedView(generics.ListAPIView):
    """B-SPORTS-03: GET /api/sports/feed/{id}/ - Retrieve a curated feed of posts relevant to that specific League/Team/Athlete ID."""
    serializer_class = PostSerializer

    def get_queryset(self):
        feed_id = self.kwargs['feed_id']
        # For now, return posts that have hashtags matching the entity name or something
        # Since we don't have direct relation, perhaps filter by content containing the entity name
        # But to make it work, let's assume feed_id is like 'league_1', 'team_1', etc.
        if feed_id.startswith('league_'):
            league_id = feed_id.split('_')[1]
            try:
                league = League.objects.get(id=league_id)
                # Return posts that mention the league name in title or content
                return Post.objects.filter(
                    models.Q(title__icontains=league.name) | models.Q(content__icontains=league.name)
                ).order_by('-created_at')[:50]
            except (League.DoesNotExist, ValueError):
                return Post.objects.none()
        elif feed_id.startswith('team_'):
            team_id = feed_id.split('_')[1]
            try:
                team = Team.objects.get(id=team_id)
                return Post.objects.filter(
                    models.Q(title__icontains=team.name) | models.Q(content__icontains=team.name)
                ).order_by('-created_at')[:50]
            except (Team.DoesNotExist, ValueError):
                return Post.objects.none()
        elif feed_id.startswith('athlete_'):
            athlete_id = feed_id.split('_')[1]
            try:
                athlete = Athlete.objects.get(id=athlete_id)
                full_name = athlete.full_name
                return Post.objects.filter(
                    models.Q(title__icontains=full_name) | models.Q(content__icontains=full_name)
                ).order_by('-created_at')[:50]
            except (Athlete.DoesNotExist, ValueError):
                return Post.objects.none()
        else:
            return Post.objects.none()


class ExploreView(generics.RetrieveAPIView):
    """
    GET /api/sports/explore/ - Aggregate trending leagues, popular teams, and upcoming fixtures
    for the Explore page. Cached for 1 hour.
    """

    def retrieve(self, request, *args, **kwargs):
        cache_key = 'sports_explore_data'
        cached_data = cache.get(cache_key)

        if cached_data:
            logger.debug("Returning cached explore data")
            return Response(cached_data)

        # Ensure fixtures are up to date
        try:
            sync_api_football_fixtures.delay()
        except Exception as e:
            logger.warning(f"Could not trigger fixtures sync: {e}")

        # Get trending leagues (top 10 by popularity score)
        trending_leagues = League.objects.filter(
            sport='football'
        ).order_by('-popularity_score', '-updated_at')[:10]

        # Get popular teams (top 15 by follower count)
        popular_teams = Team.objects.filter(
            league__sport='football'
        ).order_by('-follower_count', '-updated_at')[:15]

        # Get upcoming fixtures (next 5 in next 48 hours)
        now = datetime.now()
        future_limit = now + timedelta(hours=48)
        upcoming_fixtures = Fixture.objects.filter(
            scheduled_time__gte=now,
            scheduled_time__lte=future_limit,
            status='NS'  # Not Started
        ).order_by('scheduled_time')[:5]

        # Serialize data
        from .serializers import FixtureSerializer

        explore_data = {
            'trending_leagues': LeagueSerializer(trending_leagues, many=True).data,
            'popular_teams': TeamSerializer(popular_teams, many=True).data,
            'upcoming_fixtures': FixtureSerializer(upcoming_fixtures, many=True).data,
            'last_updated': now.isoformat()
        }

        # Cache for 1 hour
        cache.set(cache_key, explore_data, 3600)

        logger.info("Generated fresh explore data")
        return Response(explore_data)
