from django.db import models
from rest_framework import viewsets, permissions
from rest_framework.response import Response
from ..models import Post
from ..serializers import PostSerializer
import logging

logger = logging.getLogger(__name__)


class TrendsView(viewsets.ReadOnlyModelViewSet):
    """
    B-EXP-TRN-01: Trending Topics - GET /api/trends/
    Returns trending topics based on recent engagement on sports-related posts.
    """
    permission_classes = []

    def list(self, request):
        """
        B-EXP-TRN-03: Logic weighted by recent engagement on sports-related posts.
        For now, return mock data. In production, this would analyze:
        - Recent posts (last 24 hours)
        - Like/comment counts
        - Hashtag frequency
        - User engagement metrics
        """
        # Mock trending data matching B-EXP-TRN-02 specification
        trends = [
            {
                "id": 1,
                "rank": 1,
                "category": "Trending in Football",
                "topic": "#MbappeToMadrid",
                "post_count": 15420
            },
            {
                "id": 2,
                "rank": 2,
                "category": "Trending in Basketball",
                "topic": "#LukaTripleDouble",
                "post_count": 12850
            },
            {
                "id": 3,
                "rank": 3,
                "category": "Trending in NFL",
                "topic": "#ChiefsInjury",
                "post_count": 9870
            },
            {
                "id": 4,
                "rank": 4,
                "category": "Trending in Soccer",
                "topic": "#PremierLeague",
                "post_count": 8760
            },
            {
                "id": 5,
                "rank": 5,
                "category": "Trending in Tennis",
                "topic": "#WimbledonFin...",
                "post_count": 5430
            }
        ]

        return Response(trends)


class LeaguesView(viewsets.ReadOnlyModelViewSet):
    """
    B-LEAGUE-01: Major Leagues and Tournaments - GET /api/leagues/
    Returns list of major leagues and tournaments from TheSportsDB API with caching.
    """
    permission_classes = []
    serializer_class = None  # We'll override to return custom format

    def list(self, request):
        """
        Returns leagues from TheSportsDB API with caching for offline usage.
        """
        from django.core.cache import cache
        import requests

        # Check cache first
        cache_key = "sportsdb_all_leagues"
        cached_leagues = cache.get(cache_key)
        if cached_leagues:
            return Response(cached_leagues)

        try:
            # Fetch all leagues from TheSportsDB
            url = "https://www.thesportsdb.com/api/v1/json/3/all_leagues.php"
            response = requests.get(url, timeout=15)
            response.raise_for_status()
            data = response.json()

            leagues_data = []
            if data.get('leagues'):
                for league_data in data['leagues'][:50]:  # Limit to 50 major leagues
                    league = {
                        'id': league_data.get('idLeague', ''),
                        'name': league_data.get('strLeague', ''),
                        'slug': league_data.get('strLeague', '').lower().replace(' ', '-'),
                        'logo_url': league_data.get('strBadge', ''),
                        'description': league_data.get('strDescription', '')[:300] + '...' if league_data.get('strDescription') else '',
                        'sport': league_data.get('strSport', ''),
                        'country': league_data.get('strCountry', '')
                    }
                    leagues_data.append(league)

            # Cache for 24 hours
            cache.set(cache_key, leagues_data, 86400)
            return Response(leagues_data)

        except requests.RequestException as e:
            logger.error(f"Error fetching leagues from TheSportsDB API: {e}")
            # Return cached data if available, otherwise empty list
            cached_data = cache.get(cache_key, [])
            return Response(cached_data)


