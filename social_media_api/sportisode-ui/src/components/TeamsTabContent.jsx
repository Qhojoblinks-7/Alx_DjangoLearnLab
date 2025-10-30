// src/components/TeamsTabContent.jsx
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
import { fetchTeams, fetchTeamDetail, fetchSportsFeed } from './lib/api';
import SearchSports from './SearchSports';

// Helper function to get team-specific highlights
const getTeamHighlights = (slug) => {
    const highlightsMap = {
        // NBA
        'la-lakers': ['NBA Champions', 'Showtime Era', 'LeBron James', 'Kobe Bryant Legacy'],
        'golden-state-warriors': ['NBA Champions', 'Splash Brothers', 'Stephen Curry', 'Kevin Durant'],
        'boston-celtics': ['NBA Champions', 'Larry Bird', 'Paul Pierce', 'Celtics Pride'],
        'miami-heat': ['NBA Champions', 'Big Three', 'LeBron James', 'Dwyane Wade'],
        'la-clippers': ['Rising Stars', 'Kawhi Leonard', 'Paul George', 'Lob City'],
        'dallas-mavericks': ['NBA Champions', 'Dirk Nowitzki', 'Luka Dončić', 'Mark Cuban'],
        'phoenix-suns': ['Elite Offense', 'Steve Nash', 'Kevin Durant', 'Desert Heat'],
        'denver-nuggets': ['NBA Champions', 'Nikola Jokić', 'Jamal Murray', 'Mile High'],
        'milwaukee-bucks': ['NBA Champions', 'Giannis Antetokounmpo', 'Khris Middleton', 'Eastern Power'],
        'philadelphia-76ers': ['Elite Talent', 'Joel Embiid', 'James Harden', 'Ben Simmons'],
        'brooklyn-nets': ['Superteam', 'Kevin Durant', 'Kyrie Irving', 'Brooklyn Bridge'],
        'new-york-knicks': ['Historic Franchise', 'Madison Square Garden', 'Knicks Nation', 'Orange & Blue'],
        // NFL
        'kansas-city-chiefs': ['Super Bowl Champions', 'Patrick Mahomes', 'Andy Reid', 'Arrowhead Pride'],
        'san-francisco-49ers': ['Super Bowl Winners', 'Joe Montana', 'Steve Young', 'Niners Faithful'],
        'new-england-patriots': ['Dynasty', 'Tom Brady', 'Bill Belichick', 'Patriot Way'],
        'green-bay-packers': ['NFL Legends', 'Lambeau Field', 'Cheeseheads', 'Titletown USA'],
        // MLB
        'new-york-yankees': ['World Series Champions', 'Babe Ruth', 'Yankee Stadium', 'Bronx Bombers'],
        'los-angeles-dodgers': ['World Champions', 'Sandy Koufax', 'Dodger Blue', 'Hollywood Stars'],
        'boston-red-sox': ['World Series Winners', 'Curse Breakers', 'Fenway Park', 'Red Sox Nation'],
        // NHL
        'toronto-maple-leafs': ['Stanley Cup Quest', 'Auston Matthews', 'Air Canada Centre', 'Leafs Nation'],
        'montreal-canadiens': ['Stanley Cup Winners', 'Rocket Richard', 'Habs Forever', 'French Canadian Pride'],
        // Soccer
        'manchester-united': ['Premier League Giants', 'Sir Alex Ferguson', 'Old Trafford', 'Red Devils'],
        'real-madrid': ['European Champions', 'Galácticos', 'Santiago Bernabéu', 'Los Blancos'],
        'fc-barcelona': ['La Liga Champions', 'Messi Legacy', 'Camp Nou', 'Catalan Pride'],
        'liverpool-fc': ['Premier League Winners', 'Anfield Atmosphere', 'You\'ll Never Walk Alone', 'Reds Forever']
    };

    return highlightsMap[slug] || ['Elite Talent', 'Championship Pedigree', 'Fan Favorite', 'Historic Franchise'];
};

const TeamsTabContent = () => {
    const navigate = useNavigate();

    console.log('[TeamsTabContent] Component rendered');

    // Fetch the list of teams
    const { data: teams, isLoading, isError, error } = useQuery({
        queryKey: ['teamsList'],
        queryFn: fetchTeams,
        staleTime: Infinity, // Teams don't change often
    });

    console.log('[TeamsTabContent] Query state - isLoading:', isLoading, 'isError:', isError, 'data length:', teams?.length);

    // Fetch details for default team (LA Lakers)
    const { data: defaultTeam } = useQuery({
        queryKey: ['teamDetail', 'la-lakers'],
        queryFn: () => fetchTeamDetail('la-lakers'),
        enabled: !!teams, // Only fetch after teams are loaded
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Debug: Log the teams data
    // console.log('Teams data:', teams);

    // Handle team card click
    const handleTeamClick = (teamSlug) => {
        // Navigate to the dedicated teams page with the selected team
        navigate(`/teams?team=${teamSlug}`);
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
                    <AlertTitle>Teams Error</AlertTitle>
                    <AlertDescription>Could not load teams. {error.message}</AlertDescription>
                </Alert>
            </div>
        );
    }

    // Group teams by sport
    const teamsBySport = teams.reduce((acc, team) => {
        const sport = team.sport || 'Other'; // Fallback if sport is undefined
        if (!acc[sport]) {
            acc[sport] = [];
        }
        acc[sport].push(team);
        return acc;
    }, {});

    // Teams are now properly grouped by sport

    console.log('[TeamsTabContent] Rendering with teams:', teams);

    return (
        <ScrollArea className="h-[calc(100vh-120px)]">
            <div className="max-w-6xl mx-auto p-4">
                {/* Search Section */}
                <div className="mb-8">
                    <SearchSports />
                </div>

                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-primary-text mb-2">Professional Sports Teams</h1>
                    <p className="text-secondary-text">Follow your favorite teams across all major sports and get the latest news, scores, and highlights</p>
                    {teams && <p className="text-xs text-secondary-text mt-2">Found {teams.length} teams</p>}
                </div>

                {/* Default Team Details */}
                {defaultTeam && (
                    <div className="mb-8 p-6 bg-secondary-bg border border-border-divider rounded-lg">
                        <h2 className="text-xl font-bold text-primary-text mb-4">Featured: {defaultTeam.name}</h2>
                        <p className="text-secondary-text mb-4">{defaultTeam.description}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                            <div>
                                <span className="font-semibold text-primary-text">Sport:</span>
                                <span className="text-secondary-text ml-2">{defaultTeam.sport}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-primary-text">League:</span>
                                <span className="text-secondary-text ml-2">{defaultTeam.league?.name}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-primary-text">City:</span>
                                <span className="text-secondary-text ml-2">{defaultTeam.city}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-primary-text">Country:</span>
                                <span className="text-secondary-text ml-2">{defaultTeam.country}</span>
                            </div>
                        </div>
                        {defaultTeam.feed_id && (
                            <div className="mt-4">
                                <h3 className="text-lg font-semibold text-primary-text mb-2">Latest Posts</h3>
                                <InfiniteFeed
                                    queryKey={['sportsFeed', defaultTeam.feed_id]}
                                    queryFn={({ pageParam }) => fetchSportsFeed({ pageParam, feedId: defaultTeam.feed_id })}
                                    headerTitle=""
                                    PostComponent={PostCard}
                                />
                            </div>
                        )}
                    </div>
                )}

                {Object.entries(teamsBySport).map(([sport, sportTeams]) => (
                    <div key={sport} className="mb-8">
                        <h2 className="text-xl font-semibold text-primary-text mb-4 flex items-center">
                            <span className="mr-2">{sport}</span>
                            <Badge variant="secondary" className="bg-sport-accent/20 text-sport-accent">
                                {sportTeams.length} Teams
                            </Badge>
                        </h2>

                        <div className="grid grid-cols-2 gap-6 justify-items-center">
                            {sportTeams.map((team) => (
                                <Card
                                    key={team.id}
                                    className="bg-secondary-bg border-border-divider hover:border-sport-accent/50 transition-colors cursor-pointer group"
                                    onClick={() => handleTeamClick(team.slug)}
                                >
                                    <div className="p-6">
                                        {/* Team Header */}
                                        <div className="flex items-center space-x-4 mb-4">
                                            <div className="w-16 h-16 bg-sport-accent/20 rounded-full flex items-center justify-center group-hover:bg-sport-accent/30 transition-colors">
                                                <ProfilePicture
                                                    username={team.abbreviation}
                                                    size="h-12 w-12"
                                                    className="text-sport-accent font-bold text-lg"
                                                />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-primary-text group-hover:text-sport-accent transition-colors">
                                                    {team.name}
                                                </h3>
                                                <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                                                    {team.abbreviation}
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Team Stats/Info */}
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="flex items-center space-x-2 text-sm text-secondary-text">
                                                <Trophy className="h-4 w-4" />
                                                <span>Championships</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-sm text-secondary-text">
                                                <Users className="h-4 w-4" />
                                                <span>Fans Worldwide</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-sm text-secondary-text">
                                                <Star className="h-4 w-4" />
                                                <span>Elite Talent</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-sm text-secondary-text">
                                                <TrendingUp className="h-4 w-4" />
                                                <span>Rising Stars</span>
                                            </div>
                                        </div>

                                        {/* Team Highlights */}
                                        <div className="border-t border-border-divider pt-4">
                                            <h4 className="text-sm font-semibold text-secondary-text mb-2">Team Highlights</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {getTeamHighlights(team.slug).map((highlight, index) => (
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
                    <h3 className="text-lg font-semibold text-primary-text mb-2">Follow Your Teams</h3>
                    <p className="text-secondary-text leading-relaxed">
                        Stay connected with your favorite professional sports teams across basketball, football, baseball, hockey, and soccer.
                        Get real-time updates on games, player news, trades, and championship runs. From NBA dynasties to Premier League giants,
                        follow the teams that matter most to you.
                    </p>
                </div>
            </div>
        </ScrollArea>
    );
};

export default TeamsTabContent;