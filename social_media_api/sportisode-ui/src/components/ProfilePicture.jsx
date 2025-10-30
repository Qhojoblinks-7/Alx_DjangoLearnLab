// src/components/ProfilePicture.jsx
import React, { useState } from 'react';
import Avatar from 'avvvatars-react';

const ProfilePicture = ({ username, user, size = 'h-10 w-10', src = null }) => {
    // Extract size value for avvvatars (e.g., 'h-10 w-10' -> 40)
    const sizeValue = size.includes('h-') ? parseInt(size.split('h-')[1].split(' ')[0]) * 4 : 40;

    // Use user ID for unique avatars, fallback to username
    const avatarValue = user?.id ? `user-${user.id}` : (username || 'User');

    // Get profile image source
    const profileImageSrc = src || user?.profile_picture_url || user?.profile_image_url || user?.profile_image;

    const [imageError, setImageError] = useState(false);

    const handleImageError = () => {
        setImageError(true);
    };

    return (
        <div className={`${size} flex-shrink-0 rounded-full overflow-hidden border border-gray-700`}>
            {profileImageSrc && !imageError ? (
                <img
                    src={profileImageSrc}
                    alt={`${username || user?.username || 'User'}'s profile`}
                    className="h-full w-full object-cover"
                    onError={handleImageError}
                />
            ) : (
                <Avatar
                    value={avatarValue}
                    size={sizeValue}
                    style="shape"
                    shadow={false}
                    border={false}
                />
            )}
        </div>
    );
};

export default ProfilePicture;