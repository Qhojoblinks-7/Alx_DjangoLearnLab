// src/components/profile/ProfileHeader.jsx
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Calendar, Verified, Globe } from 'lucide-react';

import { Button } from '../components/ui/button';
import ProfilePicture from '../ProfilePicture';
import { toggleFollow } from '../lib/api';
// Assuming formatDate utility is available
import { formatDate } from '../lib/utils';
import EditProfileModal from './EditProfileModal';

// --- Sub-component: Follow/Edit Button ---
const ProfileActionButton = ({ profile, isCurrentUser, queryClient, onEditClick }) => {
    const mutation = useMutation({
        mutationFn: () => toggleFollow(profile.username),
        onSuccess: () => {
            // Invalidate to refetch the profile and update the button state
            queryClient.invalidateQueries({ queryKey: ['userProfile', profile.username] });
        }
    });

    if (isCurrentUser) {
        return (
            <Button
                onClick={onEditClick}
                variant="outline"
                className="rounded-full font-bold px-4 py-2 text-white border-gray-700 hover:bg-gray-800/50"
            >
                Edit profile
            </Button>
        );
    }

    const isFollowing = profile.is_following;
    return (
        <Button 
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            variant={isFollowing ? 'outline' : 'default'}
            className={`rounded-full font-bold px-4 py-2 transition-all duration-200
                ${isFollowing 
                    ? 'border-gray-500 text-white hover:bg-red-500 hover:border-red-500 hover:text-white' 
                    : 'bg-sport-accent text-black hover:bg-sport-accent/90'
                }`}
        >
            {mutation.isPending ? '...' : (isFollowing ? 'Following' : 'Follow')}
        </Button>
    );
};


// --- Main Profile Header Component ---
const ProfileHeader = ({ profile, isCurrentUser, queryClient }) => {
    const [showEditModal, setShowEditModal] = useState(false);

    const handleEditClick = () => {
        setShowEditModal(true);
    };

    const handleCloseModal = () => {
        setShowEditModal(false);
    };

    return (
        <>
            {/* Banner Image Area */}
            <div className="relative">
                <div className="h-52 bg-gray-800/50">
                    <img
                        src={profile.banner_url || "https://picsum.photos/600/208?random=1"}
                        alt="Profile Banner"
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Profile Picture and Action Button */}
                <div className="absolute -bottom-16 left-4 flex justify-between w-[calc(100%-32px)]">
                    <ProfilePicture user={profile} size="h-32 w-32" />
                    <div className="mt-4">
                        <ProfileActionButton
                            profile={profile}
                            isCurrentUser={isCurrentUser}
                            queryClient={queryClient}
                            onEditClick={handleEditClick}
                        />
                    </div>
                </div>
            </div>

            {/* Profile Info */}
            <div className="pt-20 px-4 pb-4">
                <h2 className="text-2xl font-bold text-white flex items-center">
                    {profile.name}
                    {profile.is_verified && <Verified className="h-5 w-5 ml-2 text-sport-accent"/>}
                </h2>
                <p className="text-gray-500">@{profile.username}</p>

                <p className="text-white mt-3">{profile.bio || 'No bio yet.'}</p>

                {/* Metadata */}
                <div className="flex items-center space-x-4 text-gray-500 text-sm mt-2">
                    {profile.location && (
                        <span className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1"/>
                            {profile.location}
                        </span>
                    )}
                    {profile.website && (
                        <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="flex items-center hover:text-blue-400">
                            <Globe className="h-4 w-4 mr-1"/>
                            {profile.website}
                        </a>
                    )}
                    {profile.birth_date && (
                        <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1"/>
                             {formatDate(profile.birth_date, 'MMM DD, YYYY')}
                        </span>
                    )}
                    {profile.join_date && (
                        <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1"/>
                            Joined {formatDate(profile.join_date, 'MMM YYYY')}
                        </span>
                    )}
                </div>

                {/* Following/Followers */}
                <div className="flex space-x-4 mt-2 text-white text-sm">
                    <span className="cursor-pointer hover:underline">
                        <span className="font-bold">{profile.following_count || 0}</span> Following
                    </span>
                    <span className="cursor-pointer hover:underline">
                        <span className="font-bold">{profile.followers_count || 0}</span> Followers
                    </span>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {showEditModal && (
                <EditProfileModal
                    profile={profile}
                    onClose={handleCloseModal}
                />
            )}
        </>
    );
};

export default ProfileHeader;