import requests
import os
import logging
from urllib.parse import urlparse
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from posts.s3_utils import upload_media_to_s3, get_media_url

logger = logging.getLogger(__name__)

API_KEY = os.getenv('API_FOOTBALL_KEY', '2cde8b9c2a21f966fd7b1ce5cf2f3689')
API_HOST = 'v3.football.api-sports.io'
API_URL = f'https://{API_HOST}/'

def fetch_data(endpoint, params=None):
    """
    Fetch data from API-Football with proper error handling.

    Args:
        endpoint: API endpoint (without base URL)
        params: Query parameters

    Returns:
        dict: API response data or None if failed
    """
    headers = {
        'x-rapidapi-host': API_HOST,
        'x-rapidapi-key': API_KEY
    }

    try:
        response = requests.get(API_URL + endpoint, headers=headers, params=params, timeout=30)
        response.raise_for_status()  # Raises HTTPError for bad responses (4xx or 5xx)
        return response.json()
    except requests.RequestException as e:
        logger.error(f"API Football Error for {endpoint}: {e}")
        return None

def download_and_cache_image(image_url, entity_type, entity_id, filename=None):
    """
    Download image from API-Football and cache it to S3/CloudFront.

    Args:
        image_url: URL of the image to download
        entity_type: 'league', 'team', or 'player'
        entity_id: ID of the entity
        filename: Optional custom filename

    Returns:
        str: S3/CloudFront URL of cached image or original URL if failed
    """
    if not image_url:
        return None

    try:
        # Generate filename if not provided
        if not filename:
            parsed_url = urlparse(image_url)
            original_filename = os.path.basename(parsed_url.path)
            filename = f"sports/{entity_type}s/{entity_id}/{original_filename}"

        # Check if image already exists in S3
        if default_storage.exists(filename):
            # Return CloudFront URL
            cloudfront_url = f"https://{os.getenv('AWS_CLOUDFRONT_DOMAIN')}/{filename}"
            return cloudfront_url

        # Download image
        response = requests.get(image_url, timeout=30)
        response.raise_for_status()

        # Upload to S3
        content = ContentFile(response.content)
        success = upload_media_to_s3(content, filename, content_type=response.headers.get('content-type'))

        if success:
            # Return CloudFront URL
            cloudfront_url = get_media_url(filename)
            logger.info(f"Cached {entity_type} image: {cloudfront_url}")
            return cloudfront_url
        else:
            logger.error(f"Failed to upload {entity_type} image to S3")
            return image_url

    except Exception as e:
        logger.error(f"Failed to cache {entity_type} image {image_url}: {e}")
        return image_url

def sync_leagues_data():
    """
    Sync leagues data from API-Football to local database.
    This should be run as a scheduled Celery task.
    """
    from ..models import League

    logger.info("Starting leagues data sync from API-Football")

    # Fetch current leagues
    leagues_data = fetch_data('leagues', {'current': 'true'})

    if not leagues_data or 'response' not in leagues_data:
        logger.error("Failed to fetch leagues data from API-Football")
        return

    synced_count = 0
    for league_data in leagues_data['response']:
        try:
            league_info = league_data['league']
            country_info = league_data['country']

            # Create or update league
            league, created = League.objects.get_or_create(
                id=league_info['id'],
                defaults={
                    'name': league_info['name'],
                    'sport': 'football',  # API-Football is football-focused
                    'description': f"{league_info['name']} - {country_info['name']}",
                    'standings': [],  # Will be populated separately
                }
            )

            if created:
                logger.info(f"Created new league: {league.name}")
            else:
                # Update existing league info
                league.name = league_info['name']
                league.description = f"{league_info['name']} - {country_info['name']}"
                league.save()

            # Cache league logo if available
            if league_info.get('logo'):
                cached_logo_url = download_and_cache_image(
                    league_info['logo'],
                    'league',
                    league.id
                )
                if cached_logo_url:
                    league.logo_url = cached_logo_url
                    league.save(update_fields=['logo_url'])

            synced_count += 1

        except Exception as e:
            logger.error(f"Failed to sync league {league_info.get('name', 'Unknown')}: {e}")
            continue

    logger.info(f"Successfully synced {synced_count} leagues from API-Football")

