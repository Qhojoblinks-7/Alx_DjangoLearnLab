import requests
from celery import shared_task
from django.core.cache import cache
from .models import League, Team, Athlete
from .api_football_client import api_football_client
from .utils.api_football import sync_leagues_data, sync_teams_data, sync_fixtures_data


@shared_task
def update_league_standings(league_id=None):
    """
    Update standings for all leagues or a specific league using API-Football
    """
    if league_id:
        leagues = League.objects.filter(id=league_id)
    else:
        leagues = League.objects.all()

    for league in leagues:
        try:
            # Use API-Football client with circuit breaker and caching
            standings_data = api_football_client.get_league_standings(league.id)
            if standings_data and 'response' in standings_data and standings_data['response']:
                # API-Football returns standings in response array
                league_standings = standings_data['response'][0]['league']['standings'][0]
                league.standings = league_standings
                league.save(update_fields=['standings'])
                # Invalidate cache
                cache_key = f'league_detail_{league.slug}'
                cache.delete(cache_key)
                print(f"Updated standings for league {league.name}")
            else:
                print(f"No standings data available for league {league.name}")
        except Exception as e:
            print(f"Failed to update standings for league {league.name}: {e}")
            continue


@shared_task
def update_team_schedules(team_id=None):
    """
    Update schedules for all teams or a specific team using API-Football
    """
    if team_id:
        teams = Team.objects.filter(id=team_id)
    else:
        teams = Team.objects.all()

    for team in teams:
        try:
            # Get recent fixtures for the team using API-Football
            # Note: API-Football uses team IDs differently, we'll need to map them
            fixtures_data = api_football_client.get_fixtures({
                'team': team.id,
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
                            'strSeason': league_info['season'].__str__(),
                            'dateEvent': fixture_info['date'].split('T')[0],
                            'strThumb': fixture_info.get('fixture', {}).get('logo')  # May not exist
                        }
                        detailed_events.append(event)

                    team.schedule = detailed_events
                    team.save(update_fields=['schedule'])
                    # Invalidate cache
                    cache_key = f'team_detail_{team.slug}'
                    cache.delete(cache_key)
                    print(f"Updated schedule for team {team.name}")
                else:
                    print(f"No fixtures data available for team {team.name}")
            else:
                print(f"Failed to fetch fixtures for team {team.name}")
        except Exception as e:
            print(f"Failed to update schedule for team {team.name}: {e}")
            continue


@shared_task
def get_event_details(event_id):
    """
    Get detailed information for a specific fixture using API-Football
    """
    try:
        fixture_data = api_football_client.get_fixtures({'id': event_id})
        if fixture_data and fixture_data.get("response"):
            fixture = fixture_data["response"][0]
            fixture_info = fixture['fixture']
            teams_info = fixture['teams']
            goals = fixture['goals']
            league_info = fixture['league']

            # Return enhanced fixture data in our expected format
            return {
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
        else:
            print(f"No fixture data found for {event_id}")
    except Exception as e:
        print(f"Failed to get fixture details for {event_id}: {e}")
    return None


@shared_task
def update_athlete_info(athlete_id=None):
    """
    Update athlete information using API-Football - less frequent as athlete data changes slowly
    """
    if athlete_id:
        athletes = Athlete.objects.filter(id=athlete_id)
    else:
        athletes = Athlete.objects.all()

    for athlete in athletes:
        try:
            # Get athlete details from API using API-Football client
            athlete_data = api_football_client.get_player_info(athlete.id)
            if athlete_data and 'response' in athlete_data and athlete_data['response']:
                player_info = athlete_data['response'][0]['player']
                # Update fields that might change
                athlete.position = player_info.get('position', athlete.position)
                athlete.nationality = player_info.get('nationality', athlete.nationality)
                athlete.description = player_info.get('name', athlete.description)  # Use name as description fallback
                athlete.save(update_fields=['position', 'nationality', 'description'])
                # Invalidate cache
                cache_key = f'athlete_detail_{athlete.slug}'
                cache.delete(cache_key)
                print(f"Updated info for athlete {athlete.full_name}")
            else:
                print(f"No player data found for athlete {athlete.full_name}")
        except Exception as e:
            print(f"Failed to update info for athlete {athlete.full_name}: {e}")
            continue


@shared_task
def refresh_all_sports_data():
    """
    Comprehensive refresh of all sports data
    """
    # Update all league standings
    update_league_standings.delay()

    # Update all team schedules
    update_team_schedules.delay()

    # Update athlete info (less frequently needed)
    update_athlete_info.delay()


@shared_task
def refresh_league_data(league_id):
    """
    Refresh data for a specific league and all its teams/athletes
    """
    try:
        league = League.objects.get(id=league_id)

        # Update league standings
        update_league_standings.delay(league_id)

        # Update schedules for all teams in this league
        for team in league.teams.all():
            update_team_schedules.delay(team.id)
            # Update athletes for this team
            for athlete in team.athletes.all():
                update_athlete_info.delay(athlete.id)

    except League.DoesNotExist:
        print(f"League with ID {league_id} not found")


@shared_task
def refresh_team_data(team_id):
    """
    Refresh data for a specific team and its athletes
    """
    try:
        team = Team.objects.get(id=team_id)

        # Update team schedule
        update_team_schedules.delay(team_id)

        # Update all athletes for this team
        for athlete in team.athletes.all():
            update_athlete_info.delay(athlete.id)

    except Team.DoesNotExist:
        print(f"Team with ID {team_id} not found")


@shared_task
def sync_api_football_data():
    """
    Scheduled task to sync all API-Football data (daily)
    """
    print("Starting daily API-Football data sync...")

    # Sync leagues first
    sync_leagues_data()

    # Sync teams
    sync_teams_data()

    # Sync fixtures
    sync_fixtures_data()

    print("API-Football data sync completed")


@shared_task
def sync_api_football_fixtures():
    """
    Scheduled task to sync fixtures data (hourly)
    """
    print("Starting hourly fixtures sync...")
    sync_fixtures_data()
    print("Fixtures sync completed")