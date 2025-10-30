// src/components/Page/mobile/MobileProfilePage.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Verified } from 'lucide-react';

// Component Imports
import MobileHeader from '../../MobileHeader';
import ProfileDrawer from '../../ProfileDrawer';
import BottomNavBar from '../../BottomNavBar';
import ProfileHeader from '../../profile/ProfileHeader';
import WhoToFollowSection from '../../profile/WhoToFollowSection';
import ProfileFeedTabs from '../../profile/ProfileFeedTabs';
import InfiniteFeed from '../../InfiniteFeed';
import PostCard from '../../PostCard';

// Shadcn/ui Imports
import { Button } from '../../components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/alert';
import { Card } from '../../components/ui/card';

// Hook and API Imports
import { fetchUserProfile, authenticatedFetch } from '../../lib/api';
import { useSelector } from 'react-redux';

// --- Main Mobile Profile Page Component ---
const MobileProfilePage = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);

    const currentUser = useSelector(state => state.auth.user);
    const isCurrentUser = currentUser?.username === username;

    // State for active tab
    const [activeTab, setActiveTab] = useState('posts');

    // Fetch the main profile data
    const { data: profile, isLoading, isError, error } = useQuery({
        queryKey: ['userProfile', username],
        queryFn: () => fetchUserProfile(username),
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

    if (isError || !profile) {
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
                        <AlertTitle>Profile Error</AlertTitle>
                        <AlertDescription>Could not load profile for @{username}. {error?.message}</AlertDescription>
                    </Alert>
                </div>
            </div>
        );
    }

    // Get the appropriate feed fetcher based on active tab
    const getFeedFetcher = (pageParam = 1) => {
        switch (activeTab) {
            case 'posts':
                return authenticatedFetch(`/posts/user/${username}/posts/?page=${pageParam}`).then(res => res.json());
            case 'replies':
                return authenticatedFetch(`/posts/user/${username}/replies/?page=${pageParam}`).then(res => res.json());
            case 'likes':
                return authenticatedFetch(`/posts/user/${username}/likes/?page=${pageParam}`).then(res => res.json());
            case 'highlights':
            case 'articles':
            case 'media':
                // For now, fall back to posts for unimplemented tabs
                return authenticatedFetch(`/posts/user/${username}/posts/?page=${pageParam}`).then(res => res.json());
            default:
                return authenticatedFetch(`/posts/user/${username}/posts/?page=${pageParam}`).then(res => res.json());
        }
    };

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
                {/* Sticky Header */}
                <div className="sticky top-16 bg-dark-bg/95 backdrop-blur-sm z-20 border-b border-gray-700 p-4 flex items-center space-x-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold text-white">{profile.username}</h1>
                        <p className="text-xs text-gray-500">Profile</p>
                    </div>
                </div>

                {/* Profile Header */}
                <ProfileHeader
                    profile={profile}
                    isCurrentUser={isCurrentUser}
                    queryClient={queryClient}
                />

                {/* Verification Notice */}
                {isCurrentUser && !profile.is_verified && (
                    <Card className="m-4 p-4 bg-dark-green border-green-600/50">
                        <p className="text-white font-bold flex items-center">
                            You aren't verified yet <Verified className="h-4 w-4 ml-2 text-white"/>
                        </p>
                        <p className="text-sm text-gray-300 mt-1">
                            Get verified for boosted replies, analytics, ad-free browsing, and more.
                        </p>
                        <Button variant="outline" className="mt-3 bg-white text-black border-none hover:bg-gray-200">
                            Get verified
                        </Button>
                    </Card>
                )}

                {/* Who to Follow */}
                <WhoToFollowSection />

                {/* Feed Tabs */}
                <ProfileFeedTabs activeTab={activeTab} setActiveTab={setActiveTab} />

                {/* Posts Feed */}
                <InfiniteFeed
                    queryKey={['userFeed', username, activeTab]}
                    queryFn={({ pageParam = 1 }) => getFeedFetcher(pageParam)}
                    PostComponent={PostCard}
                    headerTitle={`${profile.username}'s ${(activeTab || 'posts').charAt(0).toUpperCase() + (activeTab || 'posts').slice(1)}`}
                />
            </div>

            {/* Bottom Navigation */}
            <BottomNavBar />
        </div>
    );
};

export default MobileProfilePage;