// src/components/AthletesTabContent.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Loader2, Trophy, Users, Star, TrendingUp } from 'lucide-react';

// Shadcn/ui Imports
import { ScrollArea } from '../components/components/ui/scroll-area';
import { Card } from '../components/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '../components/components/ui/alert';
import { Badge } from '../components/components/ui/badge';

// Component Imports
import ProfilePicture from './ProfilePicture';
import InfiniteFeed from './InfiniteFeed';
import PostCard from './PostCard';
import { fetchAthletes, fetchAthleteDetail, fetchSportsFeed } from './lib/api';

// Helper function to get athlete-specific highlights
const getAthleteHighlights = (slug) => {
    const highlightsMap = {
        // Basketball
        'lebron-james': ['GOAT', '4x Champion', '4x MVP', 'Scoring King'],
        'stephen-curry': ['3x Champion', '2x MVP', 'Splash Brother', '3-Point King'],
        'kevin-durant': ['2x Champion', '2x Finals MVP', 'Scoring Machine', 'Durantula'],
        'giannis-antetokounmpo': ['2x MVP', 'Greek Freak', 'Defensive Player', 'Athletic Phenom'],
        'nikola-jokic': ['2x MVP', 'Joker', 'Triple-Double King', 'Playmaking Center'],
        // Football
        'patrick-mahomes': ['2x Super Bowl Winner', '2x Super Bowl MVP', 'Chiefs QB', 'Arm Cannon'],
        'lamar-jackson': ['MVP', 'Ravens QB', 'Dual-Threat', 'Speed Demon'],
        'christian-mccaffrey': ['Rushing Yards Leader', '49ers RB', 'Dynamic Runner', 'Receiving Threat'],
        'travis-kelce': ['Super Bowl Winner', 'Chiefs TE', 'All-Pro', 'Playmaker'],
        // Baseball
        'shohei-ohtani': ['2-Way Phenom', 'MVP', 'Dodgers Star', 'Japanese Legend'],
        'mookie-betts': ['5x All-Star', 'Dodgers OF', 'Gold Glove', 'Consistent Excellence'],
        'freddie-freeman': ['8x All-Star', 'Dodgers 1B', 'Power Hitter', 'RBI Machine'],
        // Soccer
        'lionel-messi': ['8x Ballon d\'Or', 'GOAT', 'Inter Miami', 'Argentine Legend'],
        'cristiano-ronaldo': ['5x Ballon d\'Or', 'Al-Nassr', 'Portuguese Icon', 'Goal Scoring Machine'],
        'kylian-mbappe': ['World Cup Winner', 'PSG Forward', 'Speed Demon', 'Young Phenom'],
        'mohamed-salah': ['Premier League Star', 'Liverpool Winger', 'Egyptian King', 'Clinical Finisher'],
        // Tennis
        'novak-djokovic': ['23x Grand Slam', 'GOAT Candidate', 'Serbian Legend', 'Mental Giant'],
        'carlos-alcaraz': ['2x Grand Slam', 'Spanish Sensation', 'Next Gen', 'Clay Court King']
    };

    return highlightsMap[slug] || ['Elite Athlete', 'Professional', 'Rising Star', 'Fan Favorite'];
};

