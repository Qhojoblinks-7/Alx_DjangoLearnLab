// src/components/PostCard.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';

// Shadcn/ui Imports
import { Card } from '../components/components/ui/card';
import ProfilePicture from './ProfilePicture';
import PostActionsMenu from './PostActionsMenu';
import { useSelector, useDispatch } from 'react-redux';
import { useMemo } from 'react';
import { createSelector } from '@reduxjs/toolkit';
import { processTextWithEntities } from './lib/textProcessor.jsx';
import { ProcessedText } from './ui/TextEntity';
import useViewTracking from './hooks/useViewTracking';
import { initializePostInteractions, updatePostData } from '../store/postsSlice';
import {
    fetchComments,
    postComment,
    likeComment,
    setNewComment,
    setReplyingTo,
    clearReply,
    toggleThreadCollapse,
    fetchCommentReplies,
} from '../store/commentsSlice';

// Import new modular components
import PostMedia from './PostMedia';
import CommentInput from './CommentInput';
import CommentThread from './CommentThread';
import PostCardActions from './PostCardActions';
import CommentButton from './CommentButton';
import LikeButton from './LikeButton';
import RepostButton from './RepostButton';
import ShareButton from './ShareButton';
import BookmarkButton from './BookmarkButton';
import { BarChart3 } from 'lucide-react';

// WebSocket hook for real-time updates
import { useWebSocket } from '../hooks/useWebSocket';


