from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import List, ListPost
from .serializers import (
    ListSerializer, ListCreateSerializer, ListUpdateSerializer,
    AddPostToListSerializer, ListPostSerializer
)
from posts.models import Post
from posts.views import log_post_action


class ListViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user lists."""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return ListCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ListUpdateSerializer
        return ListSerializer

    def get_queryset(self):
        return List.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['post'])
    def add_post(self, request, pk=None):
        """Add a post to a list."""
        list_obj = self.get_object()
        serializer = AddPostToListSerializer(data=request.data)

        if serializer.is_valid():
            post_id = serializer.validated_data['post_id']
            post = get_object_or_404(Post, id=post_id)

            # Check if post is already in the list
            if ListPost.objects.filter(list=list_obj, post=post).exists():
                return Response(
                    {"message": "Post is already in this list"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Add post to list
            ListPost.objects.create(list=list_obj, post=post)
            return Response({"message": "Post added to list successfully"})

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def remove_post(self, request, pk=None):
        """Remove a post from a list."""
        list_obj = self.get_object()
        post_id = request.data.get('post_id')

        if not post_id:
            return Response(
                {"error": "post_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            list_post = ListPost.objects.get(
                list=list_obj,
                post_id=post_id
            )
            list_post.delete()
            return Response({"message": "Post removed from list successfully"})
        except ListPost.DoesNotExist:
            return Response(
                {"error": "Post is not in this list"},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['get'])
    def posts(self, request, pk=None):
        """Get all posts in a list."""
        list_obj = self.get_object()
        list_posts = list_obj.list_posts.select_related(
            'post__author'
        ).order_by('-added_at')

        page = self.paginate_queryset(list_posts)
        if page is not None:
            serializer = ListPostSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = ListPostSerializer(list_posts, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def toggle_post(self, request, pk=None):
        """Add or remove a post from a list (toggle functionality)."""
        list_obj = self.get_object()
        serializer = AddPostToListSerializer(data=request.data)

        if serializer.is_valid():
            post_id = serializer.validated_data['post_id']
            post = get_object_or_404(Post, id=post_id)

            # Check if post is already in the list
            existing = ListPost.objects.filter(list=list_obj, post=post).first()

            if existing:
                # Remove post from list
                existing.delete()
                log_post_action(
                    user=request.user,
                    action_type='remove_from_list',
                    target_post=post,
                    details={'list_id': list_obj.id, 'list_name': list_obj.name, 'endpoint': 'toggle_post'}
                )
                return Response({
                    "message": "Post removed from list successfully",
                    "action": "removed"
                })
            else:
                # Add post to list
                ListPost.objects.create(list=list_obj, post=post)
                log_post_action(
                    user=request.user,
                    action_type='add_to_list',
                    target_post=post,
                    details={'list_id': list_obj.id, 'list_name': list_obj.name, 'endpoint': 'toggle_post'}
                )
                return Response({
                    "message": "Post added to list successfully",
                    "action": "added"
                })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DefaultListsView(viewsets.ReadOnlyModelViewSet):
    """ViewSet for system default lists (Reading List, Favorites, etc.)."""
    permission_classes = [IsAuthenticated]
    serializer_class = ListSerializer

    def get_queryset(self):
        # Return system default lists for the current user
        return List.objects.filter(
            owner=self.request.user,
            is_default=True
        )

    @action(detail=False, methods=['post'])
    def initialize_defaults(self, request):
        """Initialize default lists for a user if they don't exist."""
        user = request.user
        defaults_created = []

        default_lists = [
            {
                'name': 'Reading List',
                'description': 'Posts to read later',
                'icon': 'BookOpen',
                'is_default': True
            },
            {
                'name': 'Favorites',
                'description': 'Your favorite posts',
                'icon': 'Heart',
                'is_default': True
            },
            {
                'name': 'Highlights',
                'description': 'Best posts and highlights',
                'icon': 'Star',
                'is_default': True
            }
        ]

        for list_data in default_lists:
            list_obj, created = List.objects.get_or_create(
                owner=user,
                name=list_data['name'],
                defaults=list_data
            )
            if created:
                defaults_created.append(list_obj.name)

        return Response({
            "message": f"Created {len(defaults_created)} default lists",
            "created": defaults_created
        })
