from django.db import models
from django.db.models import Q, Count, Case, When, Value, BooleanField
from django.contrib.auth import get_user_model
from rest_framework import viewsets, permissions
from rest_framework.pagination import LimitOffsetPagination
from ..models import Post
from ..serializers import PostSerializer
from ..throttling import FeedAccessThrottle
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

User = get_user_model()


class HomeFeedViewSet(viewsets.ReadOnlyModelViewSet):
    """
    B-FEED-01: GET /feed/home/?tab={for_you/following}
    Returns the primary feed with personalization for "For You" tab and chronological ordering for "Following" tab.
    Uses limit-offset pagination for compatibility with frontend.
    """
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = LimitOffsetPagination
    throttle_classes = [FeedAccessThrottle]

    def get_queryset(self):
        try:
            user = self.request.user
            tab = self.request.query_params.get('tab', 'for_you')

            if tab == 'following' and user.is_authenticated:
                # B-FEED-01: Following tab - chronological posts from followed users
                following_users = user.following.all()

                # Use a single LEFT JOIN query to get posts with their repost data
                queryset = Post.objects.filter(
                    # Original posts from followed users
                    Q(author__in=following_users) |
                    # Reposts from followed users (the actual posts that were reposted)
                    Q(reposts__user__in=following_users) |
                    # Repost posts (the quote posts created by reposting)
                    Q(original_repost__user__in=following_users)
                ).select_related(
                    'author',
                    'original_repost',
                    'original_repost__original_post',
                    'original_repost__original_post__author'
                ).prefetch_related(
                    'likes', 'comments', 'reposts'
                ).distinct().order_by('-created_at')
            else:
                # B-FEED-02: For You tab - personalized algorithmic feed
                queryset = self._get_personalized_feed(user)

            # Optimization for speed with LEFT JOIN for repost data
            queryset = queryset.select_related(
                'author',
                'original_repost',
                'original_repost__original_post',
                'original_repost__original_post__author'
            ).prefetch_related(
                'likes',
                'comments',
                'reposts',
                'original_repost__original_post__likes',
                'original_repost__original_post__comments',
                'original_repost__original_post__reposts'
            )

            return queryset
        except Exception as e:
            logger.error(f"Error in HomeFeedViewSet.get_queryset: {e}")
            # Return empty queryset on error
            return Post.objects.none()

    def _get_personalized_feed(self, user):
        """
        B-FEED-02: Personalization Engine for "For You" tab
        Logic to score, rank, and inject posts from users/topics the authenticated user doesn't follow.
        """
        try:
            if user.is_authenticated:
                # Get posts from users the current user doesn't follow
                following_users = user.following.all()
                following_user_ids = set(following_users.values_list('id', flat=True))

                # Base queryset: posts not from followed users, using LEFT JOIN for repost data
                base_queryset = Post.objects.exclude(author__in=following_user_ids).select_related(
                    'author',
                    'original_repost',
                    'original_repost__original_post',
                    'original_repost__original_post__author'
                ).prefetch_related(
                    'likes',
                    'comments',
                    'reposts',
                    'original_repost__original_post__likes',
                    'original_repost__original_post__comments',
                    'original_repost__original_post__reposts'
                )

                # B-FEED-02: Scoring algorithm (simplified version)
                # In production, this would use ML models, user engagement history, etc.
                scored_posts = []

                posts_to_score = base_queryset.order_by('-created_at')[:100]  # Limit for performance

                for post in posts_to_score:
                    score = self._calculate_post_score(post, user)
                    scored_posts.append((post, score))

                # Sort by score (highest first), then by creation time
                scored_posts.sort(key=lambda x: (-x[1], -x[0].created_at.timestamp()))

                # Return top posts
                top_posts = [post for post, score in scored_posts[:50]]

                # Also include reposts in the "For You" feed (using LEFT JOIN)
                repost_posts = Post.objects.filter(
                    original_repost__isnull=False
                ).exclude(author__in=following_user_ids).select_related(
                    'author',
                    'original_repost',
                    'original_repost__original_post',
                    'original_repost__original_post__author'
                ).prefetch_related(
                    'likes',
                    'comments',
                    'reposts',
                    'original_repost__original_post__likes',
                    'original_repost__original_post__comments',
                    'original_repost__original_post__reposts'
                ).order_by('-created_at')[:10]

                # Combine with scored posts
                combined_posts = top_posts + list(repost_posts)
                result_queryset = Post.objects.filter(id__in=[p.id for p in combined_posts]).select_related(
                    'author',
                    'original_repost',
                    'original_repost__original_post',
                    'original_repost__original_post__author'
                ).prefetch_related(
                    'likes',
                    'comments',
                    'reposts',
                    'original_repost__original_post__likes',
                    'original_repost__original_post__comments',
                    'original_repost__original_post__reposts'
                ).order_by('-created_at')

                return result_queryset
            else:
                # For unauthenticated users, show recent posts
                return Post.objects.all().order_by('-created_at')
        except Exception as e:
            logger.error(f"Error in HomeFeedViewSet._get_personalized_feed: {e}")
            # Fallback to recent posts
            return Post.objects.all().order_by('-created_at')

    def _calculate_post_score(self, post, user):
        """
        Simplified scoring algorithm for personalization.
        In production, this would be much more sophisticated.
        """
        try:
            score = 0

            # Recency boost (newer posts get higher scores)
            hours_old = (timezone.now() - post.created_at).total_seconds() / 3600
            recency_score = max(0, 24 - hours_old)  # Linear decay over 24 hours
            score += recency_score * 0.3

            # Engagement boost
            total_engagement = post.likes.count() + post.comments.count() + post.reposts.count()
            engagement_score = min(total_engagement, 100)  # Cap at 100
            score += engagement_score * 0.4

            # Author credibility (simplified - based on follower count)
            # In production, this would be pre-calculated
            author_followers = getattr(post.author, 'followers_count', 0)
            credibility_score = min(author_followers / 100, 10)  # Cap at 10
            score += credibility_score * 0.3

            return score
        except Exception as e:
            logger.error(f"Error in HomeFeedViewSet._calculate_post_score: {e}")
            return 0


