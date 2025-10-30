// src/pages/ProfilePage.jsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Verified } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';

// Shadcn/ui Imports
import { Button } from '../components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
import { Card } from '../components/ui/card';

// Component Imports
import ProfileHeader from '../profile/ProfileHeader'
import WhoToFollowSection from '../profile/WhoToFollowSection';
import ProfileFeedTabs from '../profile/ProfileFeedTabs';
import InfiniteFeed from '../InfiniteFeed';
import PostCard from '../PostCard';

// Hook and API Imports
import { fetchUserProfile, authenticatedFetch } from '../lib/api';
import { setActiveTab } from '../../store/uiSlice';

// --- Main Profile Page Component ---
const ProfilePage = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const dispatch = useDispatch();

    const currentUser = useSelector(state => state.auth.user);
    const activeTab = useSelector(state => state.ui.activeTab) || 'posts'; // Default to 'posts' if undefined
    const isCurrentUser = currentUser?.username === username;

    // Fetch the main profile data
    const { data: profile, isLoading, isError, error } = useQuery({
        queryKey: ['userProfile', username],
        queryFn: () => fetchUserProfile(username),
    });

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-sport-accent" /></div>;
    }

    if (isError || !profile) {
        return <Alert variant="destructive" className="m-4"><AlertTitle>Profile Error</AlertTitle><AlertDescription>Could not load profile for @{username}. {error?.message}</AlertDescription></Alert>;
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
        <div className="max-w-xl lg:max-w-[65rem] mx-auto min-h-screen">

            {/* Sticky Header */}
            <header className="sticky top-0 bg-dark-bg/80 backdrop-blur-sm z-20 border-b border-gray-700 p-3 flex items-center space-x-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-xl font-semibold text-white">{profile.username}</h1>
                    <p className="text-xs text-gray-500">Profile</p>
                </div>
            </header>

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
            <ProfileFeedTabs activeTab={activeTab} setActiveTab={(tab) => dispatch(setActiveTab(tab))} />

            {/* Posts Feed */}
            <InfiniteFeed
                queryKey={['userFeed', username, activeTab]}
                queryFn={({ pageParam = 1 }) => getFeedFetcher(pageParam)}
                PostComponent={PostCard}
                headerTitle={`${profile.username}'s ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
            />

        </div>
    );
};

export default ProfilePage;