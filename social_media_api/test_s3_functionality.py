#!/usr/bin/env python
"""
Simple test script to verify S3 functionality works
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'social_media_api.settings')
django.setup()

from unittest.mock import patch, MagicMock
from posts.s3_utils import get_presigned_url_for_media, upload_media_to_s3, get_media_url
from io import BytesIO

def test_s3_utils():
    """Test S3 utility functions with mocking"""
    print("Testing S3 utility functions...")

    # Test pre-signed URL generation
    with patch('posts.s3_utils.get_s3_manager') as mock_get_manager:
        mock_manager = MagicMock()
        mock_get_manager.return_value = mock_manager
        mock_manager.generate_presigned_url.return_value = "https://presigned-url"

        url = get_presigned_url_for_media("test-key", expiration=60)
        assert url == "https://presigned-url"
        print("PASS: Pre-signed URL generation works")

    # Test upload function
    with patch('posts.s3_utils.get_s3_manager') as mock_get_manager:
        mock_manager = MagicMock()
        mock_get_manager.return_value = mock_manager
        mock_manager.upload_fileobj.return_value = True

        file_obj = BytesIO(b"test content")
        result = upload_media_to_s3(file_obj, "test-key", "image/jpeg")
        assert result is True
        print("PASS: S3 upload function works")

    # Test media URL generation
    with patch('posts.s3_utils.get_s3_manager') as mock_get_manager:
        mock_manager = MagicMock()
        mock_get_manager.return_value = mock_manager
        mock_manager.get_object_url.return_value = "https://cdn.example.com/test-key"

        url = get_media_url("test-key", use_cloudfront=True)
        assert "cdn.example.com" in url
        print("PASS: Media URL generation works")

    print("PASS: All S3 utility tests passed!")

def test_django_imports():
    """Test that Django models and views can be imported"""
    print("Testing Django imports...")

    try:
        from posts.models import MediaFile, Post
        from posts.views import GetUploadURLView, CreatePostView
        from posts.s3_utils import S3MediaManager, get_s3_manager
        print("PASS: Django imports successful")
    except Exception as e:
        print(f"ERROR: Django import failed: {e}")
        return False

    return True

def test_media_file_model():
    """Test MediaFile model creation"""
    print("Testing MediaFile model...")

    try:
        from posts.models import MediaFile

        # Create a test media file
        media = MediaFile.objects.create(
            file_name='test.jpg',
            media_type='image',
            file_size=1024
        )

        # Test URL generation (will be empty since no actual S3 setup)
        thumbnail_url = media.thumbnail_url
        preview_url = media.preview_url
        full_url = media.full_url

        assert thumbnail_url == ""  # Empty initially
        assert preview_url == ""
        assert full_url == ""

        # Clean up
        media.delete()

        print("PASS: MediaFile model works")
        return True

    except Exception as e:
        print(f"ERROR: MediaFile model test failed: {e}")
        return False

if __name__ == "__main__":
    print("Testing S3 Media Upload Functionality")
    print("=" * 50)

    success = True

    # Test Django setup
    if not test_django_imports():
        success = False

    # Test S3 utilities
    try:
        test_s3_utils()
    except Exception as e:
        print(f"ERROR: S3 utils test failed: {e}")
        success = False

    # Test model functionality
    if not test_media_file_model():
        success = False

    print("=" * 50)
    if success:
        print("SUCCESS: All tests passed! S3 functionality is working correctly.")
        sys.exit(0)
    else:
        print("FAILURE: Some tests failed. Please check the implementation.")
        sys.exit(1)