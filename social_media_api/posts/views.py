from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from .models import Post, Comment, Like
from .serializers import PostSerializer, CommentSerializer
from rest_framework import views, status
from rest_framework.response import Response
from .permissions import IsOwnerOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.pagination import LimitOffsetPagination
from django.shortcuts import get_object_or_404

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
        post = get_object_or_404(Post, pk=pk)
        user = request.user
        
        try:
            # If it exists, delete it (UNLIKE)
            like_instance = Like.objects.get(user=user, post=post)
            like_instance.delete()
            status_message = "unliked"
        except Like.DoesNotExist:
            # If it doesn't exist, create it (LIKE)
            Like.objects.create(user=user, post=post)
            status_message = "liked"

        # Return the updated count for the PostCard UI
        return Response({
            "status": status_message,
            "likes_count": post.likes.count(),
            "is_liked": status_message == "liked"
        }, status=status.HTTP_200_OK)