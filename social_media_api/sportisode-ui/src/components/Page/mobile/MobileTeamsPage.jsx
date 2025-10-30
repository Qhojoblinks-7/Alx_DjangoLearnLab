// src/components/Page/mobile/MobileTeamsPage.jsx
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// Component Imports
import MobileHeader from '../../MobileHeader';
import ProfileDrawer from '../../ProfileDrawer';
import BottomNavBar from '../../BottomNavBar';
import InfiniteFeed from '../../InfiniteFeed';
import PostCard from '../../PostCard';
import ProfilePicture from '../../ProfilePicture';
import { fetchTeams, fetchTeamFeed } from '../../lib/api';

// Shadcn/ui Imports
import { ScrollArea } from '../../components/ui/scroll-area';
import { Card } from '../../components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/alert';

// --- Component to display the Team-specific Feed ---
const TeamFeed = ({ teamSlug }) => {
    // Pass the dedicated fetcher to the reusable InfiniteFeed component
    const customQueryFn = ({ pageParam }) => fetchTeamFeed({ pageParam, teamSlug });

    return (
        <InfiniteFeed
            queryKey={['teamFeed', teamSlug]}
            queryFn={customQueryFn}
            // Title for the team's feed header
            headerTitle={teamSlug.toUpperCase().replace('-', ' ')}
            // Pass the PostCard component for rendering
            PostComponent={PostCard}
        />
    );
};

// --- Main Mobile Teams Page Component ---
const MobileTeamsPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const teamParam = searchParams.get('team');
    const [selectedTeam, setSelectedTeam] = useState(teamParam || 'la-lakers');
    const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);

    // Update selected team when URL param changes
    useEffect(() => {
        if (teamParam) {
            setSelectedTeam(teamParam);
        }
    }, [teamParam]);

    // Handle team selection
    const handleTeamSelect = (teamSlug) => {
        navigate(`/teams?team=${teamSlug}`);
    };

    // Fetch the list of all teams
    const { data: teams, isLoading, isError, error } = useQuery({
        queryKey: ['teamsList'],
        queryFn: fetchTeams,
        staleTime: Infinity, // Teams list is fairly static
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
                        <AlertTitle>Teams Error</AlertTitle>
                        <AlertDescription>Could not load the teams list. {error.message}</AlertDescription>
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
                {/* Team Selection Header */}
                <div className="sticky top-16 bg-dark-bg/95 backdrop-blur-sm z-10 border-b border-gray-700">
                    <div className="px-4 py-3">
                        <h2 className="text-lg font-bold text-white mb-3">All Teams</h2>
                        <ScrollArea className="w-full">
                            <div className="flex space-x-3 pb-2">
                                {teams?.map((team) => (
                                    <div
                                        key={team.id}
                                        onClick={() => handleTeamSelect(team.slug)}
                                        className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-colors min-w-max border ${
                                            selectedTeam === team.slug
                                                ? 'bg-sport-accent/20 text-white border-sport-accent'
                                                : 'bg-gray-800/50 text-gray-300 border-gray-700 hover:bg-gray-700/50'
                                        }`}
                                    >
                                        {/* Team Logo */}
                                        {team.logo_url ? (
                                            <img
                                                src={team.logo_url}
                                                alt={`${team.name} logo`}
                                                className="h-6 w-6 flex-shrink-0 rounded object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <ProfilePicture username={team.abbreviation || team.name.substring(0, 2)} size="h-6 w-6" className="flex-shrink-0"/>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-semibold truncate">{team.name}</h3>
                                            <p className="text-xs text-gray-500 truncate">{team.abbreviation || 'Team'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                {/* Team Feed */}
                <div className="max-w-xl mx-auto">
                    {selectedTeam ? (
                        <TeamFeed teamSlug={selectedTeam} />
                    ) : (
                        <div className="p-4 text-center text-gray-500">Select a team to view its dedicated feed.</div>
                    )}
                </div>
            </div>

            {/* Bottom Navigation */}
            <BottomNavBar />
        </div>
    );
};

export default MobileTeamsPage;