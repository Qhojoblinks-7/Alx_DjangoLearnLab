# Social Media API

A Django REST API for a social media platform with real-time features using WebSockets.

## Features

- **User Management**: Registration, login, user profiles with bio, profile images, and follower/following relationships.
- **Posts**: Create, read, update, delete posts with title, content, and optional video/image uploads.
- **Live Streaming**: Complete live streaming platform with real-time chat, viewer analytics, and professional broadcasting tools.
- **Comments**: Add comments to posts.
- **Likes**: Like/unlike posts.
- **Notifications**: Real-time notifications for likes, comments, follows, and live stream alerts via WebSockets.
- **Feed**: Timeline feed showing posts from followed users.
- **Real-time Updates**: WebSocket integration for live post updates, stream status, and chat messages.
- **JWT Authentication**: Secure authentication using JSON Web Tokens.
- **Permissions**: Proper permissions for post/comment/like actions.
- **State Management**: Redux Toolkit for centralized state management across the application.
- **Rate Limiting**: Comprehensive API throttling with burst and sustained controls to prevent abuse.
- **Load Testing**: Built-in Locust configuration for performance testing and scalability validation.
- **Health Monitoring**: Production-ready health checks, metrics endpoints, and alerting system.
- **WebSocket Throttling**: Rate limiting for real-time chat and streaming features.
- **Scalability**: Enterprise-grade architecture with Redis caching, async processing, and auto-scaling support.

## Rate Limiting & Scalability Features

### Advanced API Throttling
- **Post Creation**: 10 posts/hour (authenticated), 1/hour (anonymous) with burst control
- **Live Stream Creation**: 3 streams/day per user with active stream limits
- **Media Upload**: 20 upload URLs/minute to prevent abuse
- **Feed Access**: 100 requests/minute to prevent excessive polling
- **Search**: 30 searches/minute to prevent database load
- **Chat Messages**: 5 messages/minute per WebSocket user

### Load Testing Infrastructure
- **Locust Configuration**: Comprehensive load testing with 4 user behavior patterns
- **Performance Scenarios**: Normal load, stress testing, spike testing, endurance testing
- **User Simulation**: Feed browsing (70%), content creation (15%), stream viewing (10%), search (5%)

### Production Monitoring
- **Health Check Endpoints**: Basic and detailed health checks with system metrics
- **Metrics Endpoint**: Prometheus-compatible metrics for monitoring
- **Rate Limit Status**: Debug endpoint for throttling issues
- **System Monitoring**: CPU, memory, disk usage, database connections

### WebSocket Security
- **Chat Throttling**: Rate limiting for real-time messaging
- **Connection Management**: Authenticated WebSocket connections with proper cleanup
- **Message Validation**: Content filtering and size limits

### Scalability Architecture
- **Redis Backend**: Shared caching and throttling storage
- **Async Processing**: Celery for heavy media processing tasks
- **Horizontal Scaling**: Stateless design ready for auto-scaling
- **CDN Integration**: CloudFront for global media delivery

## Tech Stack

- **Backend**: Django 5.2, Django REST Framework, Django Channels
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React icons
- **Authentication**: JWT (djangorestframework-simplejwt)
- **Real-time**: Django Channels for WebSockets, Redis for Channel Layers
- **Database**: SQLite (development), configurable for production
- **File Storage**: AWS S3/CloudFront (REQUIRED for production - local filesystem inadequate for HLS streaming)
- **State Management**: Redux Toolkit for centralized state, React Query for server state
- **Live Streaming**: Mux Video API for RTMP ingestion and HLS delivery
- **Caching**: Redis for real-time data and session management

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd social_media_api
   ```

2. **Create a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
   Or install manually:
   ```bash
   pip install Django djangorestframework djangorestframework-simplejwt django-filter channels djangorestframework-nested Pillow
   ```

4. **Apply migrations**:
   ```bash
   python manage.py migrate
   ```

5. **Create a superuser** (optional):
   ```bash
   python manage.py createsuperuser
   ```

6. **Run the development server**:
   ```bash
   python manage.py runserver
   ```

The API will be available at `http://localhost:8000/api/`.

### Frontend Development Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd sportisode-ui
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

The React application will be available at `http://localhost:5173/`.

### Using Live Streaming

1. **Create a Live Stream**:
   - Click the "Go Live" button in the main navigation (next to "New Post")
   - Fill out the stream details in the modal form
   - Set privacy, scheduling, and tags as needed
   - Click "Go Live" to create the stream

2. **Manage Streams**:
   - View your streams in the live streams section
   - Start/end streams using the control buttons
   - Monitor viewer counts and analytics

3. **Watch Streams**:
    - Browse available live streams in the sidebar
    - Click on any active stream to watch
    - Private streams require invitation from the host
    - Real-time chat with other viewers
    - Live viewer count updates

## Live Streaming Features

The platform includes a comprehensive live streaming system with professional broadcasting tools, real-time chat, and analytics.

### Core Features

#### **Stream Creation & Management**
- **"Go Live" Button**: Prominently placed in main navigation next to "New Post"
- **Stream Configuration**: Title, description, scheduling, privacy settings, tags
- **Broadcasting Instructions**: Complete OBS Studio setup guide with RTMP URLs and stream keys
- **Stream Status Tracking**: Scheduled → Starting → Live → Ended lifecycle
- **Privacy Controls**: Public streams (all users) or private streams (invite-only)

#### **Real-time Broadcasting**
- **Professional Streaming**: RTMP ingestion via Mux Video API
- **HLS Delivery**: Low-latency video streaming to viewers
- **Stream Analytics**: Real-time viewer counts, peak viewers, watch duration
- **Auto-archival**: VOD creation upon stream completion
- **Webhook Integration**: External service status updates

#### **Interactive Features**
- **Live Chat**: Real-time messaging during streams (authenticated users only)
- **Viewer Engagement**: Instant viewer count updates across all clients
- **Stream Notifications**: Followers get notified when followed users go live
- **Connection Status**: Visual indicators for WebSocket connectivity
- **Auto-reconnection**: Seamless recovery from network interruptions

#### **Advanced Analytics**
- **Viewer Tracking**: Join/leave events with timestamps
- **Engagement Metrics**: Chat message counts, interaction rates
- **Stream Performance**: Connection quality, buffering metrics
- **Audience Demographics**: Geographic and device analytics

### Technical Architecture

#### **Backend Architecture**
- **Django Channels**: WebSocket support for real-time features
- **Redis**: Channel layers for message broadcasting and caching
- **Mux Integration**: Professional video streaming infrastructure
- **Webhook Processing**: Real-time stream status updates from external services
- **Asynchronous Tasks**: Celery for stream processing (VOD archival, analytics)

#### **Frontend Architecture**
- **Redux State Management**: Centralized live streaming state
- **WebSocket Integration**: Real-time data synchronization
- **React Query**: Server state management for API calls
- **Responsive Design**: Mobile-first streaming interface
- **Performance Optimization**: Lazy loading and code splitting

