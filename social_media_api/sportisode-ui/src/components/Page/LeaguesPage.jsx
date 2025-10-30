// src/pages/LeaguesPage.jsx
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// Shadcn/ui Imports
import { ScrollArea } from '../components/ui/scroll-area';
import { Card } from '../components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';

// Component Imports
import InfiniteFeed from '../InfiniteFeed'; // Reusing the feed component
import PostCard from '../PostCard'; // Used by InfiniteFeed
import ProfilePicture from '../ProfilePicture'; // For league logos
import { fetchLeagues, fetchLeagueDetail, fetchSportsFeed } from '../lib/api';

// --- Component to display the League-specific Feed ---
const LeagueFeed = ({ feedId, leagueName }) => {
    // Pass the dedicated fetcher to the reusable InfiniteFeed component
    const customQueryFn = ({ pageParam }) => fetchSportsFeed({ pageParam, feedId });

    return (
        <InfiniteFeed
            queryKey={['sportsFeed', feedId]}
            queryFn={customQueryFn}
            // Title for the league's feed header
            headerTitle={leagueName}
            // Pass the PostCard component for rendering
            PostComponent={PostCard}
        />
    );
};

const LeaguesPage = () => {
    const [searchParams] = useSearchParams();
    const leagueParam = searchParams.get('league');

    // State to manage the active league slug (Defaulting to URL param or nba-basketball)
    const [selectedLeague, setSelectedLeague] = useState(leagueParam || 'nba-basketball');

    // Update selected league when URL param changes
    useEffect(() => {
        if (leagueParam) {
            setSelectedLeague(leagueParam);
        }
    }, [leagueParam]);
    
    // Fetch the list of leagues
    const { data: leagues, isLoading: leaguesLoading, isError: leaguesError, error: leaguesErrorMsg } = useQuery({
        queryKey: ['leaguesList'],
        queryFn: fetchLeagues,
        staleTime: Infinity, // Leagues don't change often
    });

    // Fetch the selected league details
    const { data: leagueDetails } = useQuery({
        queryKey: ['leagueDetail', selectedLeague],
        queryFn: () => fetchLeagueDetail(selectedLeague),
        enabled: !!selectedLeague, // Only fetch if selectedLeague is set
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    if (leaguesLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-10 w-10 animate-spin text-sport-accent" />
            </div>
        );
    }

    if (leaguesError) {
        return (
            <div className="p-4">
                <Alert variant="destructive">
                    <AlertTitle>Leagues Error</AlertTitle>
                    <AlertDescription>Could not load major leagues. {leaguesErrorMsg.message}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="flex w-full min-h-screen">
            
            {/* Main Content Column: League Details and Feed */}
            <div className="flex-1 max-w-xl mx-auto">
                {selectedLeague ? (
                    <>
                        {/* League Details Header */}
                        {leagueDetails && (
                            <div className="mb-6 p-4 bg-secondary-bg border border-border-divider rounded-lg">
                                <h1 className="text-2xl font-bold text-primary-text mb-2">{leagueDetails.name}</h1>
                                <p className="text-secondary-text mb-4">{leagueDetails.description}</p>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-semibold text-primary-text">Sport:</span>
                                        <span className="text-secondary-text ml-2">{leagueDetails.sport}</span>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-primary-text">Country:</span>
                                        <span className="text-secondary-text ml-2">{leagueDetails.country}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* League Feed */}
                        {leagueDetails?.feed_id ? (
                            <LeagueFeed feedId={leagueDetails.feed_id} leagueName={leagueDetails.name} />
                        ) : (
                            <div className="p-4 text-center text-secondary-text">Loading league feed...</div>
                        )}
                    </>
                ) : (
                    <div className="p-4 text-center text-secondary-text">Select a league to view its details and feed.</div>
                )}
            </div>
            
            {/* Leagues Sidebar (Fixed and Scrollable) */}
            <div className="hidden lg:block w-96 ml-8">
                <Card className="sticky top-4 bg-dark-card border-gray-700 p-0 shadow-lg h-[calc(100vh-1rem)]">
                    <h2 className="text-xl font-semibold p-4 text-white border-b border-gray-700">Major Leagues</h2>
                    <ScrollArea className="h-[calc(100vh-70px)]">
                        {leagues.map((league) => (
                            <div
                                key={league.id}
                                onClick={() => setSelectedLeague(league.slug)}
                                className={`flex items-center p-3 cursor-pointer transition-colors border-b border-gray-800 
                                    ${selectedLeague === league.slug 
                                        ? 'bg-sport-accent/20 text-white font-bold' 
                                        : 'hover:bg-gray-800/50 text-gray-300'
                                    }`}
                            >
                                {/* League Logo */}
                                {league.logo_url ? (
                                    <img
                                        src={league.logo_url}
                                        alt={`${league.name} logo`}
                                        className="h-8 w-8 mr-3 rounded object-cover"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <ProfilePicture username={league.name.substring(0, 2)} size="h-8 w-8" className="mr-3"/>
                                <div>
                                    <p className="leading-tight">{league.name}</p>
                                    <p className="text-xs text-gray-500">{league.description || 'Global Competition'}</p>
                                </div>
                            </div>
                        ))}
                    </ScrollArea>
                </Card>
            </div>
        </div>
    );
};

export default LeaguesPage;