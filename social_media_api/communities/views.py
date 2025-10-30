from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Community, CommunityMembership
from .serializers import CommunitySerializer, CommunityMembershipSerializer


class CommunityViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for listing and retrieving communities.
    Contract: B-COMM-01
    """
    queryset = Community.objects.all()
    serializer_class = CommunitySerializer
    permission_classes = []  # Allow unauthenticated access for browsing
    lookup_field = 'slug'

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def join(self, request, pk=None):
        """
        Join or leave a community.
        Contract: B-COMM-04
        """
        community = self.get_object()
        user = request.user

        # Check if user is already a member
        membership = CommunityMembership.objects.filter(
            community=community,
            user=user
        ).first()

        if membership:
            # User is leaving the community
            membership.delete()
            return Response({
                'status': 'left',
                'message': f'Successfully left {community.name}'
            }, status=status.HTTP_200_OK)
        else:
            # User is joining the community
            if community.is_private:
                # For private communities, could implement approval system
                # For now, allow direct joining
                pass

            membership = CommunityMembership.objects.create(
                community=community,
                user=user
            )

            return Response({
                'status': 'joined',
                'message': f'Successfully joined {community.name}',
                'membership': CommunityMembershipSerializer(membership).data
            }, status=status.HTTP_201_CREATED)


class CommunityMembershipViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for managing community memberships.
    """
    serializer_class = CommunityMembershipSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CommunityMembership.objects.filter(user=self.request.user)
