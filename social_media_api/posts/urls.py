from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from .views import PostViewSet, CommentViewSet, FeedView
from django.urls import path,include

app_name = 'post'

router = DefaultRouter()
router.register(r'posts', PostViewSet, basename='post')

# Nested router for Comments (e.g., /posts/{post_pk}/comments/)
posts_router = routers.NestedSimpleRouter(router, r'posts', lookup='post')
posts_router.register(r'comments', CommentViewSet, basename='post-comments')

urlpatterns = [
    path('feed/', FeedView.as_view(), name='feed-timeline'), 
    path('', include(router.urls)), 
    path('', include(posts_router.urls)),
]