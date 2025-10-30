from django.contrib import admin
from .models import List, ListPost


@admin.register(List)
class ListAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'is_private', 'is_default', 'post_count', 'created_at']
    list_filter = ['is_private', 'is_default', 'created_at']
    search_fields = ['name', 'description', 'owner__username']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ListPost)
class ListPostAdmin(admin.ModelAdmin):
    list_display = ['list', 'post', 'added_at', 'order']
    list_filter = ['added_at']
    search_fields = ['list__name', 'post__title']
    readonly_fields = ['added_at']
