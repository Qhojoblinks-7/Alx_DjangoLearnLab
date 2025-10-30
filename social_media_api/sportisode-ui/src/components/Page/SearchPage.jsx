import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Users, FileText, Trophy, Building2, User } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { ScrollArea } from '../components/ui/scroll-area';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { authenticatedFetch } from '../lib/api';
import ProfilePicture from '../ProfilePicture';
import FollowButton from '../FollowButton';
import PostCard from '../PostCard';

const SearchPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [searchType, setSearchType] = useState(searchParams.get('type') || 'all');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Ref to manage the AbortController for request cancellation
    const abortControllerRef = useRef(null);

    // Debounced search function, now including AbortController for race condition prevention
    const performSearch = useCallback(async (searchQuery, type) => {
        if (!searchQuery.trim()) {
            setResults(null);
            return;
        }

        // 1. Cancel any pending previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // 2. Create a new AbortController for the current request
        const newAbortController = new AbortController();
        abortControllerRef.current = newAbortController;
        const { signal } = newAbortController;

        setLoading(true);
        setError(null);

        try {
            const response = await authenticatedFetch(
                `/search/?q=${encodeURIComponent(searchQuery)}&type=${type}`,
                { signal } // Pass the signal to the fetch
            );

            // Check if the request was aborted (signal.aborted should be checked before error/success logic)
            if (signal.aborted) return;

            if (response.ok) {
                const data = await response.json();
                
                // 3. Robust result validation
                if (!data || (data.results && Object.keys(data.results).length === 0 && data.total === 0)) {
                    setResults({ total: 0, results: {} });
                } else {
                    setResults(data);
                }
            } else {
                setError('Failed to perform search. The server responded with an error.');
            }
        } catch (err) {
            // Check for AbortError (which happens when we cancel a request)
            if (err.name === 'AbortError') {
                // If aborted, do nothing, as a new request is already underway
                return;
            }
            // All other network errors
            setError('A network error occurred while fetching search results.');
        } finally {
            // Only stop loading if the request wasn't aborted
            if (!signal.aborted) {
                setLoading(false);
                abortControllerRef.current = null; // Clear the ref only on completion/error
            }
        }
    }, []);

    // Update URL params when search changes
    useEffect(() => {
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (searchType !== 'all') params.set('type', searchType);
        setSearchParams(params, { replace: true });
    }, [query, searchType, setSearchParams]);

    // Perform search when query or type changes (Debouncing Logic)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            performSearch(query, searchType);
        }, 300); // Debounce 300ms

        // Cleanup: On unmount or dependency change, clear the timeout
        return () => {
            clearTimeout(timeoutId);
            // Also, clean up by aborting any pending fetch request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
        };
    }, [query, searchType, performSearch]);

    const handleQueryChange = (e) => {
        setQuery(e.target.value);
    };

    const handleTypeChange = (type) => {
        setSearchType(type);
    };

    const renderUserResults = (users) => (
        <div className="space-y-2">
            {users.map(user => (
                // PRESERVED DARK MODE STYLES
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
                    // PRESERVED DARK MODE STYLES
                    <Card key={entity.id} className="p-4 bg-dark-card border-gray-700 hover:bg-gray-800/50 cursor-pointer">
                        <div className="flex items-center space-x-3">
                            {/* Ensured icons are visible in dark mode */}
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
                        {/* PRESERVED DARK MODE STYLES */}
                        <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                            <Users className="h-5 w-5 mr-2" />
                            People
                        </h3>
                        {renderUserResults(users)}
                    </div>
                )}

                {posts.length > 0 && (
                    <div>
                        {/* PRESERVED DARK MODE STYLES */}
                        <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                            <FileText className="h-5 w-5 mr-2" />
                            Posts
                        </h3>
                        {renderPostResults(posts)}
                    </div>
                )}

                {(leagues.length > 0 || teams.length > 0 || athletes.length > 0) && (
                    <div>
                        {/* PRESERVED DARK MODE STYLES */}
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
            // Case 1: Backend returned a flat array of results for this specific type (e.g., just an array of posts)
            entities = resultData;
        } else if (typeof resultData === 'object' && resultData !== null) {
            // Case 2: Backend returned a keyed object. We use the searchType as the key (e.g., { posts: [...] })
            entities = resultData[searchType] || [];
        }

        // Pass the extracted entities array to the correct render function
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
        <div className="max-w-2xl mx-auto min-h-screen px-4 lg:px-0">
            {/* Header - PRESERVED DARK MODE STYLES */}
            <header className="sticky top-0 bg-dark-bg/80 backdrop-blur-sm z-10 border-b border-gray-700 p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    <Input
                        value={query}
                        onChange={handleQueryChange}
                        placeholder="Search for people, posts, teams, athletes..."
                        className="w-full pl-10 bg-dark-card border-gray-700 focus:border-sport-accent rounded-full text-white"
                        autoFocus
                    />
                </div>
            </header>

            {/* Search Type Tabs - PRESERVED DARK MODE STYLES */}
            <Tabs value={searchType} onValueChange={handleTypeChange} className="w-full">
                <TabsList className="grid w-full grid-cols-6 h-12 bg-dark-bg border-b border-gray-700 rounded-none">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="users">People</TabsTrigger>
                    <TabsTrigger value="posts">Posts</TabsTrigger>
                    <TabsTrigger value="leagues">Leagues</TabsTrigger>
                    <TabsTrigger value="teams">Teams</TabsTrigger>
                    <TabsTrigger value="athletes">Athletes</TabsTrigger>
                </TabsList>

                {/* Results */}
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
                                    <h3 className="text-xl font-bold text-white mb-2">No Results Found</h3>
                                    <p className="text-gray-400">
                                        Try refining your search query or switching categories.
                                    </p>
                                </div>
                            )}

                            {!loading && !error && !query && (
                                <div className="text-center py-16">
                                    <Search className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-white mb-2">Search Sportisode</h3>
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
    );
};

export default SearchPage;