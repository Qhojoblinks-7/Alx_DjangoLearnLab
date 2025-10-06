from rest_framework import serializers
from rest_framework.authtoken.models import Token  # ✅ from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate
from django.db import IntegrityError

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)  # ✅ serializers.CharField()
    token = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'bio', 'profile_picture', 'token']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        """
        Create a new user with the validated data.
        Handles user creation with additional fields like bio and profile_picture.
        """
        try:
            # Extract password to avoid passing it to create_user unnecessarily
            password = validated_data.pop('password')

            # Create the user with standard fields
            user = get_user_model().objects.create_user(  # ✅ get_user_model().objects.create_user
                username = validated_data['username'],
                email = validated_data.get('email'),
                password = password
            )

            # Set additional fields
            user.bio = validated_data.get('bio', '')
            if 'profile_picture' in validated_data:
                user.profile_picture = validated_data['profile_picture']

            user.save()

            # Create token for the user
            Token.objects.create(user=user)  # ✅ Token.objects.create

            return user

        except IntegrityError:
            raise serializers.ValidationError(
                {"error": "A user with this username or email already exists."}
            )
        except Exception as e:
            raise serializers.ValidationError(
                {"error": f"An error occurred during user creation: {str(e)}"}
            )

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        token = Token.objects.get(user=instance)
        representation['token'] = token.key
        return representation
            
class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for displaying user information in API responses.
    Excludes sensitive fields like password.
    """
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'bio', 'profile_picture', 'followers_count', 'following_count']

    def get_followers_count(self, obj):
        return obj.followers.count()

    def get_following_count(self, obj):
        return obj.following.count()


class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True)
    token = serializers.CharField(read_only=True)

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')

        if username and password:
            user = authenticate(username=username, password=password)
            if user:
                if user.is_active:
                    data['user'] = user
                else:
                    raise serializers.ValidationError('User account is disabled.')
            else:
                raise serializers.ValidationError('Unable to log in with provided credentials.')
        else:
            raise serializers.ValidationError('Must include username and password.')

        return data

    def create(self, validated_data):
        user = validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return {
            'username': user.username,
            'token': token.key
        }
    