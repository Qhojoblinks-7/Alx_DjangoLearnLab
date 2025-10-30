from django.core.management.base import BaseCommand
from django.utils import timezone
from posts.models import League, Team, Athlete
from datetime import date


class Command(BaseCommand):
    help = 'Populate sports database with dummy data'

    def handle(self, *args, **options):
        self.stdout.write('Populating sports data...')

        # Create Leagues
        leagues_data = [
            {
                'name': 'National Basketball Association',
                'slug': 'nba-basketball',
                'description': 'The premier professional basketball league in North America featuring 30 teams across the United States and Canada.',
                'sport': 'Basketball',
                'country': 'United States',
                'logo_url': 'https://example.com/nba-logo.png',
                'website_url': 'https://www.nba.com',
                'season_start': date(2024, 10, 22),
                'season_end': date(2025, 6, 15),
            },
            {
                'name': 'English Premier League',
                'slug': 'premier-league',
                'description': 'The top tier of English football featuring 20 clubs competing for the Premier League title.',
                'sport': 'Soccer',
                'country': 'England',
                'logo_url': 'https://example.com/epl-logo.png',
                'website_url': 'https://www.premierleague.com',
                'season_start': date(2024, 8, 17),
                'season_end': date(2025, 5, 25),
            },
            {
                'name': 'National Football League',
                'slug': 'nfl-football',
                'description': 'The premier professional American football league in the United States.',
                'sport': 'American Football',
                'country': 'United States',
                'logo_url': 'https://example.com/nfl-logo.png',
                'website_url': 'https://www.nfl.com',
                'season_start': date(2024, 9, 5),
                'season_end': date(2025, 2, 9),
            },
            {
                'name': 'Major League Baseball',
                'slug': 'mlb-baseball',
                'description': 'The premier professional baseball league in North America.',
                'sport': 'Baseball',
                'country': 'United States',
                'logo_url': 'https://example.com/mlb-logo.png',
                'website_url': 'https://www.mlb.com',
                'season_start': date(2024, 3, 28),
                'season_end': date(2024, 10, 30),
            },
        ]

        leagues = {}
        for league_data in leagues_data:
            league, created = League.objects.get_or_create(
                slug=league_data['slug'],
                defaults=league_data
            )
            leagues[league.slug] = league
            if created:
                self.stdout.write(f'Created league: {league.name}')

        # Create Teams
        teams_data = [
            # NBA Teams
            {
                'name': 'Los Angeles Lakers',
                'slug': 'la-lakers',
                'abbreviation': 'LAL',
                'sport': 'Basketball',
                'league': leagues['nba-basketball'],
                'city': 'Los Angeles',
                'country': 'United States',
                'stadium': 'Crypto.com Arena',
                'founded_year': 1947,
                'logo_url': 'https://example.com/lakers-logo.png',
                'website_url': 'https://www.nba.com/lakers',
            },
            {
                'name': 'Golden State Warriors',
                'slug': 'golden-state-warriors',
                'abbreviation': 'GSW',
                'sport': 'Basketball',
                'league': leagues['nba-basketball'],
                'city': 'San Francisco',
                'country': 'United States',
                'stadium': 'Chase Center',
                'founded_year': 1946,
                'logo_url': 'https://example.com/warriors-logo.png',
                'website_url': 'https://www.nba.com/warriors',
            },
            {
                'name': 'Boston Celtics',
                'slug': 'boston-celtics',
                'abbreviation': 'BOS',
                'sport': 'Basketball',
                'league': leagues['nba-basketball'],
                'city': 'Boston',
                'country': 'United States',
                'stadium': 'TD Garden',
                'founded_year': 1946,
                'logo_url': 'https://example.com/celtics-logo.png',
                'website_url': 'https://www.nba.com/celtics',
            },
            # Premier League Teams
            {
                'name': 'Manchester City',
                'slug': 'manchester-city',
                'abbreviation': 'MCI',
                'sport': 'Soccer',
                'league': leagues['premier-league'],
                'city': 'Manchester',
                'country': 'England',
                'stadium': 'Etihad Stadium',
                'founded_year': 1880,
                'logo_url': 'https://example.com/city-logo.png',
                'website_url': 'https://www.mancity.com',
            },
            {
                'name': 'Liverpool FC',
                'slug': 'liverpool-fc',
                'abbreviation': 'LIV',
                'sport': 'Soccer',
                'league': leagues['premier-league'],
                'city': 'Liverpool',
                'country': 'England',
                'stadium': 'Anfield',
                'founded_year': 1892,
                'logo_url': 'https://example.com/liverpool-logo.png',
                'website_url': 'https://www.liverpoolfc.com',
            },
            # NFL Teams
            {
                'name': 'Kansas City Chiefs',
                'slug': 'kansas-city-chiefs',
                'abbreviation': 'KC',
                'sport': 'American Football',
                'league': leagues['nfl-football'],
                'city': 'Kansas City',
                'country': 'United States',
                'stadium': 'Arrowhead Stadium',
                'founded_year': 1960,
                'logo_url': 'https://example.com/chiefs-logo.png',
                'website_url': 'https://www.chiefs.com',
            },
            {
                'name': 'San Francisco 49ers',
                'slug': 'san-francisco-49ers',
                'abbreviation': 'SF',
                'sport': 'American Football',
                'league': leagues['nfl-football'],
                'city': 'Santa Clara',
                'country': 'United States',
                'stadium': 'Levis Stadium',
                'founded_year': 1946,
                'logo_url': 'https://example.com/49ers-logo.png',
                'website_url': 'https://www.49ers.com',
            },
            # MLB Teams
            {
                'name': 'Los Angeles Dodgers',
                'slug': 'los-angeles-dodgers',
                'abbreviation': 'LAD',
                'sport': 'Baseball',
                'league': leagues['mlb-baseball'],
                'city': 'Los Angeles',
                'country': 'United States',
                'stadium': 'Dodger Stadium',
                'founded_year': 1883,
                'logo_url': 'https://example.com/dodgers-logo.png',
                'website_url': 'https://www.dodgers.com',
            },
        ]

        teams = {}
        for team_data in teams_data:
            team, created = Team.objects.get_or_create(
                slug=team_data['slug'],
                defaults=team_data
            )
            teams[team.slug] = team
            if created:
                self.stdout.write(f'Created team: {team.name}')

        # Create Athletes
        athletes_data = [
            {
                'first_name': 'LeBron',
                'last_name': 'James',
                'slug': 'lebron-james',
                'position': 'Small Forward',
                'sport': 'Basketball',
                'team': teams['la-lakers'],
                'country': 'United States',
                'birth_date': date(1984, 12, 30),
                'height_cm': 206,
                'weight_kg': 113,
                'photo_url': 'https://example.com/lebron-photo.jpg',
                'career_stats': {
                    'points': 38652,
                    'rebounds': 11247,
                    'assists': 11206,
                    'championships': 4,
                    'mvps': 4,
                },
                'achievements': ['4x NBA Champion', '4x NBA MVP', '4x Finals MVP', 'GOAT'],
            },
            {
                'first_name': 'Stephen',
                'last_name': 'Curry',
                'slug': 'stephen-curry',
                'position': 'Point Guard',
                'sport': 'Basketball',
                'team': teams['golden-state-warriors'],
                'country': 'United States',
                'birth_date': date(1988, 3, 14),
                'height_cm': 191,
                'weight_kg': 84,
                'photo_url': 'https://example.com/curry-photo.jpg',
                'career_stats': {
                    'points': 26153,
                    'three_pointers': 4977,
                    'assists': 7425,
                    'championships': 4,
                },
                'achievements': ['4x NBA Champion', '2x NBA MVP', 'NBA Scoring Champion'],
            },
            {
                'first_name': 'Kevin',
                'last_name': 'Durant',
                'slug': 'kevin-durant',
                'position': 'Small Forward',
                'sport': 'Basketball',
                'team': teams['golden-state-warriors'],
                'country': 'United States',
                'birth_date': date(1988, 9, 29),
                'height_cm': 211,
                'weight_kg': 109,
                'photo_url': 'https://example.com/durant-photo.jpg',
                'career_stats': {
                    'points': 29137,
                    'rebounds': 12748,
                    'assists': 4719,
                    'championships': 2,
                },
                'achievements': ['2x NBA Champion', 'NBA MVP', 'NBA Scoring Champion'],
            },
            {
                'first_name': 'Lionel',
                'last_name': 'Messi',
                'slug': 'lionel-messi',
                'position': 'Forward',
                'sport': 'Soccer',
                'team': teams['manchester-city'],
                'country': 'Argentina',
                'birth_date': date(1987, 6, 24),
                'height_cm': 170,
                'weight_kg': 72,
                'photo_url': 'https://example.com/messi-photo.jpg',
                'career_stats': {
                    'goals': 750,
                    'assists': 350,
                    'ballon_dor': 8,
                },
                'achievements': ['8x Ballon d\'Or', 'World Cup Winner', '4x Champions League'],
            },
            {
                'first_name': 'Cristiano',
                'last_name': 'Ronaldo',
                'slug': 'cristiano-ronaldo',
                'position': 'Forward',
                'sport': 'Soccer',
                'team': teams['manchester-city'],
                'country': 'Portugal',
                'birth_date': date(1985, 2, 5),
                'height_cm': 187,
                'weight_kg': 83,
                'photo_url': 'https://example.com/ronaldo-photo.jpg',
                'career_stats': {
                    'goals': 1024,
                    'assists': 239,
                    'ballon_dor': 5,
                },
                'achievements': ['5x Ballon d\'Or', '5x Champions League', 'Euro Winner'],
            },
            {
                'first_name': 'Patrick',
                'last_name': 'Mahomes',
                'slug': 'patrick-mahomes',
                'position': 'Quarterback',
                'sport': 'American Football',
                'team': teams['kansas-city-chiefs'],
                'country': 'United States',
                'birth_date': date(1995, 9, 17),
                'height_cm': 188,
                'weight_kg': 104,
                'photo_url': 'https://example.com/mahomes-photo.jpg',
                'career_stats': {
                    'passing_yards': 43359,
                    'touchdowns': 300,
                    'super_bowls': 2,
                },
                'achievements': ['2x Super Bowl Winner', '2x Super Bowl MVP', 'NFL MVP'],
            },
            {
                'first_name': 'Shohei',
                'last_name': 'Ohtani',
                'slug': 'shohei-ohtani',
                'position': 'Pitcher/Designated Hitter',
                'sport': 'Baseball',
                'team': teams['los-angeles-dodgers'],
                'country': 'Japan',
                'birth_date': date(1994, 7, 5),
                'height_cm': 193,
                'weight_kg': 95,
                'photo_url': 'https://example.com/ohtani-photo.jpg',
                'career_stats': {
                    'home_runs': 217,
                    'strikeouts': 1388,
                    'era': 3.01,
                },
                'achievements': ['AL MVP', 'AL Home Run Leader', 'Perfect Game'],
            },
        ]

        for athlete_data in athletes_data:
            athlete, created = Athlete.objects.get_or_create(
                slug=athlete_data['slug'],
                defaults=athlete_data
            )
            if created:
                self.stdout.write(f'Created athlete: {athlete.full_name}')

        self.stdout.write(self.style.SUCCESS('Successfully populated sports database with dummy data'))