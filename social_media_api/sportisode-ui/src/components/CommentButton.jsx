//components/CommentButton.jsx
import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { authenticatedFetch } from './lib/api';
import { Button } from '../components/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '../components/components/ui/drawer';
import CommentInput from './CommentInput';
import CommentThread from './CommentThread';
import { useSelector, useDispatch } from 'react-redux';
import { fetchComments } from '../store/commentsSlice';

const CommentButton = ({ postId, initialCommentsCount }) => {
    const dispatch = useDispatch();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [editingComment, setEditingComment] = useState(null);
    const currentUser = useSelector((state) => state.auth.user);

    // Fetch comments - handle both paginated and direct array responses
    const { data: commentsData, refetch } = useQuery({
        queryKey: ['comments', postId],
        queryFn: async () => {
            console.log('CommentButton: Fetching comments for post', postId);
            const response = await authenticatedFetch(`/posts/${postId}/comments/`);
            console.log('CommentButton: Response status', response.status);
            const data = await response.json();
            console.log('CommentButton: Raw response data', data);
            // Handle both paginated response format and direct array format
            const comments = data.results || data || [];
            console.log('CommentButton: Processed comments', comments.length, 'comments:', comments);
            return comments;
        },
        enabled: isOpen,
    });

    useEffect(() => {
        console.log('CommentButton: commentsData changed', { commentsData, postId });
        if (commentsData) {
            // Transform comments to include replies structure for consistency
            const transformedComments = (Array.isArray(commentsData) ? commentsData : []).map(comment => ({
                ...comment,
                replies: {
                    loaded: false,
                    list: [],
                    count: comment.reply_count || 0,
                }
            }));
            console.log('CommentButton: Setting comments', transformedComments.length, 'comments:', transformedComments);
            setComments(transformedComments);
        } else {
            console.log('CommentButton: No commentsData, setting empty array');
            setComments([]);
        }
    }, [commentsData, postId]);

    // Listen for comment deletions from Redux store
    const commentsState = useSelector((state) => state.comments.comments[postId]);
    useEffect(() => {
        if (commentsState && commentsState.list) {
            console.log('CommentButton: Redux comments updated, refreshing local state');
            // Transform Redux comments to match local format
            const transformedComments = commentsState.list.map(comment => ({
                ...comment,
                replies: {
                    loaded: comment.replies?.loaded || false,
                    list: comment.replies?.list || [],
                    count: comment.replies?.count || comment.reply_count || 0,
                }
            }));
            setComments(transformedComments);
        }
    }, [commentsState, postId]);

    // Refresh comments when drawer opens
    useEffect(() => {
        if (isOpen && postId) {
            console.log('CommentButton: Drawer opened, fetching latest comments from Redux');
            dispatch(fetchComments(postId));
        }
    }, [isOpen, postId, dispatch]);

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        try {
            const commentData = {
                content: newComment,
                ...(replyingTo && { parentId: replyingTo.id })
            };

            const response = await authenticatedFetch(`/posts/${postId}/comments/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(commentData),
            });

            if (response.ok) {
                setNewComment('');
                setReplyingTo(null);
                refetch(); // Refresh comments
            }
        } catch (error) {
            console.error('Failed to add comment:', error);
        }
    };

    const handleReply = (comment) => {
        setReplyingTo(comment);
        setEditingComment(null);
        setNewComment(`@${comment.author?.username || 'Anonymous'} `);
        // Focus the input field after setting reply state
        setTimeout(() => {
            const input = document.querySelector('input[placeholder*="Write your comment"]');
            if (input) input.focus();
        }, 100);
    };

    const handleEditComment = (comment) => {
        setEditingComment(comment);
        setReplyingTo(null);
        setNewComment(comment.content);
    };

    const handleSaveEdit = async () => {
        if (!newComment.trim() || !editingComment) return;

        try {
            const response = await authenticatedFetch(`/posts/${postId}/comments/${editingComment.id}/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment.trim() }),
            });

            if (response.ok) {
                setEditingComment(null);
                setNewComment('');
                refetch(); // Refresh comments
            }
        } catch (error) {
            console.error('Failed to edit comment:', error);
        }
    };

    const handleCancelEdit = () => {
        setEditingComment(null);
        setNewComment('');
    };

    return (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>
                <Button variant="ghost" className="p-2 hover:bg-sport-accent/10 hover:text-sport-accent group">
                    <MessageCircle className="h-5 w-5 mr-2" />
                    <span className="group-hover:text-sport-accent">{initialCommentsCount}</span>
                </Button>
            </DrawerTrigger>
            <DrawerContent className="h-[85vh] max-h-[85vh]" aria-describedby="comments-description">
                <DrawerHeader>
                    <DrawerTitle className="text-lg font-semibold">Comments</DrawerTitle>
                </DrawerHeader>
                <div id="comments-description" className="sr-only">
                    View and add comments for this post
                </div>
                <div className="flex-1 flex flex-col space-y-4 px-4 pb-4 overflow-hidden">
                    {/* Comments List */}
                    <div className="flex-1 overflow-y-auto">
                        <CommentThread
                            comments={comments}
                            loading={false}
                            collapsedThreads={[]}
                            likingComment={[]}
                            handleLikeComment={() => {}}
                            handleReply={handleReply}
                            handleToggleThreadCollapse={() => {}}
                            handleLoadReplies={() => {}}
                            currentUser={currentUser}
                            postAuthorId={null}
                            postId={postId}
                            onEditComment={handleEditComment}
                            onDeleteComment={() => {}}
                        />
                    </div>

                    {/* Add Comment */}
                    {currentUser && (
                        <div className="flex-shrink-0">
                            <CommentInput
                                currentUser={currentUser}
                                handleAddComment={handleAddComment}
                                newComment={newComment}
                                setNewComment={setNewComment}
                                replyingTo={replyingTo}
                                postingComment={false}
                                editingComment={!!editingComment}
                                handleSaveEdit={handleSaveEdit}
                                handleCancelEdit={handleCancelEdit}
                            />
                        </div>
                    )}
                </div>
            </DrawerContent>
        </Drawer>
    );
};

export default CommentButton;