// src/components/ExplorePage.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Loader2, Trophy, Users, Calendar, Clock, TrendingUp, Star } from 'lucide-react';

// Shadcn/ui Imports
import { ScrollArea } from './components/ui/scroll-area';
import { Card } from './components/ui/card';
import { Alert, AlertTitle, AlertDescription } from './components/ui/alert';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';

// Component Imports
import ProfilePicture from './ProfilePicture';
import { fetchExploreData } from './lib/api';

const ExplorePage = () => {
    const navigate = useNavigate();

    console.log('[ExplorePage] Component rendered');

    // Fetch explore data
    const { data: exploreData, isLoading, isError, error } = useQuery({
        queryKey: ['exploreData'],
        queryFn: fetchExploreData,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
    });

    console.log('[ExplorePage] Query state - isLoading:', isLoading, 'isError:', isError, 'data:', exploreData);

    const handleLeagueClick = (leagueSlug) => {
        navigate(`/leagues/${leagueSlug}`);
    };

    const handleTeamClick = (teamSlug) => {
        navigate(`/teams/${teamSlug}`);
    };

    const handleFixtureClick = (fixtureId) => {
        navigate(`/fixtures/${fixtureId}`);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-sport-accent" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-4">
                <Alert variant="destructive">
                    <AlertTitle>Explore Error</AlertTitle>
                    <AlertDescription>Could not load explore data. {error.message}</AlertDescription>
                </Alert>
            </div>
        );
    }

    const { trending_leagues = [], popular_teams = [], upcoming_fixtures = [] } = exploreData || {};

    return (
        <ScrollArea className="h-[calc(100vh-120px)]">
            <div className="max-w-6xl mx-auto p-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-primary-text mb-2">Explore Sports</h1>
                    <p className="text-secondary-text">Discover trending leagues, popular teams, and upcoming matches</p>
                </div>

                {/* Trending Leagues Section */}
                <section className="mb-8">
                    <div className="flex items-center space-x-2 mb-4">
                        <TrendingUp className="h-6 w-6 text-sport-accent" />
                        <h2 className="text-2xl font-bold text-primary-text">Trending Leagues</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {trending_leagues.map((league) => (
                            <Card
                                key={league.id}
                                className="bg-secondary-bg border-border-divider hover:border-sport-accent/50 transition-colors cursor-pointer group"
                                onClick={() => handleLeagueClick(league.slug)}
                            >
                                <div className="p-6">
                                    <div className="flex items-center space-x-4 mb-4">
                                        <div className="w-16 h-16 bg-sport-accent/20 rounded-full flex items-center justify-center group-hover:bg-sport-accent/30 transition-colors">
                                            {league.logo_url ? (
                                                <img
                                                    src={league.logo_url}
                                                    alt={league.name}
                                                    className="w-12 h-12 rounded-full object-cover"
                                                />
                                            ) : (
                                                <ProfilePicture
                                                    username={league.name.substring(0, 2)}
                                                    size="h-12 w-12"
                                                    className="text-sport-accent font-bold text-lg"
                                                />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-primary-text group-hover:text-sport-accent transition-colors">
                                                {league.name}
                                            </h3>
                                            <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                                                {league.sport}
                                            </Badge>
                                        </div>
                                    </div>

                                    <p className="text-secondary-text mb-4 leading-relaxed">
                                        {league.description}
                                    </p>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-1 text-sm text-secondary-text">
                                            <Trophy className="h-4 w-4" />
                                            <span>Professional League</span>
                                        </div>
                                        <div className="flex items-center space-x-1 text-sm text-sport-accent">
                                            <Star className="h-4 w-4" />
                                            <span>Trending</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* Popular Teams Section */}
                <section className="mb-8">
                    <div className="flex items-center space-x-2 mb-4">
                        <Users className="h-6 w-6 text-sport-accent" />
                        <h2 className="text-2xl font-bold text-primary-text">Popular Teams</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {popular_teams.map((team) => (
                            <Card
                                key={team.id}
                                className="bg-secondary-bg border-border-divider hover:border-sport-accent/50 transition-colors cursor-pointer group"
                                onClick={() => handleTeamClick(team.slug)}
                            >
                                <div className="p-4">
                                    <div className="flex items-center space-x-3 mb-3">
                                        <div className="w-12 h-12 bg-sport-accent/20 rounded-full flex items-center justify-center group-hover:bg-sport-accent/30 transition-colors">
                                            {team.logo_url ? (
                                                <img
                                                    src={team.logo_url}
                                                    alt={team.name}
                                                    className="w-8 h-8 rounded-full object-cover"
                                                />
                                            ) : (
                                                <ProfilePicture
                                                    username={team.name.substring(0, 2)}
                                                    size="h-8 w-8"
                                                    className="text-sport-accent font-bold text-sm"
                                                />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-primary-text group-hover:text-sport-accent transition-colors truncate">
                                                {team.name}
                                            </h4>
                                            <p className="text-xs text-secondary-text truncate">
                                                {team.league?.name}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-secondary-text">
                                        <div className="flex items-center space-x-1">
                                            <Users className="h-3 w-3" />
                                            <span>{team.follower_count || 0} followers</span>
                                        </div>
                                        <Badge variant="outline" className="border-sport-accent/30 text-sport-accent text-xs">
                                            Popular
                                        </Badge>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* Upcoming Fixtures Section */}
                <section className="mb-8">
                    <div className="flex items-center space-x-2 mb-4">
                        <Calendar className="h-6 w-6 text-sport-accent" />
                        <h2 className="text-2xl font-bold text-primary-text">Upcoming Fixtures</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {upcoming_fixtures.map((fixture) => (
                            <Card
                                key={fixture.id}
                                className="bg-secondary-bg border-border-divider hover:border-sport-accent/50 transition-colors cursor-pointer group"
                                onClick={() => handleFixtureClick(fixture.id)}
                            >
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <Badge variant="secondary" className="bg-gray-700 text-gray-300 text-xs">
                                            {fixture.league_name}
                                        </Badge>
                                        <div className="flex items-center space-x-1 text-xs text-secondary-text">
                                            <Clock className="h-3 w-3" />
                                            <span>{new Date(fixture.scheduled_time).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-primary-text truncate flex-1">
                                                {fixture.home_team_name}
                                            </span>
                                            <span className="text-sm font-bold text-sport-accent mx-2">
                                                {fixture.status === 'NS' ? 'vs' : fixture.home_score || '0'}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-primary-text truncate flex-1">
                                                {fixture.away_team_name}
                                            </span>
                                            <span className="text-sm font-bold text-sport-accent mx-2">
                                                {fixture.status === 'NS' ? '' : fixture.away_score || '0'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-3 pt-3 border-t border-border-divider">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-secondary-text">
                                                {new Date(fixture.scheduled_time).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                            <Badge
                                                variant={fixture.status === 'NS' ? 'default' : 'secondary'}
                                                className="text-xs"
                                            >
                                                {fixture.status === 'NS' ? 'Scheduled' : fixture.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* Call to Action */}
                <section className="text-center py-8">
                    <Card className="bg-gradient-to-r from-sport-accent/10 to-sport-accent/5 border-sport-accent/20">
                        <div className="p-8">
                            <Trophy className="h-12 w-12 text-sport-accent mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-primary-text mb-2">
                                Ready to Explore More?
                            </h3>
                            <p className="text-secondary-text mb-6">
                                Follow your favorite teams and leagues to get personalized content and live updates.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button
                                    onClick={() => navigate('/leagues')}
                                    className="bg-sport-accent hover:bg-sport-accent/90"
                                >
                                    Browse All Leagues
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => navigate('/teams')}
                                    className="border-sport-accent text-sport-accent hover:bg-sport-accent hover:text-white"
                                >
                                    Browse All Teams
                                </Button>
                            </div>
                        </div>
                    </Card>
                </section>
            </div>
        </ScrollArea>
    );
};

export default ExplorePage;