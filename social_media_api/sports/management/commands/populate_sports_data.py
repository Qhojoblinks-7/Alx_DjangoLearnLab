import requests
from django.core.management.base import BaseCommand
from django.db import IntegrityError
from sports.models import League, Team, Athlete


class Command(BaseCommand):
    help = 'Populate sports data from TheSportsDB API'

    def add_arguments(self, parser):
        parser.add_argument(
            '--leagues',
            nargs='+',
            type=str,
            help='Specific league IDs to fetch (e.g., 4328 for English Premier League)',
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before populating',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing sports data...')
            Athlete.objects.all().delete()
            Team.objects.all().delete()
            League.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Existing data cleared.'))

        leagues_to_fetch = options.get('leagues') or ['4328', '4335', '4331']  # Default: EPL, La Liga, Serie A

        for league_id in leagues_to_fetch:
            self.stdout.write(f'Fetching data for league ID: {league_id}')
            self.fetch_league_data(league_id)

        self.stdout.write(self.style.SUCCESS('Sports data population completed.'))

    def fetch_league_data(self, league_id):
        # Fetch league details
        league_url = f'https://www.thesportsdb.com/api/v1/json/3/lookupleague.php?id={league_id}'
        response = requests.get(league_url)
        if response.status_code != 200:
            self.stdout.write(self.style.ERROR(f'Failed to fetch league {league_id}'))
            return

        league_data = response.json().get('leagues', [])
        if not league_data:
            self.stdout.write(self.style.WARNING(f'No league data found for ID {league_id}. Response: {response.text[:200]}'))
            return

        league_info = league_data[0]
        league, created = League.objects.get_or_create(
            name=league_info['strLeague'],
            defaults={
                'sport': league_info.get('strSport', 'Unknown'),
                'description': league_info.get('strDescriptionEN', ''),
                'standings': {},  # Will be populated separately if needed
            }
        )
        if created:
            self.stdout.write(f'Created league: {league.name}')
        else:
            self.stdout.write(f'League already exists: {league.name}')

        # Fetch teams for this league
        self.fetch_teams_for_league(league, league_id)

    def fetch_teams_for_league(self, league, league_id):
        teams_url = f'https://www.thesportsdb.com/api/v1/json/3/lookup_all_teams.php?id={league_id}'
        response = requests.get(teams_url)
        if response.status_code != 200:
            self.stdout.write(self.style.ERROR(f'Failed to fetch teams for league {league_id}'))
            return

        teams_data = response.json().get('teams', [])
        for team_info in teams_data:
            team, created = Team.objects.get_or_create(
                name=team_info['strTeam'],
                league=league,
                defaults={
                    'abbreviation': team_info.get('strTeamShort', ''),
                    'description': team_info.get('strDescriptionEN', ''),
                    'roster': [],  # Will be populated with athletes
                    'schedule': [],  # Can be populated separately
                }
            )
            if created:
                self.stdout.write(f'Created team: {team.name}')
                # Fetch athletes for this team
                self.fetch_athletes_for_team(team, team_info['idTeam'])
            else:
                self.stdout.write(f'Team already exists: {team.name}')

    def fetch_athletes_for_team(self, team, team_id):
        athletes_url = f'https://www.thesportsdb.com/api/v1/json/3/lookup_all_players.php?id={team_id}'
        response = requests.get(athletes_url)
        if response.status_code != 200:
            self.stdout.write(self.style.ERROR(f'Failed to fetch athletes for team {team_id}'))
            return

        athletes_data = response.json().get('player', [])
        for athlete_info in athletes_data[:20]:  # Limit to 20 athletes per team to avoid too much data
            # Parse name - API returns full name in strPlayer
            full_name = athlete_info.get('strPlayer', '')
            name_parts = full_name.split(' ', 1)
            first_name = name_parts[0] if name_parts else ''
            last_name = name_parts[1] if len(name_parts) > 1 else ''

            # Use get_or_create with unique constraints, but handle slug conflicts
            try:
                athlete, created = Athlete.objects.get_or_create(
                    first_name=first_name,
                    last_name=last_name,
                    team=team,
                    defaults={
                        'position': athlete_info.get('strPosition', ''),
                        'nationality': athlete_info.get('strNationality', ''),
                        'description': athlete_info.get('strDescriptionEN', ''),
                    }
                )
            except IntegrityError:
                # Skip if athlete already exists (slug conflict)
                continue
            if created:
                self.stdout.write(f'Created athlete: {athlete.full_name}')
            else:
                self.stdout.write(f'Athlete already exists: {athlete.full_name}')