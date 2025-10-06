from rest_framework import viewsets, filters, generics
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from .models import Post, Comment, Like
from .serializers import PostSerializer, CommentSerializer
from rest_framework import views, status
from rest_framework.response import Response
from .permissions import IsOwnerOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.pagination import LimitOffsetPagination
from django.shortcuts import get_object_or_404
from notifications.models import Notification
from notifications.serializers import NotificationSerializer
from django.contrib.contenttypes.models import ContentType
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    pagination_class = LimitOffsetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['title', 'content']
    
    
    # Automatically set the author of the post to the current logged-in user
    def perform_create(self, serializer):
        serializer.save(author = self.request.user)
        
class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    pagination_class = LimitOffsetPagination
    
    # Retrieve comments for a specific post (nested routing logic)
    def get_queryset(self):
        post_id = self.kwargs.get('post_pk')
        if post_id:
            return Comment.objects.filter(post_id=post_id)
        return Comment.objects.all()
    
    def perform_create(self, serializer):
        post_id = self.kwargs.get('post_pk')
        post = Post.objects.get(id=post_id)
        serializer.save(author=self.request.user, post=post)
        
class FeedViewSet(viewsets.ReadOnlyModelViewSet):
    """
    A simple ViewSet for viewing the feed of posts.
    """
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = LimitOffsetPagination
    
    
    def get_queryset(self):
        user = self.request.user
        
        # Get IDs of users the current user follows
        followed_users_id = user.following.values_list('id', flat=True)
        
        
        # Filter posts (Task 2 requirement: show followed users' posts)
        # You can expand this with an OR condition (Q object) to mix in popular posts later.
        
        queryset = Post.objects.filter(author__id__in=followed_users_id).order_by('-created_at')
        
        
        #  Optimization for speed
        
        queryset = queryset.select_related('author').prefetch_related('likes', 'comments')
        
        return queryset
    
class PostLikeView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        post = generics.get_object_or_404(Post, pk=pk)
        user = request.user

        like, created = Like.objects.get_or_create(user=user, post=post)

        if not created:
            # If like already existed, delete it (UNLIKE)
            like.delete()
            status_message = "unliked"
        else:
            # If like was created, it's a LIKE
            status_message = "liked"

            # Create notification for the like
            notification = Notification.objects.create(
                recipient=post.author,
                actor=user,
                verb="liked",
                target=post
            )

            # Send real-time WebSocket notification
            channel_layer = get_channel_layer()
            notification_data = NotificationSerializer(notification).data
            group_name = f'user_{post.author.id}_notifications'

            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    'type': 'send_notification',
                    'data': notification_data,
                    'event_type': 'new_notification'
                }
            )

        # Return the updated count for the PostCard UI
        return Response({
            "status": status_message,
            "likes_count": post.likes.count(),
            "is_liked": status_message == "liked"
        }, status=status.HTTP_200_OK)