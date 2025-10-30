// src/components/PostMedia.jsx
import React from 'react';

// Enhanced media component supporting processed images and videos
const PostMedia = ({ post, size = 'preview', isMobile = false }) => {
    const {
        media_url,
        thumbnail_url,
        preview_url,
        is_media_processed,
        media_type,
        video,
        image
    } = post;

    const handleMediaClick = () => {
        console.log(`${isMobile ? 'Mobile' : 'Desktop'} Media clicked for post:`, post.id);
        // Record media view when user clicks on media
        fetch(`/posts/${post.id}/view/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'Content-Type': 'application/json',
            },
        }).then(() => {
            console.log('Media view recorded successfully for post:', post.id);
        }).catch(err => {
            console.warn('Failed to record media view:', err);
        });
    };

    // Use processed media if available, fallback to original
    let mediaSrc = null;
    if (is_media_processed) {
        if (size === 'thumbnail' && thumbnail_url) {
            mediaSrc = thumbnail_url;
        } else if (size === 'preview' && preview_url) {
            mediaSrc = preview_url;
        } else if (media_url) {
            mediaSrc = media_url; // Fallback to full URL if specific size not available
        }
    } else {
        mediaSrc = video || image;
    }

    // If we still don't have a mediaSrc but have media_url, use it as fallback
    if (!mediaSrc && media_url) {
        console.log('PostMedia: Using media_url as fallback for size:', size);
        mediaSrc = media_url;
    }

    console.log('PostMedia: Debug info', {
        postId: post.id,
        media_url,
        thumbnail_url,
        preview_url,
        is_media_processed,
        media_type,
        video,
        image,
        mediaSrc,
        size,
        sizeCheck: size === 'thumbnail' ? 'thumbnail' : size === 'preview' ? 'preview' : 'full'
    });

    // For debugging - show what we're rendering
    if (mediaSrc) {
        console.log('PostMedia: Will render media with src:', mediaSrc, 'type:', media_type || (video ? 'video' : image ? 'image' : 'unknown'));
    } else {
        console.log('PostMedia: No mediaSrc found, returning null. Checking components:', {
            is_media_processed,
            size,
            thumbnail_url: !!thumbnail_url,
            preview_url: !!preview_url,
            media_url: !!media_url,
            video: !!video,
            image: !!image
        });
    }

    if (!mediaSrc) {
        console.log('PostMedia: No mediaSrc, returning null');
        return null;
    }

    // Unified class for media container to match the post image
    const mediaClass = "w-full aspect-video md:aspect-[3/1] bg-gray-900 flex items-center justify-center rounded-xl overflow-hidden mt-3 border border-gray-700/50";
    const mediaImageClass = "w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity duration-300";

    // Determine media type more robustly
    const isVideo = media_type === 'video' || video || (mediaSrc && (mediaSrc.includes('.mp4') || mediaSrc.includes('.mov') || mediaSrc.includes('.avi') || mediaSrc.includes('.mkv')));
    const isImage = media_type === 'image' || image || (mediaSrc && (mediaSrc.includes('.jpg') || mediaSrc.includes('.jpeg') || mediaSrc.includes('.png') || mediaSrc.includes('.gif') || mediaSrc.includes('.webp')));

    console.log('PostMedia: Media type detection', { isVideo, isImage, media_type, video, image, mediaSrc });

    // If we have a media source but can't determine type, assume it's an image
    const hasMedia = mediaSrc && (isVideo || isImage || media_type || video || image);
    console.log('PostMedia: hasMedia check:', { hasMedia, mediaSrc: !!mediaSrc, isVideo, isImage, media_type, video, image });

    if (!hasMedia && mediaSrc) {
        console.log('PostMedia: Forcing image display for unknown media type with src:', mediaSrc);
        return (
            <div className={mediaClass}>
                <img
                    src={mediaSrc}
                    alt="Post media"
                    className={mediaImageClass}
                    onClick={handleMediaClick}
                    loading="lazy"
                    onError={(e) => console.error('PostMedia: Image failed to load:', mediaSrc, e)}
                />
            </div>
        );
    }

    if (isVideo) {
        return (
            <div
                className={mediaClass + " cursor-pointer hover:opacity-90"}
                onClick={handleMediaClick}
            >
                {is_media_processed ? (
                    <video
                        src={mediaSrc}
                        className={mediaImageClass}
                        controls
                        poster={thumbnail_url}
                        preload="metadata"
                    />
                ) : (
                    <p className="text-secondary-text text-sm sm:text-base">Click to view media</p>
                )}
            </div>
        );
    }

    if (isImage) {
        console.log('PostMedia: Rendering image with src:', mediaSrc);
        return (
            <div className={mediaClass}>
                <img
                    src={mediaSrc}
                    alt="Post media"
                    className={mediaImageClass}
                    onClick={handleMediaClick}
                    loading="lazy"
                    onError={(e) => console.error('PostMedia: Image failed to load:', mediaSrc, e)}
                />
            </div>
        );
    }

    console.log('PostMedia: No matching media type found, returning null');
    return null;
};

export default PostMedia;