from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from .serializers import UserRegistrationSerializer, UserLoginSerializer, UserSerializer

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
    