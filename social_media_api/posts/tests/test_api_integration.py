import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from unittest.mock import patch, MagicMock
from rest_framework.test import APITestCase
from rest_framework import status

from posts.models import Post, MediaFile
from posts.views import GetUploadURLView


class UploadURLAPITest(APITestCase):
    """Test the upload URL generation API"""

    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

    @patch('posts.s3_utils.boto3.client')
    def test_get_upload_url_success(self, mock_boto3):
        """Test successful upload URL generation"""
        mock_client = MagicMock()
        mock_boto3.return_value = mock_client
        mock_client.generate_presigned_url.return_value = "https://presigned-upload-url"

        url = '/api/posts/upload-url/'
        data = {
            'file_name': 'test-image.jpg',
            'content_type': 'image/jpeg'
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('upload_url', response.data)
        self.assertIn('key', response.data)
        self.assertEqual(response.data['upload_url'], "https://presigned-upload-url")

        # Verify the key follows expected pattern
        self.assertIn('uploads/', response.data['key'])
        self.assertIn(str(self.user.id), response.data['key'])
        self.assertTrue(response.data['key'].endswith('.jpg'))

    def test_get_upload_url_unauthenticated(self):
        """Test upload URL generation requires authentication"""
        self.client.force_authenticate(user=None)

        url = '/api/posts/upload-url/'
        data = {
            'file_name': 'test.jpg',
            'content_type': 'image/jpeg'
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_upload_url_missing_params(self):
        """Test upload URL generation with missing parameters"""
        url = '/api/posts/upload-url/'

        # Missing file_name
        data = {'content_type': 'image/jpeg'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Missing content_type
        data = {'file_name': 'test.jpg'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_upload_url_invalid_content_type(self):
        """Test upload URL generation with invalid content type"""
        url = '/api/posts/upload-url/'
        data = {
            'file_name': 'test.exe',
            'content_type': 'application/x-msdownload'
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch('posts.s3_utils.boto3.client')
    def test_get_upload_url_s3_failure(self, mock_boto3):
        """Test upload URL generation when S3 fails"""
        mock_client = MagicMock()
        mock_boto3.return_value = mock_client
        mock_client.generate_presigned_url.return_value = None  # Simulate failure

        url = '/api/posts/upload-url/'
        data = {
            'file_name': 'test.jpg',
            'content_type': 'image/jpeg'
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)


class PostCreationAPITest(APITestCase):
    """Test post creation with S3 media keys"""

    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

    def test_create_post_with_s3_keys(self):
        """Test successful post creation with S3 media keys"""
        url = '/api/posts/create/'
        data = {
            'content': 'Test post with media',
            'media_keys': ['uploads/1/uuid1.jpg', 'uploads/1/uuid2.mp4']
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify post was created
        post = Post.objects.get(id=response.data['id'])
        self.assertEqual(post.content, 'Test post with media')
        self.assertEqual(post.author, self.user)

        # Verify media files were created
        media_files = MediaFile.objects.filter(post=post)
        self.assertEqual(media_files.count(), 2)

        # Check media file properties
        image_media = media_files.filter(file_name__endswith='.jpg').first()
        video_media = media_files.filter(file_name__endswith='.mp4').first()

        self.assertIsNotNone(image_media)
        self.assertIsNotNone(video_media)
        self.assertEqual(image_media.media_type, 'image')
        self.assertEqual(video_media.media_type, 'video')

    def test_create_post_empty_content_with_media(self):
        """Test post creation with media but no content"""
        url = '/api/posts/create/'
        data = {
            'content': '',
            'media_keys': ['uploads/1/uuid1.jpg']
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_post_empty_content_no_media(self):
        """Test post creation with no content and no media fails"""
        url = '/api/posts/create/'
        data = {
            'content': '',
            'media_keys': []
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_post_content_too_long(self):
        """Test post creation with content exceeding max length"""
        url = '/api/posts/create/'
        long_content = 'x' * 301  # Max is 300
        data = {
            'content': long_content,
            'media_keys': []
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_post_too_many_media_files(self):
        """Test post creation with too many media files"""
        url = '/api/posts/create/'
        media_keys = [f'uploads/1/uuid{i}.jpg' for i in range(5)]  # Max is 4
        data = {
            'content': 'Test post',
            'media_keys': media_keys
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_post_invalid_s3_key(self):
        """Test post creation with invalid S3 key format"""
        url = '/api/posts/create/'
        data = {
            'content': 'Test post',
            'media_keys': ['invalid-key-format']
        }

        response = self.client.post(url, data, format='json')
        # Should still succeed but skip invalid media
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify no media files were created for invalid key
        post = Post.objects.get(id=response.data['id'])
        media_files = MediaFile.objects.filter(post=post)
        self.assertEqual(media_files.count(), 0)

    @patch('posts.tasks.process_image_file.delay')
    @patch('posts.tasks.process_video_file.delay')
    def test_create_post_triggers_processing_tasks(self, mock_video_task, mock_image_task):
        """Test that media processing tasks are triggered"""
        url = '/api/posts/create/'
        data = {
            'content': 'Test post',
            'media_keys': ['uploads/1/uuid1.jpg', 'uploads/1/uuid2.mp4']
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify processing tasks were called
        self.assertEqual(mock_image_task.call_count, 1)
        self.assertEqual(mock_video_task.call_count, 1)

        # Verify tasks were called with correct arguments (media_file_id, s3_key)
        mock_image_task.assert_called_once()
        mock_video_task.assert_called_once()

        # Check that the call includes the S3 key as second argument
        image_call_args = mock_image_task.call_args[0]
        video_call_args = mock_video_task.call_args[0]

        self.assertEqual(len(image_call_args), 2)  # media_file_id, s3_key
        self.assertEqual(len(video_call_args), 2)
        self.assertIn('uploads/1/uuid1.jpg', image_call_args)
        self.assertIn('uploads/1/uuid2.mp4', video_call_args)