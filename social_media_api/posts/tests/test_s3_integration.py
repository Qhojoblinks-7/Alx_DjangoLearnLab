import boto3
import pytest
from django.test import TestCase, override_settings
from unittest.mock import patch, MagicMock
from moto import mock_s3
from io import BytesIO

from posts.s3_utils import (
    S3MediaManager,
    get_presigned_url_for_media,
    upload_media_to_s3,
    get_media_url
)


class S3UtilsTest(TestCase):
    """Test S3 utility functions"""

    @patch('posts.s3_utils.boto3.client')
    def test_presigned_url_generation(self, mock_boto3):
        """Test pre-signed URL generation"""
        mock_client = MagicMock()
        mock_boto3.return_value = mock_client
        mock_client.generate_presigned_url.return_value = "https://presigned-url"

        url = get_presigned_url_for_media("test-key", expiration=60)

        self.assertEqual(url, "https://presigned-url")
        mock_client.generate_presigned_url.assert_called_once_with(
            'get_object',
            Params={
                'Bucket': 'sportisode-media',
                'Key': 'test-key'
            },
            ExpiresIn=60
        )

    @patch('posts.s3_utils.boto3.client')
    def test_upload_media_success(self, mock_boto3):
        """Test successful media upload"""
        mock_client = MagicMock()
        mock_boto3.return_value = mock_client
        mock_client.upload_fileobj.return_value = None

        file_obj = BytesIO(b"test content")
        result = upload_media_to_s3(file_obj, "test-key", "image/jpeg")

        self.assertTrue(result)
        mock_client.upload_fileobj.assert_called_once()

    @patch('posts.s3_utils.boto3.client')
    def test_upload_media_failure(self, mock_boto3):
        """Test media upload failure"""
        mock_client = MagicMock()
        mock_boto3.return_value = mock_client
        mock_client.upload_fileobj.side_effect = Exception("S3 Error")

        file_obj = BytesIO(b"test content")
        result = upload_media_to_s3(file_obj, "test-key", "image/jpeg")

        self.assertFalse(result)

    @override_settings(AWS_S3_CUSTOM_DOMAIN='cdn.example.com')
    def test_get_media_url_with_cloudfront(self):
        """Test media URL generation with CloudFront"""
        manager = S3MediaManager()
        url = manager.get_object_url("test-key", use_cloudfront=True)

        self.assertEqual(url, "https://cdn.example.com/test-key")

    def test_get_media_url_without_cloudfront(self):
        """Test media URL generation without CloudFront"""
        manager = S3MediaManager()
        url = manager.get_object_url("test-key", use_cloudfront=False)

        expected_url = "https://sportisode-media.s3.us-east-1.amazonaws.com/test-key"
        self.assertEqual(url, expected_url)


@mock_s3
class S3IntegrationTest(TestCase):
    """Integration tests with actual S3 mocking"""

    def setup_method(self):
        """Set up S3 mock bucket"""
        self.s3_client = boto3.client('s3', region_name='us-east-1')
        self.bucket_name = 'sportisode-media'
        self.s3_client.create_bucket(Bucket=self.bucket_name)

    def test_s3_upload_integration(self):
        """Test actual S3 upload with moto"""
        test_content = b'test file content'
        file_obj = BytesIO(test_content)

        # Upload file
        result = upload_media_to_s3(file_obj, 'test-key', 'text/plain')

        self.assertTrue(result)

        # Verify file was uploaded
        response = self.s3_client.get_object(Bucket=self.bucket_name, Key='test-key')
        self.assertEqual(response['Body'].read(), test_content)
        self.assertEqual(response['ContentType'], 'text/plain')

    def test_s3_presigned_url_integration(self):
        """Test pre-signed URL generation with moto"""
        # Upload a file first
        self.s3_client.put_object(
            Bucket=self.bucket_name,
            Key='test-file.jpg',
            Body=b'test content'
        )

        # Generate pre-signed URL
        url = get_presigned_url_for_media('test-file.jpg', expiration=60)

        self.assertIsNotNone(url)
        self.assertIn('test-file.jpg', url)
        self.assertIn('AWSAccessKeyId', url)  # Should contain AWS signature params


class S3MediaManagerTest(TestCase):
    """Test S3MediaManager class methods"""

    @patch('posts.s3_utils.boto3.client')
    def test_configure_bucket_cors_success(self, mock_boto3):
        """Test successful CORS configuration"""
        mock_client = MagicMock()
        mock_boto3.return_value = mock_client
        mock_client.put_bucket_cors.return_value = None

        manager = S3MediaManager()
        result = manager.configure_bucket_cors()

        self.assertTrue(result)
        mock_client.put_bucket_cors.assert_called_once()

    @patch('posts.s3_utils.boto3.client')
    def test_configure_bucket_cors_failure(self, mock_boto3):
        """Test CORS configuration failure"""
        mock_client = MagicMock()
        mock_boto3.return_value = mock_client
        mock_client.put_bucket_cors.side_effect = Exception("CORS Error")

        manager = S3MediaManager()
        result = manager.configure_bucket_cors()

        self.assertFalse(result)