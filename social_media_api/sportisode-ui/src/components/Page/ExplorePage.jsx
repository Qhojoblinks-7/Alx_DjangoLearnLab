// src/pages/ExplorePage.jsx (REVISED for Sports Focus)
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Users, FileText, Trophy, X, Building2, User } from 'lucide-react';
import { authenticatedFetch } from '../lib/api';
import PostCard from '../PostCard';
import ProfilePicture from '../ProfilePicture';
import FollowButton from '../FollowButton';
// Shadcn/ui Imports
import { Input } from '../components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { ScrollArea } from '../components/ui/scroll-area';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
// Component Imports
// Search components
import { Badge } from '../components/ui/badge';
import TrendingTabContent from '../TrendingTabContent'; // <-- Component for the 'Trending' tab
import LeaguesTabContent from '../LeaguesTabContent'; // <-- Component for the 'Leagues' tab
import TeamsTabContent from '../TeamsTabContent'; // <-- Component for the 'Teams' tab
import AthletesTabContent from '../AthletesTabContent'; // <-- Component for the 'Athletes' tab
import {
  fetchExploreTrends,
  fetchExploreLeagues,
  fetchExploreTeams,
  fetchExploreAthletes,
  selectExploreTrends,
  selectExploreLeagues,
  selectExploreTeams,
  selectExploreAthletes,
  selectDefaultExplorePage,
  selectSearchQuery,
  setDefaultExplorePage,
  navigateBasedOnSearch,
} from '../../store/exploreSlice';

// -----------------------------------------------------------------

