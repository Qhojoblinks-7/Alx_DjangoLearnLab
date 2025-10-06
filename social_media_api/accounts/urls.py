from rest_framework.routers import DefaultRouter
from .views import RegistrationView, LoginView, UserProfileViewSet
from django.urls import path, include


router = DefaultRouter()
router.register(r'users', UserProfileViewSet, basename='user-profile')


urlpatterns = [
    path('register/', RegistrationView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('', include(router.urls)), # Includes /users/{pk}/ and /users/{pk}/follow/
]