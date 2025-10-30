// src/components/Page/mobile/MobileFeed.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Loader2 } from 'lucide-react';
import { authenticatedFetch } from '../../lib/api';
import PostCard from '../../PostCard';
import MobileHeader from '../../MobileHeader';
import ProfileDrawer from '../../ProfileDrawer';
import BottomNavBar from '../../BottomNavBar';
import MobileFloatingMenu from '../../MobileFloatingMenu';

// --- API Fetcher ---
const fetchFeed = async ({ pageParam = 0, feedType = 'forYou' }) => {
    const limit = 10;
    const offset = pageParam;

    let endpoint = `/feed/home/?limit=${limit}&offset=${offset}`;
    if (feedType === 'following') {
        endpoint += '&tab=following';
    } else {
        endpoint += '&tab=for_you';
    }

    console.log('MobileFeed: Fetching', endpoint);
    const response = await authenticatedFetch(endpoint, { method: 'GET' });

    if (!response.ok) {
        console.error('MobileFeed: Response not ok', response.status, response.statusText);
        throw new Error("Failed to load feed data.");
    }
    const data = await response.json();
    console.log('MobileFeed: API response', { count: data.count, next: data.next, resultsLength: data.results?.length });

    // Handle both paginated response format and direct array format
    let posts = [];
    let nextOffset = undefined;

    if (data.results) {
        // Paginated response format
        posts = data.results;
        nextOffset = data.next ? new URL(data.next).searchParams.get('offset') : undefined;
    } else if (Array.isArray(data)) {
        // Direct array response
        posts = data;
        nextOffset = posts.length === 10 ? (offset + 10).toString() : undefined;
    }

    return {
        posts,
        nextOffset,
    };
};

const MobileFeed = () => {
    const { isAuthenticated } = useSelector(state => state.auth);
    const [feedType, setFeedType] = useState('forYou');
    const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const [isBottomBarVisible, setIsBottomBarVisible] = useState(true);
    const loadMoreRef = useRef(null);
    const lastScrollY = useRef(0);

    const {
        data,
        error,
        fetchNextPage,
        hasNextPage,
        isFetching,
        isFetchingNextPage,
        status,
    } = useInfiniteQuery({
        queryKey: ['feed', feedType],
        queryFn: ({ pageParam = 0 }) => fetchFeed({ pageParam, feedType }),
        getNextPageParam: (lastPage) => lastPage.nextOffset,
        initialPageParam: 0,
    });

    // Automatic pagination using Intersection Observer
    useEffect(() => {
        if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(loadMoreRef.current);

        return () => {
            if (loadMoreRef.current) {
                observer.unobserve(loadMoreRef.current);
            }
        };
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Auto-hide header and bottom bar on scroll
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
                // Scrolling down - hide header and bottom bar
                setIsHeaderVisible(false);
                setIsBottomBarVisible(false);
            } else if (currentScrollY < lastScrollY.current) {
                // Scrolling up - show header and bottom bar
                setIsHeaderVisible(true);
                setIsBottomBarVisible(true);
            }

            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const handleProfileClick = () => {
        setIsProfileDrawerOpen(true);
    };

    const handleSettingsClick = () => {
        console.log('Settings clicked');
    };

    // --- Loading and Error States ---
    if (status === 'pending') {
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
                    <Loader2 className="h-8 w-8 animate-spin text-sport-accent" />
                </div>
            </div>
        );
    }

    if (status === 'error') {
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
                <div className="p-8 pt-24">
                    <div className="text-center text-gray-500">
                        Could not load the personalized feed. {error.message}
                    </div>
                </div>
            </div>
        );
    }

    const posts = data?.pages.flatMap(page => page.posts) || [];
    console.log('MobileFeed: Combined posts', posts.length, posts.slice(0, 2));

    return (
        <div className="min-h-screen bg-dark-bg">
            {/* Mobile Header */}
            <div className={`transition-transform duration-300 ease-in-out ${
                isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
            }`}>
                <MobileHeader
                    onProfileClick={handleProfileClick}
                    onSettingsClick={handleSettingsClick}
                />
            </div>

            {/* Profile Drawer */}
            <ProfileDrawer
                isOpen={isProfileDrawerOpen}
                onClose={() => setIsProfileDrawerOpen(false)}
            />

            {/* Feed Type Selector Header */}
            <div className="sticky top-16 bg-dark-bg/95 backdrop-blur-sm z-10 border-b border-gray-700">
                <div className="flex items-center justify-between px-4 py-2">

                    {/* For You Container */}
                    <div
                        className={`px-2 py-1 rounded-md cursor-pointer transition-colors border-b-2 ${
                            feedType === 'forYou'
                                ? 'border-sport-accent text-white'
                                : 'border-transparent text-gray-500 hover:text-gray-300'
                        }`}
                        onClick={() => setFeedType('forYou')}
                        aria-selected={feedType === 'forYou'}
                        role="tab"
                    >
                        <span className="text-sm font-semibold">For You</span>
                    </div>

                    {/* Following Container */}
                    <div
                        className={`px-2 py-1 rounded-md cursor-pointer transition-colors border-b-2 ${
                            feedType === 'following'
                                ? 'border-sport-accent text-white'
                                : 'border-transparent text-gray-500 hover:text-gray-300'
                        }`}
                        onClick={() => setFeedType('following')}
                        aria-selected={feedType === 'following'}
                        role="tab"
                    >
                        <span className="text-sm font-semibold">Following</span>
                    </div>

                </div>
            </div>

            {/* Feed Content */}
            <div className={`pt-16 transition-all duration-300 ${
                !isHeaderVisible ? 'pt-0' : 'pt-16'
            }`}>
                {posts.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        No posts in your feed yet. Follow some users to see their content!
                    </div>
                )}

                {posts.map((post, index) => {
                    console.log('MobileFeed: Mapping post', index, post);
                    if (!post || !post.id) {
                        console.error('MobileFeed: Invalid post at index', index, post);
                        return null;
                    }
                    return <PostCard key={post.id} post={post} isMobile={true} />;
                })}

                {/* Invisible element for intersection observer */}
                {hasNextPage && (
                    <div ref={loadMoreRef} className="h-4" />
                )}

                {isFetchingNextPage && (
                    <div className="p-4 text-center">
                        <Loader2 className="h-6 w-6 animate-spin text-sport-accent mx-auto" />
                    </div>
                )}

                {!hasNextPage && posts.length > 0 && (
                    <div className="py-8 text-center text-gray-500 text-sm">
                        You've reached the end of the line.
                    </div>
                )}
            </div>

            {/* Mobile Floating Menu */}
            <MobileFloatingMenu />

            {/* Bottom Navigation */}
            <div className={`transition-transform duration-300 ease-in-out ${
                isBottomBarVisible ? 'translate-y-0' : 'translate-y-full'
            }`}>
                <BottomNavBar />
            </div>
        </div>
    );
};

export default MobileFeed;