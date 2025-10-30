// src/pages/CommunityPage.jsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Users } from 'lucide-react';

// Shadcn/ui Imports
import { ScrollArea } from '../components/ui/scroll-area';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';

// Component & Utility Imports
import InfiniteFeed from '../InfiniteFeed'; 
import PostCard from '../PostCard'; 
import ProfilePicture from '../ProfilePicture';
import { fetchCommunities, fetchCommunityFeed, toggleCommunityMembership } from '../lib/api'; 


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

    return (
        <Button 
            onClick={(e) => { e.stopPropagation(); mutation.mutate(); }}
            disabled={mutation.isPending}
            variant={community.is_member ? 'outline' : 'default'}
            size="sm"
            className={`font-bold transition-all duration-200 h-7 text-sm
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
    const customQueryFn = ({ pageParam }) => {
        console.log('CommunityFeed - Fetching for community:', communitySlug, 'pageParam:', pageParam);
        return fetchCommunityFeed({ pageParam, communitySlug });
    };

    return (
        <InfiniteFeed
            queryKey={['communityFeed', communitySlug]}
            queryFn={customQueryFn}
            headerTitle={`#${communitySlug.toUpperCase().replace(/-/g, ' ')}`}
            PostComponent={PostCard}
        />
    );
};


// --- Main Communities Page Component ---
const CommunityPage = () => {
    const [selectedCommunity, setSelectedCommunity] = useState(null); 
    
    const { data: communities, isLoading, isError, error } = useQuery({
        queryKey: ['communitiesList'],
        queryFn: fetchCommunities,
        staleTime: 5 * 60 * 1000,
    });

    console.log('CommunityPage - Communities data:', communities);
    console.log('CommunityPage - Loading:', isLoading, 'Error:', error);

    // Set default selected community once data loads
    useEffect(() => {
        if (!selectedCommunity && communities?.length > 0) {
            setSelectedCommunity(communities[0].slug);
        }
    }, [communities, selectedCommunity]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-10 w-10 animate-spin text-sport-accent" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-4">
                <Alert variant="destructive">
                    <AlertTitle>Community Error</AlertTitle>
                    <AlertDescription>Could not load the communities list. {error.message}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="flex w-full lg:max-w-[73rem] lg:ml-10 min-h-screen">
            
            {/* Main Content Column: Community Specific Feed */}
            <div className="flex-1 lg:max-w-[65rem] max-w-xl mx-auto">
                {selectedCommunity ? (
                    <CommunityFeed communitySlug={selectedCommunity} />
                ) : (
                    <div className="p-4 text-center text-gray-500">Select a community to view its dedicated feed.</div>
                )}
            </div>
            
            {/* Communities Sidebar (Fixed and Scrollable) */}
            <div className="hidden lg:block w-96 ml-8">
                <Card className="sticky top-4 bg-dark-card border-gray-700 p-0 shadow-lg h-[calc(100vh-1rem)]">
                    <h2 className="text-xl font-semibold p-4 text-white border-b border-gray-700">Discover Communities</h2>
                    <ScrollArea className="h-[calc(100vh-70px)]">
                        {communities.map((community) => (
                            <div
                                key={community.id}
                                onClick={() => setSelectedCommunity(community.slug)}
                                className={`flex items-center justify-between p-3 cursor-pointer transition-colors border-b border-gray-800 
                                    ${selectedCommunity === community.slug 
                                        ? 'bg-sport-accent/20 text-white font-bold' 
                                        : 'hover:bg-gray-800/50 text-gray-300'
                                    }`}
                            >
                                <div className="flex items-center">
                                    <ProfilePicture username={community.name.substring(0, 2)} size="h-8 w-8" className="mr-3"/>
                                    <div>
                                        <p className="leading-tight font-bold">{community.name}</p>
                                        <p className="text-xs text-gray-500 flex items-center">
                                            <Users className="h-3 w-3 mr-1"/>
                                            {community.member_count?.toLocaleString()} members
                                        </p>
                                    </div>
                                </div>
                                <JoinButton community={community} />
                            </div>
                        ))}
                    </ScrollArea>
                </Card>
            </div>
        </div>
    );
};

export default CommunityPage;