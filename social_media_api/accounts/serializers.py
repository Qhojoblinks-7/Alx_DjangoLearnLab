from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import get_user_model
from django.db import IntegrityError

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'bio', 'profile_picture']
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
            user = User.objects.create_user(
                username = validated_data['username'],
                email = validated_data.get('email'),
                password = password
            )

            # Set additional fields
            user.bio = validated_data.get('bio', '')
            if 'profile_picture' in validated_data:
                user.profile_picture = validated_data['profile_picture']

            user.save()
            return user

        except IntegrityError:
            raise serializers.ValidationError(
                {"error": "A user with this username or email already exists."}
            )
        except Exception as e:
            raise serializers.ValidationError(
                {"error": f"An error occurred during user creation: {str(e)}"}
            )
            
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
    