const ExplorePage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const searchRef = useRef(null);
    const [searchParams] = useSearchParams();

    // Check if we're in search mode
    const isSearchMode = searchParams.has('q');
    const searchQueryParam = searchParams.get('q') || '';
    const searchTypeParam = searchParams.get('type') || 'all';

    // Search state for search mode
    const [query, setQuery] = useState(searchQueryParam);
    const [searchType, setSearchType] = useState(searchTypeParam);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Redux selectors for explore mode
    const trends = useSelector(selectExploreTrends);
    const leagues = useSelector(selectExploreLeagues);
    const teams = useSelector(selectExploreTeams);
    const athletes = useSelector(selectExploreAthletes);
    const defaultPage = useSelector(selectDefaultExplorePage);
    const searchQuery = useSelector(selectSearchQuery);

    // Fetch explore data on component mount (only for explore mode)
    useEffect(() => {
        if (!isSearchMode) {
            dispatch(fetchExploreTrends());
            dispatch(fetchExploreLeagues());
            dispatch(fetchExploreTeams());
            dispatch(fetchExploreAthletes());
        }
    }, [dispatch, isSearchMode]);

    // Perform search when in search mode
    const performSearch = useCallback(async (searchQuery, type) => {
        if (!searchQuery.trim()) {
            setResults(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await authenticatedFetch(
                `/search/?q=${encodeURIComponent(searchQuery)}&type=${type}`
            );

            if (response.ok) {
                const data = await response.json();
                if (!data || (data.results && Object.keys(data.results).length === 0 && data.total === 0)) {
                    setResults({ total: 0, results: {} });
                } else {
                    setResults(data);
                }
            } else {
                setError('Failed to perform search. The server responded with an error.');
            }
        } catch (err) {
            setError('A network error occurred while fetching search results.');
        } finally {
            setLoading(false);
        }
    }, []);

    // Update search when query or type changes
    useEffect(() => {
        if (isSearchMode) {
            const timeoutId = setTimeout(() => {
                performSearch(query, searchType);
            }, 300);

            return () => clearTimeout(timeoutId);
        }
    }, [query, searchType, performSearch, isSearchMode]);

    // Handle tab changes to update default page preference
    const handleTabChange = (value) => {
        if (!isSearchMode) {
            dispatch(setDefaultExplorePage(value));
        } else {
            setSearchType(value);
        }
    };

    // Handle search input changes
    const handleSearchChange = (e) => {
        const newQuery = e.target.value;
        setQuery(newQuery);

        if (!isSearchMode) {
            // Update Redux state and handle navigation
            dispatch(navigateBasedOnSearch({ query: newQuery, navigate }));
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const trimmedQuery = query.trim();
        if (trimmedQuery.length > 0) {
            if (!isSearchMode) {
                dispatch(navigateBasedOnSearch({ query: trimmedQuery, navigate }));
            } else {
                performSearch(trimmedQuery, searchType);
            }
        }
    };


    // Render functions for search results
    const renderUserResults = (users) => (
        <div className="space-y-2">
            {users.map(user => (
                <Card key={user.id} className="p-4 bg-dark-card border-gray-700 hover:bg-gray-800/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <ProfilePicture user={user} size="h-12 w-12" />
                            <div>
                                <div className="flex items-center space-x-2">
                                    <span className="font-bold text-white">@{user.username}</span>
                                    {user.is_verified && (
                                        <Badge variant="secondary" className="text-xs">Verified</Badge>
                                    )}
                                </div>
                                <p className="text-gray-400 text-sm">{user.bio}</p>
                                <div className="flex items-center space-x-4 mt-1">
                                    <span className="text-gray-500 text-xs">
                                        {user.followers_count} followers
                                    </span>
                                    <span className="text-gray-500 text-xs">
                                        {user.following_count} following
                                    </span>
                                </div>
                            </div>
                        </div>
                        <FollowButton
                            userId={user.id}
                            initialFollowing={user.is_following}
                            className="ml-4"
                        />
                    </div>
                </Card>
            ))}
            {users.length === 0 && <div className="text-center py-8 text-gray-500">No people found matching your search.</div>}
        </div>
    );

    const renderPostResults = (posts) => (
        <div className="space-y-4">
            {posts.map(post => (
                <PostCard key={post.id} post={post} />
            ))}
            {posts.length === 0 && <div className="text-center py-8 text-gray-500">No posts found matching your search.</div>}
        </div>
    );

    const renderSportsEntityResults = (entities, type) => {
        const getIcon = () => {
            switch (type) {
                case 'leagues': return <Trophy className="h-5 w-5 text-white" />;
                case 'teams': return <Building2 className="h-5 w-5 text-white" />;
                case 'athletes': return <User className="h-5 w-5 text-white" />;
                default: return <Trophy className="h-5 w-5 text-white" />;
            }
        };

        return (
            <div className="space-y-2">
                {entities.map(entity => (
                    <Card key={entity.id} className="p-4 bg-dark-card border-gray-700 hover:bg-gray-800/50 cursor-pointer">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-sport-accent/20 rounded-lg text-sport-accent">
                                {getIcon()}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-white">{entity.name || `${entity.first_name} ${entity.last_name}`}</h3>
                                <p className="text-gray-400 text-sm">{entity.description || entity.position}</p>
                                {entity.team && (
                                    <p className="text-gray-500 text-xs">{entity.team}</p>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
                {entities.length === 0 && <div className="text-center py-8 text-gray-500">No {type} found matching your search.</div>}
            </div>
        );
    };

    const renderUnifiedResults = () => {
        if (!results || !results.results) return null;

        const { users = [], posts = [], leagues = [], teams = [], athletes = [] } = results.results;
        const allEmpty = users.length === 0 && posts.length === 0 && leagues.length === 0 && teams.length === 0 && athletes.length === 0;

        if (allEmpty) {
            return <div className="text-center py-8 text-gray-500">No results found for all categories matching your search.</div>;
        }

        return (
            <div className="space-y-6">
                {users.length > 0 && (
                    <div>
                        <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                            <Users className="h-5 w-5 mr-2" />
                            People
                        </h3>
                        {renderUserResults(users)}
                    </div>
                )}

                {posts.length > 0 && (
                    <div>
                        <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                            <FileText className="h-5 w-5 mr-2" />
                            Posts
                        </h3>
                        {renderPostResults(posts)}
                    </div>
                )}

                {(leagues.length > 0 || teams.length > 0 || athletes.length > 0) && (
                    <div>
                        <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                            <Trophy className="h-5 w-5 mr-2" />
                            Sports
                        </h3>
                        <div className="space-y-4">
                            {leagues.length > 0 && renderSportsEntityResults(leagues, 'leagues')}
                            {teams.length > 0 && renderSportsEntityResults(teams, 'teams')}
                            {athletes.length > 0 && renderSportsEntityResults(athletes, 'athletes')}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderTypeSpecificResults = () => {
        if (!results || !results.results) return null;

        if (searchType === 'all') {
            return renderUnifiedResults();
        }

        const resultData = results.results;
        let entities = [];

        if (Array.isArray(resultData)) {
            entities = resultData;
        } else if (typeof resultData === 'object' && resultData !== null) {
            entities = resultData[searchType] || [];
        }

        switch (searchType) {
            case 'users':
                return renderUserResults(entities);
            case 'posts':
                return renderPostResults(entities);
            case 'leagues':
            case 'teams':
            case 'athletes':
                return renderSportsEntityResults(entities, searchType);
            default:
                return null;
        }
    };

    return (
        <div className="max-w-xl lg:max-w-[47rem] mx-auto min-h-screen px-4 lg:px-0">

            {/* 1. Sticky Header & Search */}
            <header className="sticky top-0 bg-dark-bg/80 backdrop-blur-sm z-20 border-b border-gray-700 p-3">
                <div ref={searchRef} className="relative">
                    <form onSubmit={handleSearchSubmit} className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <Input
                            value={isSearchMode ? query : searchQuery}
                            onChange={handleSearchChange}
                            placeholder={isSearchMode ? "Search for people, posts, teams, athletes..." : "Search Athletes, Teams, or Topics"}
                            className="w-full pl-10 pr-10 bg-dark-card border-gray-700 focus:border-sport-accent rounded-full text-white"
                            autoFocus={isSearchMode}
                        />
                    </form>
                </div>
            </header>

            {/* Conditional Rendering: Search Mode vs Explore Mode */}
            {isSearchMode ? (
                /* SEARCH MODE */
                <div className="max-w-2xl mx-auto">
                    <Tabs value={searchType} onValueChange={handleTabChange} className="w-full">
                        <TabsList className="grid w-full grid-cols-6 h-12 bg-dark-bg border-b border-gray-700 rounded-none">
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="users">People</TabsTrigger>
                            <TabsTrigger value="posts">Posts</TabsTrigger>
                            <TabsTrigger value="leagues">Leagues</TabsTrigger>
                            <TabsTrigger value="teams">Teams</TabsTrigger>
                            <TabsTrigger value="athletes">Athletes</TabsTrigger>
                        </TabsList>

                        <TabsContent value={searchType} className="mt-0">
                            <ScrollArea className="h-[calc(100vh-140px)]">
                                <div className="p-4">
                                    {loading && (
                                        <div className="text-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sport-accent mx-auto"></div>
                                            <p className="text-gray-400 mt-2">Searching...</p>
                                        </div>
                                    )}

                                    {error && (
                                        <div className="text-center py-8">
                                            <p className="text-red-400">{error}</p>
                                            <Button
                                                onClick={() => performSearch(query, searchType)}
                                                variant="outline"
                                                className="mt-4"
                                            >
                                                Try Again
                                            </Button>
                                        </div>
                                    )}

                                    {!loading && !error && query && results && results.total > 0 && (
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <p className="text-gray-400">
                                                    {results.total} results for "{query}"
                                                </p>
                                            </div>
                                            {renderTypeSpecificResults()}
                                        </div>
                                    )}

                                    {!loading && !error && query && results && results.total === 0 && (
                                        <div className="text-center py-16">
                                            <Search className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                                            <h3 className="text-xl font-semibold text-white mb-2">No Results Found</h3>
                                            <p className="text-gray-400">
                                                Try refining your search query or switching categories.
                                            </p>
                                        </div>
                                    )}

                                    {!loading && !error && !query && (
                                        <div className="text-center py-16">
                                            <Search className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                                            <h3 className="text-xl font-semibold text-white mb-2">Search Sportisode</h3>
                                            <p className="text-gray-400">
                                                Find people, posts, teams, athletes, and more
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                </div>
            ) : (
                /* EXPLORE MODE */
                <Tabs defaultValue={defaultPage} onValueChange={handleTabChange}>
                    <TabsList className="grid w-full grid-cols-4 h-12 bg-dark-bg border-b border-gray-700 rounded-none">
                        <TabsTrigger value="trending">Trending</TabsTrigger>
                        <TabsTrigger value="leagues">Leagues</TabsTrigger>
                        <TabsTrigger value="teams">Teams</TabsTrigger>
                        <TabsTrigger value="athletes">Athletes</TabsTrigger>
                    </TabsList>

                    <TabsContent value="trending" className="mt-0">
                        <ScrollArea className="h-[calc(100vh-120px)]">
                            <TrendingTabContent trends={trends} />
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="leagues" className="mt-0">
                        <LeaguesTabContent leagues={leagues} />
                    </TabsContent>

                    <TabsContent value="teams" className="mt-0">
                        <TeamsTabContent teams={teams} />
                    </TabsContent>

                    <TabsContent value="athletes" className="mt-0">
                        <AthletesTabContent athletes={athletes} />
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
};

export default ExplorePage;