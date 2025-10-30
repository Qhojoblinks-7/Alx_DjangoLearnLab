# Advanced View Count Detection & Analytics Architecture

## Overview
This document outlines a sophisticated view detection and analytics system that goes beyond simple page-load counting to provide accurate, real-time metrics with comprehensive filtering and advanced analytics capabilities.

## Current Implementation Status
✅ **Basic View Counting**: Implemented with POST detail page triggers
✅ **Colored Mentions & Hashtags**: Fully implemented and tested
🔄 **Advanced Features**: Planned for implementation

---

## 1. Real-Time View Detection System 🚀

### Architecture Components

#### A. Frontend View Detection (Intersection Observer)

**File**: `src/components/hooks/useViewTracking.js`
```javascript
// Hook for tracking post visibility and triggering view events
const useViewTracking = (postId, options = {}) => {
  const {
    threshold = 0.5,      // 50% of post must be visible
    timeThreshold = 500,  // Must be visible for 500ms
    rootMargin = '0px'
  } = options;

  // Implementation uses Intersection Observer API
  // Triggers view event when conditions are met
};
```

**Integration Points**:
- `InfiniteFeed.jsx`: Track views in feed
- `PostCard.jsx`: Individual post visibility
- `PostDetailPage.jsx`: Detail view tracking

#### B. Backend API Enhancement

**Enhanced PostViewView** (`posts/views.py`):
```python
class PostViewView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, pk):
        post = generics.get_object_or_404(Post, pk=pk)
        user = request.user if request.user.is_authenticated else None
        client_ip = get_client_ip(request)

        # Advanced filtering logic
        if self._should_count_view(post, user, client_ip, request):
            # Atomic increment with metadata
            Post.objects.filter(pk=pk).update(
                views_count=F('views_count') + 1,
                last_viewed_at=timezone.now()
            )

            # Log detailed analytics event
            self._log_view_event(post, user, client_ip, request)

        return Response({"message": "View processed"})
```

**Filtering Logic**:
```python
def _should_count_view(self, post, user, client_ip, request):
    """Determine if this view should be counted"""

    # 1. Self-view exclusion
    if user and user == post.author:
        return False

    # 2. Rate limiting (5 minute cooldown per user/IP)
    cache_key = f"view:{post.id}:{user.id if user else client_ip}"
    if cache.get(cache_key):
        return False
    cache.set(cache_key, True, 300)  # 5 minutes

    # 3. Bot detection
    user_agent = request.META.get('HTTP_USER_AGENT', '')
    if self._is_bot(user_agent):
        return False

    # 4. Session validation
    session_key = request.session.session_key
    if not self._is_valid_session(session_key):
        return False

    return True
```

#### C. Database Schema Extensions

**New Models**:
```python
class PostView(models.Model):
    """Detailed view tracking for analytics"""
    post = models.ForeignKey(Post, on_delete=models.CASCADE)
    user = models.ForeignKey(User, null=True, on_delete=models.SET_NULL)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    session_key = models.CharField(max_length=40, null=True)
    viewed_at = models.DateTimeField(default=timezone.now)
    view_duration = models.IntegerField(null=True)  # milliseconds
    referrer = models.URLField(null=True)

class AnalyticsEvent(models.Model):
    """Generic analytics event logging"""
    EVENT_TYPES = [
        ('view', 'Post View'),
        ('impression', 'Post Impression'),
        ('engagement', 'User Engagement'),
        ('navigation', 'Navigation Event'),
    ]

    post = models.ForeignKey(Post, on_delete=models.CASCADE, null=True)
    user = models.ForeignKey(User, null=True, on_delete=models.SET_NULL)
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    event_data = models.JSONField()
    timestamp = models.DateTimeField(default=timezone.now)
    session_id = models.CharField(max_length=40)
    ip_address = models.GenericIPAddressField()
```

---

## 2. Asynchronous Analytics Pipeline 📊

### A. Event Logging System

**Event Producer** (`posts/views.py`):
```python
def _log_analytics_event(self, event_type, post, user, request, extra_data=None):
    """Log analytics event to message queue"""
    event_data = {
        'event_type': event_type,
        'post_id': post.id if post else None,
        'user_id': user.id if user else None,
        'timestamp': timezone.now().isoformat(),
        'session_id': request.session.session_key,
        'ip_address': get_client_ip(request),
        'user_agent': request.META.get('HTTP_USER_AGENT'),
        'referrer': request.META.get('HTTP_REFERER'),
        'url': request.build_absolute_uri(),
        'extra_data': extra_data or {}
    }

    # Send to message queue (Redis/Celery/RabbitMQ)
    send_to_queue('analytics_events', event_data)
```

**Event Types**:
- `post_view`: Detailed view tracking
- `post_impression`: Feed visibility
- `engagement_click`: Like, repost, comment actions
- `video_play`: Video engagement metrics
- `profile_visit`: Navigation tracking

### B. Message Queue Architecture

