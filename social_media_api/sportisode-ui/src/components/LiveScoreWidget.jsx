// src/components/LiveScoreWidget.jsx
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, MapPin, Trophy, Users } from 'lucide-react';
import { Card } from './components/components/ui/card';
import { Badge } from './components/components/ui/badge';
import { ScrollArea } from './components/components/ui/scroll-area';
// Note: API-Football doesn't provide team badges in fixtures, so image utilities not needed

// Direct API call to API-Football for live scores (fallback mechanism)
const fetchLiveScores = async () => {
    try {
        const response = await fetch('https://api-football-v1.p.rapidapi.com/v3/fixtures?live=all', {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': '2cde8b9c2a21f966fd7b1ce5cf2f3689',
                'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch live scores');
        }
        const data = await response.json();
        return data.response || [];
    } catch (error) {
        console.error('Error fetching live scores:', error);
        return [];
    }
};

const LiveScoreWidget = () => {
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);

        return () => clearInterval(timer);
    }, []);

    const { data: liveScores, isLoading, isError, error } = useQuery({
        queryKey: ['liveScores'],
        queryFn: fetchLiveScores,
        refetchInterval: 30000, // Refetch every 30 seconds
        staleTime: 15000, // Consider data stale after 15 seconds
        cacheTime: 60000, // Keep in cache for 1 minute
    });

    const formatScore = (homeScore, awayScore, status) => {
        if (status === 'Match Finished') {
            return `${homeScore || 0} - ${awayScore || 0}`;
        } else if (status?.includes('Min')) {
            return `${homeScore || 0} - ${awayScore || 0}`;
        }
        return 'vs';
    };

    const getStatusColor = (status) => {
        if (status === 'Match Finished') return 'bg-red-500';
        if (status?.includes('Min')) return 'bg-green-500';
        if (status === 'Not Started') return 'bg-gray-500';
        return 'bg-blue-500';
    };

    const getStatusText = (status) => {
        if (status === 'Match Finished') return 'FT';
        if (status?.includes('Min')) return status;
        if (status === 'Not Started') return 'NS';
        return status || 'TBD';
    };

    if (isLoading) {
        return (
            <Card className="p-4 bg-secondary-bg border-border-divider">
                <div className="flex items-center space-x-2 mb-4">
                    <Clock className="h-5 w-5 text-sport-accent animate-pulse" />
                    <h3 className="text-lg font-semibold text-primary-text">Live Scores</h3>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                            <div className="h-16 bg-gray-700 rounded-lg"></div>
                        </div>
                    ))}
                </div>
            </Card>
        );
    }

    if (isError) {
        return (
            <Card className="p-4 bg-secondary-bg border-border-divider">
                <div className="flex items-center space-x-2 mb-4">
                    <Clock className="h-5 w-5 text-red-500" />
                    <h3 className="text-lg font-semibold text-primary-text">Live Scores</h3>
                </div>
                <div className="text-center py-8">
                    <p className="text-secondary-text text-sm">
                        Unable to load live scores at this time.
                    </p>
                    <p className="text-xs text-secondary-text mt-1">
                        {error?.message || 'Please try again later.'}
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-4 bg-secondary-bg border-border-divider">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-sport-accent" />
                    <h3 className="text-lg font-semibold text-primary-text">Live Scores</h3>
                </div>
                <div className="text-xs text-secondary-text">
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>

            <ScrollArea className="h-96">
                <div className="space-y-3">
                    {liveScores && liveScores.length > 0 ? (
                        liveScores.slice(0, 10).map((fixture, index) => {
                            const fixtureInfo = fixture.fixture;
                            const teams = fixture.teams;
                            const goals = fixture.goals;
                            const league = fixture.league;

                            return (
                                <div
                                    key={`${fixtureInfo.id || index}`}
                                    className="p-3 bg-primary-bg border border-border-divider rounded-lg hover:border-sport-accent/30 transition-colors"
                                >
                                    {/* League Header */}
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-1">
                                            <Trophy className="h-3 w-3 text-sport-accent" />
                                            <span className="text-xs text-secondary-text truncate max-w-32">
                                                {league.name || 'Unknown League'}
                                            </span>
                                        </div>
                                        <Badge
                                            className={`text-xs px-2 py-0.5 ${getStatusColor(fixtureInfo.status.short)}`}
                                        >
                                            {getStatusText(fixtureInfo.status.short)}
                                        </Badge>
                                    </div>

                                    {/* Teams and Score */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                                            {/* Home Team Badge - API-Football doesn't provide team badges in fixtures */}
                                            <div className="min-w-0 flex-1">
                                                <div className="text-sm font-medium text-primary-text truncate">
                                                    {teams.home.name || 'Home Team'}
                                                </div>
                                                <div className="text-sm font-medium text-primary-text truncate">
                                                    {teams.away.name || 'Away Team'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-center ml-3">
                                            <div className="text-lg font-bold text-sport-accent">
                                                {formatScore(goals.home, goals.away, fixtureInfo.status.short)}
                                            </div>
                                            {fixtureInfo.status.short?.includes('Min') && (
                                                <div className="text-xs text-secondary-text">
                                                    {fixtureInfo.status.short}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Venue Info */}
                                    {fixtureInfo.venue?.name && (
                                        <div className="flex items-center space-x-1 mt-2">
                                            <MapPin className="h-3 w-3 text-secondary-text" />
                                            <span className="text-xs text-secondary-text truncate">
                                                {fixtureInfo.venue.name}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-8">
                            <Users className="h-8 w-8 text-secondary-text mx-auto mb-2" />
                            <p className="text-secondary-text text-sm">
                                No live matches at the moment.
                            </p>
                            <p className="text-xs text-secondary-text mt-1">
                                Check back later for live scores.
                            </p>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-border-divider">
                <p className="text-xs text-secondary-text text-center">
                    Scores update automatically • Data provided by TheSportsDB
                </p>
            </div>
        </Card>
    );
};

export default LiveScoreWidget;