// src/components/FixtureDetailPage.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Users, Trophy, ArrowLeft } from 'lucide-react';

// Shadcn/ui Imports
import { Card } from './components/ui/card';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from './components/ui/alert';

// Component Imports
import ProfilePicture from './ProfilePicture';
import InfiniteFeed from './InfiniteFeed';
import PostCard from './PostCard';
import { fetchSportsFeed } from './lib/api';

const FixtureDetailPage = () => {
    const { fixtureId } = useParams();
    const navigate = useNavigate();

    console.log('[FixtureDetailPage] Component rendered for fixture:', fixtureId);

    // For now, we'll simulate fixture data since we don't have a dedicated fixture API endpoint
    // In a real implementation, you'd fetch this from the backend
    const fixtureData = {
        id: fixtureId,
        home_team_name: 'Manchester City',
        away_team_name: 'Liverpool FC',
        home_team_id: 50,
        away_team_id: 40,
        league_name: 'Premier League',
        league_id: 39,
        scheduled_time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        status: 'NS', // Not Started
        home_score: null,
        away_score: null,
        venue: 'Etihad Stadium',
        referee: 'Michael Oliver'
    };

    // Fetch related posts using sports feed
    const { data: relatedPosts, isLoading: postsLoading } = useQuery({
        queryKey: ['fixturePosts', fixtureId],
        queryFn: ({ pageParam }) => fetchSportsFeed({
            pageParam,
            feedId: `fixture_${fixtureId}`
        }),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'NS':
                return <Badge variant="secondary">Not Started</Badge>;
            case 'LIVE':
            case '1H':
            case '2H':
                return <Badge variant="destructive" className="animate-pulse">LIVE</Badge>;
            case 'FT':
                return <Badge variant="default">Full Time</Badge>;
            case 'HT':
                return <Badge variant="secondary">Half Time</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4">
            {/* Header */}
            <div className="mb-6">
                <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-primary-text mb-2">
                            {fixtureData.home_team_name} vs {fixtureData.away_team_name}
                        </h1>
                        <p className="text-secondary-text">{fixtureData.league_name}</p>
                    </div>
                    {getStatusBadge(fixtureData.status)}
                </div>
            </div>

            {/* Match Info Card */}
            <Card className="mb-8 p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Home Team */}
                    <div className="text-center">
                        <div className="w-20 h-20 bg-sport-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ProfilePicture
                                username={fixtureData.home_team_name.substring(0, 2)}
                                size="h-16 w-16"
                                className="text-sport-accent font-bold text-xl"
                            />
                        </div>
                        <h3 className="font-bold text-primary-text mb-2">{fixtureData.home_team_name}</h3>
                        {fixtureData.status !== 'NS' && (
                            <div className="text-3xl font-bold text-sport-accent">
                                {fixtureData.home_score || 0}
                            </div>
                        )}
                    </div>

                    {/* Match Details */}
                    <div className="text-center space-y-4">
                        <div className="flex items-center justify-center space-x-2 text-secondary-text">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(fixtureData.scheduled_time)}</span>
                        </div>

                        <div className="flex items-center justify-center space-x-2 text-secondary-text">
                            <Clock className="h-4 w-4" />
                            <span>{formatTime(fixtureData.scheduled_time)}</span>
                        </div>

                        {fixtureData.venue && (
                            <div className="flex items-center justify-center space-x-2 text-secondary-text">
                                <MapPin className="h-4 w-4" />
                                <span>{fixtureData.venue}</span>
                            </div>
                        )}

                        {fixtureData.status === 'NS' && (
                            <div className="text-4xl font-bold text-sport-accent">VS</div>
                        )}

                        {fixtureData.status !== 'NS' && (
                            <div className="text-2xl font-bold text-sport-accent">-</div>
                        )}
                    </div>

                    {/* Away Team */}
                    <div className="text-center">
                        <div className="w-20 h-20 bg-sport-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ProfilePicture
                                username={fixtureData.away_team_name.substring(0, 2)}
                                size="h-16 w-16"
                                className="text-sport-accent font-bold text-xl"
                            />
                        </div>
                        <h3 className="font-bold text-primary-text mb-2">{fixtureData.away_team_name}</h3>
                        {fixtureData.status !== 'NS' && (
                            <div className="text-3xl font-bold text-sport-accent">
                                {fixtureData.away_score || 0}
                            </div>
                        )}
                    </div>
                </div>

                {/* Additional Match Info */}
                <div className="mt-6 pt-6 border-t border-border-divider">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                            <div className="text-secondary-text">League</div>
                            <div className="font-medium text-primary-text">{fixtureData.league_name}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-secondary-text">Round</div>
                            <div className="font-medium text-primary-text">Regular Season</div>
                        </div>
                        <div className="text-center">
                            <div className="text-secondary-text">Venue</div>
                            <div className="font-medium text-primary-text">{fixtureData.venue || 'TBD'}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-secondary-text">Referee</div>
                            <div className="font-medium text-primary-text">{fixtureData.referee || 'TBD'}</div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Match Stats (if live or finished) */}
            {(fixtureData.status !== 'NS') && (
                <Card className="mb-8 p-6">
                    <h2 className="text-xl font-bold text-primary-text mb-4">Match Statistics</h2>

                    <Alert>
                        <Trophy className="h-4 w-4" />
                        <AlertTitle>Live Match</AlertTitle>
                        <AlertDescription>
                            Detailed statistics will be available during and after the match.
                        </AlertDescription>
                    </Alert>
                </Card>
            )}

            {/* Related Posts */}
            <div className="mb-8">
                <h2 className="text-xl font-bold text-primary-text mb-4 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-sport-accent" />
                    Related Posts
                </h2>

                {postsLoading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sport-accent mx-auto"></div>
                        <p className="text-secondary-text mt-2">Loading posts...</p>
                    </div>
                ) : relatedPosts?.results?.length > 0 ? (
                    <InfiniteFeed
                        queryKey={['fixturePosts', fixtureId]}
                        queryFn={({ pageParam }) => fetchSportsFeed({
                            pageParam,
                            feedId: `fixture_${fixtureId}`
                        })}
                        headerTitle=""
                        PostComponent={PostCard}
                    />
                ) : (
                    <Card className="p-8 text-center">
                        <Users className="h-12 w-12 text-secondary-text mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-primary-text mb-2">No posts yet</h3>
                        <p className="text-secondary-text">
                            Be the first to post about this match!
                        </p>
                    </Card>
                )}
            </div>

            {/* Quick Actions */}
            <Card className="p-6">
                <h2 className="text-xl font-bold text-primary-text mb-4">Quick Actions</h2>
                <div className="flex flex-wrap gap-4">
                    <Button
                        onClick={() => navigate(`/teams/${fixtureData.home_team_name.toLowerCase().replace(/\s+/g, '-')}`)}
                        variant="outline"
                    >
                        Follow {fixtureData.home_team_name}
                    </Button>
                    <Button
                        onClick={() => navigate(`/teams/${fixtureData.away_team_name.toLowerCase().replace(/\s+/g, '-')}`)}
                        variant="outline"
                    >
                        Follow {fixtureData.away_team_name}
                    </Button>
                    <Button
                        onClick={() => navigate(`/leagues/${fixtureData.league_name.toLowerCase().replace(/\s+/g, '-')}`)}
                        variant="outline"
                    >
                        View League
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default FixtureDetailPage;