**Queue Configuration**:
```python
# settings.py
CELERY_BROKER_URL = 'redis://localhost:6379/0'
CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'

# Celery tasks
@shared_task
def process_analytics_event(event_data):
    """Process individual analytics event"""
    # Validate and store event
    # Update real-time metrics
    # Trigger notifications if needed
```

**Queue Consumer**:
```python
# analytics/consumer.py
def consume_analytics_events():
    """Background worker for processing analytics"""
    while True:
        event = queue.pop('analytics_events')
        process_event(event)
        update_real_time_metrics(event)
```

### C. Data Processing Pipeline

**Real-Time Metrics** (Redis):
```python
# Real-time counters
post_views:{post_id}  # Current view count
post_impressions:{post_id}  # Feed impressions
user_engagement:{user_id}  # User activity score
```

**Batch Processing** (Daily/Hourly):
```python
# analytics/tasks.py
@shared_task
def calculate_daily_metrics():
    """Calculate complex metrics that require aggregation"""
    # Engagement rate: (likes + comments + reposts) / impressions
    # Demographics: User location, age distribution
    # Traffic sources: Referrer analysis
    # Video metrics: Watch time, completion rate
    # Trend analysis: Velocity calculations
```

---

## 3. Advanced Metrics & Analytics

### A. Core Metrics

| Metric | Calculation | Update Frequency |
|--------|-------------|------------------|
| **Views** | Atomic counter increment | Real-time |
| **Impressions** | Intersection Observer triggers | Real-time |
| **Engagement Rate** | (Likes + Comments + Reposts) / Impressions | Hourly |
| **Reach** | Unique users who saw post | Daily |
| **Video Views** | 3+ seconds watched or 50% completion | Real-time |
| **Demographics** | User profile data aggregation | Daily |

### B. Analytics Dashboard API

**PostAnalyticsView** (`posts/views.py`):
```python
class PostAnalyticsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        post = generics.get_object_or_404(Post, pk=pk)

        if post.author != request.user:
            return Response({"error": "Access denied"}, status=403)

        # Real-time metrics
        real_time = self._get_real_time_metrics(post)

        # Historical data
        historical = self._get_historical_metrics(post)

        # Demographic breakdown
        demographics = self._get_demographic_data(post)

        return Response({
            'real_time': real_time,
            'historical': historical,
            'demographics': demographics,
            'insights': self._generate_insights(post)
        })
```

### C. Frontend Analytics Display

**Analytics Dashboard Component**:
```jsx
// src/components/analytics/PostAnalytics.jsx
const PostAnalytics = ({ postId }) => {
  const { data: analytics } = useQuery({
    queryKey: ['post-analytics', postId],
    queryFn: () => authenticatedFetch(`/posts/${postId}/analytics/`),
    refetchInterval: 30000  // Refresh every 30 seconds
  });

  return (
    <div className="analytics-dashboard">
      <RealTimeMetrics data={analytics.real_time} />
      <EngagementChart data={analytics.historical} />
      <DemographicsBreakdown data={analytics.demographics} />
      <InsightsPanel insights={analytics.insights} />
    </div>
  );
};
```

---

## 4. Implementation Roadmap

### Phase 1: Enhanced View Detection ✅
- [x] Basic view counting (completed)
- [ ] Intersection Observer implementation
- [ ] Rate limiting and filtering
- [ ] Self-view exclusion

### Phase 2: Analytics Infrastructure
- [ ] Event logging system
- [ ] Message queue setup
- [ ] Real-time metrics storage

### Phase 3: Advanced Analytics
- [ ] Data processing pipeline
- [ ] Analytics dashboard
- [ ] Demographic analysis
- [ ] Trend detection

### Phase 4: Optimization & Scaling
- [ ] Performance monitoring
- [ ] Database optimization
- [ ] Caching strategies
- [ ] CDN integration

---

## 5. Technical Considerations

### Performance
- **Async Processing**: All analytics operations are non-blocking
- **Caching**: Redis for real-time counters, database for historical data
- **Rate Limiting**: Prevents abuse while maintaining accuracy

### Privacy & Compliance
- **Data Retention**: Configurable retention policies
- **GDPR Compliance**: User data handling and deletion
- **Anonymization**: IP addresses hashed for privacy

### Scalability
- **Horizontal Scaling**: Message queue allows multiple consumers
- **Database Sharding**: Analytics data can be sharded by time
- **CDN Integration**: Static assets and cached metrics

### Monitoring & Alerting
- **Metrics Collection**: System performance and accuracy monitoring
- **Alerting**: Anomalies in view counting or system performance
- **A/B Testing**: Analytics accuracy validation

---

## 6. Success Metrics

- **Accuracy**: <5% deviation from manual counts
- **Performance**: <100ms latency for view registration
- **Reliability**: 99.9% uptime for analytics pipeline
- **Scalability**: Handle 10M+ daily views without degradation

This architecture provides a robust, scalable foundation for accurate view tracking and comprehensive analytics while maintaining excellent user experience and system performance.