#### **State Management (Redux)**
```javascript
// Live streaming state structure
{
  liveStreams: [],           // All available streams
  currentStream: null,       // Active viewing stream
  viewerCounts: {},          // Real-time viewer counts by stream ID
  streamStatuses: {},        // Live/ended status by stream ID
  chatMessages: {},          // Chat history by stream ID
  wsConnections: {},         // WebSocket connection status
  activeModal: null,         // UI modal state
  creatingStream: false,     // Stream creation loading state
}
```

#### **WebSocket Channels**
- `ws://localhost:8000/ws/posts/stream/{stream_id}/` - Stream chat and status updates
- `ws://localhost:8000/ws/posts/streams/status/` - Global stream notifications
- `ws://localhost:8000/ws/notifications/{user_id}/` - User notifications

### API Endpoints

#### **Live Streaming (Updated)**
- `GET /api/posts/live/stream/` - List all live streams
- `POST /api/posts/live/stream/` - Create live stream (returns RTMP URL and stream key)
- `GET /api/posts/live/stream/{id}/` - Get stream details
- `PUT /api/posts/live/stream/{id}/` - Update stream (host only)
- `DELETE /api/posts/live/stream/{id}/` - Delete stream (host only)
- `POST /api/posts/live/stream/{id}/start/` - Start stream (host only)
- `POST /api/posts/live/stream/{id}/end/` - End stream (host only)
- `GET /api/posts/live/stream/watch/{id}/` - Watch stream (with viewer tracking)
- `POST /api/posts/live/webhook/` - Webhook receiver for stream status updates

#### **Health & Monitoring**
- `GET /api/posts/health/` - Basic health check for load balancers
- `GET /api/posts/health/detailed/` - Detailed health check with system metrics
- `GET /api/posts/metrics/` - Prometheus-compatible metrics endpoint
- `GET /api/posts/rate-limit-status/` - Debug current rate limiting status

### Broadcasting Setup

#### **OBS Studio Configuration**
1. Download and install OBS Studio
2. Go to Settings → Stream
3. Select "Custom" service
4. Enter the Server URL: `rtmp://global-live.mux.com:5222/app`
5. Enter your unique Stream Key
6. Click "Start Streaming"

#### **Alternative Software**
- Streamlabs OBS
- XSplit
- vMix (professional)
- Any RTMP-compatible software

### Deployment Requirements

#### **Infrastructure**
- **Redis Server**: Required for Channel Layers and caching
- **Mux Account**: Video streaming service integration
- **Celery Worker**: Asynchronous task processing
- **Web Server**: Daphne (ASGI) for WebSocket support

#### **Environment Variables**
```bash
# Live Streaming Configuration
MUX_TOKEN_ID=your-mux-token-id
MUX_TOKEN_SECRET=your-mux-token-secret
MUX_WEBHOOK_SECRET=your-webhook-secret
MUX_WEBHOOK_URL=https://yourdomain.com/api/posts/live/webhook/

# Redis Configuration
REDIS_URL=redis://localhost:6379/0

# Celery Configuration
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

#### **Production Setup**
1. Configure Mux webhooks to point to your domain
2. Set up Redis for caching and WebSocket channels
3. Deploy Celery workers for async processing
4. Use Daphne instead of gunicorn for ASGI support
5. Configure SSL for HTTPS streaming

## Security & Compliance

### Critical Security Measures for Live Streaming

#### **A. Mux Webhook Security Enforcement**

The `POST /api/posts/live/webhook/` endpoint is critical for stream lifecycle management. **Improper implementation can allow attackers to prematurely end streams or manipulate stream status.**

**Required Security Measures:**

1. **HMAC-SHA256 Signature Verification**
   ```python
   # In settings.py
   MUX_WEBHOOK_SECRET = os.getenv('MUX_WEBHOOK_SECRET')

   # Webhook handler verifies signatures using:
   # HMAC-SHA256(timestamp + "." + request_body)
   ```

2. **HTTPS Enforcement**
   - Mux webhook URL **MUST** use HTTPS
   - Configure `MUX_WEBHOOK_URL=https://yourdomain.com/api/posts/live/webhook/`
   - Never use HTTP for webhook endpoints

3. **IP Whitelisting (Recommended)**
   ```python
   # Configure firewall to only accept from Mux IP ranges
   # Current Mux webhook IPs (check Mux documentation):
   # - 23.23.0.0/16
   # - 54.240.0.0/16
   # - 54.241.0.0/16
   ```

4. **Request Validation**
   - Verify `Mux-Signature` header format: `t=timestamp,v1=signature`
   - Use constant-time comparison to prevent timing attacks
   - Log all webhook attempts for monitoring

#### **B. Stream Key Security**

- Stream keys are unique 16-character identifiers
- Never expose stream keys in client-side code
- Rotate keys after each stream session
- Implement rate limiting on stream creation

#### **C. Content Security**

- Validate all user-generated content before broadcasting
- Implement chat message filtering and moderation
- Rate limit chat messages per user
- Secure storage of viewer analytics

#### **D. Privacy & Data Protection**

- Private streams require explicit user permission
- Implement proper data retention policies
- Comply with GDPR/CCPA for user data handling
- Secure storage of viewer analytics

### Security Implementation Checklist

- [ ] **Mux Webhook Signature Verification** - HMAC-SHA256 validation
- [ ] **HTTPS Webhook URL** - SSL/TLS encryption required
- [ ] **IP Whitelisting** - Firewall rules for Mux IPs
- [ ] **Request Logging** - Monitor all webhook attempts
- [ ] **Stream Key Rotation** - Unique keys per session
- [ ] **Chat Moderation** - Content filtering and rate limiting
- [ ] **Data Encryption** - Secure storage of sensitive data
- [ ] **Access Controls** - Proper authentication and authorization
- [ ] **S3/CloudFront Storage** - Required for production media handling
- [ ] **Signed URLs** - Temporary URLs for private media access
- [ ] **CORS Configuration** - Proper cross-origin resource sharing

### Production Security Configuration

```python
# settings.py - Security Configuration
MUX_WEBHOOK_SECRET = os.getenv('MUX_WEBHOOK_SECRET')
MUX_WEBHOOK_URL = os.getenv('MUX_WEBHOOK_URL')  # Must be HTTPS

# Webhook signature verification
WEBHOOK_SIGNATURE_TOLERANCE = 300  # 5 minutes tolerance

# Rate limiting
STREAM_CREATION_RATE_LIMIT = '10/hour'  # Per user
CHAT_MESSAGE_RATE_LIMIT = '30/minute'  # Per user

# Content security
CHAT_MODERATION_ENABLED = True
STREAM_TITLE_MAX_LENGTH = 100
STREAM_DESCRIPTION_MAX_LENGTH = 500
```

### Monitoring & Alerting

- **Webhook Failure Alerts** - Monitor signature verification failures
- **Stream Hijacking Attempts** - Alert on unauthorized stream modifications
- **Rate Limit Violations** - Monitor and block abusive users
- **Content Violations** - Automated moderation alerts

### Compliance Requirements

