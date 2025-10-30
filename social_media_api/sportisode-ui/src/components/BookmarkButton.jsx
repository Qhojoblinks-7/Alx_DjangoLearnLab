// src/components/BookmarkButton.jsx
import React from 'react';
import { Bookmark } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleBookmark, optimisticToggleBookmark, revertBookmarkToggle, selectPostInteraction, selectIsBookmarking } from '../store/postsSlice';

const BookmarkButton = ({ postId, className, iconClass }) => {
    const dispatch = useDispatch();

    // Get state from Redux store using memoized selectors
    const { isBookmarked } = useSelector((state) => selectPostInteraction(state, postId));
    const isLoading = useSelector((state) => selectIsBookmarking(state, postId));

    const handleBookmarkToggle = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('BookmarkButton: Toggling bookmark for post:', postId);
        // Optimistic UI Update (Immediate visual change)
        dispatch(optimisticToggleBookmark({ postId }));

        try {
            const result = await dispatch(toggleBookmark(postId)).unwrap();
            console.log('BookmarkButton: Bookmark toggle successful:', result);
        } catch (error) {
            // Revert on failure (Pessimistic fallback)
            console.error("BookmarkButton: Bookmark failed:", error);
            dispatch(revertBookmarkToggle({ postId }));
        }
    };

    const bookmarkColor = isBookmarked ? 'text-blue-500 fill-blue-500' : 'text-gray-500';
    const hoverClass = isBookmarked ? 'hover:text-blue-600 hover:fill-blue-600' : 'hover:bg-blue-500/10 hover:text-blue-500';

    return (
        <button
            className={`p-2 group ${hoverClass} transition-colors duration-200 rounded-md ${className || ''}`}
            onClick={handleBookmarkToggle}
            disabled={isLoading}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark post'}
        >
            <Bookmark className={`${iconClass || 'h-5 w-5'} transition-colors duration-200 ${bookmarkColor}`} />
        </button>
    );
};

export default BookmarkButton;