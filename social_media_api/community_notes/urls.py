from django.urls import path
from .views import CommunityNoteRequestView

app_name = 'community_notes'

urlpatterns = [
    path('request/', CommunityNoteRequestView.as_view(), name='request'),
]