const AthletesTabContent = () => {
    const navigate = useNavigate();

    console.log('[AthletesTabContent] Component rendered');

    // Fetch the list of athletes
    const { data: athletes, isLoading, isError, error } = useQuery({
        queryKey: ['athletesList'],
        queryFn: fetchAthletes,
        staleTime: Infinity, // Athletes don't change often
    });

    console.log('[AthletesTabContent] Query state - isLoading:', isLoading, 'isError:', isError, 'data length:', athletes?.length);

    // Fetch details for default athlete (LeBron James)
    const { data: defaultAthlete } = useQuery({
        queryKey: ['athleteDetail', 'lebron-james'],
        queryFn: () => fetchAthleteDetail('lebron-james'),
        enabled: !!athletes, // Only fetch after athletes are loaded
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Handle athlete card click
    const handleAthleteClick = (athleteSlug) => {
        // Navigate to the feed page with athlete filter
        navigate(`/?athlete=${athleteSlug}`);
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
                    <AlertTitle>Athletes Error</AlertTitle>
                    <AlertDescription>Could not load athletes. {error.message}</AlertDescription>
                </Alert>
            </div>
        );
    }

    // Group athletes by sport
    const athletesBySport = athletes.reduce((acc, athlete) => {
        const sport = athlete.sport || 'Other';
        if (!acc[sport]) {
            acc[sport] = [];
        }
        acc[sport].push(athlete);
        return acc;
    }, {});

    console.log('[AthletesTabContent] Rendering with athletes:', athletes);

    return (
        <ScrollArea className="h-[calc(100vh-120px)]">
            <div className="max-w-6xl mx-auto p-4">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-primary-text mb-2">Professional Athletes</h1>
                    <p className="text-secondary-text">Follow your favorite athletes and get the latest news, stats, and highlights</p>
                    {athletes && <p className="text-xs text-secondary-text mt-2">Found {athletes.length} athletes</p>}
                </div>

                {/* Default Athlete Details */}
                {defaultAthlete && (
                    <div className="mb-8 p-6 bg-secondary-bg border border-border-divider rounded-lg">
                        <h2 className="text-xl font-bold text-primary-text mb-4">Featured: {defaultAthlete.first_name} {defaultAthlete.last_name}</h2>
                        <p className="text-secondary-text mb-4">{defaultAthlete.description}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                            <div>
                                <span className="font-semibold text-primary-text">Position:</span>
                                <span className="text-secondary-text ml-2">{defaultAthlete.position}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-primary-text">Team:</span>
                                <span className="text-secondary-text ml-2">{defaultAthlete.team}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-primary-text">Nationality:</span>
                                <span className="text-secondary-text ml-2">{defaultAthlete.nationality}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-primary-text">Sport:</span>
                                <span className="text-secondary-text ml-2">{defaultAthlete.sport}</span>
                            </div>
                        </div>
                    </div>
                )}

                {Object.entries(athletesBySport).map(([sport, sportAthletes]) => (
                    <div key={sport} className="mb-8">
                        <h2 className="text-xl font-semibold text-primary-text mb-4 flex items-center">
                            <span className="mr-2">{sport}</span>
                            <Badge variant="secondary" className="bg-sport-accent/20 text-sport-accent">
                                {sportAthletes.length} Athletes
                            </Badge>
                        </h2>

                        <div className="grid grid-cols-2 gap-6 justify-items-center">
                            {sportAthletes.map((athlete) => (
                                <Card
                                    key={athlete.id}
                                    className="bg-secondary-bg border-border-divider hover:border-sport-accent/50 transition-colors cursor-pointer group"
                                    onClick={() => handleAthleteClick(athlete.slug)}
                                >
                                    <div className="p-6">
                                        {/* Athlete Header */}
                                        <div className="flex items-center space-x-4 mb-4">
                                            <div className="w-16 h-16 bg-sport-accent/20 rounded-full flex items-center justify-center group-hover:bg-sport-accent/30 transition-colors">
                                                <ProfilePicture
                                                    username={athlete.first_name.charAt(0) + athlete.last_name.charAt(0)}
                                                    size="h-12 w-12"
                                                    className="text-sport-accent font-bold text-lg"
                                                />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-primary-text group-hover:text-sport-accent transition-colors">
                                                    {athlete.first_name} {athlete.last_name}
                                                </h3>
                                                <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                                                    {athlete.team}
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Athlete Description */}
                                        <p className="text-secondary-text mb-4 leading-relaxed text-sm">
                                            {athlete.description}
                                        </p>

                                        {/* Athlete Stats/Info */}
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="flex items-center space-x-2 text-sm text-secondary-text">
                                                <Trophy className="h-4 w-4" />
                                                <span>{athlete.position}</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-sm text-secondary-text">
                                                <Users className="h-4 w-4" />
                                                <span>{athlete.nationality}</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-sm text-secondary-text">
                                                <Star className="h-4 w-4" />
                                                <span>Elite Talent</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-sm text-secondary-text">
                                                <TrendingUp className="h-4 w-4" />
                                                <span>Global Star</span>
                                            </div>
                                        </div>

                                        {/* Athlete Highlights */}
                                        <div className="border-t border-border-divider pt-4">
                                            <h4 className="text-sm font-semibold text-secondary-text mb-2">Career Highlights</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {getAthleteHighlights(athlete.slug).map((highlight, index) => (
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
                    </div>
                ))}

                {/* Footer Info */}
                <div className="mt-8 p-6 bg-secondary-bg border border-border-divider rounded-lg">
                    <h3 className="text-lg font-semibold text-primary-text mb-2">Follow Your Favorite Athletes</h3>
                    <p className="text-secondary-text leading-relaxed">
                        Stay connected with the world's greatest athletes across basketball, football, baseball, soccer, and more.
                        Get real-time updates on their performance, career milestones, and off-court activities.
                        From MVPs to champions, follow the athletes who inspire you most.
                    </p>
                </div>
            </div>
        </ScrollArea>
    );
};

export default AthletesTabContent;