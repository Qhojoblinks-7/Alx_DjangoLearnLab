import requests
import logging
import time
from datetime import datetime, timedelta
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

class APIFootballClient:
    """
    Enhanced API-Football client with circuit breaker pattern,
    rate limiting, and intelligent caching.
    """

    BASE_URL = "https://api-football-v1.p.rapidapi.com/v3"

    # Rate limiting configuration (API-Football has different limits)
    RATE_LIMITS = {
        'requests_per_minute': 30,  # Conservative limit
        'requests_per_hour': 300,   # API-Football allows more
        'burst_limit': 10
    }

    def __init__(self, api_key=None):
        self.api_key = api_key or "2cde8b9c2a21f966fd7b1ce5cf2f3689"
        self.session = requests.Session()
        self.session.timeout = 15  # Longer timeout for external API

        # Set headers for RapidAPI
        self.session.headers.update({
            'X-RapidAPI-Key': self.api_key,
            'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
        })

        # Circuit breaker state
        self.failure_count = 0
        self.last_failure_time = None
        self.circuit_open = False
        self.circuit_timeout = 60  # 1 minute circuit break

        # Rate limiting state
        self.requests_this_minute = 0
        self.requests_this_hour = 0
        self.last_reset_minute = datetime.now()
        self.last_reset_hour = datetime.now()

        # Cache settings - API-Football data can be cached longer
        self.cache_timeout = {
            'fixtures': 300,        # 5 minutes for live fixtures
            'standings': 1800,      # 30 minutes for standings
            'teams': 3600,          # 1 hour for team info
            'players': 3600,        # 1 hour for player info
            'leagues': 86400,       # 24 hours for league info
            'live_data': 60,        # 1 minute for live data
        }

    def _reset_rate_limits(self):
        """Reset rate limiting counters based on time windows."""
        now = datetime.now()

        # Reset minute counter
        if (now - self.last_reset_minute).seconds >= 60:
            self.requests_this_minute = 0
            self.last_reset_minute = now

        # Reset hour counter
        if (now - self.last_reset_hour).seconds >= 3600:
            self.requests_this_hour = 0
            self.last_reset_hour = now

    def _can_make_request(self):
        """Check if we can make a request based on rate limits."""
        self._reset_rate_limits()

        return (self.requests_this_minute < self.RATE_LIMITS['burst_limit'] and
                self.requests_this_hour < self.RATE_LIMITS['requests_per_hour'])

    def _record_request(self):
        """Record a successful request for rate limiting."""
        self.requests_this_minute += 1
        self.requests_this_hour += 1

    def _is_circuit_open(self):
        """Check if circuit breaker is open."""
        if not self.circuit_open:
            return False

        # Check if circuit timeout has passed
        if self.last_failure_time and \
           (datetime.now() - self.last_failure_time).seconds > self.circuit_timeout:
            self.circuit_open = False
            self.failure_count = 0
            logger.info("Circuit breaker reset - attempting requests again")
            return False

        return True

    def _record_failure(self):
        """Record a failure for circuit breaker."""
        self.failure_count += 1
        self.last_failure_time = datetime.now()

        if self.failure_count >= 3:
            self.circuit_open = True
            logger.warning(f"Circuit breaker opened after {self.failure_count} failures")

    def _record_success(self):
        """Record a success to reset circuit breaker."""
        self.failure_count = 0
        self.circuit_open = False

    def _make_request(self, endpoint, params=None, use_cache=True, cache_key=None):
        """
        Make a request with circuit breaker, rate limiting, and caching.

        Args:
            endpoint: API endpoint (without base URL)
            params: Query parameters
            use_cache: Whether to use caching
            cache_key: Custom cache key

        Returns:
            dict: API response data or None if failed
        """
        if self._is_circuit_open():
            logger.warning("Circuit breaker is open - skipping request")
            return None

        if not self._can_make_request():
            logger.warning("Rate limit exceeded - skipping request")
            return None

        # Generate cache key if not provided
        if not cache_key:
            cache_key = f"api_football_{endpoint}_{str(params) if params else ''}"

        # Check cache first
        if use_cache:
            cached_data = cache.get(cache_key)
            if cached_data:
                logger.debug(f"Cache hit for {cache_key}")
                return cached_data

        try:
            url = f"{self.BASE_URL}/{endpoint}"
            response = self.session.get(url, params=params)

            self._record_request()

            if response.status_code == 200:
                data = response.json()
                self._record_success()

                # Cache the response
                if use_cache:
                    cache_timeout = self._get_cache_timeout(endpoint)
                    cache.set(cache_key, data, cache_timeout)
                    logger.debug(f"Cached response for {cache_key} for {cache_timeout}s")

                return data
            elif response.status_code == 429:
                # Rate limited by API-Football
                logger.warning("API-Football rate limit exceeded")
                self._record_failure()
                return None
            else:
                logger.warning(f"API-Football API error: {response.status_code} for {url}")
                self._record_failure()
                return None

        except requests.exceptions.RequestException as e:
            logger.error(f"API-Football API request failed: {e}")
            self._record_failure()
            return None

    def _get_cache_timeout(self, endpoint):
        """Get appropriate cache timeout based on endpoint."""
        if 'fixtures' in endpoint and 'live' in str(endpoint):
            return self.cache_timeout['live_data']
        elif 'fixtures' in endpoint:
            return self.cache_timeout['fixtures']
        elif 'standings' in endpoint:
            return self.cache_timeout['standings']
        elif 'teams' in endpoint:
            return self.cache_timeout['teams']
        elif 'players' in endpoint:
            return self.cache_timeout['players']
        elif 'leagues' in endpoint:
            return self.cache_timeout['leagues']
        else:
            return self.cache_timeout['fixtures']

    # Public API methods

    def get_leagues(self, params=None):
        """Get leagues information."""
        default_params = {'current': 'true'}
        query_params = {**default_params, **(params or {})}
        return self._make_request("leagues", params=query_params, cache_key="leagues_current")

    def get_league_standings(self, league_id, season=None):
        """Get league standings."""
        if not season:
            season = datetime.now().year

        params = {
            'league': league_id,
            'season': season
        }
        return self._make_request("standings", params=params, cache_key=f"standings_{league_id}_{season}")

    def get_fixtures(self, params=None):
        """Get fixtures/matches."""
        return self._make_request("fixtures", params=params or {})

    def get_live_fixtures(self):
        """Get live fixtures."""
        params = {'live': 'all'}
        return self._make_request("fixtures", params=params, use_cache=False, cache_key="fixtures_live")

    def get_team_info(self, team_id):
        """Get team information."""
        params = {'id': team_id}
        return self._make_request("teams", params=params, cache_key=f"team_{team_id}")

    def get_team_statistics(self, team_id, league_id, season=None):
        """Get team statistics."""
        if not season:
            season = datetime.now().year

        params = {
            'team': team_id,
            'league': league_id,
            'season': season
        }
        return self._make_request("teams/statistics", params=params, cache_key=f"team_stats_{team_id}_{league_id}_{season}")

    def get_player_info(self, player_id, season=None):
        """Get player information."""
        if not season:
            season = datetime.now().year

        params = {
            'id': player_id,
            'season': season
        }
        return self._make_request("players", params=params, cache_key=f"player_{player_id}_{season}")

    def get_top_scorers(self, league_id, season=None):
        """Get top scorers for a league."""
        if not season:
            season = datetime.now().year

        params = {
            'league': league_id,
            'season': season
        }
        return self._make_request("players/topscorers", params=params, cache_key=f"topscorers_{league_id}_{season}")

    def get_top_assists(self, league_id, season=None):
        """Get top assists for a league."""
        if not season:
            season = datetime.now().year

        params = {
            'league': league_id,
            'season': season
        }
        return self._make_request("players/topassists", params=params, cache_key=f"topassists_{league_id}_{season}")

    def get_predictions(self, fixture_id):
        """Get match predictions."""
        params = {'fixture': fixture_id}
        return self._make_request("predictions", params=params, cache_key=f"predictions_{fixture_id}")

    def get_odds(self, fixture_id):
        """Get betting odds for a fixture."""
        params = {'fixture': fixture_id}
        return self._make_request("odds", params=params, cache_key=f"odds_{fixture_id}")

    # Health check method
    def health_check(self):
        """Check if the API is accessible."""
        try:
            # Simple health check with a lightweight endpoint
            response = self.session.get(f"{self.BASE_URL}/timezone")
            return response.status_code == 200
        except:
            return False

    # Circuit breaker status
    def get_circuit_status(self):
        """Get current circuit breaker status."""
        return {
            'circuit_open': self.circuit_open,
            'failure_count': self.failure_count,
            'last_failure': self.last_failure_time.isoformat() if self.last_failure_time else None,
            'requests_this_minute': self.requests_this_minute,
            'requests_this_hour': self.requests_this_hour,
        }


# Global client instance
api_football_client = APIFootballClient()