from rest_framework.routers import DefaultRouter
from .views import (
    PostViewSet, CommentViewSet, PostLikeView, PostShareView, PostRepostView,
    PostBookmarkView, PostUnlikeView, CommentLikeView, GetUploadURLView,
    TrendsView, LeaguesView, LeagueFeedView, TeamsView, TeamFeedView,
    AthleteFeedView, CommunityFeedView, PostDetailView, PostRepliesView,
    PostReplyView, CreatePostView, UserPostsFeedView, UserRepliesFeedView,
    UserLikesFeedView, LiveEventsView, TrendingSidebarView, SuggestedUsersView,
    PostViewView, PostPinView, PostHighlightView, PostAnalyticsView,
    PostReplySettingsView, PostEngagementsView, PostEmbedView, SearchViewSet,
    LiveStreamViewSet, LiveStreamWatchView, mux_webhook, CommentRepliesView,
    HomeFeedViewSet, DevUploadView
)
from .views_health import health_check, detailed_health_check, metrics_endpoint, rate_limit_status
from django.urls import path, include

app_name = 'post'

router = DefaultRouter()
router.register(r'', PostViewSet, basename='post')

urlpatterns = [
    path('create/', CreatePostView.as_view(), name='create-post'),  # B-POST-01
    path('feed/home/', HomeFeedViewSet.as_view({'get': 'list'}), name='feed-timeline'),
    path('upload-url/', GetUploadURLView.as_view(), name='get-upload-url'),  # B-UPLOAD-01
    path('dev-upload/', DevUploadView.as_view(), name='dev-upload'),  # Development upload endpoint
    path('<int:pk>/like/', PostLikeView.as_view(), name='post-like'),
    path('<int:pk>/share/', PostShareView.as_view(), name='post-share'),
    path('<int:pk>/repost/', PostRepostView.as_view(), name='post-repost'),
    path('<int:pk>/bookmark/', PostBookmarkView.as_view(), name='post-bookmark'),  # B-POST-12
    path('<int:pk>/unlike/', PostUnlikeView.as_view(), name='post-unlike'),
    path('<int:post_pk>/comments/', CommentViewSet.as_view({'get': 'list', 'post': 'create'}), name='post-comments'),
    path('<int:post_pk>/comments/<int:pk>/', CommentViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='post-comment-detail'),
    path('comments/<int:comment_id>/replies/', CommentRepliesView.as_view({'get': 'list'}), name='comment-replies'),
    path('comments/<int:pk>/like/', CommentLikeView.as_view(), name='comment-like'),
    path('comments/<int:comment_id>/replies/', CommentRepliesView.as_view({'get': 'list'}), name='comment-replies'),
    path('comments/<int:comment_id>/replies/', CommentRepliesView.as_view({'get': 'list'}), name='comment-replies'),
    path('league/<str:league_slug>/', LeagueFeedView.as_view({'get': 'list'}), name='league-feed'),  # B-LEAGUE-03
    path('team/<str:team_slug>/', TeamFeedView.as_view({'get': 'list'}), name='team-feed'),  # B-TEAM-03
    path('athlete/<str:athlete_slug>/', AthleteFeedView.as_view({'get': 'list'}), name='athlete-feed'),  # B-ATHLETE-03
    path('community/<str:community_slug>/', CommunityFeedView.as_view({'get': 'list'}), name='community-feed'),

    # Community Post Detail endpoints - handled by PostViewSet router
    path('<int:post_id>/replies/', PostRepliesView.as_view({'get': 'list'}), name='post-replies'),  # B-POST-02
    path('<int:pk>/reply/', PostReplyView.as_view(), name='post-reply'),  # B-POST-03

    # Enhanced Post Actions
    path('<int:pk>/view/', PostViewView.as_view(), name='post-view'),  # Track views
    path('<int:pk>/pin/', PostPinView.as_view(), name='post-pin'),  # Pin/unpin post
    path('<int:pk>/highlight/', PostHighlightView.as_view(), name='post-highlight'),  # Highlight post
    path('<int:pk>/reply_settings/', PostReplySettingsView.as_view(), name='post-reply-settings'),  # B-ACT-04
    path('<int:pk>/engagements/', PostEngagementsView.as_view(), name='post-engagements'),  # B-ACT-07
    path('<int:pk>/embed/', PostEmbedView.as_view(), name='post-embed'),  # B-ACT-09
    path('<int:pk>/analytics/', PostAnalyticsView.as_view(), name='post-analytics'),  # Get analytics

    # Profile User Feed endpoints
    path('user/<str:username>/posts/', UserPostsFeedView.as_view({'get': 'list'}), name='user-posts'),  # B-PROF-03
    path('user/<str:username>/replies/', UserRepliesFeedView.as_view({'get': 'list'}), name='user-replies'),  # B-PROF-04
    path('user/<str:username>/likes/', UserLikesFeedView.as_view({'get': 'list'}), name='user-likes'),  # B-PROF-05

    # Right Sidebar endpoints
    path('live/', LiveEventsView.as_view({'get': 'list'}), name='live-events'),  # B-RSB-01
    path('trends/sidebar/', TrendingSidebarView.as_view({'get': 'list'}), name='trends-sidebar'),  # B-RSB-02
    path('users/suggested/', SuggestedUsersView.as_view({'get': 'list'}), name='suggested-users'),  # B-RSB-03

    # Search endpoints
    path('search/', SearchViewSet.as_view({'get': 'list'}), name='search'),  # B-SEARCH-01
    path('search/context/', SearchViewSet.as_view({'get': 'context'}), name='search-context'),  # B-SEARCH-02

    # Live streaming endpoints
    path('live/stream/', LiveStreamViewSet.as_view({'get': 'list', 'post': 'create'}), name='live-stream-list'),  # B-LIVE-01
    path('live/stream/<int:pk>/', LiveStreamViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='live-stream-detail'),
    path('live/stream/<int:pk>/start/', LiveStreamViewSet.as_view({'post': 'start'}), name='live-stream-start'),  # B-LIVE-01
    path('live/stream/<int:pk>/end/', LiveStreamViewSet.as_view({'post': 'end'}), name='live-stream-end'),
    path('live/stream/watch/<int:pk>/', LiveStreamWatchView.as_view(), name='live-stream-watch'),  # B-LIVE-02

    # Streaming service webhooks
    path('webhooks/mux/', mux_webhook, name='mux-webhook'),

    # Health check and monitoring endpoints
    path('health/', health_check, name='health-check'),
    path('health/detailed/', detailed_health_check, name='detailed-health-check'),
    path('metrics/', metrics_endpoint, name='metrics'),
    path('rate-limit-status/', rate_limit_status, name='rate-limit-status'),

    path('', include(router.urls)),
]