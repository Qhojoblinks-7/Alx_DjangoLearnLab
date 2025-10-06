from rest_framework.routers import DefaultRouter
from .views import RegistrationView, LoginView, UserProfileViewSet, FollowUserView, UnfollowUserView
from django.urls import path, include


router = DefaultRouter()
router.register(r'users', UserProfileViewSet, basename='user-profile')


urlpatterns = [
    path('register/', RegistrationView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('follow/<int:user_id>/', FollowUserView.as_view(), name='follow-user'),  # ✅ follow/<int:user_id>/
    path('unfollow/<int:user_id>/', UnfollowUserView.as_view(), name='unfollow-user'),  # ✅ unfollow/<int:user_id>/
    path('', include(router.urls)), # Includes /users/{pk}/ and /users/{pk}/follow/
]