class LeagueFeedView(viewsets.ReadOnlyModelViewSet):
    """
    B-LEAGUE-03: League-specific feed
    GET /api/posts/league/{league_slug}/
    Returns posts related to a specific league.
    """
    serializer_class = PostSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = LimitOffsetPagination

    def get_queryset(self):
        league_slug = self.kwargs.get('league_slug')
        if not league_slug:
            return Post.objects.none()

        # Search posts that mention the league in content, title, or hashtags
        # Convert slug back to readable name (basic conversion)
        league_name = league_slug.replace('-', ' ').title()

        queryset = Post.objects.filter(
            Q(content__icontains=league_name) |
            Q(title__icontains=league_name) |
            Q(hashtags__hashtag__icontains=league_slug)
        ).distinct().select_related('author').prefetch_related('likes', 'comments', 'reposts')

        return queryset.order_by('-created_at')

    def list(self, request, *args, **kwargs):
        """
        Override list to ensure proper pagination response format.
        """
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class TeamFeedView(viewsets.ReadOnlyModelViewSet):
    """
    B-TEAM-03: Team-specific feed
    GET /api/posts/team/{team_slug}/
    Returns posts related to a specific team.
    """
    serializer_class = PostSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = LimitOffsetPagination

    def get_queryset(self):
        team_slug = self.kwargs.get('team_slug')
        if not team_slug:
            return Post.objects.none()

        # Search posts that mention the team in content, title, or hashtags
        # Convert slug back to readable name (basic conversion)
        team_name = team_slug.replace('-', ' ').title()

        queryset = Post.objects.filter(
            Q(content__icontains=team_name) |
            Q(title__icontains=team_name) |
            Q(hashtags__hashtag__icontains=team_slug)
        ).distinct().select_related('author').prefetch_related('likes', 'comments', 'reposts')

        return queryset.order_by('-created_at')

    def list(self, request, *args, **kwargs):
        """
        Override list to ensure proper pagination response format.
        """
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class AthleteFeedView(viewsets.ReadOnlyModelViewSet):
    """
    B-ATHLETE-03: Athlete-specific feed
    GET /api/posts/athlete/{athlete_slug}/
    Returns posts related to a specific athlete.
    """
    serializer_class = PostSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = LimitOffsetPagination

    def get_queryset(self):
        athlete_slug = self.kwargs.get('athlete_slug')
        if not athlete_slug:
            return Post.objects.none()

        # Search posts that mention the athlete in content, title, or hashtags
        # Convert slug back to readable name (basic conversion)
        athlete_name = athlete_slug.replace('-', ' ').title()

        queryset = Post.objects.filter(
            Q(content__icontains=athlete_name) |
            Q(title__icontains=athlete_name) |
            Q(hashtags__hashtag__icontains=athlete_slug)
        ).distinct().select_related('author').prefetch_related('likes', 'comments', 'reposts')

        return queryset.order_by('-created_at')

    def list(self, request, *args, **kwargs):
        """
        Override list to ensure proper pagination response format.
        """
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class CommunityFeedView(viewsets.ReadOnlyModelViewSet):
    """
    Community-specific feed
    GET /api/posts/community/{community_slug}/
    Returns posts related to a specific community.
    """
    serializer_class = PostSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = LimitOffsetPagination

    def get_queryset(self):
        community_slug = self.kwargs.get('community_slug')
        if not community_slug:
            return Post.objects.none()

        # Search posts that mention the community in content, title, or hashtags
        # Convert slug back to readable name (basic conversion)
        community_name = community_slug.replace('-', ' ').title()

        queryset = Post.objects.filter(
            Q(content__icontains=community_name) |
            Q(title__icontains=community_name) |
            Q(hashtags__hashtag__icontains=community_slug)
        ).distinct().select_related('author').prefetch_related('likes', 'comments', 'reposts')

        return queryset.order_by('-created_at')

    def list(self, request, *args, **kwargs):
        """
        Override list to ensure proper pagination response format.
        """
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class UserPostsFeedView(viewsets.ReadOnlyModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer


class UserRepliesFeedView(viewsets.ReadOnlyModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer


class UserLikesFeedView(viewsets.ReadOnlyModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer