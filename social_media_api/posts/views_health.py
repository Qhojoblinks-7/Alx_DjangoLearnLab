from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.views.decorators.cache import cache_page
from django.conf import settings
from django.core.cache import cache
from django.db import connection
import redis
import boto3
import psutil
import time
from datetime import datetime, timedelta


@require_GET
def health_check(request):
    """
    Basic health check endpoint for load balancers and monitoring.
    Returns 200 if service is healthy, 503 if not.
    """
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "sportisode-api",
        "version": getattr(settings, 'VERSION', '1.0.0')
    }

    # Check database connectivity
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        health_status["database"] = "healthy"
    except Exception as e:
        health_status["database"] = "unhealthy"
        health_status["status"] = "unhealthy"
        health_status["database_error"] = str(e)

    # Check Redis connectivity
    try:
        redis_client = redis.from_url(settings.CACHES['analytics']['LOCATION'])
        redis_client.ping()
        health_status["redis"] = "healthy"
    except Exception as e:
        health_status["redis"] = "unhealthy"
        health_status["redis_error"] = str(e)

    # Check S3 connectivity (if enabled)
    if getattr(settings, 'USE_S3', True):
        try:
            s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_S3_REGION_NAME
            )
            # Simple head bucket operation
            s3_client.head_bucket(Bucket=settings.AWS_STORAGE_BUCKET_NAME)
            health_status["s3"] = "healthy"
        except Exception as e:
            health_status["s3"] = "unhealthy"
            health_status["s3_error"] = str(e)

    status_code = 200 if health_status["status"] == "healthy" else 503
    return JsonResponse(health_status, status=status_code)


@require_GET
@cache_page(60)  # Cache for 1 minute
def detailed_health_check(request):
    """
    Detailed health check with performance metrics.
    """
    start_time = time.time()

    health_data = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "response_time": None,
        "system": {},
        "database": {},
        "cache": {},
        "storage": {},
        "throttling": {}
    }

    # System metrics
    try:
        health_data["system"] = {
            "cpu_percent": psutil.cpu_percent(interval=0.1),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_usage_percent": psutil.disk_usage('/').percent,
            "load_average": psutil.getloadavg() if hasattr(psutil, 'getloadavg') else None
        }
    except Exception as e:
        health_data["system"]["error"] = str(e)

    # Database metrics
    try:
        db_start = time.time()
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM posts_post")
            post_count = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM accounts_user")
            user_count = cursor.fetchone()[0]

        db_time = time.time() - db_start

        health_data["database"] = {
            "status": "healthy",
            "response_time": round(db_time * 1000, 2),  # ms
            "posts_count": post_count,
            "users_count": user_count,
            "connections": len(connection.queries) if hasattr(connection, 'queries') else None
        }
    except Exception as e:
        health_data["database"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health_data["status"] = "unhealthy"

    # Cache metrics
    try:
        cache_start = time.time()
        cache.set('health_check', 'ok', 10)
        cache_value = cache.get('health_check')
        cache_time = time.time() - cache_start

        health_data["cache"] = {
            "status": "healthy" if cache_value == 'ok' else "unhealthy",
            "response_time": round(cache_time * 1000, 2),  # ms
            "backend": settings.CACHES['default']['BACKEND'].split('.')[-1]
        }
    except Exception as e:
        health_data["cache"] = {
            "status": "unhealthy",
            "error": str(e)
        }

    # Storage metrics
    if getattr(settings, 'USE_S3', True):
        try:
            s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_S3_REGION_NAME
            )

            storage_start = time.time()
            # Get bucket size (approximate)
            paginator = s3_client.get_paginator('list_objects_v2')
            total_size = 0
            total_objects = 0

            for page in paginator.paginate(Bucket=settings.AWS_STORAGE_BUCKET_NAME):
                if 'Contents' in page:
                    for obj in page['Contents']:
                        total_size += obj['Size']
                        total_objects += 1

            storage_time = time.time() - storage_start

            health_data["storage"] = {
                "status": "healthy",
                "provider": "s3",
                "bucket": settings.AWS_STORAGE_BUCKET_NAME,
                "response_time": round(storage_time * 1000, 2),  # ms
                "total_objects": total_objects,
                "total_size_mb": round(total_size / (1024 * 1024), 2)
            }
        except Exception as e:
            health_data["storage"] = {
                "status": "unhealthy",
                "error": str(e)
            }

    # Throttling metrics
    try:
        # Get throttling statistics from cache
        throttle_keys = cache.keys('throttle_*') if hasattr(cache, 'keys') else []

        health_data["throttling"] = {
            "active_throttles": len(throttle_keys) if throttle_keys else 0,
            "throttle_settings": {
                "post_creation": settings.REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'].get('post_creation', 'N/A'),
                "live_stream_creation": settings.REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'].get('live_stream_creation', 'N/A'),
                "media_upload": settings.REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'].get('media_upload', 'N/A'),
                "chat_messages": settings.REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'].get('chat_messages', 'N/A'),
                "feed_access": settings.REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'].get('feed_access', 'N/A'),
                "search": settings.REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'].get('search', 'N/A')
            }
        }
    except Exception as e:
        health_data["throttling"]["error"] = str(e)

    # Calculate total response time
    total_time = time.time() - start_time
    health_data["response_time"] = round(total_time * 1000, 2)  # ms

    # Performance thresholds
    if health_data["response_time"] > 5000:  # 5 seconds
        health_data["status"] = "degraded"
        health_data["performance_issue"] = "Slow response time"

    if health_data["system"].get("memory_percent", 0) > 90:
        health_data["status"] = "critical"
        health_data["memory_issue"] = "High memory usage"

    status_code = 200
    if health_data["status"] == "unhealthy":
        status_code = 503
    elif health_data["status"] == "critical":
        status_code = 503
    elif health_data["status"] == "degraded":
        status_code = 200  # Still serve but with warning

    return JsonResponse(health_data, status=status_code)


@require_GET
def metrics_endpoint(request):
    """
    Prometheus-style metrics endpoint for monitoring.
    """
    metrics = []

    # System metrics
    try:
        cpu_percent = psutil.cpu_percent()
        memory_percent = psutil.virtual_memory().percent
        disk_percent = psutil.disk_usage('/').percent

        metrics.extend([
            f'# HELP sportisode_cpu_usage_percent CPU usage percentage',
            f'# TYPE sportisode_cpu_usage_percent gauge',
            f'sportisode_cpu_usage_percent {cpu_percent}',
            f'',
            f'# HELP sportisode_memory_usage_percent Memory usage percentage',
            f'# TYPE sportisode_memory_usage_percent gauge',
            f'sportisode_memory_usage_percent {memory_percent}',
            f'',
            f'# HELP sportisode_disk_usage_percent Disk usage percentage',
            f'# TYPE sportisode_disk_usage_percent gauge',
            f'sportisode_disk_usage_percent {disk_percent}',
        ])
    except Exception as e:
        metrics.append(f'# ERROR collecting system metrics: {e}')

    # Database metrics
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM posts_post")
            post_count = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM accounts_user")
            user_count = cursor.fetchone()[0]

        metrics.extend([
            f'# HELP sportisode_posts_total Total number of posts',
            f'# TYPE sportisode_posts_total gauge',
            f'sportisode_posts_total {post_count}',
            f'',
            f'# HELP sportisode_users_total Total number of users',
            f'# TYPE sportisode_users_total gauge',
            f'sportisode_users_total {user_count}',
        ])
    except Exception as e:
        metrics.append(f'# ERROR collecting database metrics: {e}')

    # Throttling metrics
    try:
        throttle_keys = cache.keys('throttle_*') if hasattr(cache, 'keys') else []
        active_throttles = len(throttle_keys) if throttle_keys else 0

        metrics.extend([
            f'# HELP sportisode_active_throttles Number of active throttle entries',
            f'# TYPE sportisode_active_throttles gauge',
            f'sportisode_active_throttles {active_throttles}',
        ])
    except Exception as e:
        metrics.append(f'# ERROR collecting throttling metrics: {e}')

    return JsonResponse('\n'.join(metrics), content_type='text/plain; charset=utf-8', safe=False)


@require_GET
def rate_limit_status(request):
    """
    Endpoint to check current rate limiting status for the requesting user.
    Useful for debugging throttling issues.
    """
    user = request.user
    status_data = {
        "user_authenticated": user.is_authenticated,
        "user_id": user.id if user.is_authenticated else None,
        "throttle_status": {},
        "rate_limits": settings.REST_FRAMEWORK.get('DEFAULT_THROTTLE_RATES', {})
    }

    if user.is_authenticated:
        # Check various throttle statuses
        from .throttling import PostCreationThrottle, LiveStreamCreationThrottle, MediaUploadThrottle

        throttles_to_check = [
            ('post_creation', PostCreationThrottle()),
            ('live_stream_creation', LiveStreamCreationThrottle()),
            ('media_upload', MediaUploadThrottle()),
        ]

        for throttle_name, throttle_instance in throttles_to_check:
            try:
                # Create a mock request for throttling check
                mock_request = type('MockRequest', (), {
                    'user': user,
                    'method': 'POST'
                })()

                allowed = throttle_instance.allow_request(mock_request, None)
                status_data["throttle_status"][throttle_name] = {
                    "allowed": allowed,
                    "rate": throttle_instance.get_rate()
                }
            except Exception as e:
                status_data["throttle_status"][throttle_name] = {
                    "error": str(e)
                }

    return JsonResponse(status_data)