- **GDPR Compliance** - User data handling and consent
- **Content Moderation** - Automated and manual review processes
- **Audit Logging** - Complete activity tracking for compliance
- **Data Retention** - Configurable retention policies
- **Right to Deletion** - User data removal capabilities

## Secure Media Storage & Delivery

### Critical Production Requirements

**Local file system storage is completely inadequate for production.** HLS streaming and media uploads require high-speed, durable, globally distributed storage with proper security controls.

#### **A. S3/CloudFront Implementation (REQUIRED)**

**All media uploads and streaming content MUST use AWS S3 with CloudFront CDN.**

**Required Configuration:**

1. **S3 Bucket Setup**
   ```bash
   # Create S3 bucket with proper permissions
   aws s3 mb s3://your-media-bucket --region us-east-1

   # Enable versioning for data protection
   aws s3api put-bucket-versioning \
     --bucket your-media-bucket \
     --versioning-configuration Status=Enabled

   # Configure CORS for frontend access
   aws s3api put-bucket-cors --bucket your-media-bucket --cors-configuration '{
     "CORSRules": [
       {
         "AllowedOrigins": ["https://yourdomain.com", "http://localhost:5173"],
         "AllowedMethods": ["GET", "PUT", "POST"],
         "AllowedHeaders": ["*"],
         "MaxAgeSeconds": 3600
       }
     ]
   }'
   ```

2. **CloudFront Distribution**
   ```bash
   # Create CloudFront distribution for S3 bucket
   aws cloudfront create-distribution --distribution-config '{
     "CallerReference": "media-distribution-'$(date +%s)'",
     "Origins": {
       "Quantity": 1,
       "Items": {
         "Id": "S3-your-media-bucket",
         "DomainName": "your-media-bucket.s3.amazonaws.com",
         "S3OriginConfig": {
           "OriginAccessIdentity": ""
         }
       }
     },
     "DefaultCacheBehavior": {
       "TargetOriginId": "S3-your-media-bucket",
       "ViewerProtocolPolicy": "redirect-to-https",
       "MinTTL": 0,
       "DefaultTTL": 86400,
       "MaxTTL": 31536000
     },
     "Enabled": true
   }'
   ```

3. **Django Configuration**
    ```python
    # settings.py - Complete S3 Configuration
    USE_S3 = os.getenv('USE_S3', 'False').lower() == 'true'

    if USE_S3:
        AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
        AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
        AWS_STORAGE_BUCKET_NAME = os.getenv('AWS_STORAGE_BUCKET_NAME')
        AWS_S3_REGION_NAME = os.getenv('AWS_S3_REGION_NAME', 'us-east-1')
        AWS_S3_CUSTOM_DOMAIN = os.getenv('AWS_S3_CUSTOM_DOMAIN')  # CloudFront domain

        # S3 Static Files
        STATICFILES_STORAGE = 'storages.backends.s3boto3.S3StaticStorage'
        AWS_S3_STATIC_OBJECT_PARAMETERS = {
            'CacheControl': 'max-age=31536000',  # 1 year for static files
        }

        # S3 Media Files
        DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
        AWS_LOCATION = 'media'
        AWS_S3_MEDIA_OBJECT_PARAMETERS = {
            'CacheControl': 'max-age=86400',  # 24 hours for media
        }

        # URL configuration
        MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/media/' if AWS_S3_CUSTOM_DOMAIN else f'https://{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com/media/'
        STATIC_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/static/' if AWS_S3_CUSTOM_DOMAIN else f'https://{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com/static/'

        # Security settings
        AWS_DEFAULT_ACL = None  # Use bucket policies instead
        AWS_S3_SIGNATURE_VERSION = 's3v4'
        AWS_S3_ADDRESSING_STYLE = 'virtual'
    ```

#### **B. Temporary Signed URLs for Private Media**

**Private streams and sensitive media must use signed URLs to prevent unauthorized access.**

```python
# utils.py - Signed URL Generation
from django.conf import settings
import boto3
from botocore.client import Config
import datetime

def generate_signed_url(key: str, expiration: int = 3600) -> str:
    """
    Generate a signed URL for private S3 objects.

    Args:
        key: S3 object key
        expiration: URL expiration time in seconds (default: 1 hour)

    Returns:
        Signed URL string
    """
    s3_client = boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_S3_REGION_NAME,
        config=Config(signature_version='s3v4')
    )

    try:
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': settings.AWS_STORAGE_BUCKET_NAME,
                'Key': key
            },
            ExpiresIn=expiration
        )
        return url
    except Exception as e:
        logger.error(f"Failed to generate signed URL for {key}: {e}")
        return None

# Usage in views
def get_private_stream_url(stream: LiveStream, user: User) -> str:
    """Generate signed URL for private stream access"""
    if stream.is_private and user not in stream.allowed_users.all():
        return None

    # Generate signed URL for HLS playlist
    return generate_signed_url(f'streams/{stream.id}/playlist.m3u8', expiration=3600)
```

#### **C. CORS Configuration**

**Proper CORS configuration is essential for frontend media access.**

**S3 Bucket CORS Policy:**
```json
[
  {
    "AllowedOrigins": [
      "https://yourdomain.com",
      "http://localhost:5173"
    ],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

**CloudFront CORS Headers:**
```bash
# Add CORS headers to CloudFront behavior
aws cloudfront update-distribution --id YOUR_DISTRIBUTION_ID --distribution-config '{
  "Origins": {...},
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-your-media-bucket",
    "ViewerProtocolPolicy": "redirect-to-https",
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {"Forward": "none"}
    },
    "ResponseHeadersPolicyId": "CORS_POLICY_ID"
  }
}'
```

### Media Storage Architecture

#### **File Organization**
```
S3 Bucket Structure:
├── media/
│   ├── posts/                    # Post images/videos
│   │   ├── {post_id}/
│   │   │   ├── original.jpg
│   │   │   ├── thumbnail.jpg
│   │   │   └── preview.jpg
│   ├── profiles/                 # User profile images
│   │   ├── {user_id}/
│   │   │   ├── avatar.jpg
│   │   │   └── banner.jpg
│   └── streams/                  # Live stream content
│       ├── {stream_id}/
│       │   ├── thumbnail.jpg
│       │   ├── playlist.m3u8     # HLS playlist
│       │   └── segments/         # HLS video segments
│           ├── segment_001.ts
│           ├── segment_002.ts
│           └── ...
├── static/                       # Static assets (CSS, JS)
└── temp/                         # Temporary upload storage
```

#### **Access Control**
- **Public Media**: Post images, public stream thumbnails - direct CloudFront URLs
- **Private Media**: Private streams, user uploads - signed URLs with expiration
- **Temporary Access**: Upload URLs expire after 15 minutes
- **Stream Archives**: VOD content with configurable access controls

### Production Media Configuration

#### **Environment Variables**
```bash
# AWS S3 Configuration (REQUIRED for production)
USE_S3=True
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_STORAGE_BUCKET_NAME=your-media-bucket-name
AWS_S3_REGION_NAME=us-east-1
AWS_S3_CUSTOM_DOMAIN=your-cloudfront-domain.cloudfront.net

