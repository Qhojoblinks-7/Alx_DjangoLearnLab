// src/components/profile/WhoToFollowSection.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../components/ui/button';
import ProfilePicture from '../ProfilePicture';
import { fetchSuggestedUsers } from '../lib/api';
import { Loader2, ShieldCheck } from 'lucide-react';

const WhoToFollowSection = () => {
    const { data: suggestedUsers, isLoading, isError } = useQuery({
        queryKey: ['suggestedUsers'],
        queryFn: fetchSuggestedUsers,
        staleTime: 10 * 60 * 1000, // 10 minutes
    });

    return (
        <div className="p-4 border-t border-b border-gray-700">
            <h2 className="text-xl font-semibold mb-3 text-white">Who to follow</h2>

            {isLoading && (
                <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-sport-accent" />
                </div>
            )}

            {isError && (
                <p className="text-red-400 text-sm py-2">Could not load suggested users.</p>
            )}

            {!isLoading && suggestedUsers?.map(user => (
                <div key={user.username || user.id} className="flex justify-between items-center py-2">
                    <div className="flex items-center">
                        <ProfilePicture user={user} size="h-10 w-10"/>
                        <div className="ml-3">
                            <div className="flex items-center">
                                <p className="font-bold text-white">{user.name}</p>
                                {user.is_verified && (
                                    <ShieldCheck className="ml-1 h-4 w-4 text-blue-500" />
                                )}
                            </div>
                            <p className="text-sm text-gray-500 truncate max-w-[200px]">@{user.username}</p>
                            <p className="text-sm text-gray-500 truncate max-w-[200px]">{user.bio}</p>
                        </div>
                    </div>
                    <Button variant="default" size="sm" className="bg-white text-black rounded-full font-bold hover:bg-gray-200">
                        Follow
                    </Button>
                </div>
            ))}

            {!isLoading && (!suggestedUsers || suggestedUsers.length === 0) && (
                <p className="text-gray-500 text-sm py-2">No suggested users available.</p>
            )}

            <Button variant="link" className="text-sport-accent p-0 mt-2">Show more</Button>
        </div>
    );
};

export default WhoToFollowSection;