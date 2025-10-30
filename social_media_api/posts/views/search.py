from django.db.models import Q, Count, Value, BooleanField
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models import Post
from django.contrib.auth import get_user_model

User = get_user_model()
from ..serializers import PostSerializer
from accounts.serializers import UserSerializer
from ..throttling import SearchThrottle
import logging
import requests

logger = logging.getLogger(__name__)


class SearchViewSet(viewsets.ReadOnlyModelViewSet):
    """
    B-SEARCH-01: Unified Search API
    GET /api/search/?q={query}&type={all/users/posts/leagues/teams/athletes}
    Returns search results based on query and optional type filter.
    """
    permission_classes = []  # Allow unauthenticated search
    throttle_classes = [SearchThrottle]

    def get_queryset(self):
        return Post.objects.none()  # We'll override list()

    def list(self, request):
        query = request.query_params.get('q', '').strip()
        search_type = request.query_params.get('type', 'all')

        if not query:
            return Response({
                'results': [],
                'total': 0,
                'query': query,
                'type': search_type
            })

        if search_type == 'all':
            results = self._unified_search(query, request.user)
        elif search_type == 'users':
            results = self._search_users(query, request.user)
        elif search_type == 'posts':
            results = self._search_posts(query, request.user)
        elif search_type in ['leagues', 'teams', 'athletes']:
            results = self._search_sports_entities(query, search_type, request.user)
        else:
            return Response(
                {'error': f'Invalid search type: {search_type}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response({
            'results': results,
            'total': len(results),
            'query': query,
            'type': search_type
        })

    def _unified_search(self, query, user):
        """Search across all content types"""
        results = {
            'users': self._search_users(query, user)[:5],  # Limit each type
            'posts': self._search_posts(query, user)[:10],
            'leagues': self._search_sports_entities(query, 'leagues', user)[:3],
            'teams': self._search_sports_entities(query, 'teams', user)[:5],
            'athletes': self._search_sports_entities(query, 'athletes', user)[:5],
        }
        return results

    def _search_users(self, query, user):
        """Search for users by username, first name, last name, or bio"""
        # Exclude blocked/muted users if authenticated
        queryset = User.objects.all()

        if user.is_authenticated:
            blocked_ids = set(user.blocked_users.values_list('id', flat=True))
            muted_ids = set(user.muted_users.values_list('id', flat=True))
            excluded_ids = blocked_ids | muted_ids
            if excluded_ids:
                queryset = queryset.exclude(id__in=excluded_ids)

        # Search by username, name, or bio
        users = queryset.filter(
            Q(username__icontains=query) |
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query) |
            Q(bio__icontains=query)
        ).annotate(
            followers_count=Count('followers'),
            following_count=Count('following')
        )[:20]  # Limit results

        # Serialize with request context for URLs
        serializer = UserSerializer(users, many=True, context={'request': self.request})
        return serializer.data

    def _search_posts(self, query, user):
        """Search for posts by content, title, or hashtags"""
        # Base queryset
        queryset = Post.objects.all()

        # Exclude posts from blocked/muted users if authenticated
        if user.is_authenticated:
            blocked_ids = set(user.blocked_users.values_list('id', flat=True))
            muted_ids = set(user.muted_users.values_list('id', flat=True))
            excluded_ids = blocked_ids | muted_ids
            if excluded_ids:
                queryset = queryset.exclude(author__in=excluded_ids)

        # Search by content, title, or hashtags
        posts = queryset.filter(
            Q(content__icontains=query) |
            Q(title__icontains=query) |
            Q(hashtags__hashtag__icontains=query)
        ).distinct().select_related('author').prefetch_related('likes', 'comments', 'reposts')[:50]

        serializer = PostSerializer(posts, many=True, context={'request': self.request})
        return serializer.data

    def _search_sports_entities(self, query, entity_type, user):
        """Search for sports entities using TheSportsDB API with caching"""
        from django.core.cache import cache

        # Check cache first
        cache_key = f"sportsdb_{entity_type}_{query.lower()}"
        cached_results = cache.get(cache_key)
        if cached_results:
            return cached_results

        try:
            if entity_type == 'leagues':
                # Search leagues from TheSportsDB
                url = f"https://www.thesportsdb.com/api/v1/json/3/search_all_leagues.php?l={query}"
                response = requests.get(url, timeout=10)
                response.raise_for_status()
                data = response.json()

                leagues = []
                if isinstance(data, dict) and data.get('countrys'):
                    for league_data in data['countrys'][:10]:  # Limit results
                        league = {
                            'id': league_data.get('idLeague', ''),
                            'name': league_data.get('strLeague', ''),
                            'slug': league_data.get('strLeague', '').lower().replace(' ', '-'),
                            'logo_url': league_data.get('strBadge', ''),
                            'description': league_data.get('strDescriptionEN', '')[:200] + '...' if league_data.get('strDescriptionEN') else '',
                            'sport': league_data.get('strSport', ''),
                            'country': league_data.get('strCountry', '')
                        }
                        leagues.append(league)

                # Cache for 24 hours
                cache.set(cache_key, leagues, 86400)
                return leagues

            elif entity_type == 'teams':
                # Search teams from TheSportsDB
                url = f"https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t={query}"
                response = requests.get(url, timeout=10)
                response.raise_for_status()
                data = response.json()

                teams = []
                if isinstance(data, dict) and data.get('teams'):
                    for team_data in data['teams'][:10]:  # Limit results
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
                        teams.append(team)

                # Cache for 24 hours
                cache.set(cache_key, teams, 86400)
                return teams

            elif entity_type == 'athletes':
                # Search athletes from TheSportsDB
                url = f"https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p={query}"
                response = requests.get(url, timeout=10)
                response.raise_for_status()
                data = response.json()

                athletes = []
                if isinstance(data, dict) and data.get('player'):
                    for athlete_data in data['player'][:10]:  # Limit results
                        athlete = {
                            'id': athlete_data.get('idPlayer', ''),
                            'first_name': athlete_data.get('strPlayer', '').split(' ')[0] if athlete_data.get('strPlayer') else '',
                            'last_name': ' '.join(athlete_data.get('strPlayer', '').split(' ')[1:]) if athlete_data.get('strPlayer') else '',
                            'slug': athlete_data.get('strPlayer', '').lower().replace(' ', '-'),
                            'position': athlete_data.get('strPosition', ''),
                            'team': athlete_data.get('strTeam', ''),
                            'sport': athlete_data.get('strSport', ''),
                            'logo_url': athlete_data.get('strThumb', ''),
                            'country': athlete_data.get('strNationality', '')
                        }
                        athletes.append(athlete)

                # Cache for 24 hours
                cache.set(cache_key, athletes, 86400)
                return athletes

        except requests.RequestException as e:
            logger.error(f"Error fetching data from TheSportsDB API: {e}")
            # Fall back to cached data if available, or empty results
            return cache.get(cache_key, [])

        return []

    @action(detail=False, methods=['get'])
    def context(self, request):
        """
        B-SEARCH-02: Contextual Search
        GET /api/search/context/?q={query}&context={messaging/communities/teams/leagues/athletes}
        Returns contextually relevant search results.
        """
        query = request.query_params.get('q', '').strip()
        context = request.query_params.get('context', 'general')

        if not query:
            return Response({
                'results': [],
                'total': 0,
                'query': query,
                'context': context
            })

        if context == 'messaging':
            # Search for users suitable for messaging (exclude blocked users)
            results = self._search_users_for_messaging(query, request.user)
        elif context == 'communities':
            # Search for communities
            results = self._search_communities(query, request.user)
        elif context in ['teams', 'leagues', 'athletes']:
            # Search for sports entities
            results = self._search_sports_entities(query, context, request.user)
        else:
            # General search
            results = self._unified_search(query, request.user)

        return Response({
            'results': results,
            'total': len(results) if isinstance(results, list) else sum(len(v) for v in results.values()),
            'query': query,
            'context': context
        })

    def _search_users_for_messaging(self, query, user):
        """Search users for messaging context - excludes blocked users, prioritizes followed"""
        if not user.is_authenticated:
            return []

        # Get followed users first
        followed_users = user.following.filter(
            Q(username__icontains=query) |
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query)
        ).annotate(
            followers_count=Count('followers'),
            following_count=Count('following'),
            is_followed=Value(True, BooleanField())
        )

        # Get other users (not followed, not blocked)
        blocked_ids = set(user.blocked_users.values_list('id', flat=True))
        other_users = User.objects.exclude(
            id__in=[u.id for u in followed_users] + list(blocked_ids) + [user.id]
        ).filter(
            Q(username__icontains=query) |
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query)
        ).annotate(
            followers_count=Count('followers'),
            following_count=Count('following'),
            is_followed=Value(False, BooleanField())
        )[:10]  # Limit other users

        # Combine and serialize
        all_users = list(followed_users) + list(other_users)
        serializer = UserSerializer(all_users, many=True, context={'request': self.request})
        return serializer.data

    def _search_communities(self, query, user):
        """Search for communities (mock implementation)"""
        # Mock community data
        communities = [
            {
                'id': 1,
                'name': 'NBA Fans United',
                'slug': 'nba-fans-united',
                'description': 'For all NBA fans to discuss games and players',
                'member_count': 15420,
                'logo_url': '/media/communities/nba-fans.png'
            },
            {
                'id': 2,
                'name': 'Premier League Supporters',
                'slug': 'premier-league-supporters',
                'description': 'English Premier League discussion and highlights',
                'member_count': 12850,
                'logo_url': '/media/communities/pl-supporters.png'
            }
        ]

        return [community for community in communities
               if query.lower() in community['name'].lower() or
               query.lower() in community['description'].lower()]