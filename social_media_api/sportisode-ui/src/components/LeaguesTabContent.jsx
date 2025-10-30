// src/components/LeaguesTabContent.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Loader2, Trophy, Users, Calendar, MapPin } from 'lucide-react';

// Shadcn/ui Imports
import { ScrollArea } from '../components/components/ui/scroll-area';
import { Card } from '../components/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '../components/components/ui/alert';
import { Badge } from '../components/components/ui/badge';

// Component Imports
import ProfilePicture from './ProfilePicture';
import InfiniteFeed from './InfiniteFeed';
import PostCard from './PostCard';
import { fetchLeagues, fetchLeagueDetail, fetchSportsFeed } from './lib/api';
import ExplorePage from './ExplorePage';

// Helper function to get league-specific highlights
const getLeagueHighlights = (slug) => {
    const highlightsMap = {
        'nba-basketball': ['Top Competition', 'Elite Athletes', 'Global Coverage', 'High Scoring'],
        'nfl-football': ['Top Competition', 'Global Coverage', 'Strategic Depth', 'Physical Excellence'],
        'premier-league': ['Top Competition', 'Global Coverage', 'Elite Athletes', 'Tactical Mastery'],
        'la-liga': ['Top Competition', 'Elite Athletes', 'Technical Excellence', 'Global Coverage'],
        'serie-a': ['Top Competition', 'Elite Athletes', 'Defensive Strength', 'Global Coverage'],
        'bundesliga': ['Top Competition', 'Elite Athletes', 'Youth Development', 'Global Coverage'],
        'mlb-baseball': ['Top Competition', 'Global Coverage', 'Statistical Depth', 'Long Seasons'],
        'nhl-hockey': ['Top Competition', 'Elite Athletes', 'Speed & Skill', 'Global Coverage']
    };

    return highlightsMap[slug] || ['Top Competition', 'Global Coverage', 'Elite Athletes'];
};

const LeaguesTabContent = () => {
    const navigate = useNavigate();

    console.log('[LeaguesTabContent] Component rendered');

    // Fetch the list of leagues
    const { data: leagues, isLoading, isError, error } = useQuery({
        queryKey: ['leaguesList'],
        queryFn: fetchLeagues,
        staleTime: Infinity, // Leagues don't change often
    });

    console.log('[LeaguesTabContent] Query state - isLoading:', isLoading, 'isError:', isError, 'data length:', leagues?.length);

    // Fetch details for default league (NBA)
    const { data: defaultLeague } = useQuery({
        queryKey: ['leagueDetail', 'nba-basketball'],
        queryFn: () => fetchLeagueDetail('nba-basketball'),
        enabled: !!leagues, // Only fetch after leagues are loaded
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Handle league card click
    const handleLeagueClick = (leagueSlug) => {
        // Navigate to the dedicated leagues page with the selected league
        navigate(`/leagues?league=${leagueSlug}`);
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
                    <AlertTitle>Leagues Error</AlertTitle>
                    <AlertDescription>Could not load major leagues. {error.message}</AlertDescription>
                </Alert>
            </div>
        );
    }

    console.log('[LeaguesTabContent] Rendering with leagues:', leagues);

    return (
        <ScrollArea className="h-[calc(100vh-120px)]">
            <div className="max-w-6xl mx-auto p-4">
                {/* Explore Section */}
                <div className="mb-8">
                    <ExplorePage />
                </div>

                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-primary-text mb-2">Major Sports Leagues</h1>
                    <p className="text-secondary-text">Explore the world's premier professional sports competitions</p>
                    {leagues && <p className="text-xs text-secondary-text mt-2">Found {leagues.length} leagues</p>}
                </div>

                {/* Default League Details */}
                {defaultLeague && (
                    <div className="mb-8 p-6 bg-secondary-bg border border-border-divider rounded-lg">
                        <h2 className="text-xl font-bold text-primary-text mb-4">Featured: {defaultLeague.name}</h2>
                        <p className="text-secondary-text mb-4">{defaultLeague.description}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                            <div>
                                <span className="font-semibold text-primary-text">Sport:</span>
                                <span className="text-secondary-text ml-2">{defaultLeague.sport}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-primary-text">Country:</span>
                                <span className="text-secondary-text ml-2">{defaultLeague.country}</span>
                            </div>
                        </div>
                        {defaultLeague.feed_id && (
                            <div className="mt-4">
                                <h3 className="text-lg font-semibold text-primary-text mb-2">Latest Posts</h3>
                                <InfiniteFeed
                                    queryKey={['sportsFeed', defaultLeague.feed_id]}
                                    queryFn={({ pageParam }) => fetchSportsFeed({ pageParam, feedId: defaultLeague.feed_id })}
                                    headerTitle=""
                                    PostComponent={PostCard}
                                />
                            </div>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-6 justify-items-center">
                    {leagues.map((league) => (
                        <Card
                            key={league.id}
                            className="bg-secondary-bg border-border-divider hover:border-sport-accent/50 transition-colors cursor-pointer group"
                            onClick={() => handleLeagueClick(league.slug)}
                        >
                            <div className="p-6">
                                {/* League Header */}
                                <div className="flex items-center space-x-4 mb-4">
                                    <div className="w-16 h-16 bg-sport-accent/20 rounded-full flex items-center justify-center group-hover:bg-sport-accent/30 transition-colors">
                                        <ProfilePicture
                                            username={league.name.substring(0, 2)}
                                            size="h-12 w-12"
                                            className="text-sport-accent font-bold text-lg"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-primary-text group-hover:text-sport-accent transition-colors">
                                            {league.name}
                                        </h3>
                                        <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                                            {league.slug.replace('-', ' ').toUpperCase()}
                                        </Badge>
                                    </div>
                                </div>

                                {/* League Description */}
                                <p className="text-secondary-text mb-4 leading-relaxed">
                                    {league.description}
                                </p>

                                {/* League Stats/Info */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="flex items-center space-x-2 text-sm text-secondary-text">
                                        <Trophy className="h-4 w-4" />
                                        <span>Professional</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm text-secondary-text">
                                        <Users className="h-4 w-4" />
                                        <span>Global</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm text-secondary-text">
                                        <Calendar className="h-4 w-4" />
                                        <span>Seasonal</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm text-secondary-text">
                                        <MapPin className="h-4 w-4" />
                                        <span>International</span>
                                    </div>
                                </div>

                                {/* League Highlights */}
                                <div className="border-t border-border-divider pt-4">
                                    <h4 className="text-sm font-semibold text-secondary-text mb-2">League Highlights</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {getLeagueHighlights(league.slug).map((highlight, index) => (
                                            <Badge key={index} variant="outline" className="border-sport-accent/30 text-sport-accent text-xs">
                                                {highlight}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Footer Info */}
                <div className="mt-8 p-6 bg-secondary-bg border border-border-divider rounded-lg">
                    <h3 className="text-lg font-semibold text-primary-text mb-2">About Sports Leagues</h3>
                    <p className="text-secondary-text leading-relaxed">
                        These major professional sports leagues represent the pinnacle of athletic competition worldwide.
                        Each league features elite athletes, intense rivalries, and millions of passionate fans.
                        Follow your favorite teams and athletes to stay updated with the latest news, scores, and highlights.
                    </p>
                </div>
            </div>
        </ScrollArea>
    );
};

export default LeaguesTabContent;