class TeamsView(viewsets.ReadOnlyModelViewSet):
    """
    B-TEAM-01: All Teams - GET /api/teams/
    Returns list of all teams across sports from TheSportsDB API with caching.
    """
    permission_classes = []
    serializer_class = None  # We'll override to return custom format

    def list(self, request):
        """
        Returns teams from TheSportsDB API with caching for offline usage.
        """
        from django.core.cache import cache
        import requests

        # Check cache first
        cache_key = "sportsdb_all_teams"
        cached_teams = cache.get(cache_key)
        if cached_teams:
            return Response(cached_teams)

        try:
            # Fetch popular teams from TheSportsDB (using search for major teams)
            major_teams = [
                "Manchester United", "Real Madrid", "Barcelona", "Bayern Munich",
                "Liverpool", "Chelsea", "Arsenal", "Manchester City", "Tottenham",
                "Juventus", "AC Milan", "Inter Milan", "Napoli", "Roma",
                "PSG", "Marseille", "Lyon", "Monaco",
                "Borussia Dortmund", "Schalke 04", "Bayer Leverkusen", "RB Leipzig",
                "Los Angeles Lakers", "Golden State Warriors", "Boston Celtics", "Miami Heat",
                "Chicago Bulls", "Los Angeles Clippers", "Brooklyn Nets", "Milwaukee Bucks",
                "Dallas Mavericks", "Phoenix Suns", "Denver Nuggets", "Memphis Grizzlies"
            ]

            teams_data = []
            for team_name in major_teams[:30]:  # Limit to 30 teams
                try:
                    url = f"https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t={team_name}"
                    response = requests.get(url, timeout=10)
                    response.raise_for_status()
                    data = response.json()

                    if data.get('teams') and len(data['teams']) > 0:
                        team_data = data['teams'][0]
                        team = {
                            'id': team_data.get('idTeam', ''),
                            'name': team_data.get('strTeam', ''),
                            'slug': team_data.get('strTeam', '').lower().replace(' ', '-'),
                            'logo_url': team_data.get('strTeamBadge', ''),
                            'abbreviation': team_data.get('strTeamShort', ''),
                            'sport': team_data.get('strSport', ''),
                            'league': team_data.get('strLeague', ''),
                            'city': team_data.get('strStadiumLocation', ''),
                            'country': team_data.get('strCountry', '')
                        }
                        teams_data.append(team)
                except requests.RequestException:
                    continue  # Skip failed requests

            # Remove duplicates based on team name
            unique_teams = []
            seen_names = set()
            for team in teams_data:
                if team['name'] not in seen_names:
                    unique_teams.append(team)
                    seen_names.add(team['name'])

            # Cache for 24 hours
            cache.set(cache_key, unique_teams, 86400)
            return Response(unique_teams)

        except Exception as e:
            logger.error(f"Error fetching teams from TheSportsDB API: {e}")
            # Return cached data if available, otherwise empty list
            cached_data = cache.get(cache_key, [])
            return Response(cached_data)


class AthletesView(viewsets.ReadOnlyModelViewSet):
    """
    B-ATHLETE-01: All Athletes - GET /api/athletes/
    Returns list of all athletes across sports from TheSportsDB API with caching.
    """
    permission_classes = []
    serializer_class = None  # We'll override to return custom format

    def list(self, request):
        """
        Returns athletes from TheSportsDB API with caching for offline usage.
        """
        from django.core.cache import cache
        import requests

        # Check cache first
        cache_key = "sportsdb_popular_athletes"
        cached_athletes = cache.get(cache_key)
        if cached_athletes:
            return Response(cached_athletes)

        try:
            # Fetch popular athletes from TheSportsDB (using search for major athletes)
            popular_athletes = [
                "Lionel Messi", "Cristiano Ronaldo", "Neymar", "Kylian Mbappe",
                "Mohamed Salah", "Kevin De Bruyne", "Erling Haaland", "Harry Kane",
                "LeBron James", "Stephen Curry", "Kevin Durant", "Giannis Antetokounmpo",
                "Luka Doncic", "Nikola Jokic", "Joel Embiid", "James Harden",
                "Tom Brady", "Patrick Mahomes", "Aaron Rodgers", "Josh Allen",
                "Serena Williams", "Simona Halep", "Naomi Osaka", "Ashleigh Barty",
                "Roger Federer", "Rafael Nadal", "Novak Djokovic", "Andy Murray"
            ]

            athletes_data = []
            for athlete_name in popular_athletes[:25]:  # Limit to 25 athletes
                try:
                    url = f"https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p={athlete_name}"
                    response = requests.get(url, timeout=10)
                    response.raise_for_status()
                    data = response.json()

                    if data.get('player') and len(data['player']) > 0:
                        athlete_data = data['player'][0]
                        athlete = {
                            'id': athlete_data.get('idPlayer', ''),
                            'first_name': athlete_data.get('strPlayer', '').split(' ')[0] if athlete_data.get('strPlayer') else '',
                            'last_name': ' '.join(athlete_data.get('strPlayer', '').split(' ')[1:]) if athlete_data.get('strPlayer') else '',
                            'slug': athlete_data.get('strPlayer', '').lower().replace(' ', '-'),
                            'position': athlete_data.get('strPosition', ''),
                            'team': athlete_data.get('strTeam', ''),
                            'sport': athlete_data.get('strSport', ''),
                            'league': athlete_data.get('strLeague', ''),
                            'country': athlete_data.get('strNationality', ''),
                            'logo_url': athlete_data.get('strThumb', '')
                        }
                        athletes_data.append(athlete)
                except requests.RequestException:
                    continue  # Skip failed requests

            # Remove duplicates based on athlete name
            unique_athletes = []
            seen_names = set()
            for athlete in athletes_data:
                full_name = f"{athlete['first_name']} {athlete['last_name']}"
                if full_name not in seen_names:
                    unique_athletes.append(athlete)
                    seen_names.add(full_name)

            # Cache for 24 hours
            cache.set(cache_key, unique_athletes, 86400)
            return Response(unique_athletes)

        except Exception as e:
            logger.error(f"Error fetching athletes from TheSportsDB API: {e}")
            # Return cached data if available, otherwise empty list
            cached_data = cache.get(cache_key, [])
            return Response(cached_data)


