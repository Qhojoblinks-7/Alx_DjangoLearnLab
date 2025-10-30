from django.db import models
from django.contrib.auth import get_user_model
from rest_framework import viewsets, status, permissions, views
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import CursorPagination, LimitOffsetPagination
from ..models import Post, Comment, MediaFile
from ..serializers import PostSerializer, CommentSerializer
from ..throttling import PostCreationThrottle
from ..tasks import process_image_file, process_video_file
from ..s3_utils import get_presigned_url_for_media
from django.utils import timezone
from django.conf import settings
import logging
import uuid
import os

logger = logging.getLogger(__name__)

User = get_user_model()


def log_post_action(user, action_type, target_post=None, outcome='success', details=None):
    """Log a post action for auditing purposes."""
    try:
        from ..models import PostActionLog
        PostActionLog.objects.create(
            user=user,
            action_type=action_type,
            target_post=target_post,
            outcome=outcome,
            details=details or {}
        )
    except Exception as e:
        # Log the error but don't fail the main operation
        print(f"Failed to log post action {action_type}: {e}")


class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Filter posts based on user permissions"""
        user = self.request.user
        if self.action in ['update', 'partial_update', 'destroy']:
            # Users can only modify/delete their own posts
            return Post.objects.filter(author=user)
        return Post.objects.all()

    def update(self, request, *args, **kwargs):
        """Custom update method to ensure user can only edit their own posts"""
        instance = self.get_object()
        if instance.author != request.user:
            return Response(
                {"error": "You can only edit your own posts"},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        """Custom partial update method to ensure user can only edit their own posts"""
        instance = self.get_object()
        if instance.author != request.user:
            return Response(
                {"error": "You can only edit your own posts"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Update the updated_at field when content is changed
        if 'content' in request.data or 'title' in request.data:
            instance.updated_at = timezone.now()

        return super().partial_update(request, *args, **kwargs)

    def perform_create(self, serializer):
        """Set the author when creating a post"""
        serializer.save(author=self.request.user)

    def destroy(self, request, *args, **kwargs):
        """Custom destroy method to ensure user can only delete their own posts"""
        instance = self.get_object()
        if instance.author != request.user:
            return Response(
                {"error": "You can only delete your own posts"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Log the deletion action before destroying
        log_post_action(request.user, 'delete_post', instance, 'success', {
            'post_id': instance.id,
            'had_media': bool(instance.media_file),
            'comment_count': instance.comments_count,
            'like_count': instance.likes_count
        })

        return super().destroy(request, *args, **kwargs)


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        logger.info(f"CommentViewSet: Initialized with {self.queryset.count()} comments")

    def get_queryset(self):
        """Filter comments by post_pk if provided, return all comments for the post"""
        queryset = Comment.objects.all()
        post_pk = self.kwargs.get('post_pk')
        if post_pk:
            # Return all comments for the post (both top-level and replies)
            queryset = queryset.filter(post_id=post_pk)
            logger.info(f"CommentViewSet: Filtering all comments for post {post_pk}, found {queryset.count()} comments")

            # Log all posts and their comment counts for debugging
            logger.info("CommentViewSet: All posts and their comment counts:")
            posts_with_comments = Post.objects.annotate(comment_count=models.Count('comments')).values('id', 'title', 'comment_count')
            for post in posts_with_comments:
                logger.info(f"  Post {post['id']}: '{post['title'][:50]}...' - {post['comment_count']} comments")

        # For update/partial_update/destroy, allow user's own comments OR comments on user's own posts
        if self.action in ['update', 'partial_update', 'destroy']:
            queryset = queryset.filter(
                models.Q(author=self.request.user) |  # User's own comments
                models.Q(post__author=self.request.user)  # Comments on user's own posts
            )

        return queryset

    def update(self, request, *args, **kwargs):
        """Custom update method to ensure user can only edit their own comments"""
        instance = self.get_object()
        if instance.author != request.user:
            return Response(
                {"error": "You can only edit your own comments"},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        """Custom partial update method to ensure user can only edit their own comments"""
        instance = self.get_object()
        if instance.author != request.user:
            return Response(
                {"error": "You can only edit your own comments"},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().partial_update(request, *args, **kwargs)

    def perform_create(self, serializer):
        """Set the post from URL parameters"""
        post_pk = self.kwargs.get('post_pk')
        if post_pk:
            post = Post.objects.get(pk=post_pk)
            serializer.save(post=post)
        else:
            serializer.save()

    def list(self, request, *args, **kwargs):
        logger.info("CommentViewSet: list() called")
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        logger.info(f"CommentViewSet: retrieve() called for pk={kwargs.get('pk')}")
        return super().retrieve(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        logger.info("CommentViewSet: create() called")

        # Handle reply creation with parentId
        parent_id = request.data.get('parentId')
        if parent_id:
            try:
                parent_comment = Comment.objects.get(id=parent_id)
                # Set the parent_comment in the request data
                request.data['parent_comment'] = parent_id
                logger.info(f"CommentViewSet: Creating reply to comment {parent_id} on post {parent_comment.post.id}")

                # Create the reply
                response = super().create(request, *args, **kwargs)

                # Increment reply count on parent comment using F expression
                from django.db.models import F
                parent_comment.reply_count = F('reply_count') + 1
                parent_comment.save(update_fields=['reply_count'])

                # Also increment the post's comment count using F expression
                post = parent_comment.post
                post.comments_count = F('comments_count') + 1
                post.save(update_fields=['comments_count', 'updated_at'])

                logger.info(f"CommentViewSet: Reply created successfully, incremented counts")
                return response

            except Comment.DoesNotExist:
                logger.error(f"CommentViewSet: Parent comment {parent_id} not found")
                return Response(
                    {"error": "Parent comment not found"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            except Exception as e:
                logger.error(f"CommentViewSet: Error creating reply: {e}")
                return Response(
                    {"error": "Failed to create reply"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            # Regular top-level comment creation
            response = super().create(request, *args, **kwargs)

            # Increment post's comment count for top-level comments using F expression
            if response.status_code == status.HTTP_201_CREATED:
                post_pk = kwargs.get('post_pk')
                if post_pk:
                    try:
                        from django.db.models import F
                        post = Post.objects.get(pk=post_pk)
                        post.comments_count = F('comments_count') + 1
                        post.save(update_fields=['comments_count', 'updated_at'])
                        logger.info(f"CommentViewSet: Top-level comment created, incremented post comment count")
                    except Post.DoesNotExist:
                        logger.error(f"CommentViewSet: Post {post_pk} not found when incrementing comment count")

            return response

    def perform_create(self, serializer):
        """Set the author and post from the request user and URL parameters"""
        post_pk = self.kwargs.get('post_pk')
        if post_pk:
            post = Post.objects.get(pk=post_pk)
            serializer.save(author=self.request.user, post=post)
        else:
            serializer.save(author=self.request.user)

    def destroy(self, request, *args, **kwargs):
        """Custom destroy method with complex authorization and count decrementing"""
        instance = self.get_object()

        # Check authorization: user must be either comment author OR post author
        if instance.author != request.user and instance.post.author != request.user:
            return Response(
                {"error": "You can only delete your own comments or comments on your own posts"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Store references for count decrementing
        post = instance.post
        parent_comment = instance.parent_comment

        # Perform the deletion
        response = super().destroy(request, *args, **kwargs)

        if response.status_code == status.HTTP_204_NO_CONTENT:
            # Decrement counts using conditional updates to avoid negative values
            from django.db.models import Case, When, Value, IntegerField

            if parent_comment:
                # This was a reply - decrement parent comment's reply count and post's comment count
                # Only decrement if counts are > 0 to avoid negative values
                parent_comment.reply_count = Case(
                    When(reply_count__gt=0, then=models.F('reply_count') - 1),
                    default=models.F('reply_count'),
                    output_field=models.PositiveIntegerField()
                )
                parent_comment.save(update_fields=['reply_count'])

                post.comments_count = Case(
                    When(comments_count__gt=0, then=models.F('comments_count') - 1),
                    default=models.F('comments_count'),
                    output_field=models.PositiveIntegerField()
                )
                post.save(update_fields=['comments_count', 'updated_at'])
                logger.info(f"CommentViewSet: Decremented reply count for parent comment {parent_comment.id} and post comment count")
            else:
                # This was a top-level comment - decrement post's comment count
                post.comments_count = Case(
                    When(comments_count__gt=0, then=models.F('comments_count') - 1),
                    default=models.F('comments_count'),
                    output_field=models.PositiveIntegerField()
                )
                post.save(update_fields=['comments_count', 'updated_at'])
                logger.info(f"CommentViewSet: Decremented comment count for post {post.id}")

            # Log the deletion action
            log_post_action(request.user, 'delete_comment', post, 'success', {
                'comment_id': instance.id,
                'was_reply': bool(parent_comment),
                'parent_comment_id': parent_comment.id if parent_comment else None,
                'post_id': post.id
            })

        return response


class CreatePostView(views.APIView):
    """
    B-POST-01: Create Post with Media Processing
    Handles post creation with automatic media processing and optimization.
    """
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [PostCreationThrottle]

    def post(self, request):
        try:
            # Extract data from request
            content = request.data.get('content', '').strip()
            title = request.data.get('title', '').strip()
            media_keys = request.data.getlist('media_keys', [])

            # Validation
            if not content and not title and not media_keys:
                return Response(
                    {'error': 'Post must have content, title, or media'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if len(content) > 300:  # MAX_CHARS from frontend
                return Response(
                    {'error': 'Content too long'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if len(media_keys) > 4:  # MAX_MEDIA from frontend
                return Response(
                    {'error': 'Too many media files'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create post first
            post = Post.objects.create(
                author=request.user,
                title=title,
                content=content,
            )

            # Process media keys if any
            if media_keys:
                processed_media = []
                for s3_key in media_keys:
                    try:
                        # Extract file info from S3 key
                        # Key format: uploads/{user_id}/{uuid}.{ext}
                        key_parts = s3_key.split('/')
                        if len(key_parts) < 3:
                            continue

                        file_name = key_parts[-1]
                        file_extension = file_name.split('.')[-1] if '.' in file_name else ''

                        # Determine media type from file extension
                        image_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
                        video_extensions = ['mp4', 'mov', 'avi', 'mkv']

                        if file_extension.lower() in image_extensions:
                            media_type = 'image'
                            mime_type = f'image/{file_extension.lower()}'
                        elif file_extension.lower() in video_extensions:
                            media_type = 'video'
                            mime_type = f'video/{file_extension.lower()}'
                        else:
                            continue  # Skip unsupported files

                        # Create MediaFile instance with S3 reference
                        # Note: We don't store the actual file, just reference the S3 key
                        media_instance = MediaFile.objects.create(
                            file_name=file_name,
                            file_size=0,  # Size unknown from key, will be updated during processing
                            mime_type=mime_type,
                            media_type=media_type,
                            # Store S3 key in a way that processing can access it
                            processing_status='pending'
                        )

                        # Store S3 key for processing (temporary solution)
                        # In production, you might want to add a field to MediaFile model
                        media_instance._s3_key = s3_key

                        # Link to post
                        post.media_file = media_instance
                        post.save()

                        # Trigger async processing with S3 key (handle Celery unavailability gracefully)
                        try:
                            if media_instance.media_type == 'image':
                                process_image_file.delay(media_instance.id, s3_key)
                            elif media_instance.media_type == 'video':
                                process_video_file.delay(media_instance.id, s3_key)
                        except Exception as celery_error:
                            logger.warning(f"Celery not available for media processing: {celery_error}")
                            # Mark as processed for now - in production this would be handled differently
                            media_instance.processing_status = 'completed'
                            media_url = get_presigned_url_for_media(s3_key, expiration=3600)
                            media_instance.full_url = media_url
                            media_instance.preview_url = media_url  # Use same URL for preview
                            media_instance.thumbnail_url = media_url  # Use same URL for thumbnail
                            media_instance.save()

                        processed_media.append(media_instance.id)

                    except Exception as e:
                        logger.error(f"Failed to process media key {s3_key}: {e}")
                        continue

                if not processed_media:
                    # If no valid media was processed, delete the post
                    post.delete()
                    return Response(
                        {'error': 'No valid media files provided'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # Log the action
            log_post_action(request.user, 'create_post', post, 'success', {
                'has_media': bool(media_keys),
                'media_count': len(media_keys) if media_keys else 0
            })

            # Return serialized post data
            serializer = PostSerializer(post, context={'request': request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            # Log error
            logger.error(f"Failed to create post: {e}")
            log_post_action(request.user, 'create_post', None, 'error', {'error': str(e)})
            return Response(
                {'error': 'Failed to create post'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GetUploadURLView(views.APIView):
    """
    Generate pre-signed S3 upload URL for direct browser uploads
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            file_name = request.data.get('file_name')
            content_type = request.data.get('content_type')

            if not file_name or not content_type:
                return Response(
                    {'error': 'file_name and content_type are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate content type
            allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime']
            if content_type not in allowed_types:
                return Response(
                    {'error': f'Content type {content_type} not allowed'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Generate S3 key
            file_extension = file_name.split('.')[-1] if '.' in file_name else 'bin'
            s3_key = f"uploads/{request.user.id}/{uuid.uuid4()}.{file_extension}"

            # Get pre-signed upload URL
            upload_url = get_presigned_url_for_media(s3_key, expiration=900, operation='put_object')

            if not upload_url:
                return Response(
                    {'error': 'Failed to generate upload URL'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            return Response({
                'upload_url': upload_url,
                'key': s3_key
            })

        except Exception as e:
            logger.error(f"Error generating upload URL: {e}")
            return Response(
                {'error': 'Failed to generate upload URL'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PostDetailView(views.APIView):
    def get(self, request, pk):
        return Response({"id": pk, "title": "Mock Post"})


class PostRepliesView(viewsets.ReadOnlyModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer


class PostReplyView(views.APIView):
    def post(self, request, pk):
        return Response({"status": "replied"})


class PostViewView(views.APIView):
    """
    Track post views for analytics.
    POST /posts/{id}/view/
    """
    permission_classes = [permissions.AllowAny]  # Allow anonymous views

    def post(self, request, pk):
        try:
            # Get or create view record (simplified - in production use proper analytics)
            # For now, just return success
            return Response({"status": "viewed"})
        except Exception as e:
            logger.error(f"Error tracking view for post {pk}: {e}")
            # Don't fail the request for view tracking errors
            return Response({"status": "viewed"})


class PostPinView(views.APIView):
    """
    Pin or unpin a post on the user's profile.
    POST /posts/{id}/pin/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            post = Post.objects.get(pk=pk)

            # Check if user owns the post
            if post.author != request.user:
                return Response(
                    {"error": "You can only pin your own posts"},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Toggle pin status
            post.is_pinned = not post.is_pinned
            post.save()

            log_post_action(request.user, 'pin_post', post, 'success', {
                'is_pinned': post.is_pinned
            })

            return Response({
                "is_pinned": post.is_pinned,
                "message": f"Post {'pinned' if post.is_pinned else 'unpinned'} successfully"
            })

        except Post.DoesNotExist:
            return Response(
                {"error": "Post not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error pinning post {pk}: {e}")
            log_post_action(request.user, 'pin_post', None, 'error', {'error': str(e)})
            return Response(
                {"error": "Failed to pin/unpin post"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PostHighlightView(views.APIView):
    """
    Highlight or unhighlight a post on the user's profile.
    POST /posts/{id}/highlight/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            post = Post.objects.get(pk=pk)

            # Check if user owns the post
            if post.author != request.user:
                return Response(
                    {"error": "You can only highlight your own posts"},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Toggle highlight status
            post.is_highlighted = not post.is_highlighted
            post.save()

            log_post_action(request.user, 'highlight_post', post, 'success', {
                'is_highlighted': post.is_highlighted
            })

            return Response({
                "is_highlighted": post.is_highlighted,
                "message": f"Post {'highlighted' if post.is_highlighted else 'unhighlighted'} successfully"
            })

        except Post.DoesNotExist:
            return Response(
                {"error": "Post not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error highlighting post {pk}: {e}")
            log_post_action(request.user, 'highlight_post', None, 'error', {'error': str(e)})
            return Response(
                {"error": "Failed to highlight/unhighlight post"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PostAnalyticsView(views.APIView):
    def get(self, request, pk):
        return Response({"views": 100, "likes": 10})


class PostReplySettingsView(views.APIView):
    """
    Update reply settings for a post.
    PUT /posts/{id}/reply_settings/
    """
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, pk):
        try:
            post = Post.objects.get(pk=pk)

            # Check if user owns the post
            if post.author != request.user:
                return Response(
                    {"error": "You can only change reply settings for your own posts"},
                    status=status.HTTP_403_FORBIDDEN
                )

            permission_level = request.data.get('permission_level')
            if permission_level not in ['everyone', 'following', 'mentioned']:
                return Response(
                    {"error": "Invalid permission level. Must be 'everyone', 'following', or 'mentioned'"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Update reply settings
            post.reply_settings = permission_level
            post.save()

            log_post_action(request.user, 'change_reply_settings', post, 'success', {
                'permission_level': permission_level
            })

            return Response({
                "permission_level": permission_level,
                "message": "Reply settings updated successfully"
            })

        except Post.DoesNotExist:
            return Response(
                {"error": "Post not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error updating reply settings for post {pk}: {e}")
            log_post_action(request.user, 'change_reply_settings', None, 'error', {'error': str(e)})
            return Response(
                {"error": "Failed to update reply settings"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PostEngagementsView(views.APIView):
    """
    Get detailed engagement metrics for a post to display in charts
    GET /posts/{id}/engagements/
    """
    permission_classes = [permissions.AllowAny]  # Allow viewing engagements

    def get(self, request, pk):
        try:
            post = Post.objects.get(pk=pk)

            # Get engagement data
            engagements = {
                "views": post.views_count or 0,
                "likes": post.likes_count or 0,
                "replies": post.comments_count or 0,
                "reposts": post.reposts_count or 0,
            }

            # Calculate total engagement
            total_engagement = sum(engagements.values())

            # Format for chart display
            chart_data = [
                {"label": "👁️ Views", "value": engagements["views"]},
                {"label": "❤️ Likes", "value": engagements["likes"]},
                {"label": "💬 Replies", "value": engagements["replies"]},
                {"label": "🔄 Reposts", "value": engagements["reposts"]},
            ]

            return Response({
                "engagements": chart_data,
                "total_engagement": total_engagement,
                "post_id": pk
            })

        except Post.DoesNotExist:
            return Response(
                {"error": "Post not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error getting engagements for post {pk}: {e}")
            return Response(
                {"error": "Failed to get engagement data"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PostEmbedView(views.APIView):
    def get(self, request, pk):
        return Response({"html": "<div>Embedded Post</div>", "width": 500, "height": 300})


class DevUploadView(views.APIView):
    """
    Development endpoint to handle file uploads directly (bypasses S3)
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            uploaded_file = request.FILES.get('file')
            if not uploaded_file:
                return Response(
                    {'error': 'No file provided'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate file type
            allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime']
            if uploaded_file.content_type not in allowed_types:
                return Response(
                    {'error': f'Content type {uploaded_file.content_type} not allowed'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Generate unique filename
            file_extension = uploaded_file.name.split('.')[-1] if '.' in uploaded_file.name else 'bin'
            unique_filename = f"{uuid.uuid4()}.{file_extension}"

            # Save to media directory
            media_dir = os.path.join(settings.MEDIA_ROOT, 'uploads', str(request.user.id))
            os.makedirs(media_dir, exist_ok=True)

            file_path = os.path.join(media_dir, unique_filename)
            with open(file_path, 'wb+') as destination:
                for chunk in uploaded_file.chunks():
                    destination.write(chunk)

            # Generate mock S3 key for consistency
            s3_key = f"uploads/{request.user.id}/{unique_filename}"

            return Response({
                'upload_url': f"{settings.MEDIA_URL}uploads/{request.user.id}/{unique_filename}",
                'key': s3_key,
                'file_path': file_path
            })

        except Exception as e:
            logger.error(f"Error in dev upload: {e}")
            return Response(
                {'error': 'Failed to upload file'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )