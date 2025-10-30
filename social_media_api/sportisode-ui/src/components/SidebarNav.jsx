import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, Bell, Mail, Users, User, Feather, Video, X } from 'lucide-react';
import NavIcon from './NavIcon';
import ProfilePicture from './ProfilePicture';
import { logout } from '@/store/authSlice';
import { useDispatch, useSelector } from 'react-redux';
import { authenticatedFetch } from './lib/api';
import { setUnreadCount } from '@/store/notificationsSlice';
import { setActiveModal } from '@/store/liveStreamSlice';

// Shadcn/ui Imports
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../components/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/components/ui/dialog'; // For Post Creator Modal
import PostCreator from './PostCreator';
import LiveStreamCreator from './LiveStreamCreator';

const SidebarNav = ({ isMobile = false, onClose = () => {} }) => {
    const dispatch = useDispatch();
    const user = useSelector(state => state.auth.user);
    const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
    const notificationCount = useSelector(state => state.notifications.unreadCount);
    const activeModal = useSelector(state => state.liveStream.activeModal);

    const [userProfile, setUserProfile] = useState(null);
    const [isPostCreatorOpen, setIsPostCreatorOpen] = useState(false);

    // Fetch user profile and notification count on mount and when authenticated
    useEffect(() => {
        const fetchUserData = async () => {
            if (isAuthenticated && user) {
                try {
                    // Fetch user profile
                    console.log('SidebarNav: Fetching /accounts/profile/');
                    const profileResponse = await authenticatedFetch('/accounts/profile/');
                    console.log('SidebarNav: Profile response status:', profileResponse.status);
                    if (profileResponse.ok) {
                        const profileData = await profileResponse.json();
                        console.log('SidebarNav: Profile data:', profileData);
                        setUserProfile(profileData);
                    } else {
                        console.error('Profile fetch failed:', profileResponse.status);
                        const errorText = await profileResponse.text();
                        console.error('Profile error response:', errorText.substring(0, 200));
                    }

                    // Fetch unread notification count
                    console.log('SidebarNav: Fetching /notifications/unread_count/');
                    const notificationResponse = await authenticatedFetch('/notifications/unread_count/');
                    console.log('SidebarNav: Notifications response status:', notificationResponse.status);
                    if (notificationResponse.ok) {
                        const notificationData = await notificationResponse.json();
                        console.log('SidebarNav: Notifications data:', notificationData);
                        dispatch(setUnreadCount(notificationData.unread_count));
                    } else {
                        console.error('Notifications fetch failed:', notificationResponse.status);
                        const errorText = await notificationResponse.text();
                        console.error('Notifications error response:', errorText.substring(0, 200));
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
            }
        };

        fetchUserData();
    }, [isAuthenticated, user]);


    const handleLogout = async () => {
        try {
            const response = await authenticatedFetch('/accounts/logout/', {
                method: 'POST',
            });
            if (response.ok) {
                dispatch(logout());
                dispatch(setUnreadCount(0));
                setUserProfile(null);
            }
        } catch (error) {
            console.error('Logout error:', error);
            // Fallback: logout anyway
            dispatch(logout());
            dispatch(setUnreadCount(0));
            setUserProfile(null);
        }
    };

    // Handle navigation clicks for mobile
    const handleNavClick = (href) => {
        if (isMobile && onClose) {
            onClose();
        }
        // Navigation will be handled by React Router Link
    };

    return (
        // Mobile: vertical list, Desktop: Fixed positioning
        <div className={`${isMobile ? 'w-full' : 'fixed top-0 left-0 h-screen hidden lg:flex flex-col items-end py-2 px-2 border-r w-40 border-gray-700'}`}>
            
            {/* 1. X Logo */}
            <Link to="/" className="p-3 mb-2 hover:bg-gray-800/50 rounded-full transition-colors">
                <X className="h-12 w-12 text-gray-100" />
            </Link>

            {/* 2. Navigation Icons (From image) */}
            <div className={`${isMobile ? 'space-y-4' : 'space-y-1'}`}>
                <NavIcon icon={Home} label="Home" href="/" onClick={isMobile ? onClose : undefined} />
                <NavIcon icon={Search} label="Search" href="/search" onClick={isMobile ? onClose : undefined} />
                {/* Notification Icon with Badge */}
                <NavIcon icon={Bell} label="Notifications" href="/notifications" count={notificationCount} onClick={isMobile ? onClose : undefined} />
                <NavIcon icon={Mail} label="Messages" href="/messages" onClick={isMobile ? onClose : undefined} />
                <NavIcon icon={Users} label="Communities" href="/communities" onClick={isMobile ? onClose : undefined} />
                <NavIcon icon={User} label="Profile" href={`/${user?.username}`} onClick={isMobile ? onClose : undefined} />
            </div>

            {/* 3. Post Creator Button */}
            <div className="mt-4 space-y-2">
                <NavIcon
                    icon={Feather}
                    label="Post"
                    onClick={() => {
                        console.log('Create Post button clicked in sidebar - opening modal');
                        console.log('Current modal state:', isPostCreatorOpen);
                        setIsPostCreatorOpen(true);
                        console.log('Modal state after setting:', true);
                    }}
                    isTweetButton={true}
                />
                <NavIcon
                    icon={Video}
                    label="Go Live"
                    onClick={() => dispatch(setActiveModal('create'))}
                    isTweetButton={true}
                />
            </div>
            
            {/* 4. Profile Dropdown (Bottom) */}
            <div className="mt-auto mb-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="hover:bg-gray-800/50 p-2 rounded-full transition-colors focus:outline-none">
                            <ProfilePicture user={userProfile || user} size="h-12 w-12" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" align="center" className="w-64 bg-dark-card border-gray-700 p-2">
                        <DropdownMenuItem disabled>
                            Signed in as @{userProfile?.username || user?.username}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-gray-700" />
                        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-400 focus:bg-gray-800 focus:text-red-400">
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            
            {/* 5. Post Creator Modal (Dialog) */}
            <Dialog open={isPostCreatorOpen} onOpenChange={setIsPostCreatorOpen}>
                <DialogContent className="sm:max-w-[600px] bg-dark-card border-gray-700 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-white">Create New Sportisode</DialogTitle>
                    </DialogHeader>
                    <PostCreator onClose={() => setIsPostCreatorOpen(false)} />
                </DialogContent>
            </Dialog>

            {/* 6. Live Stream Creator Modal (Dialog) */}
            <Dialog open={activeModal === 'create'} onOpenChange={(open) => !open && dispatch(setActiveModal(null))}>
                <DialogContent className="sm:max-w-[600px] bg-dark-card border-gray-700 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-white">Create Live Stream</DialogTitle>
                    </DialogHeader>
                    <LiveStreamCreator onClose={() => dispatch(setActiveModal(null))} />
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SidebarNav;