from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse

User = get_user_model()


class UserBlockMuteTestCase(APITestCase):
    """Test cases for user block and mute functionality"""

    def setUp(self):
        """Set up test users"""
        self.user1 = User.objects.create_user(
            username='user1',
            email='user1@test.com',
            password='password123'
        )
        self.user2 = User.objects.create_user(
            username='user2',
            email='user2@test.com',
            password='password123'
        )
        self.user3 = User.objects.create_user(
            username='user3',
            email='user3@test.com',
            password='password123'
        )

    def test_block_user(self):
        """Test blocking a user"""
        self.client.force_authenticate(user=self.user1)

        # Block user2
        url = reverse('accounts:profile-block', kwargs={'username': 'user2'})
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(self.user1.blocked_users.filter(id=self.user2.id).exists())
        self.assertEqual(response.data['status'], 'blocked')
        self.assertTrue(response.data['is_blocked'])

    def test_unblock_user(self):
        """Test unblocking a user"""
        # First block the user
        self.user1.blocked_users.add(self.user2)
        self.client.force_authenticate(user=self.user1)

        # Unblock user2
        url = reverse('accounts:profile-block', kwargs={'username': 'user2'})
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(self.user1.blocked_users.filter(id=self.user2.id).exists())
        self.assertEqual(response.data['status'], 'unblocked')
        self.assertFalse(response.data['is_blocked'])

    def test_mute_user(self):
        """Test muting a user"""
        self.client.force_authenticate(user=self.user1)

        # Mute user2
        url = reverse('accounts:profile-mute', kwargs={'username': 'user2'})
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(self.user1.muted_users.filter(id=self.user2.id).exists())
        self.assertEqual(response.data['status'], 'muted')
        self.assertTrue(response.data['is_muted'])

    def test_unmute_user(self):
        """Test unmuting a user"""
        # First mute the user
        self.user1.muted_users.add(self.user2)
        self.client.force_authenticate(user=self.user1)

        # Unmute user2
        url = reverse('accounts:profile-mute', kwargs={'username': 'user2'})
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(self.user1.muted_users.filter(id=self.user2.id).exists())
        self.assertEqual(response.data['status'], 'unmuted')
        self.assertFalse(response.data['is_muted'])

    def test_cannot_block_self(self):
        """Test that users cannot block themselves"""
        self.client.force_authenticate(user=self.user1)

        url = reverse('accounts:profile-block', kwargs={'username': 'user1'})
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('You cannot block yourself', response.data['error'])

    def test_cannot_mute_self(self):
        """Test that users cannot mute themselves"""
        self.client.force_authenticate(user=self.user1)

        url = reverse('accounts:profile-mute', kwargs={'username': 'user1'})
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('You cannot mute yourself', response.data['error'])

    def test_block_removes_follow(self):
        """Test that blocking a user also unfollows them"""
        # First follow user2
        self.user1.followers.add(self.user2)
        self.assertTrue(self.user1.followers.filter(id=self.user2.id).exists())

        self.client.force_authenticate(user=self.user1)

        # Block user2
        url = reverse('accounts:profile-block', kwargs={'username': 'user2'})
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should be blocked and unfollowed
        self.assertTrue(self.user1.blocked_users.filter(id=self.user2.id).exists())
        self.assertFalse(self.user1.followers.filter(id=self.user2.id).exists())

    def test_user_serializer_includes_block_mute_status(self):
        """Test that UserSerializer includes is_blocked and is_muted fields"""
        # Block and mute user2 from user1's perspective
        self.user1.blocked_users.add(self.user2)
        self.user1.muted_users.add(self.user3)

        self.client.force_authenticate(user=self.user1)

        # Get user2's profile
        url = reverse('accounts:user-profile', kwargs={'username': 'user2'})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_blocked'])
        self.assertFalse(response.data['is_muted'])  # user2 is not muted

        # Get user3's profile
        url = reverse('accounts:user-profile', kwargs={'username': 'user3'})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_blocked'])  # user3 is not blocked
        self.assertTrue(response.data['is_muted'])

    def test_unauthenticated_cannot_block_mute(self):
        """Test that unauthenticated users cannot block or mute"""
        url = reverse('accounts:profile-block', kwargs={'username': 'user2'})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        url = reverse('accounts:profile-mute', kwargs={'username': 'user2'})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
