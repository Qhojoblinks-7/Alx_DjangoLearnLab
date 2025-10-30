import requests
import logging
import time
from datetime import datetime, timedelta
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

class TheSportsDBClient:
    """
    Enhanced TheSportsDB API client with circuit breaker pattern,
    rate limiting, and intelligent caching.
    """

    BASE_URL = "https://www.thesportsdb.com/api/v1/json/3"

    # Rate limiting configuration
    RATE_LIMITS = {
        'requests_per_minute': 30,
        'requests_per_hour': 100,
        'burst_limit': 10
    }

    def __init__(self):
        self.session = requests.Session()
        self.session.timeout = 10  # 10 second timeout

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

        # Cache settings
        self.cache_timeout = {
            'league_data': 900,    # 15 minutes
            'team_data': 900,      # 15 minutes
            'player_data': 1800,   # 30 minutes
            'event_data': 3600,    # 1 hour
            'live_data': 30,       # 30 seconds
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
            cache_key = f"thesportsdb_{endpoint}_{str(params) if params else ''}"

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
            else:
                logger.warning(f"TheSportsDB API error: {response.status_code} for {url}")
                self._record_failure()
                return None

        except requests.exceptions.RequestException as e:
            logger.error(f"TheSportsDB API request failed: {e}")
            self._record_failure()
            return None

    def _get_cache_timeout(self, endpoint):
        """Get appropriate cache timeout based on endpoint."""
        if 'latest' in endpoint or 'live' in endpoint:
            return self.cache_timeout['live_data']
        elif 'event' in endpoint:
            return self.cache_timeout['event_data']
        elif 'player' in endpoint or 'lookupplayer' in endpoint:
            return self.cache_timeout['player_data']
        elif 'team' in endpoint or 'lookupteam' in endpoint:
            return self.cache_timeout['team_data']
        else:
            return self.cache_timeout['league_data']

    # Public API methods

    def get_league_standings(self, league_id, season=None):
        """Get league standings table."""
        if not season:
            season = "2024-2025"

        return self._make_request(
            "lookuptable.php",
            params={"l": league_id, "s": season},
            cache_key=f"league_standings_{league_id}_{season}"
        )

    def get_league_teams(self, league_name):
        """Get all teams in a league."""
        return self._make_request(
            "search_all_teams.php",
            params={"l": league_name},
            cache_key=f"league_teams_{league_name.replace(' ', '_')}"
        )

    def get_team_details(self, team_id):
        """Get detailed team information."""
        return self._make_request(
            "lookupteam.php",
            params={"id": team_id},
            cache_key=f"team_details_{team_id}"
        )

    def get_player_details(self, player_id):
        """Get detailed player information."""
        return self._make_request(
            "lookupplayer.php",
            params={"id": player_id},
            cache_key=f"player_details_{player_id}"
        )

    def get_team_players(self, team_name):
        """Get all players for a team."""
        return self._make_request(
            "searchplayers.php",
            params={"t": team_name},
            cache_key=f"team_players_{team_name.replace(' ', '_')}"
        )

    def get_league_events_next(self, league_id):
        """Get upcoming events for a league."""
        return self._make_request(
            "eventsnextleague.php",
            params={"id": league_id},
            cache_key=f"league_events_next_{league_id}"
        )

    def get_league_events_last(self, league_id):
        """Get recent events for a league."""
        return self._make_request(
            "eventslast.php",
            params={"id": league_id},
            cache_key=f"league_events_last_{league_id}"
        )

    def get_event_details(self, event_id):
        """Get detailed event information."""
        return self._make_request(
            "lookupevent.php",
            params={"id": event_id},
            cache_key=f"event_details_{event_id}"
        )

    def get_live_scores(self, sport=None):
        """Get live scores (premium feature)."""
        params = {}
        if sport:
            params["s"] = sport

        return self._make_request(
            "latestsoccer.php",  # Note: endpoint may vary by sport
            params=params,
            use_cache=False  # Live data should not be cached
        )

    def search_leagues(self, sport=None):
        """Search for leagues, optionally filtered by sport."""
        params = {}
        if sport:
            params["s"] = sport

        return self._make_request(
            "search_all_leagues.php",
            params=params,
            cache_key=f"search_leagues_{sport or 'all'}"
        )

    def get_league_details(self, league_id):
        """Get detailed league information."""
        return self._make_request(
            "lookupleague.php",
            params={"id": league_id},
            cache_key=f"league_details_{league_id}"
        )

    # Health check method
    def health_check(self):
        """Check if the API is accessible."""
        try:
            # Simple health check with a lightweight endpoint
            response = self.session.get(f"{self.BASE_URL}/search_all_leagues.php?s=Soccer", timeout=5)
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
thesportsdb_client = TheSportsDBClient()