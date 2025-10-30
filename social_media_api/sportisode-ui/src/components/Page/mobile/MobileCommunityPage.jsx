// src/components/Page/mobile/MobileCommunityPage.jsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Users } from 'lucide-react';

// Shadcn/ui Imports
import { ScrollArea } from '../../components/ui/scroll-area';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/alert';

// Component & Utility Imports
import InfiniteFeed from '../../InfiniteFeed';
import PostCard from '../../PostCard';
import ProfilePicture from '../../ProfilePicture';
import MobileHeader from '../../MobileHeader';
import ProfileDrawer from '../../ProfileDrawer';
import BottomNavBar from '../../BottomNavBar';
import { fetchCommunities, fetchCommunityFeed, toggleCommunityMembership } from '../../lib/api';

// --- Component for the Join Button (Sidebar item action) ---
const JoinButton = ({ community }) => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: () => toggleCommunityMembership({ communitySlug: community.slug }),

        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['communitiesList'] });

            const previousCommunities = queryClient.getQueryData(['communitiesList']);

            // Optimistically toggle the membership status
            queryClient.setQueryData(['communitiesList'], oldData => {
                return oldData?.map(c =>
                    c.slug === community.slug ? { ...c, is_member: !c.is_member } : c
                );
            });

            return { previousCommunities };
        },
        onError: (err, newCommunity, context) => {
            if (context?.previousCommunities) {
                queryClient.setQueryData(['communitiesList'], context.previousCommunities);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['communitiesList'] });
        }
    });

    // const label = community.is_member ? 'Joined' : 'Join'; // eslint-disable-line no-unused-vars

    return (
        <Button
            onClick={(e) => { e.stopPropagation(); mutation.mutate(); }}
            disabled={mutation.isPending}
            variant={community.is_member ? 'outline' : 'default'}
            size="sm"
            className={`font-medium transition-all duration-200 h-7 text-sm
                ${community.is_member
                    ? 'border-gray-500 text-gray-300 hover:bg-red-500 hover:text-white'
                    : 'bg-sport-accent text-black hover:bg-sport-accent/90'
                }`}
        >
            {mutation.isPending ? '...' : (community.is_member ? 'Joined' : 'Join')}
        </Button>
    );
};

// --- Component to display the Community-specific Feed ---
const CommunityFeed = ({ communitySlug }) => {
    const customQueryFn = ({ pageParam }) => fetchCommunityFeed({ pageParam, communitySlug });

    return (
        <InfiniteFeed
            queryKey={['communityFeed', communitySlug]}
            queryFn={customQueryFn}
            headerTitle={`#${communitySlug.toUpperCase().replace(/-/g, ' ')}`}
            PostComponent={PostCard}
        />
    );
};

// --- Main Mobile Communities Page Component ---
const MobileCommunityPage = () => {
    const [selectedCommunity, setSelectedCommunity] = useState(null);
    const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);

    const { data: communities, isLoading, isError, error } = useQuery({
        queryKey: ['communitiesList'],
        queryFn: fetchCommunities,
        staleTime: 5 * 60 * 1000,
    });

    const handleProfileClick = () => {
        setIsProfileDrawerOpen(true);
    };

    const handleSettingsClick = () => {
        console.log('Settings clicked');
    };

    // Set default selected community once data loads
    useEffect(() => {
        if (!selectedCommunity && communities?.length > 0) {
            setSelectedCommunity(communities[0].slug);
        }
    }, [communities, selectedCommunity]);

    if (isLoading) {
        return (
            <div className="min-h-screen" style={{ backgroundColor: 'var(--primary-bg)' }}>
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

    if (isError) {
        return (
            <div className="min-h-screen" style={{ backgroundColor: 'var(--primary-bg)' }}>
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
                        <AlertTitle>Community Error</AlertTitle>
                        <AlertDescription>Could not load the communities list. {error.message}</AlertDescription>
                    </Alert>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen style={{ backgroundColor: 'var(--primary-bg)' }}">
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
                {/* Community Selection Header */}
                <div className="sticky top-16 style={{ backgroundColor: 'var(--primary-bg)' }}/95 backdrop-blur-sm z-10 border-b border-gray-700">
                    <div className="px-4 py-3">
                        <h2 className="text-xl font-semibold text-white mb-3">Communities</h2>
                        <ScrollArea className="w-full">
                            <div className="flex space-x-3 pb-2 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                {communities.map((community) => (
                                    <div
                                        key={community.id}
                                        onClick={() => setSelectedCommunity(community.slug)}
                                        className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-colors min-w-max border ${
                                            selectedCommunity === community.slug
                                                ? 'bg-sport-accent/20 text-white border-sport-accent'
                                                : 'bg-gray-800/50 text-gray-300 border-gray-700 hover:bg-gray-700/50'
                                        }`}
                                    >
                                        <ProfilePicture username={community.name.substring(0, 2)} size="h-6 w-6" className="flex-shrink-0"/>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{community.name}</p>
                                            <p className="text-xs text-gray-500 flex items-center">
                                                <Users className="h-3 w-3 mr-1"/>
                                                {community.member_count?.toLocaleString()}
                                            </p>
                                        </div>
                                        <JoinButton community={community} />
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                {/* Community Feed */}
                <div className="max-w-xl mx-auto">
                    {selectedCommunity ? (
                        <CommunityFeed communitySlug={selectedCommunity} />
                    ) : (
                        <div className="p-4 text-center text-gray-500">Select a community to view its dedicated feed.</div>
                    )}
                </div>
            </div>

            {/* Bottom Navigation */}
            <BottomNavBar />
        </div>
    );
};

export default MobileCommunityPage;
