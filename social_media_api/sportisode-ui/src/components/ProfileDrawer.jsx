// src/components/ProfileDrawer.jsx
import React, { useState, useEffect } from 'react';
import { X, Crown, Bookmark, DollarSign, Settings, LogOut, User } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import ProfilePicture from './ProfilePicture';
import { authenticatedFetch } from './lib/api';

const ProfileDrawer = ({ isOpen, onClose }) => {
    const dispatch = useDispatch();
    const user = useSelector(state => state.auth.user);
    const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
    const [userProfile, setUserProfile] = useState(null);

    // Fetch detailed user profile data when drawer opens
    useEffect(() => {
        const fetchUserProfile = async () => {
            if (isAuthenticated && user && isOpen) {
                try {
                    console.log('ProfileDrawer: Fetching user profile');
                    const response = await authenticatedFetch('/accounts/profile/');
                    if (response.ok) {
                        const profileData = await response.json();
                        console.log('ProfileDrawer: Profile data received', profileData);
                        setUserProfile(profileData);
                    } else {
                        console.error('ProfileDrawer: Profile fetch failed', response.status);
                    }
                } catch (error) {
                    console.error('ProfileDrawer: Error fetching profile', error);
                }
            }
        };

        fetchUserProfile();
    }, [isAuthenticated, user, isOpen]);

    const handleLogout = () => {
        dispatch({ type: 'auth/logout' });
        onClose();
    };

    const menuItems = [
        {
            icon: User,
            label: 'Profile',
            href: `/${user?.username}`,
            action: () => {
                // Navigate to profile
                window.location.href = `/${user?.username}`;
                onClose();
            }
        },
        {
            icon: Bookmark,
            label: 'Bookmarks',
            href: '/bookmarks',
            action: () => {
                // Navigate to bookmarks
                onClose();
            }
        },
        {
            icon: DollarSign,
            label: 'Monetization',
            href: '/monetization',
            action: () => {
                // Navigate to monetization settings
                onClose();
            }
        },
        {
            icon: Settings,
            label: 'Settings',
            href: '/settings',
            action: () => {
                // Navigate to settings
                onClose();
            }
        }
    ];

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Drawer */}
            <div className={`fixed left-0 top-0 h-full w-80 backdrop-blur-sm border-r border-gray-700 transform transition-transform duration-300 ease-in-out z-[60] ${
                isOpen ? 'translate-x-0' : '-translate-x-full'
            }`} style={{ backgroundColor: 'var(--primary-bg)' }}>

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h2 className="text-lg font-semibold text-white">Profile</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-400" />
                    </button>
                </div>

                {/* Profile Section */}
                <div className="p-4 border-b border-gray-700">
                    {isAuthenticated && user ? (
                        <div className="flex items-center space-x-3">
                            <ProfilePicture
                                user={userProfile || user}
                                size="h-16 w-16"
                                className="ring-2 ring-sport-accent/50"
                            />
                            <div>
                                <h3 className="text-lg font-bold text-white">
                                    {userProfile?.name || `${userProfile?.first_name || ''} ${userProfile?.last_name || ''}`.trim() || user.username}
                                </h3>
                                <p className="text-gray-400 text-sm">@{userProfile?.username || user.username}</p>
                                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                                    <span>{userProfile?.following_count || 0} Following</span>
                                    <span>{userProfile?.followers_count || 0} Followers</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="h-16 w-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <User className="h-8 w-8 text-gray-400" />
                            </div>
                            <p className="text-gray-400">Not signed in</p>
                        </div>
                    )}
                </div>

                {/* Premium Upgrade Section */}
                <div className="p-4 border-b border-gray-700">
                    <div className="bg-gradient-to-r from-sport-accent/20 to-sport-accent/10 rounded-lg p-4 border border-sport-accent/30">
                        <div className="flex items-center space-x-3 mb-3">
                            <Crown className="h-6 w-6 text-sport-accent" />
                            <h4 className="text-lg font-semibold text-white">Upgrade to Premium</h4>
                        </div>
                        <p className="text-gray-300 text-sm mb-3">
                            Unlock exclusive features and support the platform
                        </p>
                        <button className="w-full bg-sport-accent hover:bg-accent-hover text-black font-bold py-2 px-4 rounded-lg transition-colors">
                            Upgrade Now
                        </button>
                    </div>
                </div>

                {/* Menu Items */}
                <div className="flex-1 p-4">
                    <nav className="space-y-2">
                        {menuItems.map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={index}
                                    onClick={item.action}
                                    className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-800/50 transition-colors text-left"
                                >
                                    <Icon className="h-5 w-5 text-gray-400" />
                                    <span className="text-white font-medium">{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Logout Section */}
                {isAuthenticated && (
                    <div className="p-4 border-t border-gray-700">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-red-900/20 text-red-400 hover:text-red-300 transition-colors"
                        >
                            <LogOut className="h-5 w-5" />
                            <span className="font-medium">Log out</span>
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default ProfileDrawer;