// src/components/SearchSports.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Trophy, Users, User, Filter, X } from 'lucide-react';

// Shadcn/ui Imports
import { Input } from './components/ui/input';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';

// Component Imports
import ProfilePicture from './ProfilePicture';
import { fetchLeagues, fetchTeams, fetchAthletes } from './lib/api';

const SearchSports = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [sportFilter, setSportFilter] = useState('all');

    // Fetch all data
    const { data: leagues = [] } = useQuery({
        queryKey: ['leaguesList'],
        queryFn: fetchLeagues,
        staleTime: Infinity,
    });

    const { data: teams = [] } = useQuery({
        queryKey: ['teamsList'],
        queryFn: fetchTeams,
        staleTime: Infinity,
    });

    const { data: athletes = [] } = useQuery({
        queryKey: ['athletesList'],
        queryFn: fetchAthletes,
        staleTime: Infinity,
    });

    // Filter data based on search query and filters
    const filteredLeagues = leagues.filter(league => {
        const matchesQuery = league.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           league.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSport = sportFilter === 'all' || league.sport.toLowerCase() === sportFilter;
        return matchesQuery && matchesSport;
    });

    const filteredTeams = teams.filter(team => {
        const matchesQuery = team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           team.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (team.league?.name && team.league.name.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesSport = sportFilter === 'all' || (team.league?.sport && team.league.sport.toLowerCase() === sportFilter);
        return matchesQuery && matchesSport;
    });

    const filteredAthletes = athletes.filter(athlete => {
        const fullName = athlete.full_name || `${athlete.first_name} ${athlete.last_name}`;
        const matchesQuery = fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           athlete.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           athlete.nationality.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (athlete.team?.name && athlete.team.name.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesQuery;
    });

    const handleLeagueClick = (leagueSlug) => {
        navigate(`/leagues/${leagueSlug}`);
    };

    const handleTeamClick = (teamSlug) => {
        navigate(`/teams/${teamSlug}`);
    };

    const handleAthleteClick = (athleteSlug) => {
        navigate(`/athletes/${athleteSlug}`);
    };

    const clearSearch = () => {
        setSearchQuery('');
        setSportFilter('all');
    };

    // const isLoading = leaguesLoading || teamsLoading || athletesLoading;

    return (
        <div className="max-w-6xl mx-auto p-4">
            {/* Search Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-primary-text mb-4">Search Sports</h1>

                {/* Search Input */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-text h-4 w-4" />
                    <Input
                        type="text"
                        placeholder="Search leagues, teams, athletes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-10 py-3 text-lg"
                    />
                    {searchQuery && (
                        <button
                            onClick={clearSearch}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-text hover:text-primary-text"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center space-x-2">
                        <Filter className="h-4 w-4 text-secondary-text" />
                        <span className="text-sm text-secondary-text">Filter by sport:</span>
                    </div>
                    <Select value={sportFilter} onValueChange={setSportFilter}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="All Sports" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Sports</SelectItem>
                            <SelectItem value="football">Football</SelectItem>
                            <SelectItem value="basketball">Basketball</SelectItem>
                            <SelectItem value="baseball">Baseball</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Results Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all">All ({filteredLeagues.length + filteredTeams.length + filteredAthletes.length})</TabsTrigger>
                    <TabsTrigger value="leagues">Leagues ({filteredLeagues.length})</TabsTrigger>
                    <TabsTrigger value="teams">Teams ({filteredTeams.length})</TabsTrigger>
                    <TabsTrigger value="athletes">Athletes ({filteredAthletes.length})</TabsTrigger>
                </TabsList>

                {/* All Results */}
                <TabsContent value="all" className="mt-6">
                    <div className="space-y-8">
                        {filteredLeagues.length > 0 && (
                            <section>
                                <h2 className="text-xl font-bold text-primary-text mb-4 flex items-center">
                                    <Trophy className="h-5 w-5 mr-2 text-sport-accent" />
                                    Leagues
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {filteredLeagues.slice(0, 6).map((league) => (
                                        <LeagueCard key={league.id} league={league} onClick={handleLeagueClick} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {filteredTeams.length > 0 && (
                            <section>
                                <h2 className="text-xl font-bold text-primary-text mb-4 flex items-center">
                                    <Users className="h-5 w-5 mr-2 text-sport-accent" />
                                    Teams
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredTeams.slice(0, 9).map((team) => (
                                        <TeamCard key={team.id} team={team} onClick={handleTeamClick} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {filteredAthletes.length > 0 && (
                            <section>
                                <h2 className="text-xl font-bold text-primary-text mb-4 flex items-center">
                                    <User className="h-5 w-5 mr-2 text-sport-accent" />
                                    Athletes
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredAthletes.slice(0, 9).map((athlete) => (
                                        <AthleteCard key={athlete.id} athlete={athlete} onClick={handleAthleteClick} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {filteredLeagues.length === 0 && filteredTeams.length === 0 && filteredAthletes.length === 0 && searchQuery && (
                            <div className="text-center py-12">
                                <Search className="h-12 w-12 text-secondary-text mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-primary-text mb-2">No results found</h3>
                                <p className="text-secondary-text">Try adjusting your search terms or filters</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* Leagues Tab */}
                <TabsContent value="leagues" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredLeagues.map((league) => (
                            <LeagueCard key={league.id} league={league} onClick={handleLeagueClick} detailed />
                        ))}
                    </div>
                </TabsContent>

                {/* Teams Tab */}
                <TabsContent value="teams" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredTeams.map((team) => (
                            <TeamCard key={team.id} team={team} onClick={handleTeamClick} detailed />
                        ))}
                    </div>
                </TabsContent>

                {/* Athletes Tab */}
                <TabsContent value="athletes" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredAthletes.map((athlete) => (
                            <AthleteCard key={athlete.id} athlete={athlete} onClick={handleAthleteClick} detailed />
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

// League Card Component
const LeagueCard = ({ league, onClick, detailed = false }) => (
    <Card
        className="bg-secondary-bg border-border-divider hover:border-sport-accent/50 transition-colors cursor-pointer group"
        onClick={() => onClick(league.slug)}
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

            {detailed && (
                <p className="text-secondary-text mb-4 leading-relaxed">
                    {league.description}
                </p>
            )}

            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1 text-sm text-secondary-text">
                    <Trophy className="h-4 w-4" />
                    <span>Professional League</span>
                </div>
                {league.country && (
                    <Badge variant="outline" className="border-sport-accent/30 text-sport-accent">
                        {league.country}
                    </Badge>
                )}
            </div>
        </div>
    </Card>
);

// Team Card Component
const TeamCard = ({ team, onClick, detailed = false }) => (
    <Card
        className="bg-secondary-bg border-border-divider hover:border-sport-accent/50 transition-colors cursor-pointer group"
        onClick={() => onClick(team.slug)}
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

            {detailed && (
                <p className="text-secondary-text text-xs mb-3 leading-relaxed">
                    {team.description}
                </p>
            )}

            <div className="flex items-center justify-between text-xs text-secondary-text">
                <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span>{team.follower_count || 0} followers</span>
                </div>
                <Badge variant="outline" className="border-sport-accent/30 text-sport-accent text-xs">
                    {team.league?.sport || 'Sports'}
                </Badge>
            </div>
        </div>
    </Card>
);

// Athlete Card Component
const AthleteCard = ({ athlete, onClick, detailed = false }) => (
    <Card
        className="bg-secondary-bg border-border-divider hover:border-sport-accent/50 transition-colors cursor-pointer group"
        onClick={() => onClick(athlete.slug)}
    >
        <div className="p-4">
            <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-sport-accent/20 rounded-full flex items-center justify-center group-hover:bg-sport-accent/30 transition-colors">
                    <ProfilePicture
                        username={athlete.first_name?.[0] + athlete.last_name?.[0]}
                        size="h-8 w-8"
                        className="text-sport-accent font-bold text-sm"
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-primary-text group-hover:text-sport-accent transition-colors truncate">
                        {athlete.full_name || `${athlete.first_name} ${athlete.last_name}`}
                    </h4>
                    <p className="text-xs text-secondary-text truncate">
                        {athlete.position}
                    </p>
                </div>
            </div>

            {detailed && (
                <div className="space-y-2 mb-3">
                    <p className="text-secondary-text text-xs">
                        Team: {athlete.team?.name || 'Free Agent'}
                    </p>
                    <p className="text-secondary-text text-xs">
                        Nationality: {athlete.nationality}
                    </p>
                </div>
            )}

            <div className="flex items-center justify-between text-xs text-secondary-text">
                <Badge variant="outline" className="border-sport-accent/30 text-sport-accent text-xs">
                    {athlete.position}
                </Badge>
                <span>{athlete.nationality}</span>
            </div>
        </div>
    </Card>
);

export default SearchSports;