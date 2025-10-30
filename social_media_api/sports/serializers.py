from rest_framework import serializers
from .models import League, Team, Athlete, Fixture

class LeagueSerializer(serializers.ModelSerializer):
    class Meta:
        model = League
        fields = ['id', 'name', 'slug', 'sport', 'description', 'standings', 'feed_id']

class TeamSerializer(serializers.ModelSerializer):
    league = LeagueSerializer(read_only=True)

    class Meta:
        model = Team
        fields = ['id', 'name', 'slug', 'league', 'abbreviation', 'description', 'roster', 'schedule', 'feed_id']

class AthleteSerializer(serializers.ModelSerializer):
    team = TeamSerializer(read_only=True)

    class Meta:
        model = Athlete
        fields = ['id', 'first_name', 'last_name', 'slug', 'team', 'position', 'nationality', 'description', 'feed_id', 'full_name']


class FixtureSerializer(serializers.ModelSerializer):
    """Serializer for fixture data displayed on Explore page"""

    class Meta:
        model = Fixture
        fields = [
            'id', 'home_team_name', 'away_team_name', 'home_team_id', 'away_team_id',
            'league_name', 'league_id', 'scheduled_time', 'status',
            'home_score', 'away_score'
        ]