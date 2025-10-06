from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from .views import PostViewSet, CommentViewSet, FeedViewSet, PostLikeView
from django.urls import path,include

app_name = 'post'

router = DefaultRouter()
router.register(r'posts', PostViewSet, basename='post')

# Nested router for Comments (e.g., /posts/{post_pk}/comments/)
posts_router = routers.NestedSimpleRouter(router, r'posts', lookup='post')
posts_router.register(r'comments', CommentViewSet, basename='post-comments')

urlpatterns = [
    path('feed/', FeedViewSet.as_view({'get': 'list'}), name='feed-timeline'),
    path('', include(router.urls)),
    path('', include(posts_router.urls)),
    path('posts/<int:pk>/like/', PostLikeView.as_view(), name='post-like'),
]