# Media Security
SIGNED_URL_EXPIRATION=3600  # 1 hour for private content
UPLOAD_URL_EXPIRATION=900   # 15 minutes for uploads
MAX_FILE_SIZE=100MB         # Maximum upload size
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,mp4,mov,avi
```

#### **Django Settings**
```python
# settings.py - Production Media Configuration
if USE_S3:
    # S3 Storage
    AWS_S3_OBJECT_PARAMETERS = {
        'CacheControl': 'max-age=31536000',  # 1 year cache for static
    }

    # Media-specific settings
    AWS_S3_MEDIA_OBJECT_PARAMETERS = {
        'CacheControl': 'max-age=86400',  # 24 hours for media
    }

    # File size limits
    FILE_UPLOAD_MAX_MEMORY_SIZE = 100 * 1024 * 1024  # 100MB
    DATA_UPLOAD_MAX_MEMORY_SIZE = 100 * 1024 * 1024

    # Content type restrictions
    CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4']
    MAX_UPLOAD_SIZE = 100 * 1024 * 1024  # 100MB
```

### Monitoring & Performance

#### **CloudWatch Metrics**
- **S3 Request Metrics**: Track access patterns and errors
- **CloudFront Metrics**: Monitor CDN performance and cache hit rates
- **Cost Optimization**: Monitor storage usage and transfer costs

#### **Performance Optimization**
- **CDN Caching**: Appropriate cache headers for different content types
- **Regional Replication**: Multi-region S3 buckets for global performance
- **Transfer Acceleration**: S3 Transfer Acceleration for large uploads
- **Signed Cookies**: For authenticated content access

### Security Considerations

#### **Data Protection**
- **Encryption at Rest**: S3 server-side encryption enabled
- **HTTPS Only**: All media served over HTTPS
- **Access Logging**: Comprehensive S3 and CloudFront access logs
- **Data Retention**: Configurable retention policies for compliance

#### **Access Security**
- **IAM Roles**: Least-privilege access for application
- **Bucket Policies**: Restrict access to specific resources
- **VPC Endpoints**: Secure S3 access within VPC
- **MFA Delete**: Enable MFA for critical bucket operations

## Implementation Guide: S3 Signed URLs & CORS

### **Django Implementation for Signed URLs**

Add this utility function to your Django project:

```python
# utils/s3_utils.py
import boto3
import logging
from botocore.client import Config
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

logger = logging.getLogger(__name__)

def get_s3_client():
    """Get configured S3 client"""
    if not all([
        settings.AWS_ACCESS_KEY_ID,
        settings.AWS_SECRET_ACCESS_KEY,
        settings.AWS_STORAGE_BUCKET_NAME
    ]):
        raise ImproperlyConfigured("AWS S3 settings not properly configured")

    return boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_S3_REGION_NAME,
        config=Config(signature_version='s3v4')
    )

def generate_signed_url(key: str, expiration: int = 3600, content_type: str = None) -> str:
    """
    Generate a signed URL for private S3 objects.

    Args:
        key: S3 object key (e.g., 'media/posts/123/image.jpg')
        expiration: URL expiration time in seconds (default: 1 hour)
        content_type: Content type for upload URLs

    Returns:
        Signed URL string

    Raises:
        ValueError: If S3 is not configured or key is invalid
    """
    if not settings.USE_S3:
        raise ValueError("S3 storage is not enabled")

    s3_client = get_s3_client()

    try:
        params = {
            'Bucket': settings.AWS_STORAGE_BUCKET_NAME,
            'Key': key
        }

        # For upload URLs, specify content type
        if content_type:
            params['ContentType'] = content_type

        url = s3_client.generate_presigned_url(
            'put_object' if content_type else 'get_object',
            Params=params,
            ExpiresIn=expiration
        )
        return url
    except Exception as e:
        logger.error(f"Failed to generate signed URL for {key}: {e}")
        raise ValueError(f"Could not generate signed URL: {e}")

def get_private_stream_url(stream, user, expiration: int = 3600) -> str:
    """
    Generate signed URL for private stream access.

    Args:
        stream: LiveStream instance
        user: User instance
        expiration: URL expiration in seconds

    Returns:
        Signed URL or None if access denied
    """
    from posts.models import LiveStream

    if not isinstance(stream, LiveStream):
        raise ValueError("Invalid stream object")

    # Check access permissions
    if stream.is_private and user not in stream.allowed_users.all():
        return None

    # Generate signed URL for HLS playlist
    playlist_key = f'streams/{stream.id}/playlist.m3u8'
    return generate_signed_url(playlist_key, expiration)

def get_upload_url(key: str, content_type: str, expiration: int = 900) -> str:
    """
    Generate signed URL for file uploads.

    Args:
        key: S3 object key for upload destination
        content_type: MIME type of file being uploaded
        expiration: URL expiration in seconds (default: 15 minutes)

    Returns:
        Signed upload URL
    """
    return generate_signed_url(key, expiration, content_type)
```

### **Usage in Views**

```python
# posts/views.py - Example usage
from utils.s3_utils import get_private_stream_url, get_upload_url

class LiveStreamWatchView(views.APIView):
    def get(self, request, pk):
        try:
            stream = LiveStream.objects.get(pk=pk)

            # Check permissions
            if stream.is_private and request.user not in stream.allowed_users.all():
                return Response({'error': 'Access denied'}, status=403)

            # Generate signed URL for private streams
            if stream.is_private:
                playback_url = get_private_stream_url(stream, request.user)
            else:
                playback_url = stream.playback_url

            return Response({
                'stream': LiveStreamSerializer(stream).data,
                'playback_url': playback_url
            })

        except LiveStream.DoesNotExist:
            return Response({'error': 'Stream not found'}, status=404)

class UploadURLView(views.APIView):
    def post(self, request):
        file_name = request.data.get('file_name')
        content_type = request.data.get('content_type')

        if not file_name or not content_type:
            return Response({'error': 'file_name and content_type required'}, status=400)

        # Generate upload URL
        key = f'uploads/{request.user.id}/{file_name}'
        upload_url = get_upload_url(key, content_type)

        return Response({
            'upload_url': upload_url,
            'key': key
        })
```

### **Frontend Integration**

```javascript
// Generate signed upload URL
const getUploadURL = async (fileName, contentType) => {
  const response = await fetch('/api/posts/upload-url/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_name: fileName, content_type: contentType })
  });

  if (!response.ok) throw new Error('Failed to get upload URL');

  const { upload_url, key } = await response.json();
  return { upload_url, key };
};

// Upload file directly to S3
const uploadToS3 = async (file, uploadURL) => {
  const response = await fetch(uploadURL, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type
    }
  });

  if (!response.ok) throw new Error('Upload failed');
  return response;
};

