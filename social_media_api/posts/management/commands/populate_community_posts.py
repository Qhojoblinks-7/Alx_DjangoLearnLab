from django.core.management.base import BaseCommand
from django.utils import timezone
from posts.models import Post
from accounts.models import User
from communities.models import Community
import random


class Command(BaseCommand):
    help = 'Populate the database with community-specific posts'

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

        # Community-specific post templates
        community_posts = {
            'NBA Fans United': [
                "The Lakers are looking unstoppable this season!",
                "Steph Curry's shooting is absolutely incredible",
                "Giannis is dominating the paint like never before",
                "NBA Finals predictions: Who will win it all?",
                "LeBron James is still the GOAT at 38 years old",
                "The Warriors need to rebuild around young talent",
                "Kevin Durant is having an MVP-caliber season",
                "Boston Celtics are the team to beat in the East",
            ],
            'Premier League Supporters': [
                "Manchester City's attacking football is a joy to watch",
                "Liverpool's defense has been rock solid this season",
                "Arsenal's young squad shows incredible potential",
                "Tottenham needs to find consistency in their play",
                "Chelsea's transfer strategy is paying dividends",
                "Manchester United needs to invest in youth development",
                "Newcastle United has become a Premier League powerhouse",
                "Premier League title race is incredibly tight",
            ],
            'NFL GameDay': [
                "Chiefs defense is absolutely elite this year",
                "49ers offense is clicking on all cylinders",
                "Super Bowl predictions: AFC vs NFC champion?",
                "NFL MVP race is wide open this season",
                "Monday Night Football was an absolute thriller",
                "The Eagles are showing championship form",
                "Buccaneers defense is one of the best in the league",
                "Cowboys need to find their identity this season",
            ],
            'Soccer World Cup 2026': [
                "World Cup 2026 is going to be absolutely massive",
                "Which teams will qualify for the next World Cup?",
                "Messi's legacy will be complete after 2026",
                "World Cup host cities are going to be incredible",
                "Group stage predictions for 2026 World Cup",
                "Brazil's squad depth is unmatched",
                "Argentina's golden generation peaks in 2026",
                "Germany needs to rebuild for the next cycle",
            ],
            'Tennis Champions': [
                "Djokovic's consistency is unmatched in tennis",
                "Wimbledon finals are always magical to watch",
                "Next gen players like Alcaraz are the future",
                "US Open was an absolute rollercoaster this year",
                "Australian Open predictions for next year",
                "Federer and Nadal have changed tennis forever",
                "Women's tennis is incredibly competitive",
                "Grass court season brings out the best in players",
            ],
            'MLB Diamond Club': [
                "Yankees lineup is stacked this season",
                "Dodgers pitching staff is unhouchable",
                "World Series predictions: AL vs NL?",
                "MLB trade deadline moves are game-changers",
                "Rookie of the Year race is competitive",
                "The Astros are showing championship form",
                "Mets need to rebuild around young talent",
                "Phillies are a serious World Series contender",
            ],
            'Formula 1 Racing': [
                "F1 sprint races add so much excitement",
                "Mercedes dominance or Red Bull resurgence?",
                "Monaco GP is always the highlight of the season",
                "New F1 regulations are changing everything",
                "Driver championship battle is intense",
                "Ferrari needs to find their form quickly",
                "McLaren's resurgence has been impressive",
                "Technical innovations are revolutionizing F1",
            ],
            'Olympic Athletes': [
                "Olympic spirit brings out the best in athletes",
                "Paris 2024 Olympics were absolutely spectacular",
                "Winter Olympics showcase incredible athleticism",
                "Olympic records are being shattered every games",
                "Host cities transform for the Olympic magic",
                "Team USA is always a powerhouse",
                "Small nations punching above their weight",
                "Olympic village creates lifelong friendships",
            ],
            'Sports Analytics Hub': [
                "Advanced stats are revolutionizing sports analysis",
                "Expected goals (xG) analysis is fascinating",
                "Player efficiency metrics tell the real story",
                "Data-driven coaching is the future of sports",
                "Statistical analysis of game strategies",
                "Predictive modeling is getting incredibly accurate",
                "Sports betting analytics are highly sophisticated",
                "Performance tracking technology is advancing rapidly",
            ],
            'Women in Sports': [
                "Women's sports are getting the recognition they deserve",
                "WNBA players are absolute superstars",
                "Women's soccer is growing exponentially",
                "Female athletes breaking barriers every day",
                "Empowerment through sports excellence",
                "Title IX has transformed women's athletics",
                "More coverage means more opportunities",
                "Women's sports inspire the next generation",
            ],
            'College Sports Nation': [
                "March Madness is the most exciting tournament",
                "College football rivalries are legendary",
                "NCAA championships showcase incredible talent",
                "Student-athletes balance academics and excellence",
                "College sports create lifelong memories",
                "Conference realignment is changing everything",
                "NIL deals are transforming college athletics",
                "The transfer portal has increased competition",
            ],
            'Sports Betting Pros': [
                "Responsible betting is key to enjoying sports",
                "Understanding odds and probabilities",
                "Bankroll management is crucial for long-term success",
                "Value betting vs emotional betting decisions",
                "Sports analytics improve betting accuracy",
                "Line movement analysis is an art form",
                "Injury reports can make or break bets",
                "Weather conditions affect outcomes significantly",
            ],
        }

        created_count = 0

        # Create community-specific posts
        for community in communities:
            templates = community_posts.get(community.name, [
                f"Exciting discussion in {community.name}!",
                f"What's your take on {community.name}?",
                f"Latest updates from {community.name}",
                f"Community thoughts on {community.name}",
                f"Discussion thread for {community.name}",
            ])

            # Create 8-12 posts per community
            num_posts = random.randint(8, 12)

            for i in range(num_posts):
                # Random user
                author = random.choice(users)

                # Random template
                template = random.choice(templates)

                # Create unique title and content
                title = f"{template} #{i+1}"
                content = f"{template}\n\nWhat are your thoughts on this? Let's discuss! 💬\n\n#{community.slug.replace('-', '')}"

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
                    self.style.SUCCESS(f'Created post in {community.name}: {title[:40]}...')
                )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {created_count} community-specific posts')
        )