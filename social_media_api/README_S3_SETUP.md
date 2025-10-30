# S3 Media Storage Setup Guide

## Overview
This guide covers setting up secure media uploads and playback using AWS S3 and CloudFront for the Sportisode social media platform.

## Prerequisites
- AWS Account with appropriate permissions
- S3 bucket created
- CloudFront distribution (optional but recommended)
- Environment variables configured

## AWS Setup

### 1. Create S3 Bucket
```bash
aws s3 mb s3://sportisode-media --region us-east-1
```

### 2. Configure Bucket Policy (Public Read for Media)
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::sportisode-media/media/*"
        }
    ]
}
```

### 3. Configure CORS Policy
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST"],
        "AllowedOrigins": [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "https://yourdomain.com"
        ],
        "MaxAgeSeconds": 3600
    }
]
```

### 4. Create CloudFront Distribution (Recommended)
- Origin: Your S3 bucket
- Behaviors: Default (*) with caching enabled
- Price Class: Use Only US, Canada, Europe (or as needed)

## Environment Variables

### Required for Production
```bash
# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_STORAGE_BUCKET_NAME=sportisode-media
AWS_S3_REGION_NAME=us-east-1
AWS_S3_CUSTOM_DOMAIN=your-distribution.cloudfront.net

# Frontend URL for CORS
FRONTEND_URL=https://yourdomain.com

# S3 Usage (set to 'true' for production)
USE_S3=true
```

### Development Setup
```bash
# For local development, you can use local storage
USE_S3=false
```

## Django Configuration

### Settings.py
The settings are already configured to use S3 when `USE_S3=true`:

- `DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'`
- CORS origins configured for development and production
- CloudFront domain support for CDN delivery

### Media Processing
- Images: Processed into thumbnail, preview, and full sizes
- Videos: Transcoded to HLS with multiple bitrates
- All variants uploaded to S3 automatically

## Security Features

### Pre-signed URLs
- **Video Content**: 60-second expiration to prevent unauthorized sharing
- **Private Streams**: 1-hour expiration for live streams
- **Automatic Generation**: Handled by serializers and utilities

### CORS Protection
- Restricted to frontend domains only
- Prevents unauthorized cross-origin requests
- Configurable per environment

## File Structure in S3

```
sportisode-media/
├── media/
│   ├── {media_id}/
│   │   ├── thumbnail.webp
│   │   ├── preview.webp
│   │   ├── full.webp
│   │   ├── playlist.m3u8
│   │   └── hls/
│   │       ├── 0/segment.mp4
│   │       └── ...
├── uploads/
│   └── {user_id}/
│       └── {uuid}.{ext}
└── streams/
    └── {stream_id}/
        ├── thumbnail/
        └── playback/
```

## Testing

### 1. Environment Variable Validation
```bash
python manage.py check
```

### 2. S3 Connectivity Test
```python
from posts.s3_utils import s3_manager
# Test basic connectivity
result = s3_manager.s3_client.list_buckets()
print("S3 Connection:", "Success" if result else "Failed")
```

### 3. Media Upload Test
```python
from posts.views import GetUploadURLView
# Test pre-signed URL generation
view = GetUploadURLView()
# Make test request
```

## Deployment Checklist

- [ ] S3 bucket created and configured
- [ ] CloudFront distribution set up (optional)
- [ ] CORS policy applied to bucket
- [ ] Environment variables set in production
- [ ] `USE_S3=true` in production settings
- [ ] AWS credentials have appropriate permissions
- [ ] Test media upload and processing
- [ ] Verify signed URLs work for videos
- [ ] Check CORS allows frontend requests

## Troubleshooting

### Common Issues

1. **Access Denied Errors**
   - Check AWS credentials and permissions
   - Verify bucket policy allows operations
   - Ensure IAM user has S3 permissions

2. **CORS Errors**
   - Check bucket CORS configuration
   - Verify frontend domain is in allowed origins
   - Clear browser cache after CORS changes

3. **Pre-signed URL Issues**
   - Verify AWS credentials are correct
   - Check system clock is accurate
   - Ensure S3 key format is correct

4. **Media Processing Failures**
   - Check Celery worker is running
   - Verify FFmpeg/MoviePy installation
   - Check S3 connectivity during processing

## Monitoring

### Key Metrics to Monitor
- S3 storage usage and costs
- CloudFront cache hit rates
- Media processing queue lengths
- Failed upload attempts
- Pre-signed URL generation errors

### Logs to Check
- Django application logs for S3 errors
- Celery worker logs for processing failures
- AWS CloudWatch for S3 access patterns

## Cost Optimization

### S3 Storage Classes
- Use Standard for frequently accessed media
- Consider Intelligent Tiering for variable access patterns
- Use Glacier for archived content

### CloudFront Optimizations
- Enable compression
- Configure appropriate cache behaviors
- Use price classes to reduce costs

### Monitoring Costs
- Set up billing alerts for S3 and CloudFront usage
- Monitor data transfer costs
- Track API request volumes