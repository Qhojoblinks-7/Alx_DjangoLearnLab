// src/components/PostDetailDrawer.jsx
import React, { useState, useEffect } from 'react';
import { MessageCircle, Repeat2, Share2, Heart, Reply, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { authenticatedFetch } from './lib/api';
import { Button } from '../components/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '../components/components/ui/drawer';
import ProfilePicture from './ProfilePicture';
import EnhancedTextInput from './ui/EnhancedTextInput';

const PostDetailDrawer = ({ post, isOpen, onClose }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);

    // Fetch comments
    const { data: commentsData, refetch } = useQuery({
        queryKey: ['comments', post?.id],
        queryFn: () => authenticatedFetch(`/posts/${post?.id}/comments/`).then(res => res.json()),
        enabled: isOpen && !!post?.id,
    });

    useEffect(() => {
        if (commentsData) {
            // Handle paginated response - extract results array
            const commentsArray = commentsData.results || commentsData;
            setComments(Array.isArray(commentsArray) ? commentsArray : []);
        }
    }, [commentsData]);

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        try {
            const commentData = {
                content: newComment,
                ...(replyingTo && { parent_comment: replyingTo.id })
            };

            const response = await authenticatedFetch(`/posts/${post.id}/comments/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(commentData),
            });

            if (response.ok) {
                setNewComment('');
                setReplyingTo(null);
                refetch();
            }
        } catch (error) {
            console.error('Failed to add comment:', error);
        }
    };

    const handleReply = (comment) => {
        setReplyingTo(comment);
        setNewComment(`@${comment.author.username} `);
    };

    const handleLikeComment = async (commentId) => {
        // Placeholder for comment liking functionality
        console.log('Like comment:', commentId);
    };

    const renderComment = (comment, depth = 0) => (
        <div key={comment.id} className={`${depth > 0 ? 'ml-8 border-l-2 border-gray-600 pl-4' : ''} mb-4`}>
            <div className="flex space-x-2">
                <ProfilePicture username={comment.author?.username || 'Anonymous'} size="sm" />
                <div className="flex-1">
                    <div className="flex items-center space-x-1 mb-1">
                        <span className="font-semibold text-sm text-white">
                            {comment.author?.username || 'Anonymous'}
                        </span>
                        <span className="text-gray-500 text-xs">
                            {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">{comment.content}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <button
                            onClick={() => handleLikeComment(comment.id)}
                            className="flex items-center space-x-1 hover:text-red-500"
                        >
                            <Heart className="h-3 w-3" />
                            <span>{comment.likes_count || 0}</span>
                        </button>
                        <button
                            onClick={() => handleReply(comment)}
                            className="flex items-center space-x-1 hover:text-blue-500"
                        >
                            <Reply className="h-3 w-3" />
                            <span>Reply</span>
                        </button>
                    </div>
                </div>
            </div>
            {/* Render replies */}
            {comment.replies && comment.replies.map(reply => renderComment(reply, depth + 1))}
        </div>
    );

    if (!post) return null;

    return (
        <Drawer open={isOpen} onOpenChange={onClose}>
            <DrawerContent className="max-h-[90vh]">
                <DrawerHeader className="flex flex-row items-center justify-between">
                    <DrawerTitle>Post Details</DrawerTitle>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </DrawerHeader>

                <div className="px-4 pb-4 overflow-y-auto max-h-[calc(90vh-80px)]">
                    {/* Full Post Content */}
                    <div className="mb-6">
                        <div className="flex space-x-3 mb-3">
                            <ProfilePicture username={post.author.username} />
                            <div className="flex-1">
                                <div className="flex items-center space-x-1">
                                    <span className="font-bold text-white hover:underline cursor-pointer">
                                        {post.author.username}
                                    </span>
                                    <span className="text-gray-500 text-sm">@{post.author.username.toLowerCase()}</span>
                                    <span className="text-gray-500 text-sm">· {new Date(post.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="ml-11">
                            <p className="text-white mb-2">{post.title}</p>
                            {post.content && <p className="text-gray-300 mb-2">{post.content}</p>}
                            {post.video && (
                                <div className="w-full h-48 bg-black flex items-center justify-center rounded-xl overflow-hidden mb-2">
                                    <p className="text-gray-500">Video Player: {post.video.substring(0, 30)}...</p>
                                </div>
                            )}
                        </div>

                        {/* Post Action Buttons */}
                        <div className="flex justify-between mt-4 ml-11 text-gray-500 w-full md:w-4/5">
                            <Button variant="ghost" className="p-2">
                                <MessageCircle className="h-5 w-5 mr-2" />
                                <span>{post.comments_count}</span>
                            </Button>
                            <Button variant="ghost" className="p-2">
                                <Repeat2 className="h-5 w-5 mr-2" />
                                <span>{post.reposts_count}</span>
                            </Button>
                            <Button variant="ghost" className="p-2">
                                <Heart className={`h-5 w-5 mr-2 ${post.is_liked ? 'text-red-500 fill-red-500' : ''}`} />
                                <span>{post.likes_count}</span>
                            </Button>
                            <Button variant="ghost" className="p-2">
                                <Share2 className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div className="border-t border-gray-700 pt-4">
                        <h3 className="text-lg font-semibold mb-4">Comments ({commentsData?.count || comments.length})</h3>

                        {/* Comments List */}
                        <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                            {comments.map(comment => renderComment(comment))}
                        </div>

                        {/* Add Comment/Reply */}
                        <div className="space-y-2">
                            {replyingTo && (
                                <div className="text-sm text-gray-400 mb-2">
                                    Replying to @{replyingTo.author?.username || 'Anonymous'}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setReplyingTo(null);
                                            setNewComment('');
                                        }}
                                        className="ml-2 text-xs"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            )}
                            <EnhancedTextInput
                                value={newComment}
                                onChange={setNewComment}
                                onSubmit={handleAddComment}
                                placeholder={replyingTo ? `Reply to @${replyingTo.author?.username || 'Anonymous'}...` : "Write a comment..."}
                                context="comment"
                            />
                        </div>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
};

export default PostDetailDrawer;