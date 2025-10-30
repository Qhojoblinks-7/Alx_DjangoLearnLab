from django.urls import path
from . import views

app_name = 'sports'

urlpatterns = [
    path('leagues/<slug:slug>/', views.LeagueDetailView.as_view(), name='league-detail'),
    path('teams/<slug:slug>/', views.TeamDetailView.as_view(), name='team-detail'),
    path('athletes/<slug:slug>/', views.AthleteDetailView.as_view(), name='athlete-detail'),
    path('events/<str:event_id>/', views.EventDetailView.as_view(), name='event-detail'),
    path('feed/<str:feed_id>/', views.SportsFeedView.as_view(), name='sports-feed'),
    path('explore/', views.ExploreView.as_view(), name='explore'),
]