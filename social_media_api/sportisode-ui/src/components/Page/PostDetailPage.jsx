// src/components/Page/PostDetailPage.jsx
import React, { useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Component Imports
import PostCard from '../PostCard';
import PostCommentModal from '../PostCommentModal';

// API Imports
import { authenticatedFetch } from '../lib/api';

const PostDetailPage = () => {
    const { postId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const commentRef = useRef(null);

    // Get navigation state from notifications
    const { scrollToComment, highlightComment, scrollToContent, highlightMention, commentId } = location.state || {};

    // Fetch single post data
    const { data: post, isLoading, isError, error } = useQuery({
        queryKey: ['post', postId],
        queryFn: async () => {
            const response = await authenticatedFetch(`/posts/${postId}/`);
            if (!response.ok) {
                throw new Error('Failed to fetch post');
            }
            return response.json();
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Increment view count when post loads
    useEffect(() => {
        if (post && postId) {
            // Record the view (fire and forget)
            authenticatedFetch(`/posts/${postId}/view/`, {
                method: 'POST',
            }).catch(err => {
                // Silently fail - view counting is not critical
                console.warn('Failed to record view:', err);
            });
        }
    }, [post, postId]);

    // Handle scrolling and highlighting after post loads
    useEffect(() => {
        if (post && (scrollToComment || scrollToContent)) {
            // Small delay to ensure DOM is fully rendered
            setTimeout(() => {
                if (scrollToComment && commentRef.current) {
                    // Scroll to the comment section
                    commentRef.current.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });

                    // Add highlight effect if requested
                    if (highlightComment) {
                        commentRef.current.classList.add('highlight-notification');
                        setTimeout(() => {
                            commentRef.current.classList.remove('highlight-notification');
                        }, 3000);
                    }
                } else if (scrollToContent) {
                    // Scroll to top of post content
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });

                    // Add highlight effect for mentions
                    if (highlightMention) {
                        const postContent = document.querySelector('.post-content');
                        if (postContent) {
                            postContent.classList.add('highlight-mention');
                            setTimeout(() => {
                                postContent.classList.remove('highlight-mention');
                            }, 3000);
                        }
                    }
                }
            }, 500);
        }
    }, [post, scrollToComment, scrollToContent, highlightComment, highlightMention]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                <div className="flex items-center space-x-2 text-sport-accent">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Loading post...</span>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-white mb-2">Post Not Found</h2>
                    <p className="text-gray-400 mb-4">{error.message}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-4 py-2 bg-sport-accent text-white rounded-lg hover:bg-sport-accent/80 transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-bg">
            {/* Header with back button */}
            <header className="sticky top-0 bg-dark-bg/80 backdrop-blur-sm border-b border-gray-700 z-10">
                <div className="max-w-2xl mx-auto px-4 py-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        <span>Back</span>
                    </button>
                </div>
            </header>

            {/* Main content */}
            <main className="max-w-2xl mx-auto px-4 py-6">
                {post && (
                    <div className="space-y-6">
                        {/* Post Card */}
                        <div className="post-content">
                            <PostCard
                                post={post}
                                showCommentsButton={false}
                                isDetailView={true}
                            />
                        </div>

                        {/* Comments Section */}
                        <div ref={commentRef} className="transition-all duration-300">
                            <PostCommentModal
                                postId={postId}
                                isOpen={true}
                                onClose={() => {}} // No close action for detail page
                                isDetailPage={true}
                                initialPost={post}
                            />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default PostDetailPage;