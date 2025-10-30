// src/components/ShareButton.jsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Share2 } from 'lucide-react';
import { Button } from '../components/components/ui/button';
import { setShareCopied, selectIsShareCopied } from '../store/postsSlice';

const ShareButton = ({ postId, className, iconClass, hideCount }) => {
    const dispatch = useDispatch();
    const isCopied = useSelector(state => selectIsShareCopied(state, postId));

    const handleShare = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('ShareButton: Sharing post:', postId);
        const url = `${window.location.origin}/post/${postId}`;

        if (navigator.share) {
            // Use Web Share API if available
            try {
                await navigator.share({
                    title: 'Check out this post',
                    url: url,
                });
                console.log('ShareButton: Web Share API used successfully');
            } catch (error) {
                console.error('ShareButton: Error sharing:', error);
            }
        } else {
            // Fallback to clipboard
            try {
                await navigator.clipboard.writeText(url);
                console.log('ShareButton: URL copied to clipboard');
                dispatch(setShareCopied({ postId }));
                // Clear the copied state after 2 seconds
                setTimeout(() => {
                    dispatch({ type: 'posts/clearShareCopied' });
                }, 2000);
            } catch (error) {
                console.error('ShareButton: Failed to copy:', error);
            }
        }
    };

    return (
        <Button
            variant="ghost"
            className={`p-2 hover:bg-sport-accent/10 hover:text-sport-accent ${className || ''}`}
            onClick={handleShare}
        >
            <Share2 className={`h-5 w-5 ${iconClass || ''}`} />
            {isCopied && <span className="ml-2 text-xs">Copied!</span>}
        </Button>
    );
};

export default ShareButton;