from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from .models import Post

User = get_user_model()


class SearchTestCase(APITestCase):
    """Test cases for search functionality"""

    def setUp(self):
        """Set up test users and posts"""
        self.user1 = User.objects.create_user(
            username='user1',
            email='user1@test.com',
            password='password123',
            bio='I love basketball'
        )
        self.user2 = User.objects.create_user(
            username='user2',
            email='user2@test.com',
            password='password123',
            bio='Football fan'
        )
        self.user3 = User.objects.create_user(
            username='user3',
            email='user3@test.com',
            password='password123',
            first_name='John',
            last_name='Doe'
        )

        # Create test posts
        self.post1 = Post.objects.create(
            author=self.user1,
            title='NBA Finals',
            content='The Lakers won the championship!'
        )
        self.post2 = Post.objects.create(
            author=self.user2,
            title='Football Match',
            content='Amazing game last night'
        )
        self.post3 = Post.objects.create(
            author=self.user3,
            title='Sports News',
            content='Breaking news in sports world'
        )

    def test_unified_search_all_types(self):
        """Test unified search across all content types"""
        response = self.client.get(reverse('search'), {'q': 'basketball'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertIn('total', response.data)
        self.assertIn('query', response.data)
        self.assertEqual(response.data['query'], 'basketball')
        self.assertEqual(response.data['type'], 'all')

        # Should find user1 in users section
        self.assertIn('users', response.data['results'])
        self.assertGreater(len(response.data['results']['users']), 0)

    def test_search_users(self):
        """Test searching for users"""
        response = self.client.get(reverse('search'), {'q': 'user1', 'type': 'users'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertGreater(len(response.data['results']), 0)

        # Check that user1 is in results
        usernames = [user['username'] for user in response.data['results']]
        self.assertIn('user1', usernames)

    def test_search_users_by_name(self):
        """Test searching users by first/last name"""
        response = self.client.get(reverse('search'), {'q': 'John', 'type': 'users'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['results']), 0)

        # Should find user3
        usernames = [user['username'] for user in response.data['results']]
        self.assertIn('user3', usernames)

    def test_search_posts(self):
        """Test searching for posts"""
        response = self.client.get(reverse('search'), {'q': 'Lakers', 'type': 'posts'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertGreater(len(response.data['results']), 0)

        # Check that post1 is in results
        post_ids = [post['id'] for post in response.data['results']]
        self.assertIn(self.post1.id, post_ids)

    def test_search_posts_by_hashtag(self):
        """Test searching posts by hashtag"""
        # Create a post with hashtag
        post_with_hashtag = Post.objects.create(
            author=self.user1,
            title='Hashtag Test',
            content='Check out #NBA finals!'
        )

        response = self.client.get(reverse('search'), {'q': 'NBA', 'type': 'posts'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['results']), 0)

        # Should find the post with hashtag
        post_ids = [post['id'] for post in response.data['results']]
        self.assertIn(post_with_hashtag.id, post_ids)

    def test_search_sports_entities_leagues(self):
        """Test searching for leagues"""
        response = self.client.get(reverse('search'), {'q': 'NBA', 'type': 'leagues'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertGreater(len(response.data['results']), 0)

        # Should find NBA league
        league_names = [league['name'] for league in response.data['results']]
        self.assertIn('NBA', league_names)

    def test_search_sports_entities_teams(self):
        """Test searching for teams"""
        response = self.client.get(reverse('search'), {'q': 'Lakers', 'type': 'teams'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertGreater(len(response.data['results']), 0)

        # Should find Lakers team
        team_names = [team['name'] for team in response.data['results']]
        self.assertIn('Los Angeles Lakers', team_names)

    def test_search_sports_entities_athletes(self):
        """Test searching for athletes"""
        response = self.client.get(reverse('search'), {'q': 'LeBron', 'type': 'athletes'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertGreater(len(response.data['results']), 0)

        # Should find LeBron James
        athlete_names = [f"{athlete['first_name']} {athlete['last_name']}" for athlete in response.data['results']]
        self.assertIn('LeBron James', athlete_names)

    def test_contextual_search_messaging(self):
        """Test contextual search for messaging"""
        self.client.force_authenticate(user=self.user1)

        # Follow user2 for messaging context
        self.user1.followers.add(self.user2)

        response = self.client.get(reverse('search-context'), {'q': 'user2', 'context': 'messaging'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertEqual(response.data['context'], 'messaging')

        # Should find user2
        usernames = [user['username'] for user in response.data['results']]
        self.assertIn('user2', usernames)

    def test_empty_search_query(self):
        """Test search with empty query"""
        response = self.client.get(reverse('search'), {'q': ''})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 0)
        self.assertEqual(response.data['total'], 0)

    def test_invalid_search_type(self):
        """Test search with invalid type"""
        response = self.client.get(reverse('search'), {'q': 'test', 'type': 'invalid'})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_search_respects_blocks(self):
        """Test that search excludes blocked users"""
        self.client.force_authenticate(user=self.user1)

        # user1 blocks user2
        self.user1.blocked_users.add(self.user2)

        response = self.client.get(reverse('search'), {'q': 'user2', 'type': 'users'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should not find user2 in results
        usernames = [user['username'] for user in response.data['results']]
        self.assertNotIn('user2', usernames)

    def test_search_respects_mutes(self):
        """Test that search excludes muted users"""
        self.client.force_authenticate(user=self.user1)

        # user1 mutes user3
        self.user1.muted_users.add(self.user3)

        response = self.client.get(reverse('search'), {'q': 'John', 'type': 'users'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should not find user3 in results
        usernames = [user['username'] for user in response.data['results']]
        self.assertNotIn('user3', usernames)
