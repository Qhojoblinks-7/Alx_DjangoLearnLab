from django.contrib.auth import get_user_model
from rest_framework import viewsets, status, permissions, views
from rest_framework.response import Response
from ..models import Post, Like, PostShare, Repost, Bookmark
from ..serializers import PostSerializer
import logging

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


class PostLikeView(views.APIView):
    """
    POST /api/v1/posts/{postId}/like
    Toggle like status for a post.
    Returns current like status and updated like count.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            post = Post.objects.get(pk=pk)

            # Toggle like: create if doesn't exist, delete if exists
            like, created = Like.objects.get_or_create(
                user=request.user,
                post=post
            )

            if not created:
                # User already liked, so unlike
                like.delete()
                is_liked = False
            else:
                # User didn't like, so like
                is_liked = True

            # Update the likes_count field on the post using F expression to avoid race conditions
            from django.db.models import F
            if is_liked:
                post.likes_count = F('likes_count') + 1
            else:
                post.likes_count = F('likes_count') - 1
            post.save(update_fields=['likes_count', 'updated_at'])

            # Refresh to get the actual value
            post.refresh_from_db()
            likes_count = post.likes_count

            # Log the action
            log_post_action(
                request.user,
                'toggle_like',
                post,
                'success',
                {'is_liked': is_liked, 'likes_count': likes_count}
            )

            return Response({
                "isLiked": is_liked,
                "likes_count": likes_count
            })

        except Post.DoesNotExist:
            return Response(
                {"error": "Post not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error toggling like for post {pk}: {e}")
            log_post_action(
                request.user,
                'toggle_like',
                None,
                'error',
                {'error': str(e)}
            )
            return Response(
                {"error": "Failed to toggle like"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PostRepostView(views.APIView):
    """
    POST /api/v1/posts/{postId}/repost
    Create a repost (quote post) of the specified post.
    Returns the updated repost count and new post ID.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        logger.info(f"PostRepostView: Starting repost creation for post {pk} by user {request.user.username}")
        try:
            logger.info(f"PostRepostView: Getting original post {pk}")
            original_post = Post.objects.get(pk=pk)
            logger.info(f"PostRepostView: Found original post: {original_post.title} by {original_post.author.username}")

            comment = request.data.get('comment', '').strip()
            logger.info(f"PostRepostView: Comment provided: '{comment}' (length: {len(comment)})")

            # Check if user already reposted this post
            logger.info(f"PostRepostView: Checking for existing repost by user {request.user.username}")
            existing_repost = Repost.objects.filter(
                original_post=original_post,
                user=request.user
            ).first()
            logger.info(f"PostRepostView: Existing repost found: {existing_repost is not None}")

            if existing_repost:
                logger.warning(f"PostRepostView: User {request.user.username} already reposted post {pk}")
                return Response(
                    {"error": "You have already reposted this post"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create a new post for the repost (quote post)
            logger.info(f"PostRepostView: Creating repost post for user {request.user.username}")
            try:
                repost_post = Post.objects.create(
                    author=request.user,
                    title=f"Repost of {original_post.title}",
                    content=comment if comment else f"Reposted: {original_post.title}",
                )
                logger.info(f"PostRepostView: Created repost post with ID {repost_post.id}")
            except Exception as e:
                logger.error(f"PostRepostView: Failed to create repost post: {e}")
                raise

            # Create the repost record and link it to the new post
            logger.info(f"PostRepostView: Creating Repost record linking post {repost_post.id} to original {original_post.id}")
            try:
                repost = Repost.objects.create(
                    original_post=original_post,
                    user=request.user,
                    comment=comment,
                    repost_post=repost_post  # Link the repost to the new post
                )
                logger.info(f"PostRepostView: Created Repost record with ID {repost.id}")
            except Exception as e:
                logger.error(f"PostRepostView: Failed to create Repost record: {e}")
                # Clean up the created post if repost creation fails
                try:
                    repost_post.delete()
                    logger.info(f"PostRepostView: Cleaned up repost post {repost_post.id} after Repost creation failure")
                except Exception as cleanup_error:
                    logger.error(f"PostRepostView: Failed to clean up repost post: {cleanup_error}")
                raise

            # Update repost count on original post
            logger.info(f"PostRepostView: Updating repost count on original post {original_post.id}")
            try:
                # Use F expression to avoid race conditions
                from django.db.models import F
                original_post.reposts_count = F('reposts_count') + 1
                original_post.save(update_fields=['reposts_count', 'updated_at'])  # Trigger updated_at
                # Refresh to get the actual value
                original_post.refresh_from_db()
                reposts_count = original_post.reposts_count  # Use the updated value
                logger.info(f"PostRepostView: Updated repost count to {reposts_count}")
            except Exception as e:
                logger.error(f"PostRepostView: Failed to update repost count: {e}")
                raise

            # Generate new post ID (using the repost post ID)
            new_post_id = f"r_{repost_post.id}"
            logger.info(f"PostRepostView: Generated new post ID: {new_post_id}")

            # Log the action
            log_post_action(
                request.user,
                'create_repost',
                original_post,
                'success',
                {'new_post_id': new_post_id, 'reposts_count': reposts_count, 'has_comment': bool(comment)}
            )

            logger.info(f"PostRepostView: Repost creation successful for post {pk}")
            return Response({
                "repostCount": reposts_count,
                "newPostId": new_post_id
            })

        except Post.DoesNotExist:
            logger.error(f"PostRepostView: Post {pk} not found")
            return Response(
                {"error": "Post not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"PostRepostView: Unexpected error creating repost for post {pk}: {e}")
            logger.error(f"PostRepostView: Error type: {type(e).__name__}")
            import traceback
            logger.error(f"PostRepostView: Full traceback: {traceback.format_exc()}")
            log_post_action(
                request.user,
                'create_repost',
                None,
                'error',
                {'error': str(e), 'traceback': traceback.format_exc()}
            )
            return Response(
                {"error": "Failed to create repost"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PostShareView(views.APIView):
    """
    POST /api/v1/posts/{postId}/share
    Log a share action for a post.
    Returns the updated share count and a short URL.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            post = Post.objects.get(pk=pk)
            platform = request.data.get('platform', 'unknown')

            # Create share record (allow multiple shares per platform for analytics)
            share, created = PostShare.objects.get_or_create(
                post=post,
                user=request.user,
                platform=platform,
                defaults={'platform': platform}
            )

            # Update post share count using F expression to avoid race conditions
            from django.db.models import F
            if created:
                post.shares_count = F('shares_count') + 1
                post.save(update_fields=['shares_count', 'updated_at'])
                # Refresh to get the actual value
                post.refresh_from_db()
                shares_count = post.shares_count
            else:
                # Share already exists, just return current count
                shares_count = post.shares.count()

            # Generate short URL (simplified - in production use a URL shortener service)
            short_url = f"https://sportisode.com/p/{post.id}"

            # Log the action
            log_post_action(
                request.user,
                'share_post',
                post,
                'success',
                {'platform': platform, 'shares_count': shares_count}
            )

            return Response({
                "shareCount": shares_count,
                "shortUrl": short_url
            })

        except Post.DoesNotExist:
            return Response(
                {"error": "Post not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error logging share for post {pk}: {e}")
            log_post_action(
                request.user,
                'share_post',
                None,
                'error',
                {'error': str(e)}
            )
            return Response(
                {"error": "Failed to log share"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PostBookmarkView(views.APIView):
    """
    POST /api/v1/posts/{postId}/bookmark
    Toggle bookmark status for a post.
    Returns current bookmark status.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        logger.info(f"PostBookmarkView: Starting bookmark toggle for post {pk} by user {request.user.username}")
        try:
            logger.info(f"PostBookmarkView: Attempting to get post {pk}")
            post = Post.objects.get(pk=pk)
            logger.info(f"PostBookmarkView: Found post {pk}: {post.title}")

            logger.info(f"PostBookmarkView: Checking for existing bookmark")
            existing_bookmark = Bookmark.objects.filter(user=request.user, post=post).first()
            logger.info(f"PostBookmarkView: Existing bookmark found: {existing_bookmark is not None}")

            if existing_bookmark:
                logger.info(f"PostBookmarkView: Deleting existing bookmark")
                existing_bookmark.delete()
                is_bookmarked = False
                logger.info(f"PostBookmarkView: Bookmark removed successfully")
            else:
                logger.info(f"PostBookmarkView: Creating new bookmark")
                bookmark = Bookmark.objects.create(user=request.user, post=post)
                is_bookmarked = True
                logger.info(f"PostBookmarkView: Bookmark created successfully with ID {bookmark.id}")

            # Log the action
            logger.info(f"PostBookmarkView: Logging action with is_bookmarked={is_bookmarked}")
            log_post_action(
                request.user,
                'toggle_bookmark',
                post,
                'success',
                {'is_bookmarked': is_bookmarked}
            )

            logger.info(f"PostBookmarkView: Returning response with isBookmarked={is_bookmarked}")
            return Response({
                "isBookmarked": is_bookmarked
            })

        except Post.DoesNotExist:
            logger.error(f"PostBookmarkView: Post {pk} not found")
            return Response(
                {"error": "Post not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"PostBookmarkView: Unexpected error toggling bookmark for post {pk}: {e}")
            logger.error(f"PostBookmarkView: Error type: {type(e).__name__}")
            import traceback
            logger.error(f"PostBookmarkView: Full traceback: {traceback.format_exc()}")
            log_post_action(
                request.user,
                'toggle_bookmark',
                None,
                'error',
                {'error': str(e), 'traceback': traceback.format_exc()}
            )
            return Response(
                {"error": "Failed to toggle bookmark"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PostUnlikeView(views.APIView):
    def post(self, request, pk):
        return Response({"status": "unliked"})


class CommentLikeView(views.APIView):
    def post(self, request, pk):
        return Response({"status": "liked"})


class CommentRepliesView(viewsets.ReadOnlyModelViewSet):
    """
    B. Fetching Replies
    GET /api/v1/comments/{commentId}/replies
    Retrieves a paginated list of replies for a specific comment.
    """
    from ..serializers import CommentSerializer
    serializer_class = CommentSerializer
    permission_classes = [permissions.AllowAny]
    from rest_framework.pagination import LimitOffsetPagination
    pagination_class = LimitOffsetPagination

    def get_queryset(self):
        from ..models import Comment
        comment_id = self.kwargs.get('comment_id')
        if not comment_id:
            return Comment.objects.none()

        # Filter comments where parent_comment matches the provided comment_id
        return Comment.objects.filter(parent_comment_id=comment_id).order_by('created_at')

    def list(self, request, *args, **kwargs):
        """
        Returns paginated list of replies for a specific comment.
        Response format: { "count": 5, "replies": [...] }
        """
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'count': len(serializer.data),
            'replies': serializer.data
        })