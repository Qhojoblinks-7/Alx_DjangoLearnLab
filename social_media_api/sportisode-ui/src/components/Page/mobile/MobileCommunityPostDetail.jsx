// src/components/Page/mobile/MobileCommunityPostDetail.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, MoreHorizontal, Send } from 'lucide-react';

// Component Imports
import MobileHeader from '../../MobileHeader';
import ProfileDrawer from '../../ProfileDrawer';
import BottomNavBar from '../../BottomNavBar';
import PostCard from '../../PostCard';
import InfiniteFeed from '../../InfiniteFeed';
import ProfilePicture from '../../ProfilePicture';

// Shadcn/ui Imports
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/alert';

// API Imports
import { fetchSinglePost, fetchPostReplies, postReply } from '../../lib/api';
import { useSelector } from 'react-redux';

// --- Component for the Thread Feed (Replies) ---
const RepliesFeed = ({ parentPostId }) => {
    const customQueryFn = ({ pageParam }) => fetchPostReplies({ pageParam, parentPostId });

    return (
        <InfiniteFeed
            queryKey={['postReplies', parentPostId]}
            queryFn={customQueryFn}
            PostComponent={PostCard}
            isBordered={true}
        />
    );
};

// --- Component for the Reply Composer ---
const ReplyComposer = ({ parentPostId }) => {
    const [content, setContent] = useState('');
    const user = useSelector((state) => state.auth.user);
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: () => postReply({ parentPostId, content }),
        onSuccess: () => {
            setContent('');
            queryClient.invalidateQueries({ queryKey: ['postReplies', parentPostId] });
            queryClient.invalidateQueries({ queryKey: ['singlePost', parentPostId] });
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (content.trim()) {
            mutation.mutate();
        }
    };

    if (!isAuthenticated) return null;

    return (
        <div className="flex p-4 border-b border-gray-700">
            <ProfilePicture user={user} size="h-10 w-10" className="mt-1"/>
            <form onSubmit={handleSubmit} className="flex-1 ml-3 flex items-start">
                <Input
                    placeholder="Post your reply"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="flex-1 bg-dark-bg border-none focus:ring-0 text-white placeholder-gray-500 h-10"
                    disabled={mutation.isPending}
                />
                <Button
                    type="submit"
                    disabled={!content.trim() || mutation.isPending}
                    className="bg-sport-accent hover:bg-sport-accent/90 text-black font-medium ml-2 rounded-full h-10 px-4"
                >
                    {mutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5"/>}
                </Button>
            </form>
        </div>
    );
};

// --- Main Mobile Community Post Detail Page Component ---
const MobileCommunityPostDetail = () => {
    const { postId } = useParams();
    const navigate = useNavigate();
    const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);

    const { data: post, isLoading, isError } = useQuery({
        queryKey: ['singlePost', postId],
        queryFn: () => {
            console.log('MobileCommunityPostDetail - Fetching post:', postId);
            return fetchSinglePost(postId);
        },
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

    if (isError || !post) {
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
                        <AlertTitle>Post Not Found</AlertTitle>
                        <AlertDescription>The requested post could not be loaded.</AlertDescription>
                    </Alert>
                </div>
            </div>
        );
    }

    const renderHeaderActions = () => (
        <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="rounded-full text-white border-gray-500 hover:bg-gray-800/50">
                Subscribe
            </Button>
            <Button variant="default" size="sm" className="bg-sport-accent text-black rounded-full hover:bg-sport-accent/90">
                Reply
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-white">
                <MoreHorizontal className="h-5 w-5" />
            </Button>
        </div>
    );

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
                <div className="sticky top-16 bg-dark-bg/95 backdrop-blur-sm z-20 border-b border-gray-700 p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white">
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                        <h1 className="text-xl font-semibold text-white">Community post</h1>
                    </div>
                    {renderHeaderActions()}
                </div>

                {/* Post Content */}
                <div className="p-0">
                    <PostCard post={post} isDetailView={true} className="border-b border-gray-700" />
                </div>

                {/* Reply Composer */}
                <ReplyComposer parentPostId={postId} />

                {/* Replies Header */}
                <h2 className="text-lg font-semibold p-4 border-b border-gray-700 text-white">
                    Replies ({post.reply_count || 0})
                </h2>

                {/* Replies Feed */}
                <RepliesFeed parentPostId={postId} />
            </div>

            {/* Bottom Navigation */}
            <BottomNavBar />
        </div>
    );
};

export default MobileCommunityPostDetail;