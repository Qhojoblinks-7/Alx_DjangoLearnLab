"""
URL configuration for social_media_api project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from posts.views import TrendsView, LeaguesView, TeamsView, AthletesView, HomeFeedViewSet, SearchViewSet

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include(('accounts.urls', 'accounts'), namespace='accounts')),
    path('posts/', include('posts.urls')),
    path('notifications/', include('notifications.urls')),
    path('messages/', include('messages.urls')),
    path('communities/', include('communities.urls')),
    path('lists/', include('lists.urls')),
    path('community_notes/', include('community_notes.urls')),
    path('sports/', include('sports.urls')),
    path('feed/home/', HomeFeedViewSet.as_view({'get': 'list'}), name='home-feed'),  # B-FEED-01
    path('search/', SearchViewSet.as_view({'get': 'list'}), name='search'),  # B-SEARCH-01
    path('search/context/', SearchViewSet.as_view({'get': 'context'}), name='search-context'),  # B-SEARCH-02
    path('trends/', TrendsView.as_view({'get': 'list'}), name='trends'),  # B-EXP-TRN-01
    path('leagues/', LeaguesView.as_view({'get': 'list'}), name='leagues'),  # B-LEAGUE-01
    path('teams/', TeamsView.as_view({'get': 'list'}), name='teams'),  # B-TEAM-01
    path('athletes/', AthletesView.as_view({'get': 'list'}), name='athletes'),  # B-ATHLETE-01
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
