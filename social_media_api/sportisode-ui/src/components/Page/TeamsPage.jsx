// src/pages/TeamsPage.jsx
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// Shadcn/ui Imports
import { ScrollArea } from '../components/ui/scroll-area';
import { Card } from '../components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';

// Component & Utility Imports
import InfiniteFeed from '../InfiniteFeed'; 
import PostCard from '../PostCard'; 
import ProfilePicture from '../ProfilePicture';
import { fetchTeams, fetchTeamDetail, fetchSportsFeed } from '../lib/api';


// --- Component to display the Team-specific Feed ---
const TeamFeed = ({ feedId, teamName }) => {
    // Pass the dedicated fetcher to the reusable InfiniteFeed component
    const customQueryFn = ({ pageParam }) => fetchSportsFeed({ pageParam, feedId });

    return (
        <InfiniteFeed
            queryKey={['sportsFeed', feedId]}
            queryFn={customQueryFn}
            // Title for the team's feed header
            headerTitle={teamName}
            // Pass the PostCard component for rendering
            PostComponent={PostCard}
        />
    );
};

const TeamsPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const teamParam = searchParams.get('team');

    // State to manage the active team slug (Defaulting to URL param or la-lakers)
    const [selectedTeam, setSelectedTeam] = useState(teamParam || 'la-lakers');

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
    const { data: teams, isLoading: teamsLoading, isError: teamsError, error: teamsErrorMsg } = useQuery({
        queryKey: ['teamsList'],
        queryFn: fetchTeams,
        staleTime: Infinity, // Teams list is fairly static
    });

    // Fetch the selected team details
    const { data: teamDetails } = useQuery({
        queryKey: ['teamDetail', selectedTeam],
        queryFn: () => fetchTeamDetail(selectedTeam),
        enabled: !!selectedTeam, // Only fetch if selectedTeam is set
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    if (teamsLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-10 w-10 animate-spin text-sport-accent" />
            </div>
        );
    }

    if (teamsError) {
        return (
            <div className="p-4">
                <Alert variant="destructive">
                    <AlertTitle>Teams Error</AlertTitle>
                    <AlertDescription>Could not load the teams list. {teamsErrorMsg.message}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="flex w-full min-h-screen">
            
            {/* Main Content Column: Team Details and Feed */}
            <div className="flex-1 max-w-xl mx-auto">
                {selectedTeam ? (
                    <>
                        {/* Team Details Header */}
                        {teamDetails && (
                            <div className="mb-6 p-4 bg-secondary-bg border border-border-divider rounded-lg">
                                <h1 className="text-2xl font-bold text-primary-text mb-2">{teamDetails.name}</h1>
                                <p className="text-secondary-text mb-4">{teamDetails.description}</p>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-semibold text-primary-text">Sport:</span>
                                        <span className="text-secondary-text ml-2">{teamDetails.sport}</span>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-primary-text">League:</span>
                                        <span className="text-secondary-text ml-2">{teamDetails.league?.name}</span>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-primary-text">City:</span>
                                        <span className="text-secondary-text ml-2">{teamDetails.city}</span>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-primary-text">Country:</span>
                                        <span className="text-secondary-text ml-2">{teamDetails.country}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Team Feed */}
                        {teamDetails?.feed_id ? (
                            <TeamFeed feedId={teamDetails.feed_id} teamName={teamDetails.name} />
                        ) : (
                            <div className="p-4 text-center text-secondary-text">Loading team feed...</div>
                        )}
                    </>
                ) : (
                    <div className="p-4 text-center text-secondary-text">Select a team to view its details and feed.</div>
                )}
            </div>
            
            {/* Teams Sidebar (Fixed and Scrollable) */}
            <div className="hidden lg:block w-96 ml-8">
                <Card className="sticky top-4 bg-dark-card border-gray-700 p-0 shadow-lg h-[calc(100vh-1rem)]">
                    <h2 className="text-xl font-semibold p-4 text-white border-b border-gray-700">All Teams</h2>
                    <ScrollArea className="h-[calc(100vh-70px)]">
                        {teams.map((team) => (
                            <div
                                key={team.id}
                                onClick={() => handleTeamSelect(team.slug)}
                                className={`flex items-center p-3 cursor-pointer transition-colors border-b border-gray-800
                                    ${selectedTeam === team.slug
                                        ? 'bg-sport-accent/20 text-white font-bold'
                                        : 'hover:bg-gray-800/50 text-gray-300'
                                    }`}
                            >
                                {/* Team Logo */}
                                {team.logo_url ? (
                                    <img
                                        src={team.logo_url}
                                        alt={`${team.name} logo`}
                                        className="h-8 w-8 mr-3 rounded object-cover"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <ProfilePicture username={team.abbreviation || team.name.substring(0, 2)} size="h-8 w-8" className="mr-3"/>
                                <div>
                                    <p className="leading-tight">{team.name}</p>
                                    <p className="text-xs text-gray-500">{team.abbreviation || 'Team'}</p>
                                </div>
                            </div>
                        ))}
                    </ScrollArea>
                </Card>
            </div>
        </div>
    );
};

export default TeamsPage;