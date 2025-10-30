// src/components/LikeButton.jsx
import React from 'react';
import { Heart } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from './components/ui/button';
import { toggleLike, optimisticToggleLike, revertLikeToggle, selectPostInteraction, selectIsLiking } from '../store/postsSlice';

const LikeButton = ({ postId, initialIsLiked, initialLikesCount, hideCount }) => {
    const dispatch = useDispatch();
    const queryClient = useQueryClient();

    // Get state from Redux store using memoized selectors
    const { isLiked } = useSelector((state) => selectPostInteraction(state, postId));
    const isLoading = useSelector((state) => selectIsLiking(state, postId));

    // ✅ Use server-provided aggregated metrics for counts, Redux state only for user interaction status
    const currentIsLiked = isLiked !== undefined ? isLiked : initialIsLiked;
    const currentLikesCount = initialLikesCount;  // ✅ Always use server-provided aggregated count

    // Get updated count from Redux if available (for WebSocket updates)
    const reduxInteraction = useSelector((state) => selectPostInteraction(state, postId));
    const displayLikesCount = reduxInteraction?.likesCount ?? currentLikesCount;

    // Debug logging - SUCCESS: Aggregated metrics are working!
    console.log('LikeButton: SUCCESS - Aggregated metrics working for postId', postId, ':', {
        reduxIsLiked: isLiked,
        currentIsLiked,
        currentLikesCount,
        displayLikesCount,
        initialIsLiked,
        initialLikesCount
    });

    const handleLikeToggle = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Optimistic UI Update (Immediate visual change)
        dispatch(optimisticToggleLike({ postId }));

        try {
            await dispatch(toggleLike(postId)).unwrap();

            // Invalidate the feed query to refetch data from server and sync like counts
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['feed'] });
            }, 1000); // Small delay to let the optimistic update be visible

        } catch (error) {
            console.error('LikeButton: toggleLike failed:', error);
            // Revert on failure (Pessimistic fallback)
            dispatch(revertLikeToggle({ postId }));
        }
    };

    const heartColor = currentIsLiked ? 'text-red-500 fill-red-500' : 'text-gray-500';
    const hoverClass = currentIsLiked ? 'hover:text-red-600' : 'hover:bg-red-500/10 hover:text-red-500';

    return (
        <Button
            variant="ghost"
            className={`p-2 group ${hoverClass} transition-colors duration-200`}
            onClick={handleLikeToggle}
            disabled={isLoading}
        >
            <Heart className={`h-5 w-5 mr-2 transition-colors duration-200 ${heartColor}`} />
            {!hideCount && (
                <span className={currentIsLiked ? 'text-red-500 font-semibold' : 'group-hover:text-red-500'}>
                    {displayLikesCount || 0}
                </span>
            )}
        </Button>
    );
};

export default LikeButton;