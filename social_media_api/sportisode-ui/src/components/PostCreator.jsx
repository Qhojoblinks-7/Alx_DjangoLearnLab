// src/components/PostCreator.jsx

import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Image, X, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { updatePostContent, addMediaFile, removeMediaFile, clearPostCreationForm, submitPostCreation } from '../store/formsSlice';

import { Textarea } from './components/ui/textarea';
import { Button } from './components/ui/button';
import ProfilePicture from './ProfilePicture';

const MAX_CHARS = 300;
const MAX_MEDIA = 4;

const PostCreator = ({ onClose, editMode = false, postToEdit = null }) => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const user = useSelector(state => state.auth.user);
    const { postCreation } = useSelector(state => state.forms);

    const { content, mediaFiles, mediaPreviews, uploads, isSubmitting, submitError } = postCreation;

    // Handle edit mode initialization
    React.useEffect(() => {
        if (editMode && postToEdit) {
            console.log('Initializing edit mode for post:', postToEdit);
            // Pre-populate form with existing post data
            dispatch(updatePostContent(postToEdit.content || ''));
            // Handle existing media files if needed
            handleExistingMediaFiles(postToEdit);
        }
    }, [editMode, postToEdit, dispatch]);

    const handleExistingMediaFiles = async (post) => {
        // Clear any existing media files first
        dispatch(clearPostCreationForm());

        // If the post has media, we need to handle it
        if (post.media_file) {
            console.log('Post has existing media:', post.media_file);

            try {
                // Get the media URL for the full size
                const mediaUrl = post.media_file.get_url_for_size ? post.media_file.get_url_for_size('full') : post.media_file.url;

                if (mediaUrl) {
                    // Download the media file
                    const response = await fetch(mediaUrl);
                    const blob = await response.blob();

                    // Create a File object from the blob
                    const fileName = post.media_file.file_name || `media_${post.id}.${post.media_file.mime_type.split('/')[1]}`;
                    const file = new File([blob], fileName, { type: post.media_file.mime_type });

                    // Create preview
                    const preview = {
                        url: URL.createObjectURL(file),
                        type: post.media_file.media_type
                    };

                    // Add to Redux store
                    dispatch(addMediaFile({ file, preview }));

                    console.log('Successfully loaded existing media file for editing');
                }
            } catch (error) {
                console.error('Failed to load existing media file:', error);
                // Show user-friendly message
                alert('Note: Existing media files cannot be edited at this time. You can add new media or edit just the text.');
            }
        }

        // If the post has legacy media fields (image/video), handle those too
        if (post.image || post.video) {
            console.log('Post has legacy media:', { image: post.image, video: post.video });

            try {
                const mediaUrl = post.image || post.video;
                const response = await fetch(mediaUrl);
                const blob = await response.blob();

                // Determine file type and create File object
                const isVideo = post.video;
                const mimeType = isVideo ? 'video/mp4' : 'image/jpeg';
                const fileName = `legacy_media_${post.id}.${isVideo ? 'mp4' : 'jpg'}`;
                const file = new File([blob], fileName, { type: mimeType });

                // Create preview
                const preview = {
                    url: URL.createObjectURL(file),
                    type: isVideo ? 'video' : 'image'
                };

                // Add to Redux store
                dispatch(addMediaFile({ file, preview }));

                console.log('Successfully loaded legacy media file for editing');
            } catch (error) {
                console.error('Failed to load legacy media file:', error);
                alert('Note: Existing media files cannot be edited at this time. You can add new media or edit just the text.');
            }
        }
    };

    // Handle successful post creation (only for create mode)
    React.useEffect(() => {
        console.log('PostCreator useEffect check:', {
            editMode,
            isSubmitting,
            submitError,
            content: content.length,
            mediaFilesLength: mediaFiles.length,
            condition: !editMode && !isSubmitting && !submitError && content === '' && mediaFiles.length === 0
        });

        // Only close if we were actually submitting and now we're done
        if (!editMode && !isSubmitting && !submitError && content === '' && mediaFiles.length === 0) {
            // Check if we just finished submitting (look for evidence of recent submission)
            const wasSubmitting = localStorage.getItem('postCreatorWasSubmitting');
            if (wasSubmitting === 'true') {
                console.log('PostCreator: Closing modal after successful post creation');
                localStorage.removeItem('postCreatorWasSubmitting');
                // Post was successfully created and form was cleared
                // Invalidate all relevant queries to refresh feeds
                queryClient.invalidateQueries({ queryKey: ['homeFeed'] });
                queryClient.invalidateQueries({ queryKey: ['feed-timeline'] });
                queryClient.invalidateQueries({ queryKey: ['communityFeed'] });
                queryClient.invalidateQueries({ queryKey: ['user-posts'] });
                queryClient.invalidateQueries({ queryKey: ['user-replies'] });
                queryClient.invalidateQueries({ queryKey: ['user-likes'] });

                onClose();
            } else {
                console.log('PostCreator: Form is empty but no recent submission detected - not closing modal');
            }
        }
    }, [editMode, isSubmitting, submitError, content, mediaFiles.length, queryClient, onClose]);

    const handleMediaChange = (e) => {
        const files = Array.from(e.target.files);

        if (mediaFiles.length + files.length > MAX_MEDIA) {
            alert(`You can only upload up to ${MAX_MEDIA} media files.`);
            return;
        }

        // Validate file types (images and videos)
        const validFiles = files.filter(file =>
            file.type.startsWith('image/') || file.type.startsWith('video/')
        );

        if (validFiles.length !== files.length) {
            alert('Only image and video files are supported.');
            return;
        }

        // Add files with previews to Redux state
        validFiles.forEach(file => {
            const preview = {
                url: URL.createObjectURL(file),
                type: file.type.startsWith('video/') ? 'video' : 'image'
            };
            dispatch(addMediaFile({ file, preview }));
        });
    };

    const removeMedia = (index) => {
        // Revoke the object URL to free memory
        URL.revokeObjectURL(mediaPreviews[index]);

        dispatch(removeMediaFile(index));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const trimmedContent = content.trim();
        if (trimmedContent.length === 0 && mediaFiles.length === 0) {
            alert("A post cannot be empty.");
            return;
        }

        if (editMode && postToEdit) {
            // Handle post editing
            handleEditPost(trimmedContent);
        } else {
            // Mark that we're starting a submission
            localStorage.setItem('postCreatorWasSubmitting', 'true');
            console.log('PostCreator: Starting post creation submission');
            // Dispatch the Redux thunk for post creation
            dispatch(submitPostCreation({
                content: trimmedContent,
                mediaFiles: mediaFiles
            }));
        }
    };

    const handleEditPost = async (newContent) => {
        try {
            // Get auth token from Redux store or localStorage
            const token = localStorage.getItem('authToken') || user?.token;

            const response = await fetch(`http://localhost:8000/posts/${postToEdit.id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Token ${token}` : '',
                },
                body: JSON.stringify({
                    content: newContent,
                    title: postToEdit.title // Keep existing title
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Post updated successfully:', result);
                alert('Post updated successfully!');
                onClose();
            } else {
                let errorMessage = 'Unknown error';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.detail || 'Unknown error';
                } catch (parseError) {
                    console.error('Failed to parse error response:', parseError);
                }
                alert(`Failed to update post: ${errorMessage}`);
            }
        } catch (error) {
            console.error('Error updating post:', error);
            alert('Failed to update post. Please try again.');
        }
    };

    const isButtonDisabled = isSubmitting || (content.trim().length === 0 && mediaFiles.length === 0) || content.length > MAX_CHARS;

    return (
        <div className="p-4">
            <div className="flex space-x-3">
                <ProfilePicture user={user} size="h-10 w-10" />

                <div className="flex-1">
                    {/* Text Area for Content: Supports multi-line input for tags/hashtags */}
                    <Textarea
                        value={content}
                        onChange={(e) => dispatch(updatePostContent(e.target.value))}
                        placeholder={editMode ? "Edit your post content..." : "What's happening in sports? (e.g., #GHPL, tagging @axeltokam)"}
                        maxLength={MAX_CHARS}
                        className="bg-transparent border-none focus-visible:ring-0 text-xl resize-none text-white min-h-[150px] leading-relaxed" // Increased min-height and leading
                        rows={6} // Increased rows
                        autoFocus={editMode} // Auto-focus in edit mode
                    />

                    {/* Media Preview Area */}
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        {mediaPreviews.map((preview, index) => {
                            const upload = uploads[index] || {};
                            const getStatusIcon = () => {
                                switch (upload.status) {
                                    case 'uploading':
                                        return <Upload className="h-4 w-4 text-blue-500 animate-pulse" />;
                                    case 'completed':
                                        return <CheckCircle className="h-4 w-4 text-green-500" />;
                                    case 'failed':
                                        return <AlertCircle className="h-4 w-4 text-red-500" />;
                                    default:
                                        return null;
                                }
                            };

                            return (
                                <div key={index} className="relative aspect-video rounded-xl overflow-hidden bg-black">
                                    {preview.type === 'video' ? (
                                        <video
                                            src={preview.url}
                                            className="w-full h-full object-cover"
                                            controls
                                        />
                                    ) : (
                                        <img
                                            src={preview.url}
                                            alt={`Preview ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    )}

                                    {/* Upload Status Overlay */}
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                        {getStatusIcon()}
                                        {upload.status === 'uploading' && (
                                            <div className="ml-2 text-white text-xs">
                                                {upload.progress}%
                                            </div>
                                        )}
                                        {upload.error && (
                                            <div className="ml-2 text-red-400 text-xs max-w-full truncate">
                                                {upload.error}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => removeMedia(index)}
                                        className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Footer Bar */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-700 mt-4">
                {/* Left: Action Buttons (Media upload) */}
                <div className="flex items-center space-x-4">
                    <label htmlFor="media-upload" className="cursor-pointer">
                        <Image className="h-5 w-5 text-sport-accent hover:text-sport-accent/80 transition-colors" />
                        <input
                            id="media-upload"
                            type="file"
                            multiple
                            accept="image/*,video/*"
                            onChange={handleMediaChange}
                            className="hidden"
                            disabled={mediaFiles.length >= MAX_MEDIA}
                        />
                    </label>
                    <span className="text-sm text-gray-500">
                        {mediaFiles.length}/{MAX_MEDIA} images
                    </span>
                </div>

                {/* Right: Char Counter and Post Button */}
                <div className="flex items-center space-x-4">
                    <span className={`text-sm ${content.length > MAX_CHARS ? 'text-red-500' : 'text-gray-500'}`}>
                        {MAX_CHARS - content.length}
                    </span>
                    <Button
                        onClick={handleSubmit}
                        disabled={isButtonDisabled}
                        className={`rounded-full font-bold px-4 py-2 ${isButtonDisabled ? 'bg-sport-accent/50 cursor-not-allowed' : 'bg-sport-accent text-black hover:bg-sport-accent/90'}`}
                    >
                        {editMode ? 'Update' : 'Post'}
                    </Button>
                </div>
            </div>
            {submitError && <p className="text-red-500 text-sm mt-2">Could not post: {submitError.non_field_errors?.[0] || 'An error occurred'}</p>}
        </div>
    );
};

export default PostCreator;