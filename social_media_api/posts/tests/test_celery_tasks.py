import pytest
from unittest.mock import patch, MagicMock, mock_open
from io import BytesIO
from PIL import Image
from django.test import TestCase, override_settings

from posts.models import MediaFile
from posts.tasks import process_image_file, process_video_file


class MediaProcessingTaskTest(TestCase):
    """Test Celery media processing tasks"""

    @patch('posts.tasks.upload_media_to_s3')
    @patch('posts.tasks.Image')
    def test_process_image_file_success(self, mock_image_class, mock_upload):
        """Test successful image processing"""
        # Mock PIL Image
        mock_image = MagicMock()
        mock_image.convert.return_value = mock_image
        mock_image_class.open.return_value = mock_image

        # Mock successful upload
        mock_upload.return_value = True

        # Create test media file
        media_file = MediaFile.objects.create(
            file_name='test.jpg',
            media_type='image',
            file_size=1024
        )

        # Run task
        result = process_image_file(media_file.id, 'uploads/1/test.jpg')

        self.assertTrue(result)

        # Verify image processing was called
        mock_image_class.open.assert_called_once()

        # Verify S3 upload was called for processed variants
        self.assertGreaterEqual(mock_upload.call_count, 1)

        # Refresh from database and check status
        media_file.refresh_from_db()
        self.assertEqual(media_file.processing_status, 'completed')
        self.assertIsNotNone(media_file.thumbnail_url)

    @patch('posts.tasks.upload_media_to_s3')
    @patch('posts.tasks.Image')
    def test_process_image_file_upload_failure(self, mock_image_class, mock_upload):
        """Test image processing with upload failure"""
        # Mock PIL Image
        mock_image = MagicMock()
        mock_image.convert.return_value = mock_image
        mock_image_class.open.return_value = mock_image

        # Mock upload failure
        mock_upload.return_value = False

        # Create test media file
        media_file = MediaFile.objects.create(
            file_name='test.jpg',
            media_type='image'
        )

        # Run task - should raise exception on upload failure
        with self.assertRaises(Exception):
            process_image_file(media_file.id, 'uploads/1/test.jpg')

        # Refresh from database and check status
        media_file.refresh_from_db()
        self.assertEqual(media_file.processing_status, 'failed')

    @patch('posts.tasks.upload_media_to_s3')
    @patch('posts.tasks.mp')
    @patch('builtins.open', new_callable=mock_open)
    @patch('posts.tasks.os.unlink')
    def test_process_video_file_success(self, mock_unlink, mock_file_open, mock_mp, mock_upload):
        """Test successful video processing"""
        # Mock moviepy
        mock_video = MagicMock()
        mock_video.duration = 30.0
        mock_video.w = 1920
        mock_video.h = 1080
        mock_mp.VideoFileClip.return_value = mock_video

        # Mock PIL Image for thumbnail
        with patch('posts.tasks.Image') as mock_image_class:
            mock_image = MagicMock()
            mock_image_class.open.return_value = mock_image
            mock_image_class.fromarray.return_value = mock_image

            # Mock successful uploads
            mock_upload.return_value = True

            # Create test media file
            media_file = MediaFile.objects.create(
                file_name='test.mp4',
                media_type='video'
            )

            # Run task
            result = process_video_file(media_file.id, 'uploads/1/test.mp4')

            self.assertTrue(result)

            # Verify video processing was called
            mock_mp.VideoFileClip.assert_called_once()

            # Verify S3 uploads were called for processed variants
            self.assertGreaterEqual(mock_upload.call_count, 1)

            # Refresh from database and check status
            media_file.refresh_from_db()
            self.assertEqual(media_file.processing_status, 'completed')
            self.assertEqual(media_file.duration, 30.0)
            self.assertEqual(media_file.width, 1920)
            self.assertEqual(media_file.height, 1080)
            self.assertIsNotNone(media_file.thumbnail_url)

    @patch('posts.tasks.upload_media_to_s3')
    @patch('posts.tasks.mp')
    def test_process_video_file_s3_download(self, mock_mp, mock_upload):
        """Test video processing with S3 download"""
        # Mock S3 client for download
        with patch('posts.tasks.s3_manager') as mock_s3_manager:
            mock_s3_client = MagicMock()
            mock_s3_manager.s3_client = mock_s3_client
            mock_s3_client.get_object.return_value = {
                'Body': MagicMock(read=MagicMock(return_value=b'fake video data'))
            }

            # Mock moviepy
            mock_video = MagicMock()
            mock_video.duration = 15.0
            mock_video.w = 1280
            mock_video.h = 720
            mock_mp.VideoFileClip.return_value = mock_video

            # Mock PIL for thumbnail
            with patch('posts.tasks.Image') as mock_image_class:
                mock_image = MagicMock()
                mock_image_class.fromarray.return_value = mock_image

                # Mock successful uploads
                mock_upload.return_value = True

                # Create test media file
                media_file = MediaFile.objects.create(
                    file_name='test.mp4',
                    media_type='video'
                )

                # Run task with S3 key
                result = process_video_file(media_file.id, 'uploads/1/test.mp4')

                self.assertTrue(result)

                # Verify S3 download was called
                mock_s3_client.get_object.assert_called_once_with(
                    Bucket='sportisode-media',
                    Key='uploads/1/test.mp4'
                )

                # Verify file size was updated
                media_file.refresh_from_db()
                self.assertEqual(media_file.file_size, len(b'fake video data'))

    def test_process_image_file_invalid_id(self):
        """Test processing with invalid media file ID"""
        with self.assertRaises(MediaFile.DoesNotExist):
            process_image_file(99999, 'uploads/1/test.jpg')

    @patch('posts.tasks.upload_media_to_s3')
    @patch('posts.tasks.Image')
    def test_process_image_file_exception_handling(self, mock_image_class, mock_upload):
        """Test exception handling in image processing"""
        # Mock PIL Image to raise exception
        mock_image_class.open.side_effect = Exception("Image processing error")

        # Create test media file
        media_file = MediaFile.objects.create(
            file_name='test.jpg',
            media_type='image'
        )

        # Run task - should handle exception gracefully
        with self.assertRaises(Exception):
            process_image_file(media_file.id, 'uploads/1/test.jpg')

        # Refresh from database and check status
        media_file.refresh_from_db()
        self.assertEqual(media_file.processing_status, 'failed')
        self.assertIn('Image processing error', media_file.processing_error)


@override_settings(CELERY_TASK_ALWAYS_EAGER=True)
class CeleryIntegrationTest(TestCase):
    """Test Celery task integration"""

    @patch('posts.tasks.upload_media_to_s3')
    @patch('posts.tasks.Image')
    def test_task_execution_in_queue(self, mock_image_class, mock_upload):
        """Test that tasks execute synchronously with CELERY_TASK_ALWAYS_EAGER"""
        # Mock PIL Image
        mock_image = MagicMock()
        mock_image.convert.return_value = mock_image
        mock_image_class.open.return_value = mock_image

        # Mock successful upload
        mock_upload.return_value = True

        # Create test media file
        media_file = MediaFile.objects.create(
            file_name='test.jpg',
            media_type='image'
        )

        # This should execute synchronously due to CELERY_TASK_ALWAYS_EAGER
        result = process_image_file.delay(media_file.id, 'uploads/1/test.jpg')

        # Verify task completed successfully
        self.assertTrue(result.get())

        # Verify media file was processed
        media_file.refresh_from_db()
        self.assertEqual(media_file.processing_status, 'completed')