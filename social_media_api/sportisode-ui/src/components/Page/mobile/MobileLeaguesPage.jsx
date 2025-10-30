// src/components/Page/mobile/MobileLeaguesPage.jsx
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// Component Imports
import MobileHeader from '../../MobileHeader';
import ProfileDrawer from '../../ProfileDrawer';
import BottomNavBar from '../../BottomNavBar';
import InfiniteFeed from '../../InfiniteFeed';
import PostCard from '../../PostCard';
import ProfilePicture from '../../ProfilePicture';
import { fetchLeagues, fetchLeagueFeed } from '../../lib/api';

// Shadcn/ui Imports
import { ScrollArea } from '../../components/ui/scroll-area';
import { Card } from '../../components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/alert';

// --- Component to display the League-specific Feed ---
const LeagueFeed = ({ leagueSlug }) => {
    // Pass the dedicated fetcher to the reusable InfiniteFeed component
    const customQueryFn = ({ pageParam }) => fetchLeagueFeed({ pageParam, leagueSlug });

    return (
        <InfiniteFeed
            queryKey={['leagueFeed', leagueSlug]}
            queryFn={customQueryFn}
            // Title for the league's feed header
            headerTitle={leagueSlug.toUpperCase().replace('-', ' ')}
            // Pass the PostCard component for rendering
            PostComponent={PostCard}
        />
    );
};

// --- Main Mobile Leagues Page Component ---
const MobileLeaguesPage = () => {
    const [searchParams] = useSearchParams();
    const leagueParam = searchParams.get('league');
    const [selectedLeague, setSelectedLeague] = useState(leagueParam || 'nba-basketball');
    const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);

    // Update selected league when URL param changes
    useEffect(() => {
        if (leagueParam) {
            setSelectedLeague(leagueParam);
        }
    }, [leagueParam]);

    // Fetch the list of leagues
    const { data: leagues, isLoading, isError, error } = useQuery({
        queryKey: ['leaguesList'],
        queryFn: fetchLeagues,
        staleTime: Infinity, // Leagues don't change often
    });

    const handleProfileClick = () => {
        setIsProfileDrawerOpen(true);
    };

    const handleSettingsClick = () => {
        console.log('Settings clicked');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-dark-bg">
                <MobileHeader
                    onProfileClick={handleProfileClick}
                    onSettingsClick={handleSettingsClick}
                />
                <ProfileDrawer
                    isOpen={isProfileDrawerOpen}
                    onClose={() => setIsProfileDrawerOpen(false)}
                />
                <div className="flex justify-center items-center h-screen pt-16">
                    <Loader2 className="h-10 w-10 animate-spin text-sport-accent" />
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="min-h-screen bg-dark-bg">
                <MobileHeader
                    onProfileClick={handleProfileClick}
                    onSettingsClick={handleSettingsClick}
                />
                <ProfileDrawer
                    isOpen={isProfileDrawerOpen}
                    onClose={() => setIsProfileDrawerOpen(false)}
                />
                <div className="p-4 pt-20">
                    <Alert variant="destructive">
                        <AlertTitle>Leagues Error</AlertTitle>
                        <AlertDescription>Could not load major leagues. {error.message}</AlertDescription>
                    </Alert>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-bg">
            {/* Mobile Header */}
            <MobileHeader
                onProfileClick={handleProfileClick}
                onSettingsClick={handleSettingsClick}
            />

            {/* Profile Drawer */}
            <ProfileDrawer
                isOpen={isProfileDrawerOpen}
                onClose={() => setIsProfileDrawerOpen(false)}
            />

            {/* Main Content */}
            <div className="pt-16">
                {/* League Selection Header */}
                <div className="sticky top-16 bg-dark-bg/95 backdrop-blur-sm z-10 border-b border-gray-700">
                    <div className="px-4 py-3">
                        <h2 className="text-xl font-semibold text-white mb-3">Major Leagues</h2>
                        <ScrollArea className="w-full">
                            <div className="flex space-x-3 pb-2">
                                {leagues?.map((league) => (
                                    <div
                                        key={league.id}
                                        onClick={() => setSelectedLeague(league.slug)}
                                        className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-colors min-w-max border ${
                                            selectedLeague === league.slug
                                                ? 'bg-sport-accent/20 text-white border-sport-accent'
                                                : 'bg-gray-800/50 text-gray-300 border-gray-700 hover:bg-gray-700/50'
                                        }`}
                                    >
                                        {/* League Logo */}
                                        {league.logo_url ? (
                                            <img
                                                src={league.logo_url}
                                                alt={`${league.name} logo`}
                                                className="h-6 w-6 flex-shrink-0 rounded object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <ProfilePicture username={league.name.substring(0, 2)} size="h-6 w-6" className="flex-shrink-0"/>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-medium truncate">{league.name}</h3>
                                            <p className="text-xs text-gray-500 truncate">{league.description || 'Global Competition'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                {/* League Feed */}
                <div className="max-w-xl mx-auto">
                    {selectedLeague ? (
                        <LeagueFeed leagueSlug={selectedLeague} />
                    ) : (
                        <div className="p-4 text-center text-gray-500">Select a league to view its feed.</div>
                    )}
                </div>
            </div>

            {/* Bottom Navigation */}
            <BottomNavBar />
        </div>
    );
};

export default MobileLeaguesPage;