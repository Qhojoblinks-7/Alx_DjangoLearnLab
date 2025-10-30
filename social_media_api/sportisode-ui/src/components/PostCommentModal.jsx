// src/components/PostCommentModal.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MessageCircle, Heart, Reply, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../components/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '../components/components/ui/drawer';
import ProfilePicture from './ProfilePicture';
import {
  fetchComments,
  postComment,
  likeComment,
  setNewComment,
  setReplyingTo,
  clearReply,
  toggleThreadCollapse,
} from '../store/commentsSlice';
import { processTextWithEntities } from './lib/textProcessor.jsx';
import { ProcessedText } from './ui/TextEntity';
import EnhancedTextInput from './ui/EnhancedTextInput';

// EnhancedTextInput component handles all picker functionality

const PostCommentModal = ({ post, isOpen, onClose }) => {
    const dispatch = useDispatch();

    // Get current user from Redux store
    const currentUser = useSelector((state) => state.auth.user);

    // Check if we're on mobile
    const isMobile = window.innerWidth < 768;

    // Get state from Redux store
    const {
        comments: commentsData,
        composition: { newComment, replyingTo },
        ui: { collapsedThreads },
        loading: { postingComment, likingComment },
    } = useSelector((state) => ({
        comments: state.comments.comments[post?.id] || { comments: [], count: 0, loading: false, error: null },
        composition: state.comments.composition,
        ui: state.comments.ui,
        loading: state.comments.loading,
    }));

    const comments = commentsData.comments || [];
    const totalCommentsCount = commentsData.count || comments.length;

    // Fetch comments when modal opens
    useEffect(() => {
        if (isOpen && post?.id) {
            dispatch(fetchComments(post.id));
        }
    }, [isOpen, post?.id, dispatch]);

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        try {
            await dispatch(postComment({
                postId: post.id,
                content: newComment,
                parentCommentId: replyingTo?.id,
            })).unwrap();

            // Clear the composition state
            dispatch(setNewComment(''));
            dispatch(clearReply());
        } catch (error) {
            console.error('Failed to add comment:', error);
        }
    };

    const handleReply = (comment) => {
        dispatch(setReplyingTo(comment));
        dispatch(setNewComment(`@${comment.author?.username || 'Anonymous'} `));
        // Focus the input field after setting reply state
        setTimeout(() => {
            const input = document.querySelector('textarea[placeholder*="Reply to"], input[placeholder*="Reply to"]');
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

    // eslint-disable-next-line no-unused-vars
    const renderComment = (comment, depth = 0, isLastInThread = false) => {
        const hasReplies = comment.replies && comment.replies.length > 0;
        const isCollapsed = collapsedThreads.has(comment.id);

        return (
            <div key={comment.id} className="group">
                <div className={`flex space-x-3 ${depth > 0 ? 'ml-6' : ''}`}>
                    {/* Thread line for nested comments */}
                    {depth > 0 && (
                        <div className="flex flex-col items-center">
                            <div className="w-px h-6 bg-gray-600"></div>
                            <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                            {!isLastInThread && <div className="w-px flex-1 bg-gray-600"></div>}
                        </div>
                    )}

                    <div className="flex-1">
                        <div className="flex space-x-2">
                            <ProfilePicture username={comment.author?.username || 'Anonymous'} size="sm" />
                            <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-semibold text-sm text-white">
                                        {comment.author?.username || 'Anonymous'}
                                    </span>
                                    <span className="text-gray-500 text-xs">
                                        {new Date(comment.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <ProcessedText className="text-sm mb-2">{processTextWithEntities(comment.content)}</ProcessedText>
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                    <button
                                        onClick={() => handleLikeComment(comment.id)}
                                        disabled={likingComment.has(comment.id)}
                                        className="flex items-center space-x-1 hover:text-red-500 transition-colors disabled:opacity-50"
                                        aria-label={`Like comment by ${comment.author?.username || 'Anonymous'}`}
                                    >
                                        <Heart className="h-3 w-3" />
                                        <span>{comment.likes_count || 0}</span>
                                    </button>
                                    <button
                                        onClick={() => handleReply(comment)}
                                        className="flex items-center space-x-1 hover:text-blue-500 transition-colors"
                                        aria-label={`Reply to comment by ${comment.author?.username || 'Anonymous'}`}
                                    >
                                        <Reply className="h-3 w-3" />
                                        <span>Reply</span>
                                    </button>
                                    {hasReplies && (
                                        <button
                                            onClick={() => handleToggleThreadCollapse(comment.id)}
                                            className="flex items-center space-x-1 hover:text-gray-300 transition-colors"
                                            aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} replies`}
                                        >
                                            {isCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
                                            <span>{comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Render replies */}
                        {hasReplies && !isCollapsed && (
                            <div className="mt-3 space-y-3">
                                {comment.replies.map((reply, index) =>
                                    renderComment(reply, depth + 1, index === comment.replies.length - 1)
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (!post) return null;

    return (
        <>
            {isMobile ? (
                <Drawer open={isOpen} onOpenChange={onClose}>
                    <DrawerContent className="bg-gray-900 border-gray-700 text-gray-100 max-h-[90vh]">
                        <DrawerHeader className="text-center">
                            <DrawerTitle className="text-white">Comments ({totalCommentsCount})</DrawerTitle>
                        </DrawerHeader>
                        <div className="flex flex-col h-full max-h-[80vh]">
                            {/* Post Preview */}
                            <div className="p-4 border-b border-gray-700">
                                <div className="flex items-center space-x-3 mb-3">
                                    <ProfilePicture username={post.author.username} size="sm" />
                                    <div>
                                        <h3 className="font-bold text-white text-sm">{post.author.username}</h3>
                                        <p className="text-gray-500 text-xs">
                                            {new Date(post.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                {post.content && (
                                    <ProcessedText className="text-sm">{processTextWithEntities(post.content)}</ProcessedText>
                                )}
                            </div>

                            {/* Comments List */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4" role="list" aria-label="Comments">
                                <CommentThread
                                    comments={comments}
                                    loading={false}
                                    collapsedThreads={collapsedThreads}
                                    likingComment={likingComment}
                                    handleLikeComment={handleLikeComment}
                                    handleReply={handleReply}
                                    handleToggleThreadCollapse={handleToggleThreadCollapse}
                                    handleLoadReplies={() => {}}
                                    currentUser={currentUser}
                                    postAuthorId={post?.author?.id}
                                    postId={post?.id}
                                    onEditComment={() => {}}
                                    onDeleteComment={() => {}}
                                />
                            </div>

                            {/* Comment Input */}
                            <div className="p-4 border-t border-gray-700">
                                {replyingTo && (
                                    <div className="mb-3 p-2 bg-gray-800 rounded-lg flex items-center justify-between">
                                        <span className="text-sm text-gray-300">
                                            Replying to @{replyingTo.author?.username || 'Anonymous'}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => dispatch(clearReply())}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                )}

                                <EnhancedTextInput
                                    value={newComment}
                                    onChange={(value) => dispatch(setNewComment(value))}
                                    onSubmit={handleAddComment}
                                    placeholder={replyingTo ? `Reply to @${replyingTo.author?.username || 'Anonymous'}...` : "Write a comment..."}
                                    disabled={postingComment}
                                    isLoading={postingComment}
                                    context="comment"
                                    editingComment={false}
                                />
                            </div>
                        </div>
                    </DrawerContent>
                </Drawer>
            ) : (
                <Dialog open={isOpen} onOpenChange={onClose}>
                    <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] h-full max-h-[90vh]">
                            {/* Left Panel - Post Details */}
                            <div className="p-6 border-r border-gray-700 overflow-y-auto">
                                <div className="space-y-4">
                                    {/* Author Info */}
                                    <div className="flex items-center space-x-3">
                                        <ProfilePicture username={post.author.username} size="md" />
                                        <div>
                                            <h3 className="font-bold text-white">{post.author.username}</h3>
                                            <p className="text-gray-500 text-sm">@{post.author.username.toLowerCase()}</p>
                                            <p className="text-gray-500 text-xs">
                                                {new Date(post.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Post Content */}
                                    <div className="space-y-3">
                                        {post.title && (
                                            <h1 className="text-xl font-bold text-white">{processTextWithEntities(post.title)}</h1>
                                        )}
                                        {post.content && (
                                            <ProcessedText>{processTextWithEntities(post.content)}</ProcessedText>
                                        )}
                                        {post.video && (
                                            <div className="w-full h-64 bg-black flex items-center justify-center rounded-xl overflow-hidden">
                                                <p className="text-gray-500">Video Player: {post.video.substring(0, 30)}...</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Post Stats */}
                                    <div className="flex items-center space-x-6 text-gray-500 pt-4 border-t border-gray-700">
                                        <div className="flex items-center space-x-2">
                                            <Heart className="h-4 w-4" />
                                            <span>{post.likes_count}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <MessageCircle className="h-4 w-4" />
                                            <span>{post.comments_count}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Reply className="h-4 w-4" />
                                            <span>{post.reposts_count}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Panel - Comments */}
                            <div className="flex flex-col h-full">
                                {/* Comments Header */}
                                <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                                    <h2 className="text-lg font-semibold">Comments ({totalCommentsCount})</h2>
                                    <Button variant="ghost" size="sm" onClick={onClose}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>

                                {/* Comments List */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4" role="list" aria-label="Comments">
                                    <CommentThread
                                        comments={comments}
                                        loading={false}
                                        collapsedThreads={collapsedThreads}
                                        likingComment={likingComment}
                                        handleLikeComment={handleLikeComment}
                                        handleReply={handleReply}
                                        handleToggleThreadCollapse={handleToggleThreadCollapse}
                                        handleLoadReplies={() => {}}
                                        currentUser={currentUser}
                                        postAuthorId={post?.author?.id}
                                        postId={post?.id}
                                        onEditComment={() => {}}
                                        onDeleteComment={() => {}}
                                    />
                                </div>

                                {/* Comment Input */}
                                <div className="p-4 border-t border-gray-700">
                                    {replyingTo && (
                                        <div className="mb-3 p-2 bg-gray-800 rounded-lg flex items-center justify-between">
                                            <span className="text-sm text-gray-300">
                                                Replying to @{replyingTo.author?.username || 'Anonymous'}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => dispatch(clearReply())}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    )}

                                    <EnhancedTextInput
                                        value={newComment}
                                        onChange={(value) => dispatch(setNewComment(value))}
                                        onSubmit={handleAddComment}
                                        placeholder={replyingTo ? `Reply to @${replyingTo.author?.username || 'Anonymous'}...` : "Write a comment..."}
                                        disabled={postingComment}
                                        isLoading={postingComment}
                                        context="comment"
                                        editingComment={false}
                                    />
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
};

export default PostCommentModal;