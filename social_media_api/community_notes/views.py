from rest_framework import views, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from posts.models import Post
from .models import CommunityNoteRequest
from .serializers import CommunityNoteRequestSerializer
from posts.views import log_post_action


class CommunityNoteRequestView(views.APIView):
    """
    B-ACT-06: Community Note Request - POST /api/community_notes/request/
    Log a request for a community note/fact-check on the post.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        print(f"CommunityNoteRequestView called by user {request.user}")

        # Get post_id and reason from request body
        post_id = request.data.get('post_id')
        reason = request.data.get('reason', '').strip()

        if not post_id:
            return Response(
                {"error": "post_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not reason:
            return Response(
                {"error": "reason is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate post exists
        post = get_object_or_404(Post, id=post_id)

        # Check if user already requested a community note for this post
        existing_request = CommunityNoteRequest.objects.filter(
            post=post,
            requester=request.user
        ).first()

        if existing_request:
            return Response(
                {"error": "You have already requested a community note for this post"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create the community note request
        community_note_request = CommunityNoteRequest.objects.create(
            post=post,
            requester=request.user,
            reason=reason
        )

        print(f"Created community note request {community_note_request.id} for post {post.id} by user {request.user.username}")

        # Log the action
        log_post_action(
            user=request.user,
            action_type='request_community_note',
            target_post=post,
            details={'reason': reason, 'request_id': community_note_request.id, 'endpoint': 'request'}
        )

        # Serialize and return the created request
        serializer = CommunityNoteRequestSerializer(community_note_request)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
