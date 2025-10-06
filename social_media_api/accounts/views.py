from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets, generics
from rest_framework import permissions
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from .serializers import UserRegistrationSerializer, UserLoginSerializer, UserSerializer
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.db.models import Count
from .models import User

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
        serializer = UserLoginSerializer(data = request.data)
        
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            
            user = authenticate(username = username, password = password)
            if user:
                token, created = Token.objects.get_or_create(user = user)
                return Response({
                    'token': token.key
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
    
    
    # Action to handle /api/accounts/users/{pk}/follow/ (Task 2 requirement)
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
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
    