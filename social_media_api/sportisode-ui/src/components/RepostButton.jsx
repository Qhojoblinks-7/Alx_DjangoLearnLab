// src/components/RepostButton.jsx
import React, { useState } from 'react';
import { Repeat2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/components/ui/button';
import { createRepost, optimisticToggleRepost, revertRepostToggle, selectPostInteraction, selectIsReposting } from '../store/postsSlice';

const RepostButton = ({ postId, initialRepostsCount, initialIsReposted, hideCount }) => {
    const dispatch = useDispatch();
    const queryClient = useQueryClient();
    const [showCommentDialog, setShowCommentDialog] = useState(false);
    const [comment, setComment] = useState('');

    // Get state from Redux store using memoized selectors
    const { isReposted } = useSelector((state) => selectPostInteraction(state, postId));
    const isLoading = useSelector((state) => selectIsReposting(state, postId));

    // ✅ Use server-provided aggregated metrics for counts, Redux state only for user interaction status
    const currentIsReposted = isReposted !== undefined ? isReposted : initialIsReposted;
    const currentRepostsCount = initialRepostsCount;  // ✅ Always use server-provided aggregated count

    // Debug logging - SUCCESS: Aggregated metrics are working!
    console.log('RepostButton: SUCCESS - Aggregated metrics working for postId', postId, ':', {
        reduxIsReposted: isReposted,
        currentIsReposted,
        currentRepostsCount,
        initialIsReposted,
        initialRepostsCount
    });

    const handleRepostToggle = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('RepostButton: Creating repost for post:', postId);
        console.log('RepostButton: Current Redux state:', { isReposted: currentIsReposted, repostsCount: currentRepostsCount });

        // For now, create repost without comment (simple repost)
        // Optimistic UI Update
        dispatch(optimisticToggleRepost({ postId }));

        console.log('RepostButton: After optimistic update, dispatching createRepost');

        try {
            const result = await dispatch(createRepost({ postId, comment: comment.trim() || null })).unwrap();
            console.log('RepostButton: Repost creation successful:', result);
            console.log('RepostButton: API response details:', {
                originalPostId: result.originalPostId,
                repostCount: result.repostCount,
                newPostId: result.newPostId
            });

            // Invalidate the feed query to refetch data from server and sync repost counts
            setTimeout(() => {
                console.log('RepostButton: Invalidating feed queries');
                queryClient.invalidateQueries({ queryKey: ['feed'] });
            }, 1000); // Small delay to let the optimistic update be visible

            // Reset comment if dialog was shown
            setComment('');
            setShowCommentDialog(false);

        } catch (error) {
            // Revert on failure
            console.error('RepostButton: Repost failed:', error);
            console.error('RepostButton: Error details:', error.message || error);
            dispatch(revertRepostToggle({ postId }));

            // Show user-friendly error message
            const errorMessage = error || 'Failed to repost. Please try again.';
            // You could dispatch a notification action here if you have one
            alert(errorMessage); // Temporary - replace with proper notification system
        }
    };

    const handleRepostWithComment = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setShowCommentDialog(true);
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        await handleRepostToggle(e);
    };

    const repostColor = currentIsReposted ? 'text-green-500' : 'text-gray-500';
    const hoverClass = currentIsReposted ? 'hover:text-green-600' : 'hover:bg-green-500/10 hover:text-green-500';

    return (
        <>
            <Button
                variant="ghost"
                className={`p-2 group ${hoverClass} transition-colors duration-200`}
                onClick={handleRepostToggle}
                disabled={isLoading}
                onContextMenu={handleRepostWithComment} // Right-click for comment option
            >
                <Repeat2 className={`h-5 w-5 mr-2 transition-colors duration-200 ${repostColor}`} />
                {!hideCount && (
                    <span className={currentIsReposted ? 'text-green-500 font-semibold' : 'group-hover:text-green-500'}>
                        {currentRepostsCount || 0}
                    </span>
                )}
            </Button>

            {/* Simple comment dialog - can be enhanced with proper modal */}
            {showCommentDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-4 rounded-lg max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-3">Add a comment to your repost</h3>
                        <textarea
                            className="w-full p-2 border rounded mb-3 resize-none"
                            rows="3"
                            placeholder="What's your take on this post?"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            maxLength="280"
                        />
                        <div className="flex justify-end space-x-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowCommentDialog(false);
                                    setComment('');
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCommentSubmit}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Reposting...' : 'Repost'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default RepostButton;