// MOCK data structure matching the Django PostSerializer contract
const PostCard = ({ post, isDetailView = false, isMobile = false }) => {
    const {
        id,
        type,
        author,
        title,
        content,
        created_at,
        likes_count,
        reposts_count,
        is_liked,
        is_reposted,
        is_bookmarked,
        views_count,
        is_repost_in_feed,
        reposted_by,
        original_post,
        repost_comment,
        repost_timestamp,
        media_url, // eslint-disable-line no-unused-vars
        thumbnail_url, // eslint-disable-line no-unused-vars
        preview_url, // eslint-disable-line no-unused-vars
        is_media_processed, // eslint-disable-line no-unused-vars
        media_type // eslint-disable-line no-unused-vars
    } = post;

    // Check if this is a repost based on the type field
    const isRepost = type === 'repost';

    // For reposts, show reposter as main author and original post as embedded
    const displayAuthor = isRepost ? (author || { username: 'Anonymous', id: 0 }) : (is_repost_in_feed && reposted_by ? reposted_by : (author || { username: 'Anonymous', id: 0 }));
    const originalPost = isRepost ? original_post : (is_repost_in_feed ? { ...post, author } : null);

    // For reposts, use the repost post's title/content, not the original post's
    const displayTitle = isRepost ? (title || '') : title;
    const displayContent = isRepost ? (content || '') : content;
    const displayCreatedAt = isRepost ? repost_timestamp : created_at;

    const dispatch = useDispatch();

    // Local state for accordion (desktop) and drawer (mobile)
    const [commentsExpanded, setCommentsExpanded] = useState(false);

    // Refs for click outside detection
    const commentsSectionRef = useRef(null);
    const commentButtonRef = useRef(null);

    // Get state from Redux store
    const currentUser = useSelector((state) => state.auth.user);

    // Get comments state from Redux
    const selectCommentsData = useMemo(() => createSelector(
        [(state) => state.comments.comments[id] || { list: [], count: 0, loading: false, error: null },
         (state) => state.comments.composition[id] || { newComment: '', replyingTo: null, showUserSuggestions: false, suggestions: [], cursorPosition: 0 },
         (state) => state.comments.ui,
         (state) => state.comments.loading],
        (comments, composition, ui, loading) => ({
            comments,
            composition,
            ui,
            loading,
        })
    ), [id]);

    const {
        comments: commentsData,
        composition: { newComment, replyingTo },
        ui,
        loading: { postingComment },
    } = useSelector(selectCommentsData);

    const { collapsedThreads } = ui;
    const { likingComment } = useSelector((state) => state.comments.loading);

    // Extract comments list from commentsData
    const comments = commentsData.list || [];

    // Check if we already have interaction data for this post
    const currentInteraction = useSelector((state) => state.posts.interactions[id]);

    // Calculate total comments including all nested replies recursively
    const calculateTotalComments = (commentsArray) => {
        let total = 0;

        const countRecursive = (comments) => {
            comments.forEach(comment => {
                total += 1; // Count the comment itself
                if (comment.replies && comment.replies.length > 0) {
                    countRecursive(comment.replies); // Recursively count nested replies
                }
            });
        };

        countRecursive(commentsArray);
        return total;
    };

    // Use the post's comments_count from API, or calculate from loaded comments if available
    const totalCommentsCount = comments.length > 0 ? calculateTotalComments(comments) : (post.comments_count || 0);
    console.log('PostCard: Comments data for post', id, ':', { commentsData, comments, totalCommentsCount });
    console.log('PostCard: Full commentsData structure:', JSON.stringify(commentsData, null, 2));

    // View tracking with Intersection Observer
    const viewTrackingRef = useViewTracking(id, {
        threshold: 0.5, // 50% visibility
        timeThreshold: 500,// 500ms duration
        viewType: 'feed', // Feed impression
        enabled: !isDetailView // Only track in feed, not detail view
    });

    // Initialize post interactions in Redux store
    useEffect(() => {
        // Only initialize if we don't already have interaction data for this post
        if (!currentInteraction) {
            dispatch(initializePostInteractions({
                postId: id,
                isLiked: is_liked,
                likesCount: likes_count,
                isReposted: is_reposted,
                repostsCount: reposts_count,
                isBookmarked: is_bookmarked,
                viewsCount: views_count,
            }));
        }
    }, [dispatch, id, is_liked, likes_count, is_reposted, reposts_count, is_bookmarked, views_count, currentInteraction]);

    // WebSocket connection for real-time post updates
    const handleWsMessage = (message) => {
        console.log('PostCard WebSocket message received:', message);
        if (message.data && message.data.event_type === 'likes_update' && message.data.post_id === id) {
            console.log('PostCard: Updating likes count for post', id, 'to', message.data.likes_count);
            // Update the post data in Redux store
            dispatch(updatePostData({
                postId: id,
                data: {
                    likes_count: message.data.likes_count
                }
            }));
        }

        // Also handle updates for the original post if this is a repost
        if (message.data && message.data.event_type === 'likes_update' && originalPost && message.data.post_id === originalPost.id) {
            console.log('PostCard: Updating likes count for original post', originalPost.id, 'to', message.data.likes_count);
            // Update the original post data within this repost
            dispatch(updatePostData({
                postId: originalPost.id,
                data: {
                    likes_count: message.data.likes_count
                }
            }));
        }
    };

    // Connect to post-specific WebSocket for real-time updates
    useWebSocket(`/post/${id}/`, handleWsMessage);

    // Handle comment button clicks - drawer for mobile, accordion for desktop
    const handleCommentClick = () => {
        console.log(`${isMobile ? 'Mobile' : 'Desktop'} Comment button clicked for post:`, id);
        if (isMobile) {
            // Mobile: Use drawer (handled by CommentButton component)
            return;
        } else {
            // Desktop: Toggle accordion
            console.log('PostCard: Current comments state:', { commentsExpanded, commentsData, comments: commentsData.comments?.list || [] });
            if (!commentsExpanded) {
                // Fetch comments when expanding
                console.log('PostCard: Fetching comments for post:', id);
                dispatch(fetchComments(id));
            }
            setCommentsExpanded(!commentsExpanded);
        }
    };

    // Click outside handler to close accordion
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                commentsExpanded &&
                commentsSectionRef.current &&
                !commentsSectionRef.current.contains(event.target) &&
                commentButtonRef.current &&
                !commentButtonRef.current.contains(event.target)
            ) {
                setCommentsExpanded(false);
            }
        };

        if (commentsExpanded) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [commentsExpanded]);

    // Comment functionality
    const handleAddComment = async () => {
        console.log(`${isMobile ? 'Mobile' : 'Desktop'} Adding comment for post:`, id, 'content:', newComment, 'replyingTo:', replyingTo);

        // Check if user is authenticated
        if (!currentUser) {
            alert('You must be logged in to comment');
            return;
        }

        if (!newComment.trim()) return;

        try {
            await dispatch(postComment({
                postId: id,
                content: newComment,
                parentCommentId: replyingTo?.id,
            })).unwrap();

            console.log('Comment added successfully');
            // Clear the composition state for this specific post
            dispatch(setNewComment({ postId: id, comment: '' }));
            dispatch(clearReply({ postId: id }));
        } catch (error) {
            console.error('Failed to add comment:', error);
            // Show user-friendly error message
            alert(`Failed to add comment: ${error.message || 'Unknown error'}`);
        }
    };

    const handleReply = (comment) => {
        dispatch(setReplyingTo({ postId: id, replyingTo: comment }));
        dispatch(setNewComment({ postId: id, comment: `@${comment.author?.username || 'Anonymous'} ` }));
        // Focus the input field after setting reply state
        setTimeout(() => {
            const input = document.querySelector('input[placeholder*="Write your comment"], textarea[placeholder*="Write your comment"]');
            if (input) input.focus();
        }, 100);
    };

    const handleLikeComment = async (commentId) => {
        try {
            await dispatch(likeComment(commentId)).unwrap();
        } catch (error) {
            console.error('Failed to like comment:', error);
        }
    };

    const handleToggleThreadCollapse = (commentId) => {
        dispatch(toggleThreadCollapse(commentId));
    };

    const handleLoadReplies = async (commentId) => {
        try {
            console.log('PostCard: Loading replies for comment', commentId);
            await dispatch(fetchCommentReplies({ commentId, limit: 5, offset: 0 })).unwrap();
            console.log('PostCard: Successfully loaded replies for comment', commentId);
        } catch (error) {
            console.error('PostCard: Failed to load replies for comment', commentId, ':', error);
        }
    };

    return (
        // Rounded edges and depth
        <Card ref={viewTrackingRef} className="p-4 sm:p-5 mb-4 ml-1.5 mr-1.5 border border-gray-800 rounded-xl bg-dark-card shadow-md shadow-gray-900 transition duration-200 hover:bg-[#1f2a37] hover:border-gray-700">
            {/* Repost Header - Only show for reposts */}
            {isRepost && (
                <div className="flex items-center space-x-2 mb-3 text-gray-400 text-sm">
                    <span className="font-medium text-gray-300">{displayAuthor.username}</span>
                    <span>Reposted</span>
                    <span className="text-gray-500">{new Date(repost_timestamp).toLocaleDateString()}</span>
                </div>
            )}

            {/* Reposter's Comment - Only show for reposts with comments */}
            {isRepost && repost_comment && (
                <div className="mb-3">
                    <ProcessedText className="text-white text-base sm:text-lg leading-relaxed font-medium">
                        {processTextWithEntities(repost_comment)}
                    </ProcessedText>
                </div>
            )}

            <div className="flex items-start space-x-3">

                {/* 1. Author Avatar */}
                <Link to={`/${displayAuthor.username}`}>
                    <ProfilePicture user={displayAuthor} size="md" />
                </Link>

                <div className="flex-1 min-w-0">
                    {/* 2. Header (Name, Handle, Time) */}
                    <div className="flex items-start justify-between">
                        <div className="flex flex-col min-w-0">
                            {/* TOP LINE: Name and Handle */}
                            <div className="flex items-center space-x-2">
                                {/* AUTHOR NAME - High priority: Bold and prominent */}
                                <Link to={`/${displayAuthor.username}`} className="font-bold text-white hover:underline text-base sm:text-lg truncate">
                                    {displayAuthor.username}
                                </Link>
                                {/* USER HANDLE - Subtle, medium priority */}
                                <span className="text-gray-500 text-sm font-normal">
                                    @{displayAuthor.username.toLowerCase()}
                                </span>
                            </div>

                            {/* SUB-LINE: Only time */}
                            <div className="flex items-center text-gray-500 text-xs sm:text-sm font-normal truncate mt-0.5">
                                <span>{new Date(displayCreatedAt).toLocaleDateString()}</span>
                            </div>
                        </div>

                        {/* Post Actions Menu (Three Dots) */}
                        <PostActionsMenu post={post} currentUser={currentUser} />
                    </div>


                    {/* 4. Content */}
                    {!isRepost && (
                        <>
                            {/* Title/Content - High priority: Clear, readable, standard size */}
                            {(displayTitle || displayContent) && (
                                <>
                                    {displayTitle && (
                                        <ProcessedText className="text-white mt-2 text-base sm:text-lg leading-relaxed font-normal">
                                            {processTextWithEntities(displayTitle)}
                                        </ProcessedText>
                                    )}
                                    {displayContent && (
                                        <ProcessedText className="text-white mt-2 text-base sm:text-lg leading-relaxed font-normal">
                                            {processTextWithEntities(displayContent)}
                                        </ProcessedText>
                                    )}
                                </>
                            )}
                        </>
                    )}

                    {/* Embedded Original Post for Reposts */}
                    {originalPost && (
                        <div className="mt-2 sm:mt-3 border border-gray-600 rounded-xl p-2 sm:p-3 bg-gray-800/50">
                            <div className="flex items-start space-x-2 sm:space-x-3 mb-2">
                                {/* Original Author Avatar */}
                                <Link to={`/${originalPost.author.username}`}>
                                    <ProfilePicture user={originalPost.author} size="sm" />
                                </Link>
                                <div className="flex flex-col min-w-0">
                                    {/* Original Author Name and Handle - Medium priority: Clear but smaller */}
                                    <div className="flex items-center space-x-2">
                                        <Link to={`/${originalPost.author.username}`} className="font-semibold text-gray-200 text-xs sm:text-sm hover:underline truncate">
                                            {originalPost.author.username}
                                        </Link>
                                        <span className="text-gray-400 text-xs truncate">@{originalPost.author.username.toLowerCase()}</span>
                                    </div>
                                    {/* Original Post Timestamp - Low priority: Subtle and small */}
                                    <div className="flex items-center text-gray-500 text-xs font-normal truncate">
                                        <span>{new Date(originalPost.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            {/* Embedded Content - Readable, but smaller than the reposter's comment */}
                            <ProcessedText className="text-gray-300 text-sm leading-relaxed mb-2 font-normal">{processTextWithEntities(originalPost.title)}</ProcessedText>
                            {originalPost.content && <ProcessedText className="text-gray-300 text-sm leading-relaxed mb-2 font-normal">{processTextWithEntities(originalPost.content)}</ProcessedText>}
                            <PostMedia post={originalPost} size="preview" isMobile={isMobile} />

                            {/* Aggregated Metrics for Original Post */}
                            <div className="flex items-center space-x-4 mt-2 text-gray-400 text-xs">
                                <span>{originalPost.likes_count || 0} Likes</span>
                                <span>{originalPost.reposts_count || 0} Reposts</span>
                                <span>{originalPost.comments_count || 0} Comments</span>
                            </div>

                            {/* Debug: Show that aggregated metrics are working */}
                            {originalPost.likes_count > 0 && (
                                <div className="mt-1 text-green-400 text-xs font-semibold">
                                    ✅ Aggregated metrics working! Original post has {originalPost.likes_count} likes
                                </div>
                            )}
                        </div>
                    )}

                    {/* 5. Media */}
                    {!isRepost && <PostMedia post={post} size="preview" isMobile={isMobile} />}


                    {/* 5. Interaction Counts (REMOVED) - Divider is now optional/removed */}
                    <div className="mt-3 pb-3 border-b border-gray-700/50"></div>


                    {/* 6. Interaction Bar (Icons + Counts + Bookmark) - Updated to include counts */}
                    {isMobile ? (
                        <div className="flex items-center justify-between mt-3 text-gray-500">
                            <div className="flex items-center space-x-1 sm:space-x-4">
                                {/* Like Button (Icon + Count) */}
                                <LikeButton
                                    postId={id}
                                    initialIsLiked={currentInteraction?.isLiked ?? is_liked}
                                    initialLikesCount={likes_count}
                                    className="p-2"
                                    iconClass="h-5 w-5"
                                    hideCount={false}
                                />

                                {/* Comment Button - Mobile Drawer */}
                                <CommentButton
                                    postId={id}
                                    initialCommentsCount={totalCommentsCount}
                                />

                                {/* Repost Button (Icon + Count - used for Share count) */}
                                <RepostButton
                                    postId={id}
                                    initialRepostsCount={reposts_count}
                                    initialIsReposted={currentInteraction?.isReposted ?? is_reposted}
                                    className="p-2"
                                    iconClass="h-5 w-5"
                                    hideCount={false}
                                />

                                {/* Share Button (Icon Only - assuming ShareButton handles its own icon/logic) */}
                                <ShareButton
                                    postId={id}
                                    className="p-2"
                                    iconClass="h-5 w-5"
                                    hideCount={true}
                                />

                                {/* Impressions (Bar Chart Icon + Count) */}
                                {(currentInteraction?.viewsCount ?? views_count) != null && (
                                    <span className="flex items-center space-x-1 text-gray-500 hover:text-white cursor-pointer transition-colors p-2 -ml-2 sm:ml-0">
                                        <BarChart3 className="h-5 w-5" />
                                        <span className="text-sm font-medium text-white transition-colors">
                                            {currentInteraction?.viewsCount ?? views_count}
                                        </span>
                                    </span>
                                )}
                            </div>

                            {/* Bookmark/Save Icon */}
                            <BookmarkButton
                                postId={id}
                                className="p-2"
                                iconClass="h-5 w-5"
                            />
                        </div>
                    ) : (
                        <PostCardActions
                            postId={id}
                            isLiked={currentInteraction?.isLiked ?? is_liked}
                            likesCount={likes_count}
                            repostsCount={reposts_count}
                            isReposted={currentInteraction?.isReposted ?? is_reposted}
                            viewsCount={currentInteraction?.viewsCount ?? views_count}
                            totalCommentsCount={totalCommentsCount}
                            handleCommentClick={handleCommentClick}
                            commentButtonRef={commentButtonRef}
                        />
                    )}
                </div>
            </div>

            {/* 7. Comment Input (Custom Styled) - Only show if user is authenticated */}
            {currentUser && (
                <CommentInput
                    currentUser={currentUser}
                    handleAddComment={handleAddComment}
                    newComment={newComment}
                    setNewComment={(value) => dispatch(setNewComment({ postId: id, comment: value }))}
                    replyingTo={replyingTo}
                    postingComment={postingComment}
                    editingComment={false}
                />
            )}

            {/* Expandable Comments Section */}
            {commentsExpanded && (
                <div ref={commentsSectionRef} className="border-t border-gray-700/50 pt-3 sm:pt-4 mt-3 sm:mt-4">
                    <CommentThread
                        comments={comments}
                        loading={commentsData.loading}
                        collapsedThreads={collapsedThreads}
                        likingComment={likingComment}
                        handleLikeComment={handleLikeComment}
                        handleReply={handleReply}
                        handleToggleThreadCollapse={handleToggleThreadCollapse}
                        handleLoadReplies={handleLoadReplies}
                        currentUser={currentUser}
                        postAuthorId={post.author?.id}
                        postId={id}
                    />
                </div>
            )}
        </Card>
    );
};

export default PostCard;