class LiveEventsView(viewsets.ReadOnlyModelViewSet):
    """
    Returns mock live events data for the sidebar.
    In production, this would fetch real-time live events from sports APIs.
    """
    permission_classes = []

    def list(self, request):
        """
        Return mock live events data.
        """
        live_events = [
            {
                'id': 1,
                'host_name': 'NBA Official',
                'title': 'NBA Finals Game 7',
                'engagement_type': 'fire',
                'engagement_count': 15420
            },
            {
                'id': 2,
                'host_name': 'Premier League',
                'title': 'Manchester City vs Arsenal',
                'engagement_type': 'heart',
                'engagement_count': 12850
            },
            {
                'id': 3,
                'host_name': 'NFL',
                'title': 'Super Bowl LVIII',
                'engagement_type': 'fire',
                'engagement_count': 9870
            }
        ]

        return Response(live_events)


class TrendingSidebarView(viewsets.ReadOnlyModelViewSet):
    """
    Returns trending posts for the sidebar.
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = PostSerializer

    def get_queryset(self):
        # Return recent posts with high engagement (likes + comments + reposts)
        try:
            return Post.objects.annotate(
                engagement_score=models.Count('likes') + models.Count('comments') + models.Count('reposts')
            ).filter(
                engagement_score__gt=0
            ).order_by('-engagement_score', '-created_at')[:10]
        except Exception as e:
            logger.error(f"Error in TrendingSidebarView.get_queryset: {e}")
            # Return recent posts as fallback
            return Post.objects.all().order_by('-created_at')[:10]


class SuggestedUsersView(viewsets.ReadOnlyModelViewSet):
    """
    Returns suggested users for the sidebar.
    """
    permission_classes = [permissions.AllowAny]
    from accounts.serializers import UserSerializer
    serializer_class = UserSerializer

    def get_queryset(self):
        try:
            # Return users with high follower counts (excluding current user if authenticated)
            from django.contrib.auth import get_user_model
            User = get_user_model()
            queryset = User.objects.annotate(
                followers_count=models.Count('followers', distinct=True),
                following_count=models.Count('following', distinct=True)
            ).filter(
                followers_count__gt=0
            ).order_by('-followers_count')[:10]

            # Exclude current user if authenticated
            if self.request.user.is_authenticated:
                queryset = queryset.exclude(id=self.request.user.id)

            return queryset
        except Exception as e:
            logger.error(f"Error in SuggestedUsersView.get_queryset: {e}")
            # Return empty queryset on error
            from django.contrib.auth import get_user_model
            User = get_user_model()
            return User.objects.none()