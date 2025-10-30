from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets, generics
from rest_framework import permissions
from rest_framework import views
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from .serializers import UserRegistrationSerializer, UserLoginSerializer, UserSerializer, ProfileUpdateSerializer
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.db.models import Count
from .models import User
from notifications.models import Notification

class RegistrationView(APIView):
    permission_classes = ()
    
    def post(self, request):
        serializer = UserRegistrationSerializer(data = request.data)

        if serializer.is_valid():
            user = serializer.save()
            token, created = Token.objects.get_or_create(user = user)
            return Response({
                'user': UserSerializer(user).data,
                'token': token.key},status = status.HTTP_201_CREATED)
        return Response(serializer.errors, status = status.HTTP_400_BAD_REQUEST)
    
class LoginView(APIView):
    permission_classes = ()

    def post(self, request):
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"LoginView: Received POST request to /accounts/login/ with data: {request.data}")

        serializer = UserLoginSerializer(data = request.data)

        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            logger.info(f"LoginView: Attempting authentication for username: {username}")

            user = authenticate(username = username, password = password)
            if user:
                logger.info(f"LoginView: Authentication successful for user: {username}")
                token, created = Token.objects.get_or_create(user = user)
                return Response({
                    'token': token.key,
                    'user_id': user.id,
                    'username': user.username
                }, status = status.HTTP_200_OK)
            logger.warning(f"LoginView: Authentication failed for username: {username}")
            return Response({'error': 'Invalid Credentials'}, status = status.HTTP_401_UNAUTHORIZED)
        logger.error(f"LoginView: Serializer validation failed with errors: {serializer.errors}")
        return Response(serializer.errors, status = status.HTTP_400_BAD_REQUEST)
class LoginView(APIView):
    permission_classes = ()
    
    def post(self, request):
        serializer = UserLoginSerializer(data = request.data)
        
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            
            user = authenticate(username = username, password = password)
            if user:
                token, created = Token.objects.get_or_create(user = user)
                return Response({
                    'token': token.key,
                    'user_id': user.id,
                    'username': user.username
                }, status = status.HTTP_200_OK)
            return Response({'error': 'Invalid Credentials'}, status = status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status = status.HTTP_400_BAD_REQUEST)
    
    
class UserProfileViewSet(viewsets.ReadOnlyModelViewSet):
    # to ensure followers_count and following_count are available
    queryset = User.objects.annotate(
        followers_count = Count('followers', distinct=True),
        following_count = Count('following', distinct=True)
    )

    serializer_class = UserSerializer

    def get_serializer_context(self):
        """Pass request context to serializer for URL building"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    
    # Action to handle /api/accounts/users/{pk}/follow/ (Task 2 requirement)
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def follow(self, request, pk=None):
        target_user = get_object_or_404(User, pk=pk)
        current_user = request.user
        
        
        if current_user == target_user:
            return Response({'error': "You cannot follow yourself."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Toggle follow/unfollow
        if target_user.followers.filter(id=current_user.id).exists():
            current_user.followers.remove(target_user)
            status_message = "unfollowed"

        else:
            current_user.followers.add(target_user)
            status_message = "followed"

            # Create notification for the follow
            Notification.objects.create(
                recipient=target_user,
                actor=current_user,
                verb="followed",
                target=target_user
            )

        return Response({
            "status": status_message,
            "followers_count": target_user.followers.count(),
            "is_following": status_message == "followed"
        }, status=status.HTTP_200_OK)


class FollowUserView(generics.GenericAPIView):  # ✅ generics.GenericAPIView
    queryset = User.objects.all()  # ✅ CustomUser.objects.all() (User is the custom user model)
    permission_classes = [permissions.IsAuthenticated]  # ✅ permissions.IsAuthenticated

    def post(self, request, pk):
        target_user = self.get_object()
        current_user = request.user

        if current_user == target_user:
            return Response({'error': "You cannot follow yourself."}, status=status.HTTP_400_BAD_REQUEST)

        if target_user.followers.filter(id=current_user.id).exists():
            return Response({'error': "Already following this user."}, status=status.HTTP_400_BAD_REQUEST)

        current_user.followers.add(target_user)

        return Response({
            "status": "followed",
            "followers_count": target_user.followers.count(),
            "is_following": True
        }, status=status.HTTP_200_OK)


class UnfollowUserView(generics.GenericAPIView):  # ✅ generics.GenericAPIView
    queryset = User.objects.all()  # ✅ CustomUser.objects.all() (User is the custom user model)
    permission_classes = [permissions.IsAuthenticated]  # ✅ permissions.IsAuthenticated

    def post(self, request, pk):
        target_user = self.get_object()
        current_user = request.user

        if current_user == target_user:
            return Response({'error': "You cannot unfollow yourself."}, status=status.HTTP_400_BAD_REQUEST)

        if not target_user.followers.filter(id=current_user.id).exists():
            return Response({'error': "Not following this user."}, status=status.HTTP_400_BAD_REQUEST)

        current_user.followers.remove(target_user)

        return Response({
            "status": "unfollowed",
            "followers_count": target_user.followers.count(),
            "is_following": False
        }, status=status.HTTP_200_OK)


class UserProfileView(generics.RetrieveAPIView):
    """
    B-PROF-01: Profile Detail - GET /accounts/profile/<username>/
    Returns the profile details for any user by username.
    Includes: basic info, bio, location, followers/following counts, join date, and is_following flag.
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]  # Require authentication for profile access
    queryset = User.objects.annotate(
        followers_count=Count('followers', distinct=True),
        following_count=Count('following', distinct=True)
    )

    def get_object(self):
        try:
            username = self.kwargs.get('username')
            if username:
                return get_object_or_404(self.queryset, username=username)
            # Fallback to current user if no username provided (for /accounts/profile/)
            if self.request.user.is_authenticated:
                return get_object_or_404(self.queryset, pk=self.request.user.pk)
            else:
                # This shouldn't happen since profile requires authentication, but handle gracefully
                from rest_framework.exceptions import NotAuthenticated
                raise NotAuthenticated('Authentication credentials were not provided.')
        except Exception as e:
            print(f"Error in UserProfileView.get_object: {e}")
            # Return current user as fallback
            if self.request.user.is_authenticated:
                return get_object_or_404(self.queryset, pk=self.request.user.pk)
            raise NotAuthenticated('Authentication credentials were not provided.')

    def get_serializer_context(self):
        """Pass request context to serializer for URL building"""
        try:
            context = super().get_serializer_context()
            context['request'] = self.request
            return context
        except Exception as e:
            print(f"Error in UserProfileView.get_serializer_context: {e}")
            return {'request': self.request}


