import boto3
import logging
from botocore.exceptions import ClientError
from django.conf import settings
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class S3MediaManager:
    """Utility class for managing S3 media operations"""

    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_S3_REGION_NAME
        )
        self.bucket_name = settings.AWS_STORAGE_BUCKET_NAME

    def generate_presigned_url(self, key, expiration=60, operation='get_object'):
        """
        Generate a pre-signed URL for S3 object access

        Args:
            key: S3 object key
            expiration: URL expiration time in seconds (default: 60)
            operation: S3 operation ('get_object', 'put_object', etc.)

        Returns:
            str: Pre-signed URL or None if error
        """
        # Check if using dummy credentials (development mode)
        if (hasattr(settings, 'AWS_ACCESS_KEY_ID') and
            settings.AWS_ACCESS_KEY_ID == 'dummy_key'):
            # Return mock URL for development testing
            return f"https://mock-s3.example.com/{key}?operation={operation}&expiration={expiration}&mock=true"

        try:
            url = self.s3_client.generate_presigned_url(
                operation,
                Params={
                    'Bucket': self.bucket_name,
                    'Key': key
                },
                ExpiresIn=expiration
            )
            return url
        except ClientError as e:
            logger.error(f"Error generating pre-signed URL for {key}: {e}")
            return None

    def upload_fileobj(self, file_obj, key, content_type=None, acl='public-read'):
        """
        Upload a file-like object to S3

        Args:
            file_obj: File-like object to upload
            key: S3 object key
            content_type: MIME type of the file
            acl: Access control list

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            extra_args = {'ACL': acl}
            if content_type:
                extra_args['ContentType'] = content_type

            self.s3_client.upload_fileobj(
                file_obj,
                self.bucket_name,
                key,
                ExtraArgs=extra_args
            )
            return True
        except ClientError as e:
            logger.error(f"Error uploading file to S3 {key}: {e}")
            return False

    def delete_object(self, key):
        """
        Delete an object from S3

        Args:
            key: S3 object key

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=key)
            return True
        except ClientError as e:
            logger.error(f"Error deleting S3 object {key}: {e}")
            return False

    def get_object_url(self, key, use_cloudfront=True):
        """
        Get the public URL for an S3 object

        Args:
            key: S3 object key
            use_cloudfront: Whether to use CloudFront domain if configured

        Returns:
            str: Public URL for the object
        """
        if use_cloudfront and hasattr(settings, 'AWS_S3_CUSTOM_DOMAIN') and settings.AWS_S3_CUSTOM_DOMAIN:
            return f"https://{settings.AWS_S3_CUSTOM_DOMAIN}/{key}"
        else:
            return f"https://{self.bucket_name}.s3.{settings.AWS_S3_REGION_NAME}.amazonaws.com/{key}"

    def configure_bucket_cors(self):
        """
        Configure CORS policy for the S3 bucket

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            cors_configuration = {
                'CORSRules': [
                    {
                        'AllowedHeaders': ['*'],
                        'AllowedMethods': ['GET', 'PUT', 'POST'],
                        'AllowedOrigins': getattr(settings, 'AWS_S3_CORS_ORIGINS', ['*']),
                        'MaxAgeSeconds': getattr(settings, 'AWS_S3_CORS_MAX_AGE_SECONDS', 3600)
                    }
                ]
            }

            self.s3_client.put_bucket_cors(
                Bucket=self.bucket_name,
                CORSConfiguration=cors_configuration
            )
            logger.info(f"Successfully configured CORS for bucket {self.bucket_name}")
            return True
        except ClientError as e:
            logger.error(f"Error configuring CORS for bucket {self.bucket_name}: {e}")
            return False


# Lazy-loaded global instance for easy access
_s3_manager = None

def get_s3_manager():
    """Get or create S3 manager instance"""
    global _s3_manager
    if _s3_manager is None:
        _s3_manager = S3MediaManager()
    return _s3_manager


def get_presigned_url_for_media(media_key, expiration=60, operation='get_object'):
    """
    Convenience function to get pre-signed URL for media

    Args:
        media_key: Media file key in S3
        expiration: URL expiration in seconds
        operation: S3 operation ('get_object', 'put_object', etc.)

    Returns:
        str: Pre-signed URL or None
    """
    return get_s3_manager().generate_presigned_url(media_key, expiration, operation)


def upload_media_to_s3(file_obj, key, content_type=None):
    """
    Convenience function to upload media to S3

    Args:
        file_obj: File-like object
        key: S3 key
        content_type: MIME type

    Returns:
        bool: Success status
    """
    return get_s3_manager().upload_fileobj(file_obj, key, content_type)


def get_media_url(key, use_cloudfront=True):
    """
    Convenience function to get media URL

    Args:
        key: S3 key
        use_cloudfront: Use CloudFront if available

    Returns:
        str: Media URL
    """
    return get_s3_manager().get_object_url(key, use_cloudfront)