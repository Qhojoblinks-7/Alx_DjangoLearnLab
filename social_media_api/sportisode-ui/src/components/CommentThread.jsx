// src/components/CommentThread.jsx
import React, { useState } from 'react';
import { MessageCircle, Heart, Reply, ChevronDown, ChevronUp, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProfilePicture from './ProfilePicture';
import { ProcessedText } from './ui/TextEntity';
import { processTextWithEntities } from './lib/textProcessor.jsx';
import { Button } from '../components/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/components/ui/dropdown-menu';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '../components/components/ui/drawer';
import { editComment, deleteComment } from '../store/commentsSlice';
import { useDispatch } from 'react-redux';

// Individual Comment Component
const CommentItem = ({
    comment,
    depth = 0,
    isLastInThread = false,
    collapsedThreads,
    likingComment,
    handleLikeComment,
    handleReply,
    handleToggleThreadCollapse,
    handleLoadReplies,
    currentUser,
    postAuthorId,
    postId,
    onEditComment,
    onDeleteComment
}) => {
    const dispatch = useDispatch();

    const handleReplyClick = (comment) => {
        handleReply(comment);
        // Focus the input field after setting reply state
        setTimeout(() => {
            const input = document.querySelector('input[placeholder*="Write your comment"], textarea[placeholder*="Write your comment"]');
            if (input) input.focus();
        }, 100);
    };
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

    // Check if we're on mobile
    const isMobile = window.innerWidth < 768;

    const hasReplies = comment.replies && comment.replies.loaded && comment.replies.list && comment.replies.list.length > 0;
    const hasUnloadedReplies = comment.reply_count > 0 && (!comment.replies || !comment.replies.loaded);
    const isCollapsed = collapsedThreads.includes(comment.id);

    const canEdit = currentUser?.id === comment.author?.id;
    const canDelete = currentUser?.id === comment.author?.id || currentUser?.id === postAuthorId;

    const handleDelete = () => {
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        try {
            console.log('Deleting comment:', { commentId: comment.id, postId: postId, comment });
            await dispatch(deleteComment({ commentId: comment.id, postId: postId })).unwrap();
            setIsDeleteDialogOpen(false);
        } catch (error) {
            console.error('Failed to delete comment:', error);
            alert(`Failed to delete comment: ${error}`);
        }
    };

    return (
        <>
            {/* Delete Comment Confirmation */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-md" aria-describedby="delete-comment-description">
                    <DialogHeader>
                        <DialogTitle>Delete Comment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4" id="delete-comment-description">
                        <p className="text-gray-600">
                            Are you sure you want to delete this comment? This action cannot be undone.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="group">
                <div className={`flex space-x-3 ${depth > 0 ? 'ml-6' : ''}`}>
                    {/* Thread line for nested comments */}
                    {depth > 0 && (
                        <div className="flex flex-col items-center">
                            <div className="w-px h-6 bg-gray-600"></div>
                            <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                            {!isLastInThread && <div className="w-px flex-1 bg-gray-600"></div>}
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        <div className="flex space-x-3">
                            {comment.author?.username ? (
                                <Link to={`/${comment.author.username}`}>
                                    <ProfilePicture username={comment.author.username} size="xs" />
                                </Link>
                            ) : (
                                <ProfilePicture username="Anonymous" size="xs" />
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-col space-y-1 mb-2">
                                    {comment.author?.username ? (
                                        <Link to={`/${comment.author.username}`} className="font-semibold text-base text-white hover:underline truncate">
                                            {comment.author.username}
                                        </Link>
                                    ) : (
                                        <span className="font-semibold text-base text-white truncate">Anonymous</span>
                                    )}
                                    <span className="text-gray-500 text-sm truncate">
                                        {new Date(comment.timestamp || comment.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <ProcessedText className="text-base mb-3 leading-relaxed font-normal">{processTextWithEntities(comment.content)}</ProcessedText>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                                        <button
                                            onClick={() => handleLikeComment(comment.id)}
                                            disabled={likingComment.includes(comment.id)}
                                            className="flex items-center space-x-1 hover:text-red-500 transition-colors disabled:opacity-50 touch-manipulation p-1 rounded"
                                            aria-label={`Like comment by ${comment.author?.username || 'Anonymous'}`}
                                        >
                                            <Heart className="h-4 w-4" />
                                            <span>{comment.likes_count || 0}</span>
                                        </button>
                                        <button
                                            onClick={() => handleReplyClick(comment)}
                                            className="flex items-center space-x-1 hover:text-blue-500 transition-colors touch-manipulation p-1 rounded"
                                            aria-label={`Reply to comment by ${comment.author?.username || 'Anonymous'}`}
                                        >
                                            <Reply className="h-4 w-4" />
                                            <span>Reply</span>
                                        </button>
                                        {hasReplies && (
                                            <button
                                                onClick={() => handleToggleThreadCollapse(comment.id)}
                                                className="flex items-center space-x-1 hover:text-gray-300 transition-colors touch-manipulation p-1 rounded"
                                                aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} replies`}
                                            >
                                                {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                                                <span>{comment.replies.list.length} {comment.replies.list.length === 1 ? 'reply' : 'replies'}</span>
                                            </button>
                                        )}
                                        {hasUnloadedReplies && (
                                            <button
                                                onClick={() => handleLoadReplies(comment.id)}
                                                className="flex items-center space-x-1 hover:text-blue-400 transition-colors touch-manipulation p-1 rounded"
                                                aria-label={`View ${comment.reply_count} replies`}
                                            >
                                                <MessageCircle className="h-4 w-4" />
                                                <span>View {comment.reply_count} {comment.reply_count === 1 ? 'reply' : 'replies'}</span>
                                            </button>
                                        )}
                                    </div>

                                    {/* Comment Actions Menu */}
                                    {canDelete && (
                                        isMobile ? (
                                            <Drawer open={isMobileDrawerOpen} onOpenChange={setIsMobileDrawerOpen}>
                                                <DrawerTrigger asChild>
                                                    <button
                                                        className="text-gray-500 hover:text-gray-300 transition-colors touch-manipulation p-1 rounded"
                                                        aria-label="Comment options"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </button>
                                                </DrawerTrigger>
                                                <DrawerContent className="bg-gray-900 border-gray-700 text-gray-100">
                                                    <DrawerHeader className="text-center">
                                                        <DrawerTitle className="text-white">Comment Options</DrawerTitle>
                                                    </DrawerHeader>
                                                    <div className="px-4 pb-4">
                                                        {canEdit && (
                                                            <Button
                                                                variant="ghost"
                                                                onClick={() => {
                                                                    onEditComment(comment);
                                                                    setIsMobileDrawerOpen(false);
                                                                }}
                                                                className="w-full justify-start mb-2 text-gray-300 hover:text-white hover:bg-gray-800"
                                                            >
                                                                <Edit className="mr-3 h-4 w-4 flex-shrink-0" />
                                                                <span className="flex-1 text-left">Edit</span>
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            onClick={() => {
                                                                handleDelete();
                                                                setIsMobileDrawerOpen(false);
                                                            }}
                                                            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                                        >
                                                            <Trash2 className="mr-3 h-4 w-4 flex-shrink-0" />
                                                            <span className="flex-1 text-left">Delete</span>
                                                        </Button>
                                                    </div>
                                                </DrawerContent>
                                            </Drawer>
                                        ) : (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button
                                                        className="text-gray-500 hover:text-gray-300 transition-colors touch-manipulation p-1 rounded"
                                                        aria-label="Comment options"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40 bg-gray-900 border-gray-700 text-gray-100">
                                                    {canEdit && (
                                                        <DropdownMenuItem
                                                            onClick={() => onEditComment(comment)}
                                                            className="cursor-pointer hover:bg-gray-800 focus:bg-gray-800 px-3 py-2 text-gray-300 hover:text-white focus:text-white"
                                                        >
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem
                                                        onClick={handleDelete}
                                                        className="cursor-pointer hover:bg-gray-800 focus:bg-gray-800 px-3 py-2 text-red-400 hover:text-red-300 focus:text-red-300"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Render replies */}
                        {hasReplies && !isCollapsed && (
                            <div className="mt-3 space-y-3">
                                {comment.replies.list.map((reply, index) =>
                                    <CommentItem
                                        key={reply.id}
                                        comment={reply}
                                        depth={depth + 1}
                                        isLastInThread={index === comment.replies.list.length - 1}
                                        collapsedThreads={collapsedThreads}
                                        likingComment={likingComment}
                                        handleLikeComment={handleLikeComment}
                                        handleReply={handleReply}
                                        handleToggleThreadCollapse={handleToggleThreadCollapse}
                                        handleLoadReplies={handleLoadReplies}
                                        currentUser={currentUser}
                                        postAuthorId={postAuthorId}
                                        postId={postId}
                                        onEditComment={onEditComment}
                                        onDeleteComment={onDeleteComment}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

// Main Comment Thread Component
const CommentThread = ({
    comments,
    loading,
    collapsedThreads,
    likingComment,
    handleLikeComment,
    handleReply,
    handleToggleThreadCollapse,
    handleLoadReplies,
    currentUser,
    postAuthorId,
    postId,
    onEditComment,
    onDeleteComment
}) => {
    // Group comments into parent-child structure for proper threading
    const groupCommentsIntoThreads = (flatComments) => {
        const commentMap = {};
        const topLevelComments = [];

        // First pass: create map of all comments
        flatComments.forEach(comment => {
            commentMap[comment.id] = {
                ...comment,
                replies: {
                    loaded: true,
                    list: [],
                    count: comment.reply_count || 0
                }
            };
        });

        // Second pass: build the tree structure
        flatComments.forEach(comment => {
            if (comment.parent_comment) {
                // This is a reply - add to parent's replies
                const parentId = comment.parent_comment;
                if (commentMap[parentId]) {
                    commentMap[parentId].replies.list.push(commentMap[comment.id]);
                }
            } else {
                // This is a top-level comment
                topLevelComments.push(commentMap[comment.id]);
            }
        });

        return topLevelComments;
    };

    const threadedComments = groupCommentsIntoThreads(comments);

    if (loading) {
        return (
            <div className="text-center text-gray-500 py-4 text-sm sm:text-base">
                Loading comments...
            </div>
        );
    }

    if (threadedComments.length === 0) {
        return (
            <div className="text-center text-gray-500 py-4 text-sm sm:text-base">
                No comments yet. Be the first to comment!
            </div>
        );
    }

    return (
        <div className="space-y-4 mb-4 px-4" role="list" aria-label="Comments">
            {threadedComments.map(comment => (
                <CommentItem
                    key={comment.id}
                    comment={comment}
                    collapsedThreads={collapsedThreads}
                    likingComment={likingComment}
                    handleLikeComment={handleLikeComment}
                    handleReply={handleReply}
                    handleToggleThreadCollapse={handleToggleThreadCollapse}
                    handleLoadReplies={handleLoadReplies}
                    currentUser={currentUser}
                    postAuthorId={postAuthorId}
                    postId={postId}
                    onEditComment={onEditComment}
                    onDeleteComment={onDeleteComment}
                />
            ))}
        </div>
    );
};

export default CommentThread;