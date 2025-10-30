from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CommunityViewSet, CommunityMembershipViewSet

app_name = 'communities'

router = DefaultRouter()
router.register(r'', CommunityViewSet, basename='community')
router.register(r'memberships', CommunityMembershipViewSet, basename='membership')

urlpatterns = [
    path('', include(router.urls)),
]