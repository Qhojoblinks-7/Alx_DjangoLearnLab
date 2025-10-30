from rest_framework.routers import DefaultRouter
from .views import RegistrationView, LoginView, UserProfileViewSet, FollowUserView, UnfollowUserView, UserProfileView, ProfileFollowView, LogoutView, ProfileUpdateView, ProfileBlockView, ProfileMuteView
from django.urls import path, include


router = DefaultRouter()
router.register(r'users', UserProfileViewSet, basename='user-profile')


urlpatterns = [
    path('register/', RegistrationView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('profile/update/', ProfileUpdateView.as_view(), name='profile-update'),  # B-EDIT-01 - update profile
    path('profile/<str:username>/follow/', ProfileFollowView.as_view(), name='profile-follow'),  # B-PROF-02 - must come before profile/<username>/
    path('profile/<str:username>/block/', ProfileBlockView.as_view(), name='profile-block'),  # B-USER-02 - block user
    path('profile/<str:username>/mute/', ProfileMuteView.as_view(), name='profile-mute'),  # B-USER-03 - mute user
    path('profile/<str:username>/', UserProfileView.as_view(), name='user-profile'),  # B-PROF-01 - any user
    path('profile/', UserProfileView.as_view(), name='user-profile-current'),  # B-SID-12 - current user (fallback)
    path('logout/', LogoutView.as_view(), name='logout'),  # B-SID-13
    path('follow/<int:user_id>/', FollowUserView.as_view(), name='follow-user'),  # ✅ follow/<int:user_id>/
    path('unfollow/<int:user_id>/', UnfollowUserView.as_view(), name='unfollow-user'),  # ✅ unfollow/<int:user_id>/
    path('', include(router.urls)), # Includes /users/{pk}/ and /users/{pk}/follow/
]