def sync_teams_data():
    """
    Sync teams data from API-Football to local database.
    This should be run as a scheduled Celery task.
    """
    from ..models import Team, League

    logger.info("Starting teams data sync from API-Football")

    # Get all leagues first
    leagues = League.objects.filter(sport='football')

    synced_count = 0
    for league in leagues:
        try:
            # Fetch teams for this league
            teams_data = fetch_data('teams', {'league': league.id, 'season': 2024})

            if not teams_data or 'response' not in teams_data:
                continue

            for team_data in teams_data['response']:
                try:
                    team_info = team_data['team']

                    # Create or update team
                    team, created = Team.objects.get_or_create(
                        id=team_info['id'],
                        defaults={
                            'name': team_info['name'],
                            'league': league,
                            'description': f"{team_info['name']} - {league.name}",
                            'roster': [],  # Will be populated separately
                            'schedule': [],  # Will be populated separately
                        }
                    )

                    if created:
                        logger.info(f"Created new team: {team.name}")
                    else:
                        # Update existing team info
                        team.name = team_info['name']
                        team.description = f"{team_info['name']} - {league.name}"
                        team.save()

                    # Cache team logo if available
                    if team_info.get('logo'):
                        cached_logo_url = download_and_cache_image(
                            team_info['logo'],
                            'team',
                            team.id
                        )
                        if cached_logo_url:
                            team.logo_url = cached_logo_url
                            team.save(update_fields=['logo_url'])

                    synced_count += 1

                except Exception as e:
                    logger.error(f"Failed to sync team {team_info.get('name', 'Unknown')}: {e}")
                    continue

        except Exception as e:
            logger.error(f"Failed to sync teams for league {league.name}: {e}")
            continue

    logger.info(f"Successfully synced {synced_count} teams from API-Football")

def sync_fixtures_data():
    """
    Sync upcoming fixtures data from API-Football.
    This should be run as a periodic Celery task (hourly).
    """
    from ..models import Fixture
    from datetime import datetime, timedelta

    logger.info("Starting fixtures data sync from API-Football")

    # Get fixtures for next 7 days
    today = datetime.now()
    next_week = today + timedelta(days=7)

    fixtures_data = fetch_data('fixtures', {
        'from': today.strftime('%Y-%m-%d'),
        'to': next_week.strftime('%Y-%m-%d')
    })

    if not fixtures_data or 'response' not in fixtures_data:
        logger.error("Failed to fetch fixtures data from API-Football")
        return

    synced_count = 0
    for fixture_data in fixtures_data['response']:
        try:
            fixture_info = fixture_data['fixture']
            teams_info = fixture_data['teams']
            league_info = fixture_data['league']

            # Create or update fixture
            fixture, created = Fixture.objects.get_or_create(
                id=fixture_info['id'],
                defaults={
                    'home_team_name': teams_info['home']['name'],
                    'away_team_name': teams_info['away']['name'],
                    'home_team_id': teams_info['home']['id'],
                    'away_team_id': teams_info['away']['id'],
                    'league_name': league_info['name'],
                    'league_id': league_info['id'],
                    'scheduled_time': fixture_info['date'],
                    'status': fixture_info['status']['short'],
                    'home_score': fixture_data['goals']['home'],
                    'away_score': fixture_data['goals']['away'],
                }
            )

            if created:
                logger.info(f"Created new fixture: {fixture.home_team_name} vs {fixture.away_team_name}")
                synced_count += 1
            else:
                # Update existing fixture
                fixture.status = fixture_info['status']['short']
                fixture.home_score = fixture_data['goals']['home']
                fixture.away_score = fixture_data['goals']['away']
                fixture.save()

        except Exception as e:
            logger.error(f"Failed to sync fixture {fixture_info.get('id', 'Unknown')}: {e}")
            continue

    logger.info(f"Successfully synced {synced_count} fixtures from API-Football")