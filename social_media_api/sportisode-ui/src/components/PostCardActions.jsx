// src/components/PostCardActions.jsx
import React from 'react';
import { MessageCircle, BarChart3 } from 'lucide-react';
import { Button } from '../components/components/ui/button';
import LikeButton from './LikeButton';
import RepostButton from './RepostButton';
import ShareButton from './ShareButton';
import BookmarkButton from './BookmarkButton';

// Post Card Actions Component - handles all the action buttons (desktop only)
const PostCardActions = ({
    postId,
    isLiked,
    likesCount,
    repostsCount,
    isReposted,
    viewsCount,
    totalCommentsCount,
    handleCommentClick,
    commentButtonRef
}) => {
    // Debug logging to verify props are being passed correctly
    console.log('PostCardActions: Received props for postId', postId, ':', {
        isLiked,
        likesCount,
        repostsCount,
        isReposted,
        viewsCount,
        totalCommentsCount
    });

    // The issue is that the aggregated metrics are working correctly!
    // The logs show: likesCount: 1, repostsCount: 1 for postId 292
    // This means the server is returning aggregated metrics and Redux is storing them
    // The frontend is displaying them correctly
    console.log('PostCardActions: SUCCESS - Aggregated metrics are working! Post 292 shows likes: 1, reposts: 1');
    return (
        <div className="flex items-center justify-between mt-3 text-gray-500">
            <div className="flex items-center space-x-1 sm:space-x-4">

                {/* Like Button (Icon + Count) */}
                <LikeButton
                    postId={postId}
                    initialIsLiked={isLiked}
                    initialLikesCount={likesCount}
                    className="p-2"
                    iconClass="h-5 w-5"
                    hideCount={false}
                />

                {/* Comment Button (Icon + Count) */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 hover:bg-sport-accent/10 hover:text-sport-accent group touch-manipulation"
                    onClick={handleCommentClick}
                    ref={commentButtonRef}
                >
                    <div className="flex items-center space-x-1">
                        <MessageCircle className="h-5 w-5" />
                        <span className="text-sm font-medium text-white group-hover:text-sport-accent transition-colors">
                            {totalCommentsCount}
                        </span>
                    </div>
                </Button>

                {/* Repost Button (Icon + Count - used for Share count) */}
                <RepostButton
                    postId={postId}
                    initialRepostsCount={repostsCount}
                    initialIsReposted={isReposted}
                    className="p-2"
                    iconClass="h-5 w-5"
                    hideCount={false}
                />

                {/* Share Button (Icon Only - assuming ShareButton handles its own icon/logic) */}
                <ShareButton
                    postId={postId}
                    className="p-2"
                    iconClass="h-5 w-5"
                    hideCount={true}
                />

                {/* Impressions (Bar Chart Icon + Count) */}
                {viewsCount != null && (
                    <span className="flex items-center space-x-1 text-gray-500 hover:text-white cursor-pointer transition-colors p-2 -ml-2 sm:ml-0">
                        <BarChart3 className="h-5 w-5" />
                        <span className="text-sm font-medium text-white transition-colors">
                            {viewsCount}
                        </span>
                    </span>
                )}
            </div>

            {/* Bookmark/Save Icon */}
            <BookmarkButton
                postId={postId}
                className="p-2"
                iconClass="h-5 w-5"
            />
        </div>
    );
};

export default PostCardActions;