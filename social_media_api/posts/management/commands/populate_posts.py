from django.core.management.base import BaseCommand
from django.utils import timezone
from posts.models import Post
from accounts.models import User
from communities.models import Community
import random


class Command(BaseCommand):
    help = 'Populate the database with sample posts for communities'

    def handle(self, *args, **options):
        # Get users and communities
        users = list(User.objects.all())
        communities = list(Community.objects.all())

        if not users:
            self.stdout.write(self.style.ERROR('No users found. Please create users first.'))
            return

        if not communities:
            self.stdout.write(self.style.ERROR('No communities found. Please create communities first.'))
            return

        # Sample post data for different communities
        post_templates = {
            'NBA Fans United': [
                "Just watched the Lakers game - LeBron is still the GOAT! 🏆",
                "NBA Finals predictions: Who do you think will win this year?",
                "Steph Curry's shooting form is absolutely incredible 🔥",
                "Giannis is dominating the paint like never before!",
                "NBA trade deadline rumors are heating up! 📈",
            ],
            'Premier League Supporters': [
                "Manchester City's attacking football is a joy to watch ⚽",
                "Liverpool's comeback in the last match was incredible!",
                "Premier League title race is so tight this season!",
                "Arsenal's young squad is showing amazing potential 🌟",
                "Tottenham's new manager is bringing fresh energy",
            ],
            'NFL GameDay': [
                "Chiefs defense is absolutely elite this season 🏈",
                "49ers offense is clicking on all cylinders!",
                "Super Bowl predictions: AFC or NFC champion?",
                "NFL MVP race is wide open this year 📊",
                "Monday Night Football was an absolute thriller!",
            ],
            'Soccer World Cup 2026': [
                "World Cup 2026 is going to be absolutely massive! 🌍⚽",
                "Which teams do you think will qualify for the next World Cup?",
                "Messi's legacy will be complete after 2026 🐐",
                "World Cup host cities are going to be incredible",
                "Group stage predictions for 2026 World Cup",
            ],
            'Tennis Champions': [
                "Djokovic's consistency is unmatched in tennis 🎾",
                "Wimbledon finals are always magical to watch",
                "Next gen players like Alcaraz are the future",
                "US Open was an absolute rollercoaster this year",
                "Australian Open predictions for next year",
            ],
            'MLB Diamond Club': [
                "Yankees lineup is stacked this season ⚾",
                "Dodgers pitching staff is unhouchable",
                "World Series predictions: AL vs NL?",
                "MLB trade deadline moves are game-changers",
                "Rookie of the Year race is competitive",
            ],
            'Formula 1 Racing': [
                "F1 sprint races add so much excitement! 🏎️",
                "Mercedes dominance or Red Bull resurgence?",
                "Monaco GP is always the highlight of the season",
                "New F1 regulations are changing everything",
                "Driver championship battle is intense!",
            ],
            'Olympic Athletes': [
                "Olympic spirit brings out the best in athletes 🏅",
                "Paris 2024 Olympics were absolutely spectacular",
                "Winter Olympics showcase incredible athleticism",
                "Olympic records are being shattered every games",
                "Host cities transform for the Olympic magic",
            ],
            'Sports Analytics Hub': [
                "Advanced stats are revolutionizing how we watch sports 📈",
                "Expected goals (xG) analysis is fascinating",
                "Player efficiency metrics tell the real story",
                "Data-driven coaching is the future of sports",
                "Statistical analysis of game strategies",
            ],
            'Women in Sports': [
                "Women's sports are getting the recognition they deserve ♀️",
                "WNBA players are absolute superstars",
                "Women's soccer is growing exponentially",
                "Female athletes breaking barriers every day",
                "Empowerment through sports excellence",
            ],
            'College Sports Nation': [
                "March Madness is the most exciting tournament 🏀",
                "College football rivalries are legendary",
                "NCAA championships showcase incredible talent",
                "Student-athletes balance academics and excellence",
                "College sports create lifelong memories",
            ],
            'Sports Betting Pros': [
                "Responsible betting is key to enjoying sports 🤑",
                "Understanding odds and probabilities",
                "Bankroll management is crucial for long-term success",
                "Value betting vs emotional betting decisions",
                "Sports analytics improve betting accuracy",
            ],
        }

        created_count = 0

        # Create posts for each community
        for community in communities:
            templates = post_templates.get(community.name, [
                f"Exciting discussion in {community.name}!",
                f"What's your take on {community.name}?",
                f"Latest updates from {community.name}",
                f"Community thoughts on {community.name}",
                f"Discussion thread for {community.name}",
            ])

            # Create 3-5 posts per community
            num_posts = random.randint(3, 5)

            for i in range(num_posts):
                # Random user and template
                author = random.choice(users)
                template = random.choice(templates)

                # Add some variation to avoid duplicates
                title = f"{template} #{i+1}"
                content = f"{template}\n\nWhat are your thoughts on this? Let's discuss! 💬"

                post = Post.objects.create(
                    author=author,
                    title=title,
                    content=content,
                    created_at=timezone.now() - timezone.timedelta(
                        days=random.randint(0, 30),
                        hours=random.randint(0, 23),
                        minutes=random.randint(0, 59)
                    )
                )

                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created post in {community.name}: {title[:50]}...')
                )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {created_count} posts across {len(communities)} communities')
        )