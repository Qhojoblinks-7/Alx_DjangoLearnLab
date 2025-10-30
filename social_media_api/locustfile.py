import os
import json
from locust import HttpUser, task, between, SequentialTaskSet
from locust.exception import StopUser
import random
import string


class FeedBrowsingUser(HttpUser):
    """
    Simulates users browsing the feed and interacting with posts.
    """
    wait_time = between(1, 5)  # Wait 1-5 seconds between tasks

    def on_start(self):
        """Setup user session"""
        # Try to login or use anonymous access
        self.token = None
        self.user_id = None

        # For authenticated users, attempt login
        if random.choice([True, False]):  # 50% authenticated users
            self.login()

    def login(self):
        """Attempt to login with test credentials"""
        test_users = [
            {"username": "testuser1", "password": "testpass123"},
            {"username": "testuser2", "password": "testpass123"},
            {"username": "testuser3", "password": "testpass123"},
        ]

        user_creds = random.choice(test_users)

        response = self.client.post("/api/auth/login/", json=user_creds)

        if response.status_code == 200:
            self.token = response.json().get("token")
            self.user_id = response.json().get("user", {}).get("id")

            # Set authorization header for subsequent requests
            if self.token:
                self.client.headers.update({"Authorization": f"Token {self.token}"})

    @task(10)
    def browse_feed(self):
        """Browse the home feed"""
        with self.client.get("/api/feed/home/", catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            elif response.status_code == 429:
                response.success()  # Rate limited, but expected
            else:
                response.failure(f"Feed browse failed: {response.status_code}")

    @task(5)
    def browse_following_feed(self):
        """Browse following feed (authenticated users only)"""
        if not self.token:
            return

        with self.client.get("/api/feed/home/?tab=following", catch_response=True) as response:
            if response.status_code in [200, 429]:
                response.success()
            else:
                response.failure(f"Following feed failed: {response.status_code}")

    @task(3)
    def view_post_detail(self):
        """View a specific post (simulated)"""
        # In a real scenario, you'd get post IDs from the feed
        # For now, just test the endpoint structure
        post_id = random.randint(1, 1000)

        with self.client.get(f"/api/posts/{post_id}/", catch_response=True) as response:
            if response.status_code in [200, 404, 429]:  # 404 is expected for non-existent posts
                response.success()
            else:
                response.failure(f"Post detail failed: {response.status_code}")

    @task(2)
    def search_content(self):
        """Perform search queries"""
        search_terms = [
            "basketball", "football", "nba", "premier league",
            "lebron", "messi", "soccer", "sports"
        ]

        query = random.choice(search_terms)

        with self.client.get(f"/api/search/?q={query}", catch_response=True) as response:
            if response.status_code in [200, 429]:
                response.success()
            else:
                response.failure(f"Search failed: {response.status_code}")

    @task(1)
    def view_trends(self):
        """View trending topics"""
        with self.client.get("/api/trends/", catch_response=True) as response:
            if response.status_code in [200, 429]:
                response.success()
            else:
                response.failure(f"Trends failed: {response.status_code}")


class ContentCreationUser(HttpUser):
    """
    Simulates users creating content (posts, streams).
    Higher wait times to simulate thoughtful content creation.
    """
    wait_time = between(10, 30)  # Longer waits for content creation

    def on_start(self):
        """Setup authenticated user for content creation"""
        self.login()

    def login(self):
        """Login as content creator"""
        response = self.client.post("/api/auth/login/", json={
            "username": "creator1",
            "password": "testpass123"
        })

        if response.status_code == 200:
            self.token = response.json().get("token")
            if self.token:
                self.client.headers.update({"Authorization": f"Token {self.token}"})
        else:
            raise StopUser("Failed to authenticate content creator")

    @task(5)
    def create_post(self):
        """Create a new post"""
        post_content = self.generate_post_content()

        with self.client.post("/api/posts/create/", json={
            "content": post_content,
            "title": f"Test Post {random.randint(1, 1000)}"
        }, catch_response=True) as response:
            if response.status_code == 201:
                response.success()
            elif response.status_code == 429:
                response.success()  # Rate limited
            else:
                response.failure(f"Post creation failed: {response.status_code}")

    @task(1)
    def create_live_stream(self):
        """Create a live stream (rare action)"""
        if random.random() < 0.1:  # Only 10% of content creators start streams
            with self.client.post("/api/live/stream/", json={
                "title": f"Live Stream {random.randint(1, 100)}",
                "description": "Test live stream for load testing"
            }, catch_response=True) as response:
                if response.status_code == 201:
                    response.success()
                elif response.status_code == 429:
                    response.success()  # Rate limited
                else:
                    response.failure(f"Stream creation failed: {response.status_code}")

    @task(2)
    def upload_media_url_request(self):
        """Request upload URL for media (simulates file upload preparation)"""
        with self.client.post("/api/posts/upload-url/", json={
            "file_name": f"test_image_{random.randint(1, 1000)}.jpg",
            "content_type": "image/jpeg"
        }, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            elif response.status_code == 429:
                response.success()  # Rate limited
            else:
                response.failure(f"Upload URL request failed: {response.status_code}")

    def generate_post_content(self):
        """Generate realistic post content"""
        templates = [
            "Just watched an amazing game! The plays were incredible. #sports",
            "Can't believe that last minute goal! What a finish! ⚽",
            "NBA finals are heating up! Who's your pick to win? 🏀",
            "Premier League weekend was intense. So many upsets!",
            "That athletic performance was absolutely spectacular!",
            "Sportsmanship at its finest today. Great game all around.",
            "The crowd was electric! Best atmosphere I've experienced.",
            "Tactical brilliance on display. Chess on the field/court.",
        ]

        return random.choice(templates)


class StreamViewerUser(HttpUser):
    """
    Simulates users watching live streams.
    """
    wait_time = between(5, 15)

    def on_start(self):
        """Setup for stream viewing"""
        if random.choice([True, False]):  # 50% authenticated viewers
            self.login()

    def login(self):
        """Login for authenticated viewing"""
        response = self.client.post("/api/auth/login/", json={
            "username": f"viewer{random.randint(1, 100)}",
            "password": "testpass123"
        })

        if response.status_code == 200:
            self.token = response.json().get("token")
            if self.token:
                self.client.headers.update({"Authorization": f"Token {self.token}"})

    @task(8)
    def view_live_streams(self):
        """Browse available live streams"""
        with self.client.get("/api/live/stream/", catch_response=True) as response:
            if response.status_code in [200, 429]:
                response.success()
            else:
                response.failure(f"Live streams list failed: {response.status_code}")

    @task(5)
    def watch_stream(self):
        """Watch a specific stream"""
        stream_id = random.randint(1, 50)  # Assume some streams exist

        with self.client.get(f"/api/live/stream/watch/{stream_id}/", catch_response=True) as response:
            if response.status_code in [200, 404, 429]:  # 404 expected for non-existent streams
                response.success()
            else:
                response.failure(f"Stream watch failed: {response.status_code}")

    @task(2)
    def view_live_events(self):
        """View live events sidebar"""
        with self.client.get("/api/live/events/", catch_response=True) as response:
            if response.status_code in [200, 429]:
                response.success()
            else:
                response.failure(f"Live events failed: {response.status_code}")


class SearchAndDiscoveryUser(HttpUser):
    """
    Simulates users searching and discovering content.
    """
    wait_time = between(3, 8)

    @task(6)
    def search_users(self):
        """Search for users"""
        usernames = ["john", "mike", "sarah", "alex", "emma", "chris"]

        with self.client.get(f"/api/search/?q={random.choice(usernames)}&type=users", catch_response=True) as response:
            if response.status_code in [200, 429]:
                response.success()
            else:
                response.failure(f"User search failed: {response.status_code}")

    @task(4)
    def search_posts(self):
        """Search for posts"""
        terms = ["basketball", "football", "nba", "goal", "game", "sports"]

        with self.client.get(f"/api/search/?q={random.choice(terms)}&type=posts", catch_response=True) as response:
            if response.status_code in [200, 429]:
                response.success()
            else:
                response.failure(f"Post search failed: {response.status_code}")

    @task(3)
    def browse_leagues(self):
        """Browse sports leagues"""
        with self.client.get("/api/leagues/", catch_response=True) as response:
            if response.status_code in [200, 429]:
                response.success()
            else:
                response.failure(f"Leagues browse failed: {response.status_code}")

    @task(3)
    def browse_teams(self):
        """Browse sports teams"""
        with self.client.get("/api/teams/", catch_response=True) as response:
            if response.status_code in [200, 429]:
                response.success()
            else:
                response.failure(f"Teams browse failed: {response.status_code}")

    @task(2)
    def browse_athletes(self):
        """Browse athletes"""
        with self.client.get("/api/athletes/", catch_response=True) as response:
            if response.status_code in [200, 429]:
                response.success()
            else:
                response.failure(f"Athletes browse failed: {response.status_code}")


# Load testing configuration
# Run with: locust -f locustfile.py --host=http://localhost:8000
#
# Web UI: http://localhost:8089
# Example command: locust -f locustfile.py --host=http://localhost:8000 --users=100 --spawn-rate=10
#
# User distribution:
# - 70% Feed browsing users (most common activity)
# - 15% Content creation users (active creators)
# - 10% Stream viewers (live content consumers)
# - 5% Search/discovery users (explorers)

# For production load testing, adjust these weights based on your expected user behavior