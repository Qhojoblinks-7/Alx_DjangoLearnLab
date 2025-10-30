from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from posts.models import Post, Comment, Like, CommentLike
from accounts.models import User
import random

class Command(BaseCommand):
    help = 'Populate the database with dummy data for testing'

    def handle(self, *args, **options):
        self.stdout.write('Creating dummy data...')

        # Create dummy users
        users_data = [
            {'username': 'john_doe', 'email': 'john@example.com'},
            {'username': 'jane_smith', 'email': 'jane@example.com'},
            {'username': 'mike_johnson', 'email': 'mike@example.com'},
            {'username': 'sarah_wilson', 'email': 'sarah@example.com'},
            {'username': 'alex_brown', 'email': 'alex@example.com'},
            {'username': 'emma_davis', 'email': 'emma@example.com'},
            {'username': 'chris_miller', 'email': 'chris@example.com'},
            {'username': 'lisa_garcia', 'email': 'lisa@example.com'},
        ]

        users = []
        for user_data in users_data:
            user, created = User.objects.get_or_create(
                username=user_data['username'],
                defaults={
                    'email': user_data['email'],
                    'first_name': user_data['username'].split('_')[0].title(),
                    'last_name': user_data['username'].split('_')[1].title() if len(user_data['username'].split('_')) > 1 else '',
                }
            )
            if created:
                user.set_password('password123')
                user.save()
                self.stdout.write(f'Created user: {user.username}')
            users.append(user)

        # Create dummy posts with sports content
        posts_data = [
            {
                'title': 'NBA Finals Game 7: Epic Comeback Victory!',
                'content': 'What a game! The Lakers pulled off an incredible comeback in the final quarter. LeBron James was phenomenal with 35 points, 12 rebounds, and 8 assists. The crowd was electric!',
                'author': users[0]
            },
            {
                'title': 'Premier League Transfer News: Big Moves This Window',
                'content': 'The summer transfer window is heating up! Manchester United has agreed a £80m deal for the Brazilian star. Arsenal are also making moves in midfield. What do you think of these transfers?',
                'author': users[1]
            },
            {
                'title': 'NFL Week 1 Preview: Chiefs vs Raiders',
                'content': 'The defending Super Bowl champions take on their division rivals in what promises to be an exciting season opener. Patrick Mahomes looks ready to go!',
                'author': users[2]
            },
            {
                'title': 'Tennis Grand Slam: Wimbledon Championships',
                'content': 'The grass court season is here! Novak Djokovic is looking strong in his quest for another Wimbledon title. The women\'s draw also has some exciting matchups.',
                'author': users[3]
            },
            {
                'title': 'MLB Trade Deadline: Major Deals Announced',
                'content': 'Several blockbuster trades happened before the deadline. The Yankees acquired a power hitter, while the Dodgers bolstered their pitching staff. How will this affect the playoff race?',
                'author': users[4]
            },
            {
                'title': 'Soccer World Cup Qualifying: Key Matches This Week',
                'content': 'Several crucial World Cup qualifying matches are happening this international break. Brazil and Argentina both have tough tests ahead. Who do you think will qualify?',
                'author': users[5]
            },
            {
                'title': 'NHL Stanley Cup Playoffs: Conference Finals Preview',
                'content': 'The NHL playoffs are down to the conference finals. The battle for the Stanley Cup is heating up with some intense matchups. Which team will hoist the Cup?',
                'author': users[6]
            },
            {
                'title': 'Formula 1: Monaco Grand Prix Highlights',
                'content': 'What an incredible race in Monaco! The street circuit always delivers drama, and this year was no exception. The overtake on the final lap was breathtaking.',
                'author': users[7]
            },
            {
                'title': 'College Football: Big Game Weekend Preview',
                'content': 'Several top-ranked teams clash this weekend in college football. The rivalry games always bring out the best in these programs. Who are you picking?',
                'author': users[0]
            },
            {
                'title': 'Olympic Games: Paris 2024 Preparations',
                'content': 'The Paris Olympics are just around the corner! The preparations are in full swing, and the world is excited for another spectacular show. Which events are you most looking forward to?',
                'author': users[1]
            },
            {
                'title': 'Golf: Masters Tournament Recap',
                'content': 'Another legendary Masters tournament has concluded. The champion\'s performance on the back nine was masterful. Augusta National never disappoints!',
                'author': users[2]
            },
            {
                'title': 'Basketball: March Madness Sweet 16',
                'content': 'The NCAA Tournament is down to the Sweet 16! Some incredible upsets and buzzer-beaters have defined this tournament. The Cinderella stories are the best part.',
                'author': users[3]
            },
            {
                'title': 'Cricket: World Cup Semifinals',
                'content': 'The ICC Cricket World Cup semifinals are set! Two epic matchups that will determine who plays in the final. The tournament has been full of surprises.',
                'author': users[4]
            },
            {
                'title': 'Rugby: Six Nations Championship',
                'content': 'The Six Nations is always competitive, and this year is no different. Ireland is looking strong, but England and France are pushing hard. Who will win the title?',
                'author': users[5]
            },
            {
                'title': 'Baseball: Home Run Derby Spectacular',
                'content': 'The Home Run Derby was absolutely incredible! The power display was off the charts. These players are hitting the ball harder than ever before.',
                'author': users[6]
            }
        ]

        posts = []
        for post_data in posts_data:
            post, created = Post.objects.get_or_create(
                title=post_data['title'],
                author=post_data['author'],
                defaults={
                    'content': post_data['content'],
                }
            )
            if created:
                # Randomize the creation time to spread them out
                post.created_at = timezone.now() - timezone.timedelta(
                    days=random.randint(0, 30),
                    hours=random.randint(0, 23),
                    minutes=random.randint(0, 59)
                )
                post.save()
                self.stdout.write(f'Created post: {post.title[:50]}...')
            posts.append(post)

        # Create some comments on posts
        comment_texts = [
            "Great analysis! I completely agree with your take.",
            "This is exactly what I was thinking. Well said!",
            "Interesting perspective. I hadn't considered that angle.",
            "Thanks for sharing this! Really informative content.",
            "Love this post! Keep up the great work.",
            "This made me think differently about the situation.",
            "Excellent breakdown of the key points.",
            "You nailed it! This is spot on.",
            "Really enjoyed reading this. Thanks for posting!",
            "This is gold! So much valuable information here.",
        ]

        for post in posts[:8]:  # Add comments to first 8 posts
            num_comments = random.randint(1, 5)
            for _ in range(num_comments):
                commenter = random.choice(users)
                comment_text = random.choice(comment_texts)

                comment = Comment.objects.create(
                    post=post,
                    author=commenter,
                    content=comment_text
                )

                # Randomize comment time
                comment.created_at = post.created_at + timezone.timedelta(
                    hours=random.randint(1, 48),
                    minutes=random.randint(0, 59)
                )
                comment.save()

        # Create some likes on posts
        for post in posts:
            # Random number of likes (0-8)
            num_likes = random.randint(0, 8)
            likers = random.sample(users, min(num_likes, len(users)))

            for liker in likers:
                Like.objects.get_or_create(
                    user=liker,
                    post=post
                )

        # Create some comment likes
        for comment in Comment.objects.all():
            # Random chance of likes on comments
            if random.random() < 0.3:  # 30% chance
                num_likes = random.randint(1, 3)
                likers = random.sample(users, min(num_likes, len(users)))

                for liker in likers:
                    CommentLike.objects.get_or_create(
                        user=liker,
                        comment=comment
                    )

        self.stdout.write(self.style.SUCCESS('Successfully populated database with dummy data!'))
        self.stdout.write(f'Created {len(users)} users, {len(posts)} posts, and various comments/likes')