class ProfileFollowView(views.APIView):
    """
    B-PROF-02: Toggle Follow - POST /api/accounts/profile/<username>/follow/
    Toggles the authenticated user's follow status for the target user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, username):
        target_user = get_object_or_404(User, username=username)
        current_user = request.user

        if current_user == target_user:
            return Response({'error': "You cannot follow yourself."}, status=status.HTTP_400_BAD_REQUEST)

        # Toggle follow/unfollow
        if target_user.followers.filter(id=current_user.id).exists():
            current_user.followers.remove(target_user)
            status_message = "unfollowed"
        else:
            current_user.followers.add(target_user)
            status_message = "followed"

            # Create notification for the follow
            Notification.objects.create(
                recipient=target_user,
                actor=current_user,
                verb="followed",
                target=target_user
            )

        return Response({
            "status": status_message,
            "followers_count": target_user.followers.count(),
            "is_following": status_message == "followed"
        }, status=status.HTTP_200_OK)


class LogoutView(views.APIView):
    """
    B-SID-13: Logout - POST /api/accounts/logout/
    Invalidates the user's current token.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            # Delete the user's token
            request.user.auth_token.delete()
            return Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)
        except:
            # If token deletion fails, still return success
            return Response({"message": "Logged out."}, status=status.HTTP_200_OK)


class ProfileUpdateView(views.APIView):
    """
    B-EDIT-01: Update Profile - PUT /api/accounts/profile/update/
    Handles updating the authenticated user's profile. Accepts multipart/form-data for file uploads.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]  # Handle file uploads

    def put(self, request):
        user = request.user
        print(f"ProfileUpdateView: request.data = {request.data}")
        print(f"ProfileUpdateView: request.FILES = {request.FILES}")
        serializer = ProfileUpdateSerializer(user, data=request.data, partial=True)

        if serializer.is_valid():
            updated_user = serializer.save()
            print(f"ProfileUpdateView: updated user profile_image = {updated_user.profile_image}")
            response_data = {
                "message": "Profile updated successfully.",
                "user": UserSerializer(updated_user, context={'request': request}).data
            }
            print(f"ProfileUpdateView: response user = {response_data['user']}")
            return Response(response_data, status=status.HTTP_200_OK)

        print(f"ProfileUpdateView: serializer errors = {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileBlockView(views.APIView):
    """
    B-USER-02: Toggle Block - POST /api/accounts/profile/<username>/block/
    Toggles the authenticated user's block status for the target user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, username):
        target_user = get_object_or_404(User, username=username)
        current_user = request.user

        if current_user == target_user:
            return Response({'error': "You cannot block yourself."}, status=status.HTTP_400_BAD_REQUEST)

        # Toggle block/unblock
        if current_user.blocked_users.filter(id=target_user.id).exists():
            current_user.blocked_users.remove(target_user)
            status_message = "unblocked"
        else:
            current_user.blocked_users.add(target_user)
            status_message = "blocked"

            # If blocking, also unfollow if following
            if target_user.followers.filter(id=current_user.id).exists():
                current_user.followers.remove(target_user)

        return Response({
            "status": status_message,
            "is_blocked": status_message == "blocked"
        }, status=status.HTTP_200_OK)


class ProfileMuteView(views.APIView):
    """
    B-USER-03: Toggle Mute - POST /api/accounts/profile/<username>/mute/
    Toggles the authenticated user's mute status for the target user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, username):
        target_user = get_object_or_404(User, username=username)
        current_user = request.user

        if current_user == target_user:
            return Response({'error': "You cannot mute yourself."}, status=status.HTTP_400_BAD_REQUEST)

        # Toggle mute/unmute
        if current_user.muted_users.filter(id=target_user.id).exists():
            current_user.muted_users.remove(target_user)
            status_message = "unmuted"
        else:
            current_user.muted_users.add(target_user)
            status_message = "muted"

        return Response({
            "status": status_message,
            "is_muted": status_message == "muted"
        }, status=status.HTTP_200_OK)
    