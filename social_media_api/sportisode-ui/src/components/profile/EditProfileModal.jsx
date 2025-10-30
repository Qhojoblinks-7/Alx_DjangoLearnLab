// src/components/profile/EditProfileModal.jsx
import React, { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { X, Camera } from 'lucide-react';

// Shadcn/ui Imports
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

// API and Hooks
import { updateProfile } from '../lib/api';
import ProfilePicture from '../ProfilePicture';
import { updateProfileField, setProfileImage, clearProfileEditForm, initializeProfileEdit } from '../../store/formsSlice';
import { updateUserProfile } from '../../store/authSlice';

// Utility for image handling (assumed)
// function handleImageChange(e, setFile, setPreview) { ... }

const EditProfileModal = ({ profile, onClose }) => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { profileEdit } = useSelector(state => state.forms);

    // Initialize form with profile data when modal opens
    useEffect(() => {
        if (profile) {
            dispatch(initializeProfileEdit(profile));
        }
    }, [profile, dispatch]);

    const { first_name, last_name, bio, location, website, birthDate, gender, profilePicture, bannerImage, profilePicturePreview, bannerImagePreview } = profileEdit;

    // Mutation hook for API call
    const mutation = useMutation({
        mutationFn: updateProfile,
        onSuccess: (newProfileData) => {
            // 1. Update auth state with new profile data
            dispatch(updateUserProfile(newProfileData));
            // 2. Invalidate profile query to refetch fresh data on the ProfilePage
            queryClient.invalidateQueries({ queryKey: ['userProfile', profile.username] });
            // 3. Clear form state and close modal
            dispatch(clearProfileEditForm());
            console.log('Profile updated successfully!', newProfileData);
            onClose();
        },
        onError: (error) => {
            console.error('Update failed:', error.message);
            alert(`Error: ${error.message}`); // Simple error display
        },
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        dispatch(updateProfileField({ field: name, value }));
    };

    const handleImageChange = (e, imageType) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const preview = URL.createObjectURL(file);
            dispatch(setProfileImage({ type: imageType, file, preview }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const payload = new FormData();

        // Append text fields
        const formData = { first_name, last_name, bio, location, website, birth_date: birthDate, gender };
        Object.entries(formData).forEach(([key, value]) => {
            // Only append if value is present and different from original (optional optimization)
            if (value !== null && value !== undefined && value !== '') {
                  payload.append(key, value);
            }
        });

        // Append files if they exist
        if (profilePicture) {
            payload.append('profile_image', profilePicture);
        }
        if (bannerImage) {
            payload.append('banner_image', bannerImage);
        }

        mutation.mutate(payload);
    };

    // Determine the current image URLs for preview
    const profilePicPreview = profilePicturePreview || profile.profile_picture_url;
    const bannerPreview = bannerImagePreview || profile.banner_url || "https://picsum.photos/600/208?random=1";
    
    return (
        // Modal/Overlay Container (P-EDIT-01)
        <div className="fixed inset-0 z-50 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center">
            <Card className="bg-dark-bg w-[90%] max-w-2xl h-[90%] rounded-xl overflow-hidden flex flex-col">
                
                {/* Modal Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-700 sticky top-0 bg-dark-bg">
                    <div className="flex items-center space-x-4">
                        <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-gray-800">
                            <X className="h-6 w-6 text-white" />
                        </Button>
                        <h2 className="text-xl font-bold">Edit profile</h2>
                    </div>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={mutation.isPending} 
                        className="bg-white text-black rounded-full font-bold hover:bg-gray-200"
                    >
                        {mutation.isPending ? 'Saving...' : 'Save'}
                    </Button>
                </div>

                {/* Modal Body (Form) */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Banner and Profile Picture Upload */}
                        <div className="relative h-48 bg-gray-800/50">
                            {/* Banner Image */}
                            <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
                            
                            {/* Banner Upload Button */}
                            <input 
                                id="banner-upload" 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => handleImageChange(e, 'banner')}
                            />
                            <label 
                                htmlFor="banner-upload" 
                                className="absolute inset-0 flex justify-center items-center bg-black/40 cursor-pointer hover:bg-black/60 transition-colors"
                            >
                                <Camera className="h-8 w-8 text-white" />
                            </label>

                            {/* Profile Picture Upload */}
                            <div className="absolute -bottom-12 left-4">
                                <ProfilePicture user={{ profile_picture_url: profilePicPreview }} size="h-28 w-28" className="border-4 border-dark-bg"/>
                                <input 
                                    id="profile-pic-upload" 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => handleImageChange(e, 'profile')}
                                />
                                <label 
                                    htmlFor="profile-pic-upload" 
                                    className="absolute inset-0 flex justify-center items-center bg-black/40 rounded-full cursor-pointer hover:bg-black/60 transition-colors"
                                    style={{ width: '7rem', height: '7rem' }}
                                >
                                    <Camera className="h-6 w-6 text-white" />
                                </label>
                            </div>
                        </div>

                        {/* Text Fields */}
                        <div className="pt-16 space-y-6">
                            {/* First Name */}
                            <div className="space-y-2">
                                <label htmlFor="first_name" className="text-sm text-gray-400">First Name</label>
                                <Input
                                    id="first_name"
                                    name="first_name"
                                    value={first_name}
                                    onChange={handleChange}
                                    placeholder="First Name"
                                    className="bg-gray-800 border-gray-700 text-white"
                                />
                            </div>

                            {/* Last Name */}
                            <div className="space-y-2">
                                <label htmlFor="last_name" className="text-sm text-gray-400">Last Name</label>
                                <Input
                                    id="last_name"
                                    name="last_name"
                                    value={last_name}
                                    onChange={handleChange}
                                    placeholder="Last Name"
                                    className="bg-gray-800 border-gray-700 text-white"
                                />
                            </div>

                            {/* Bio */}
                            <div className="space-y-2">
                                <label htmlFor="bio" className="text-sm text-gray-400">Bio</label>
                                <Textarea
                                    id="bio"
                                    name="bio"
                                    value={bio}
                                    onChange={handleChange}
                                    maxLength={160}
                                    placeholder="Bio (max 160 characters)"
                                    className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
                                />
                                <span className="text-xs text-gray-500 float-right">{bio.length} / 160</span>
                            </div>

                            {/* Location */}
                            <div className="space-y-2">
                                <label htmlFor="location" className="text-sm text-gray-400">Location</label>
                                <Input 
                                    id="location"
                                    name="location"
                                    value={location}
                                    onChange={handleChange}
                                    placeholder="Location"
                                    className="bg-gray-800 border-gray-700 text-white"
                                />
                            </div>

                            {/* Website */}
                            <div className="space-y-2">
                                <label htmlFor="website" className="text-sm text-gray-400">Website</label>
                                <Input 
                                    id="website"
                                    name="website"
                                    value={website}
                                    onChange={handleChange}
                                    placeholder="Website"
                                    className="bg-gray-800 border-gray-700 text-white"
                                />
                            </div>

                            {/* Birth Date */}
                            <div className="space-y-2">
                                <label htmlFor="birthDate" className="text-sm text-gray-400">Birth Date</label>
                                <Input
                                    id="birthDate"
                                    name="birthDate"
                                    type="date"
                                    value={birthDate}
                                    onChange={handleChange}
                                    className="bg-gray-800 border-gray-700 text-white"
                                />
                            </div>

                            {/* Gender */}
                            <div className="space-y-2">
                                <label htmlFor="gender" className="text-sm text-gray-400">Gender</label>
                                <Select value={gender} onValueChange={(value) => handleChange({ target: { name: 'gender', value } })}>
                                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800 border-gray-700">
                                        <SelectItem value="male" className="text-white">Male</SelectItem>
                                        <SelectItem value="female" className="text-white">Female</SelectItem>
                                        <SelectItem value="other" className="text-white">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </form>
                </div>
            </Card>
        </div>
    );
};

export default EditProfileModal;