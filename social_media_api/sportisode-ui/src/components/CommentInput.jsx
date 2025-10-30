// src/components/CommentInput.jsx
import React, { useRef } from 'react';
import { Paperclip, Smile, Send } from 'lucide-react';
import ProfilePicture from './ProfilePicture';

// Custom Component for the Styled Comment Input to match the image
const CommentInput = ({ currentUser, handleAddComment, newComment, setNewComment, replyingTo, postingComment, editingComment, handleSaveEdit, handleCancelEdit }) => {
    const inputRef = useRef(null);

    // Focus the input when editing starts
    React.useEffect(() => {
        if (editingComment && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select(); // Select all text for easy replacement
        }
    }, [editingComment]);

    const handleSendClick = () => {
        if (!postingComment && newComment.trim()) {
            if (editingComment) {
                handleSaveEdit();
            } else {
                handleAddComment();
            }
        }
    };

    const handleCancelClick = () => {
        if (editingComment && handleCancelEdit) {
            handleCancelEdit();
        }
    };

    return (
        <div className="flex items-start space-x-3 mt-4">
            {/* User Avatar */}
            {/* Using currentUser for the input avatar */}
            <ProfilePicture user={currentUser} size="md" />

            {/* Input Container */}
            <div className="flex-1 bg-gray-800/80 rounded-full py-1 px-4 flex items-center min-w-0">

                {/* Text Input (replaces the heavy EnhancedTextInput for this simpler look) */}
                <input
                    ref={inputRef}
                    type="text"
                    placeholder={editingComment ? "Edit your comment..." : replyingTo ? `Replying to @${replyingTo.author?.username || 'Anonymous'}...` : "Write your comment.."}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && newComment.trim()) {
                            e.preventDefault();
                            handleSendClick();
                        } else if (e.key === 'Escape' && editingComment) {
                            handleCancelClick();
                        }
                    }}
                    disabled={postingComment}
                    className="w-full bg-transparent border-none text-white placeholder-gray-500 focus:outline-none text-sm sm:text-base py-2"
                />

                {/* Right-side Icons */}
                <div className="flex items-center space-x-3 text-gray-500">
                    {editingComment && (
                        <button
                            className="cursor-pointer hover:text-gray-300 transition-colors"
                            onClick={handleCancelClick}
                        >
                            Cancel
                        </button>
                    )}
                    <button className="cursor-pointer hover:text-gray-300 transition-colors">
                        <Paperclip className="h-4 w-4" />
                    </button>
                    <button className="cursor-pointer hover:text-gray-300 transition-colors">
                        <Smile className="h-4 w-4" />
                    </button>
                    <button
                        className={`cursor-pointer transition-colors ${newComment.trim() && !postingComment ? 'text-blue-400 hover:text-blue-300' : 'opacity-50'}`}
                        onClick={handleSendClick}
                        disabled={postingComment || !newComment.trim()}
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CommentInput;