// Complete upload flow
const uploadFile = async (file) => {
  try {
    const { upload_url, key } = await getUploadURL(file.name, file.type);
    await uploadToS3(file, upload_url);

    // File is now uploaded to S3 at the specified key
    return key;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};
```

### **CORS Configuration for S3**

**S3 Bucket CORS Policy (JSON):**
```json
[
  {
    "AllowedOrigins": [
      "https://yourdomain.com",
      "http://localhost:5173"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

**CloudFront CORS Headers:**
```javascript
// Add to CloudFront Response Headers Policy
{
  "ResponseHeadersPolicyConfig": {
    "Name": "CORS-Policy",
    "CorsConfig": {
      "AccessControlAllowOrigins": {
        "Quantity": 2,
        "Items": ["https://yourdomain.com", "http://localhost:5173"]
      },
      "AccessControlAllowHeaders": {
        "Quantity": 1,
        "Items": ["*"]
      },
      "AccessControlAllowMethods": {
        "Quantity": 4,
        "Items": ["GET", "PUT", "POST", "DELETE"]
      },
      "AccessControlAllowCredentials": false,
      "AccessControlExposeHeaders": {
        "Quantity": 1,
        "Items": ["ETag"]
      },
      "AccessControlMaxAgeSec": 3600,
      "OriginOverride": true
    }
  }
}
```

### **Production Deployment Checklist**

- [ ] **S3 Bucket Created** with proper permissions and CORS
- [ ] **CloudFront Distribution** configured with S3 origin
- [ ] **Django Settings** updated with S3 configuration
- [ ] **Signed URL Utility** implemented in Django
- [ ] **Upload/View Endpoints** updated to use signed URLs
- [ ] **Frontend Upload Logic** updated for direct S3 uploads
- [ ] **CORS Policies** configured for both S3 and CloudFront
- [ ] **SSL/TLS** enabled for all media URLs
- [ ] **Access Logging** enabled for security monitoring
- [ ] **Backup Strategy** implemented for critical media

This implementation provides **enterprise-grade secure media storage** with proper access controls, global CDN delivery, and comprehensive security measures! 🔒📁

## Usage

### Authentication

All API endpoints except registration and login require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### API Endpoints

#### Accounts

- `POST /api/accounts/register/` - Register a new user
- `POST /api/accounts/login/` - Login and get JWT tokens
- `GET /api/accounts/users/` - List users
- `GET /api/accounts/users/{id}/` - Get user profile
- `POST /api/accounts/users/{id}/follow/` - Follow/unfollow a user

#### Posts

- `GET /api/posts/posts/` - List all posts
- `POST /api/posts/posts/` - Create a new post
- `GET /api/posts/posts/{id}/` - Get post details
- `PUT /api/posts/posts/{id}/` - Update post (author only)
- `DELETE /api/posts/posts/{id}/` - Delete post (author only)
- `POST /api/posts/posts/{id}/like/` - Like a post
- `POST /api/posts/posts/{id}/unlike/` - Unlike a post

#### Comments

- `GET /api/posts/posts/{post_id}/comments/` - List comments on a post
- `POST /api/posts/posts/{post_id}/comments/` - Add a comment to a post
- `PUT /api/posts/posts/{post_id}/comments/{id}/` - Update comment (author only)
- `DELETE /api/posts/posts/{post_id}/comments/{id}/` - Delete comment (author only)

#### Feed

- `GET /api/posts/feed/` - Get timeline feed (posts from followed users)

#### Live Streaming (Updated)

- `GET /api/posts/live/stream/` - List live streams
- `POST /api/posts/live/stream/` - Create Live Stream: Now returns the stream_key and rtmp_url from the video service
- `GET /api/posts/live/stream/{id}/` - Get live stream details
- `PUT /api/posts/live/stream/{id}/` - Update live stream (host only)
- `DELETE /api/posts/live/stream/{id}/` - Delete live stream (host only)
- `POST /api/posts/live/stream/{id}/start/` - Start a live stream (host only)
- `POST /api/posts/live/stream/{id}/end/` - End a live stream (host only)
- `GET /api/posts/live/stream/watch/{id}/` - Watch a live stream
- `POST /api/posts/live/webhook/` - NEW Endpoint: Receives Webhooks from the video service (e.g., Mux/MediaLive) to signal stream START or END. This is essential for host-less status updates.

### Live Streaming

The platform supports live streaming functionality with the following features:

#### Creating Live Streams

Users can create live streams through the "Go Live" button in the main navigation. The creation form includes:

- **Title**: Required stream title
- **Description**: Optional detailed description
- **Scheduled Start**: Optional scheduling for future streams
- **Thumbnail URL**: Optional preview image URL
- **Tags**: Comma-separated tags for categorization
- **Privacy Settings**: Public or private streams

#### Stream Management

- **Stream Status**: Tracks stream lifecycle (scheduled → starting → live → ended)
- **Viewer Analytics**: Real-time viewer count and peak viewers
- **Host Controls**: Start/end streams, manage privacy settings
- **Unique Stream Keys**: Auto-generated secure keys for RTMP broadcasting

#### Watching Streams

- **Public Streams**: Accessible to all authenticated users
- **Private Streams**: Restricted to invited users only
- **Real-time Viewer Tracking**: Automatic join/leave tracking
- **Playback URLs**: HLS streaming for smooth video delivery

### WebSocket Connections

Connect to WebSockets for real-time updates:

- **Notifications**: `ws://localhost:8000/ws/notifications/{user_id}/`
- **Post Updates**: `ws://localhost:8000/ws/posts/{post_id}/`
- **Live Stream Chat**: `ws://localhost:8000/ws/posts/stream/{stream_id}/` - Real-time chat messages for an active stream
- **Live Stream Status**: `ws://localhost:8000/ws/posts/stream/{stream_id}/` - Real-time viewer count and stream status changes
- **Global Stream Notifications**: `ws://localhost:8000/ws/posts/streams/status/` - Notifications when followed users go live

## Project Structure

```
social_media_api/
├── accounts/              # User management and authentication
│   ├── models.py          # Custom User model with profile fields
│   ├── views.py           # Registration, login, profile management
│   ├── serializers.py     # User serialization and validation
│   └── urls.py            # Authentication endpoints
├── posts/                 # Core content and live streaming
│   ├── models.py          # Post, Comment, Like, LiveStream models
│   ├── views.py           # API endpoints for content management
│   ├── serializers.py     # Content serialization and validation
│   └── urls.py            # Content API routes
├── notifications/         # Real-time notifications system
│   ├── models.py          # Notification model
│   ├── consumers.py       # WebSocket consumers
│   └── views.py           # Notification API endpoints
├── sports/                # Sports data management (leagues, teams, athletes)
│   ├── models.py          # League, Team, Athlete models
│   └── views.py           # Sports data API endpoints
├── social_media_api/      # Django project configuration
│   ├── settings.py        # Project settings and configuration
│   ├── urls.py            # Main URL routing
│   ├── asgi.py            # ASGI configuration for WebSockets
│   └── wsgi.py            # WSGI configuration
├── sportisode-ui/         # React frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── LiveStreamCreator.jsx    # Live stream creation modal
│   │   │   ├── SidebarNav.jsx           # Navigation with "Go Live" button
│   │   │   ├── RightSidebar.jsx         # Live streams display
│   │   │   ├── StreamPlayer.jsx         # HLS video player component
│   │   │   ├── Page/
│   │   │   │   └── StreamPage.jsx       # Dedicated stream viewing page
│   │   │   └── lib/
│   │   │       └── api.js               # API functions and utilities
│   │   ├── store/
│   │   │   ├── liveStreamSlice.js       # Redux slice for live streaming state
│   │   │   ├── store.js                 # Redux store configuration
│   │   │   └── ...                      # Other Redux slices
│   │   └── hooks/
│   │       └── useLiveStreamWebSocket.js # WebSocket hook for streams
│   └── ...
├── manage.py              # Django management script
├── requirements.txt        # Python dependencies
├── db.sqlite3            # SQLite database (development)
├── locustfile.py         # Load testing configuration with Locust
├── RATE_LIMITING_SCALABILITY.md  # Comprehensive rate limiting documentation
└── README.md
```

## Backend Architecture

### Django Apps Overview

#### 1. **Accounts App** (`accounts/`)
Manages user authentication, profiles, and social relationships.

**Models:**
- **User**: Custom user model extending Django's AbstractUser
  - Additional fields: bio, profile_image, banner_image, location, website
  - Relationships: followers (ManyToMany), following (ManyToMany), blocked_users, muted_users

**Key Features:**
- JWT-based authentication
- User registration and login
- Profile management with media uploads
- Follow/unfollow functionality
- Block/mute user controls

#### 2. **Posts App** (`posts/`)
Handles all content creation, interaction, and live streaming functionality.

**Models:**
- **Post**: Main content model
  - Fields: title, content, author, created_at, updated_at
  - Media: video, image, media_file (enhanced processing)
  - Features: likes_count, comments_count, reposts_count, views_count
  - Settings: is_pinned, is_highlighted, reply_settings

- **Comment**: Threaded comment system
  - Fields: post, author, parent_comment, content, created_at
  - Features: likes_count, nested replies

- **Like**: Post and comment interaction tracking
  - Relationships: post/user, comment/user

- **Repost**: Content sharing functionality
- **Bookmark**: User content saving
- **PostHashtag**: Hashtag indexing for search

- **LiveStream**: Live streaming functionality
  - Fields: title, description, host, stream_key, playback_url, stream_url
  - Status: scheduled → starting → live → ended
  - Features: viewer_count, peak_viewers, thumbnail_url, tags, is_private
  - Analytics: LiveStreamView tracking (join/leave times, watch duration)

- **MediaFile**: Enhanced media processing system
  - Support for images and videos with multiple sizes
  - Processing status tracking
  - Variants: thumbnail, preview, full size, HLS streaming

**Additional Files:**
- **s3_utils.py**: S3 media management utilities with pre-signed URLs
- **consumers.py**: WebSocket consumers with chat throttling
- **views_health.py**: Health check and monitoring endpoints
- **throttling.py**: Advanced rate limiting classes
- **tasks.py**: Async media processing with S3 uploads

**Key Features:**
- Content creation with rich media support
- Real-time commenting and liking
- Advanced feed algorithms
- Live streaming with viewer analytics
- Media processing pipeline

#### 3. **Notifications App** (`notifications/`)
Real-time notification system using WebSockets.

**Models:**
- **Notification**: User notifications
  - Types: like, comment, follow, repost, mention
  - Status: read/unread
  - Relationships: recipient, actor, target

**Key Features:**
- WebSocket-based real-time delivery
- Notification preferences
- Bulk read/unread operations
- Actor-target relationship tracking

#### 4. **Sports App** (`sports/`)
Sports data management for leagues, teams, and athletes.

**Models:**
- **League**: Sports leagues/tournaments
  - Fields: name, slug, description, sport, country, logo_url
  - Data: standings (JSON), teams relationship

- **Team**: Sports teams
  - Fields: name, slug, abbreviation, sport, league, city, country
  - Media: logo_url, stadium info
  - Data: roster, schedule (JSON)

- **Athlete**: Player profiles
  - Fields: first_name, last_name, position, team, sport
  - Stats: career_stats, achievements (JSON)
  - Media: photo_url

**Key Features:**
- Hierarchical sports data structure
- JSON-based flexible data storage
- Feed integration for sports content

### Database Design

**Key Relationships:**
- User ↔ Post (One-to-Many: author)
- Post ↔ Comment (One-to-Many)
- Post/User ↔ Like (Many-to-Many through Like model)
- User ↔ User (Many-to-Many: followers/following)
- Post ↔ MediaFile (One-to-One)
- LiveStream ↔ User (Many-to-One: host)
- LiveStream ↔ LiveStreamView (One-to-Many)

**Indexing Strategy:**
- Created_at fields for chronological ordering
- Foreign key indexes for performance
- Full-text search indexes for content
- Composite indexes for complex queries

### API Architecture

**RESTful Endpoints:**
- `/api/accounts/` - User management
- `/api/posts/` - Content and live streaming
- `/api/notifications/` - Notification management
- `/api/sports/` - Sports data

**WebSocket Channels:**
- `ws://localhost:8000/ws/notifications/{user_id}/`
- `ws://localhost:8000/ws/posts/{post_id}/`

**Authentication:**
- JWT tokens with refresh mechanism
- Session-based WebSocket authentication

## Development

### Running with Daphne (for WebSockets)

For full WebSocket support, use Daphne:

```bash
pip install daphne
daphne social_media_api.asgi:application
```

### Load Testing with Locust

The project includes comprehensive load testing configuration using Locust:

```bash
# Install Locust
pip install locust

# Run load tests
locust -f locustfile.py --host=http://localhost:8000

# Web UI access at http://localhost:8089
# Command line: locust -f locustfile.py --host=http://localhost:8000 --users=100 --spawn-rate=10
```

**Load Testing Scenarios:**
- **FeedBrowsingUser**: 70% of users - simulates feed browsing behavior
- **ContentCreationUser**: 15% of users - simulates content creation
- **StreamViewerUser**: 10% of users - simulates live stream viewing
- **SearchAndDiscoveryUser**: 5% of users - simulates search and discovery

### Unit Testing

```bash
python manage.py test
```

### Code Formatting

Use Black for code formatting:

```bash
pip install black
black .
```

## Deployment

### Environment Variables

Set the following environment variables for production:

```bash
# Django Settings
DEBUG=False
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database (PostgreSQL REQUIRED for production)
DATABASE_URL=postgresql://user:password@host:port/database

# Redis (REQUIRED for WebSockets and caching)
REDIS_URL=redis://localhost:6379/0

# AWS S3/CloudFront (REQUIRED for production media handling)
USE_S3=True
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_STORAGE_BUCKET_NAME=your-media-bucket-name
AWS_S3_REGION_NAME=us-east-1
AWS_S3_CUSTOM_DOMAIN=your-cloudfront-domain.cloudfront.net

# Live Streaming (Mux - REQUIRED for live streaming)
MUX_TOKEN_ID=your-mux-token-id
MUX_TOKEN_SECRET=your-mux-token-secret
MUX_WEBHOOK_SECRET=your-mux-webhook-secret
MUX_WEBHOOK_URL=https://yourdomain.com/api/posts/live/webhook/

# Security Settings
WEBHOOK_SIGNATURE_TOLERANCE=300
STREAM_CREATION_RATE_LIMIT=10/hour
CHAT_MESSAGE_RATE_LIMIT=30/minute

# Celery (REQUIRED for async processing)
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Rate Limiting Configuration
POST_CREATION_RATE_LIMIT=10/hour
LIVE_STREAM_CREATION_RATE_LIMIT=3/day
MEDIA_UPLOAD_RATE_LIMIT=20/minute
CHAT_MESSAGE_RATE_LIMIT=5/minute
FEED_ACCESS_RATE_LIMIT=100/minute
SEARCH_RATE_LIMIT=30/minute

# Monitoring & Health Checks
HEALTH_CHECK_ENABLED=true
METRICS_ENABLED=true
RATE_LIMIT_MONITORING=true

# Production Security (automatically enabled when DEBUG=False)
SECURE_SSL_REDIRECT=true
SECURE_HSTS_SECONDS=31536000
SESSION_COOKIE_SECURE=true
CSRF_COOKIE_SECURE=true
```

### Live Streaming Setup

1. **Create Mux Account**: Sign up at [mux.com](https://mux.com)
2. **Get API Credentials**: Obtain Token ID and Secret from Mux dashboard
3. **Configure Webhooks**: Set webhook URL in Mux to receive stream events
4. **Environment Variables**: Set MUX_* variables as shown above

### Production Deployment Steps

1. Set `DEBUG = False` in settings.py (this automatically enables all security settings)
2. Configure security settings:
    - `SECURE_BROWSER_XSS_FILTER = True`
    - `SECURE_SSL_REDIRECT = True`
    - `X_FRAME_OPTIONS = 'DENY'`
3. Configure static and media files:
    - Run `python manage.py collectstatic` to collect static files
    - Use AWS S3/CloudFront for media files with django-storages
4. Configure a production database (PostgreSQL recommended)
5. Set up Redis for Channel Layers and caching
6. Use Daphne for ASGI server (required for WebSockets)
7. Configure nginx/apache for static/media file serving
8. Set proper ALLOWED_HOSTS and SECRET_KEY
9. Configure SSL certificate for HTTPS (required for streaming)

### Streaming Infrastructure

The live streaming feature requires:

- **Mux Video API**: Handles RTMP ingestion, transcoding, and HLS delivery
- **RTMP Broadcasting**: Users broadcast using OBS Studio or similar software
- **HLS Playback**: Low-latency video streaming to viewers
- **Webhooks**: Real-time notifications of stream status changes
- **CDN**: Global content delivery for optimal performance

### Security Configuration

**Development vs Production Security:**
- The security warnings shown by `python manage.py check --deploy` are expected in development
- All security settings are automatically enabled when `DEBUG = False` in production
- Use strong, randomly generated `SECRET_KEY` in production environments

### Monitoring

Monitor these key metrics:
- Stream connection success rates
- Viewer count and engagement
- Webhook delivery reliability
- API response times for streaming endpoints

### New Deployment Requirement

**Asynchronous Workers**: You will need a worker process (like Celery or an equivalent) to handle stream processing tasks that shouldn't block the main web thread (e.g., initiating the VOD archival process upon receiving the stream-ended webhook).

## Recent Updates

### Enterprise-Grade Rate Limiting & Scalability (Latest)

**Implemented comprehensive rate limiting, load testing, and production monitoring system** with enterprise-grade security and scalability features.

#### Key Security & Performance Features Implemented

- **Advanced API Throttling**: Multi-layer rate limiting with burst and sustained controls
  - Post creation: 10/hour (authenticated), 1/hour (anonymous)
  - Live streams: 3/day per user with active stream limits
  - Media uploads: 20/minute to prevent abuse
  - Feed access: 100/minute to prevent excessive polling
  - Search: 30/minute to prevent database load
  - Chat messages: 5/minute per WebSocket user

- **Load Testing Infrastructure**: Complete Locust configuration with 4 user behavior patterns
  - FeedBrowsingUser (70%): Simulates typical feed browsing
  - ContentCreationUser (15%): Simulates content creators
  - StreamViewerUser (10%): Simulates live stream viewers
  - SearchAndDiscoveryUser (5%): Simulates search/discovery users

- **Production Monitoring**: Enterprise-grade health checks and alerting
  - Basic health check: Load balancer monitoring
  - Detailed health check: System metrics and performance data
  - Metrics endpoint: Prometheus-compatible monitoring
  - Rate limit status: Debug throttling issues

- **WebSocket Security**: Real-time communication protection
  - Chat message throttling with user-specific limits
  - Connection management with proper cleanup
  - Message validation and content filtering

- **Scalability Architecture**: Production-ready infrastructure
  - Redis backend for shared throttling storage
  - Async processing with Celery for heavy tasks
  - Horizontal scaling support with stateless design
  - CDN integration for global media delivery

#### Implementation Details

**Throttling Classes:**
```python
# Advanced rate limiting with multiple scopes
class PostCreationThrottle(UserRateThrottle):
    scope = 'post_creation'
    rate = '10/hour'

class BurstRateThrottle(UserRateThrottle):
    scope = 'burst'
    rate = '60/minute'

class ChatMessageThrottleConsumer:
    # WebSocket throttling mixin
    async def check_chat_throttle(self, user):
        # Rate limiting for real-time chat
```

**Load Testing Scenarios:**
```python
# Comprehensive user behavior simulation
class FeedBrowsingUser(HttpUser):
    wait_time = between(1, 5)
    # 70% of users - feed browsing behavior

class ContentCreationUser(HttpUser):
    wait_time = between(10, 30)
    # 15% of users - content creation patterns
```

**Health Monitoring:**
```python
# Production health checks
@require_GET
def health_check(request):
    # Basic load balancer health check
    return JsonResponse({"status": "healthy"})

@require_GET
@cache_page(60)
def detailed_health_check(request):
    # Detailed system monitoring with metrics
    return JsonResponse(health_data)
```

#### Production Deployment Requirements

**Environment Variables:**
```bash
# Rate Limiting Configuration
POST_CREATION_RATE_LIMIT=10/hour
LIVE_STREAM_CREATION_RATE_LIMIT=3/day
MEDIA_UPLOAD_RATE_LIMIT=20/minute
CHAT_MESSAGE_RATE_LIMIT=5/minute
FEED_ACCESS_RATE_LIMIT=100/minute
SEARCH_RATE_LIMIT=30/minute

# Monitoring & Health Checks
HEALTH_CHECK_ENABLED=true
METRICS_ENABLED=true
RATE_LIMIT_MONITORING=true
```

#### Files Added/Modified

- `posts/throttling.py`: Advanced rate limiting classes
- `posts/consumers.py`: WebSocket consumers with throttling
- `posts/views_health.py`: Health check and monitoring endpoints
- `posts/s3_utils.py`: S3 media management utilities
- `locustfile.py`: Load testing configuration
- `RATE_LIMITING_SCALABILITY.md`: Comprehensive documentation

#### Security Benefits

- **DoS Protection**: Multi-layer rate limiting prevents abuse
- **Spam Prevention**: Content creation and chat limits
- **Scalability**: Auto-scaling triggers based on real metrics
- **Monitoring**: Real-time alerting for performance issues
- **WebSocket Security**: Protected real-time communications

This implementation provides **enterprise-grade protection** while maintaining excellent user experience and system performance under high load conditions.

### Secure Media Uploads and Playback with S3/CloudFront (Latest)

**Implemented enterprise-grade secure media storage and delivery system** with AWS S3/CloudFront integration, pre-signed URLs for private content, and comprehensive CORS configuration.

#### Key Security Features Implemented

- **S3 Storage Backend**: All media files now use AWS S3 by default (configurable via USE_S3 environment variable)
- **Pre-signed URLs**: Private media (archived streams) use time-limited signed URLs (60-second expiration)
- **CORS Configuration**: Proper cross-origin resource sharing for React frontend domains
- **Media Processing Pipeline**: Asynchronous processing uploads variants directly to S3
- **Production Validation**: Environment variable validation for required AWS credentials

#### S3 Integration Details

**Settings Configuration:**
```python
# S3 enabled by default for production security
USE_S3 = os.getenv('USE_S3', 'true').lower() == 'true'

if USE_S3:
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    AWS_S3_CORS_ORIGINS = [
        'http://localhost:5173',  # Development
        os.getenv('FRONTEND_URL', 'https://yourdomain.com'),  # Production
    ]
```

**Media Processing Tasks:**
- Image variants (thumbnail, preview, full) uploaded directly to S3
- Video thumbnails and HLS playlists stored in S3
- Proper S3 key generation: `media/{media_id}/{variant}.ext`

**Pre-signed URL Implementation:**
```python
# For private streams (LiveStream.is_private = True)
signed_url = s3_manager.generate_presigned_url(s3_key, expiration=3600)

# For public post media
direct_url = get_media_url(s3_key)  # CloudFront URL
```

**CORS Management:**
- S3 bucket CORS configured via management command: `python manage.py configure_s3_cors`
- CloudFront distribution handles CORS headers for CDN delivery
- Supports both development (localhost:5173) and production domains

#### Environment Variables Required

```bash
# AWS S3 Configuration (REQUIRED for secure media handling)
USE_S3=true
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_STORAGE_BUCKET_NAME=your-media-bucket-name
AWS_S3_REGION_NAME=us-east-1
AWS_S3_CUSTOM_DOMAIN=your-cloudfront-domain.cloudfront.net

# Frontend URL for CORS
FRONTEND_URL=https://yourdomain.com
```

#### Security Architecture

- **Access Control**: Private streams require user authentication and permission checks
- **URL Expiration**: Signed URLs expire after 60 seconds for private content, 1 hour for streams
- **HTTPS Only**: All media served over secure connections via CloudFront
- **Bucket Policies**: Restrictive S3 bucket policies with proper access controls

#### Migration Strategy

- **Backward Compatibility**: Local storage still available when USE_S3=false
- **Gradual Rollout**: Environment variable control allows staged deployment
- **Data Integrity**: Existing media files remain accessible during transition

### Comprehensive Live Streaming Platform (Latest)

Implemented a complete, production-ready live streaming platform with professional broadcasting tools, real-time chat, Redux state management, and enterprise-grade architecture.

#### Backend Architecture
- **Models**: `LiveStream`, `LiveStreamView` for stream management and viewer analytics
- **API Endpoints**: Full REST API with 9 endpoints for stream lifecycle management
- **WebSocket Consumers**: `LiveStreamConsumer`, `StreamStatusConsumer` for real-time features
- **Serializers**: `LiveStreamSerializer`, `LiveStreamCreateSerializer`, `LiveStreamStartSerializer`
- **Views**: `LiveStreamViewSet` with CRUD operations, `LiveStreamWatchView` for viewer tracking
- **Authentication**: JWT-based auth with proper permissions for stream operations
- **External Integration**: Mux Video API for RTMP ingestion and HLS delivery
- **Webhook Processing**: Real-time status updates from streaming service
- **Asynchronous Tasks**: Celery integration for stream processing (VOD archival)

#### Frontend Architecture
- **Redux State Management**: Complete `liveStreamSlice` with centralized state for all streaming features
- **Components**: `LiveStreamCreator`, `StreamPlayer`, `StreamPage` with full functionality
- **WebSocket Integration**: Real-time chat, viewer counts, and status updates
- **UI/UX**: Professional broadcasting interface with OBS Studio setup instructions
- **Responsive Design**: Mobile-first streaming experience
- **Performance**: Optimized with lazy loading, code splitting, and efficient re-renders

#### Real-time Features
- **Live Chat**: Authenticated messaging during streams with rate limiting
- **Viewer Analytics**: Real-time counts, join/leave tracking, geographic data
- **Stream Status**: Instant updates across all clients (live/ended/scheduled)
- **Global Notifications**: Followers notified when followed users go live
- **Connection Resilience**: Auto-reconnection with heartbeat monitoring
- **WebSocket Channels**: Dedicated channels for chat, status, and notifications

#### Professional Broadcasting
- **RTMP Support**: Industry-standard streaming protocol
- **HLS Delivery**: Low-latency video delivery to viewers
- **Stream Keys**: Unique, secure keys for each broadcast
- **OBS Integration**: Complete setup guide with copy-to-clipboard URLs
- **Multi-platform**: Support for OBS Studio, Streamlabs, XSplit, and more
- **Privacy Controls**: Public streams (open to all) and private streams (invite-only)

#### State Management (Redux)
```javascript
// Comprehensive state structure
{
  liveStreams: [],           // All streams with real-time updates
  currentStream: null,       // Active viewing stream
  viewerCounts: {},          // Real-time viewer counts by stream ID
  streamStatuses: {},        // Live/ended status with metadata
  chatMessages: {},          // Chat history with timestamps
  wsConnections: {},         // WebSocket health monitoring
  activeModal: null,         // UI modal state management
  creatingStream: false,     // Async operation states
  createStreamError: null,   // Error handling
}
```

#### Infrastructure & Deployment
- **Redis**: Channel layers for WebSocket broadcasting and caching
- **Celery**: Asynchronous processing for stream archival and analytics
- **Mux Integration**: Professional video streaming with webhooks
- **Environment Configuration**: Complete setup for production deployment
- **Monitoring**: Key metrics for stream performance and user engagement
- **Scalability**: Architecture designed for high-concurrency streaming

#### Key Achievements
- ✅ **Complete Live Streaming Platform**: From creation to broadcast to viewing
- ✅ **Real-time Synchronization**: Instant updates across all connected clients
- ✅ **Professional Broadcasting**: Industry-standard RTMP/HLS with OBS integration
- ✅ **Enterprise State Management**: Redux-powered centralized state
- ✅ **Production Ready**: Comprehensive deployment and monitoring setup
- ✅ **User Experience**: Intuitive interface with real-time chat and analytics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.