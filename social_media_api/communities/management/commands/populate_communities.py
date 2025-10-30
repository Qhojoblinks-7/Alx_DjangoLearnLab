from django.core.management.base import BaseCommand
from django.utils.text import slugify
from communities.models import Community
from accounts.models import User


class Command(BaseCommand):
    help = 'Populate the database with sample communities'

    def handle(self, *args, **options):
        # Get the first user as owner, or create one if none exists
        try:
            owner = User.objects.first()
            if not owner:
                owner = User.objects.create_user(
                    username='admin',
                    email='admin@sportisode.com',
                    password='admin123',
                    first_name='Admin',
                    last_name='User'
                )
                self.stdout.write(self.style.SUCCESS(f'Created admin user: {owner.username}'))
        except User.DoesNotExist:
            owner = User.objects.create_user(
                username='admin',
                email='admin@sportisode.com',
                password='admin123',
                first_name='Admin',
                last_name='User'
            )
            self.stdout.write(self.style.SUCCESS(f'Created admin user: {owner.username}'))

        # Sample communities data
        communities_data = [
            {
                'name': 'NBA Fans United',
                'description': 'A community for passionate NBA fans to discuss games, players, and basketball culture.',
                'is_private': False,
                'allow_posting': True,
            },
            {
                'name': 'Premier League Supporters',
                'description': 'Connect with fellow Premier League fans. Share match predictions, player analysis, and celebrate victories together.',
                'is_private': False,
                'allow_posting': True,
            },
            {
                'name': 'NFL GameDay',
                'description': 'Your go-to community for NFL discussions, game breakdowns, and fantasy football talk.',
                'is_private': False,
                'allow_posting': True,
            },
            {
                'name': 'Soccer World Cup 2026',
                'description': 'Get ready for the 2026 World Cup! Discuss qualifying matches, team selections, and tournament predictions.',
                'is_private': False,
                'allow_posting': True,
            },
            {
                'name': 'Tennis Champions',
                'description': 'Elite tennis community for Grand Slam discussions, player rankings, and tournament analysis.',
                'is_private': False,
                'allow_posting': True,
            },
            {
                'name': 'MLB Diamond Club',
                'description': 'America\'s pastime community. Discuss MLB teams, players, trades, and the pennant race.',
                'is_private': False,
                'allow_posting': True,
            },
            {
                'name': 'Formula 1 Racing',
                'description': 'High-speed community for F1 fans. Discuss races, drivers, teams, and the latest in motorsport.',
                'is_private': False,
                'allow_posting': True,
            },
            {
                'name': 'Olympic Athletes',
                'description': 'Celebrating Olympic excellence. Share stories of athletic achievement and Olympic dreams.',
                'is_private': False,
                'allow_posting': True,
            },
            {
                'name': 'Sports Analytics Hub',
                'description': 'Data-driven sports discussions. Advanced stats, performance analysis, and predictive modeling.',
                'is_private': False,
                'allow_posting': True,
            },
            {
                'name': 'Women in Sports',
                'description': 'Empowering female athletes and celebrating women\'s sports achievements across all disciplines.',
                'is_private': False,
                'allow_posting': True,
            },
            {
                'name': 'College Sports Nation',
                'description': 'NCAA sports community covering football, basketball, and all college athletics.',
                'is_private': False,
                'allow_posting': True,
            },
            {
                'name': 'Sports Betting Pros',
                'description': 'Responsible sports betting discussions, odds analysis, and betting strategies.',
                'is_private': True,  # Private community
                'allow_posting': True,
            },
        ]

        created_count = 0
        for community_data in communities_data:
            community, created = Community.objects.get_or_create(
                slug=slugify(community_data['name']),
                defaults={
                    'name': community_data['name'],
                    'description': community_data['description'],
                    'owner': owner,
                    'is_private': community_data['is_private'],
                    'allow_posting': community_data['allow_posting'],
                }
            )

            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created community: {community.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Community already exists: {community.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {created_count} communities')
        )