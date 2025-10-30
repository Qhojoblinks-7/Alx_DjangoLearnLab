from rest_framework import serializers
from .models import Community, CommunityMembership


class CommunitySerializer(serializers.ModelSerializer):
    """
    Serializer for Community model.
    """
    member_count = serializers.ReadOnlyField()
    is_member = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()

    class Meta:
        model = Community
        fields = [
            'id', 'name', 'slug', 'description', 'avatar', 'banner',
            'created_at', 'updated_at', 'is_private', 'allow_posting',
            'owner', 'member_count', 'is_member', 'is_owner'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'owner', 'member_count']

    def get_is_member(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.memberships.filter(user=request.user).exists()
        return False

    def get_is_owner(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.owner == request.user
        return False


class CommunityMembershipSerializer(serializers.ModelSerializer):
    """
    Serializer for CommunityMembership model.
    """
    community_name = serializers.CharField(source='community.name', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = CommunityMembership
        fields = [
            'id', 'community', 'community_name', 'user', 'user_username',
            'joined_at', 'role'
        ]
        read_only_fields = ['id', 'joined_at']