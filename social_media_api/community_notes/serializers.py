from rest_framework import serializers
from .models import CommunityNoteRequest, CommunityNote


class CommunityNoteRequestSerializer(serializers.ModelSerializer):
    """Serializer for community note requests."""

    class Meta:
        model = CommunityNoteRequest
        fields = [
            'id', 'post', 'requester', 'reason', 'status',
            'reviewed_by', 'reviewed_at', 'review_notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'requester', 'status', 'reviewed_by',
            'reviewed_at', 'review_notes', 'created_at', 'updated_at'
        ]


class CommunityNoteSerializer(serializers.ModelSerializer):
    """Serializer for community notes."""

    class Meta:
        model = CommunityNote
        fields = [
            'id', 'post', 'content', 'created_by', 'created_at',
            'updated_at', 'helpful_votes', 'not_helpful_votes',
            'is_active', 'total_votes', 'helpful_percentage'
        ]
        read_only_fields = [
            'id', 'created_by', 'created_at', 'updated_at',
            'helpful_votes', 'not_helpful_votes', 'total_votes', 'helpful_percentage'
        ]