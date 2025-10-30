// src/components/FollowButton.jsx
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authenticatedFetch } from './lib/api';
import { Button } from '../components/components/ui/button';
import { Check } from 'lucide-react'; // Icon for 'Following' state

/**
 * Handles the API call for toggling the follow status.
 * @param {object} payload - Contains userId and the action (follow/unfollow).
 */
const toggleFollowStatus = async ({ userId, action }) => {
    // Determine the action endpoint based on the current state
    const method = action === 'follow' ? 'POST' : 'DELETE';
    
    // API endpoint based on DRF conventions: /users/{pk}/follow/
    const response = await authenticatedFetch(`/accounts/users/${userId}/follow/`, {
        method: method,
    });

    if (!response.ok && response.status !== 204) { // 204 No Content for successful DELETE
        throw new Error(`Failed to ${action} user.`);
    }
    
    // Return the new state
    return { isFollowing: action === 'follow' };
};

const FollowButton = ({ userId, initialFollowing }) => {
    const queryClient = useQueryClient();
    
    // Local state initialized by the prop from the parent component (ExplorePage)
    const [isFollowing, setIsFollowing] = React.useState(initialFollowing);

    // React Query Mutation Hook
    const mutation = useMutation({
        mutationFn: toggleFollowStatus,
        
        // Optimistic Update (Best for UX)
        onMutate: async (newStatus) => {
            // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({ queryKey: ['suggestions'] });
            
            // Snapshot the previous value
            const previousSuggestions = queryClient.getQueryData(['suggestions']);
            
            // Optimistically update the single user's follow status in the suggestions list
            queryClient.setQueryData(['suggestions'], (oldData) => {
                if (!oldData) return oldData;
                
                // Find the user and toggle their local state
                const newpages = oldData.pages.map(page => ({
                    ...page,
                    results: page.results.map(user => 
                        user.id === userId ? { ...user, is_following: newStatus.action === 'follow' } : user
                    )
                }));
                return { pages: newpages, pageParams: oldData.pageParams };
            });
            
            // Immediately update the local button state for instant feedback
            setIsFollowing(newStatus.action === 'follow');

            // Return a context object with the snapshot value
            return { previousSuggestions };
        },

        onError: (err, newStatus, context) => {
            // Rollback on failure
            if (context?.previousSuggestions) {
                queryClient.setQueryData(['suggestions'], context.previousSuggestions);
                // Revert local button state
                setIsFollowing(newStatus.action === 'unfollow'); 
            }
            console.error(err);
        },

        onSettled: () => {
            // Invalidate to ensure consistency, especially if other components rely on it
            queryClient.invalidateQueries({ queryKey: ['suggestions'] });
        },
    });

    const handleButtonClick = () => {
        const action = isFollowing ? 'unfollow' : 'follow';
        mutation.mutate({ userId, action });
    };

    return (
        <Button
            onClick={handleButtonClick}
            disabled={mutation.isPending}
            className={`font-bold transition-all duration-200 w-24 h-8 text-sm
                ${isFollowing 
                    ? 'bg-transparent border border-gray-500 text-gray-300 hover:bg-gray-700/50' 
                    : 'bg-sport-accent text-black hover:bg-sport-accent/90'
                }`}
        >
            {mutation.isPending ? '...' : isFollowing ? (
                <span className="flex items-center group/btn">
                    <span className="group-hover/btn:hidden">Following</span>
                    <span className="hidden group-hover/btn:inline-flex items-center text-red-500">
                        <Check className="h-4 w-4 mr-1"/> Unfollow
                    </span>
                </span>
            ) : (
                'Follow'
            )}
        </Button>
    );
};

export default FollowButton;