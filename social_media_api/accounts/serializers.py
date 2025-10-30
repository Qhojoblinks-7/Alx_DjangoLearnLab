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
        fields = ['id', 'username', 'email', 'password', 'bio', 'profile_image', 'token']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        """
        Create a new user with the validated data.
        Handles user creation with additional fields like bio and profile_image.
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
            if 'profile_image' in validated_data:
                user.profile_image = validated_data['profile_image']

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
    is_following = serializers.SerializerMethodField()
    is_blocked = serializers.SerializerMethodField()
    is_muted = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()
    profile_picture_url = serializers.SerializerMethodField()
    banner_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'name', 'bio', 'profile_image', 'profile_picture_url', 'banner_image', 'banner_url', 'location', 'website', 'birth_date', 'gender', 'followers_count', 'following_count', 'is_following', 'is_blocked', 'is_muted', 'is_verified']

    def get_followers_count(self, obj):
        return obj.followers.count()

    def get_following_count(self, obj):
        return obj.following.count()

    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.followers.filter(id=request.user.id).exists()
        return False

    def get_is_blocked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.blocked_users.filter(id=request.user.id).exists()
        return False

    def get_is_muted(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.muted_users.filter(id=request.user.id).exists()
        return False

    def get_name(self, obj):
        """Return the full name combining first_name and last_name"""
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}".strip()
        elif obj.first_name:
            return obj.first_name
        elif obj.last_name:
            return obj.last_name
        else:
            return obj.username  # Fallback to username if no name provided

    def get_profile_picture_url(self, obj):
        """Return the full URL for the profile picture"""
        if obj.profile_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_image.url)
        return None

    def get_banner_url(self, obj):
        """Return the full URL for the banner image"""
        if obj.banner_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.banner_image.url)
        return None


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user profile information.
    Handles both text fields and file uploads (profile_image, banner_image).
    """
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'bio', 'profile_image', 'banner_image', 'location', 'website', 'birth_date', 'gender']
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False},
            'bio': {'required': False},
            'profile_image': {'required': False},
            'banner_image': {'required': False},
            'location': {'required': False},
            'website': {'required': False},
            'birth_date': {'required': False},
        }


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
    