// src/layouts/MainLayout.jsx (Mobile-First Global Layout with Bottom Nav)
import React, { useState } from 'react';
import SidebarNav from '../SidebarNav';
import RightSidebar from '../RightSidebar';
import BottomNavBar from '../BottomNavBar';
import MobileHeader from '../MobileHeader';
import ProfileDrawer from '../ProfileDrawer';
import MobileFloatingMenu from '../MobileFloatingMenu';

/**
 * Mobile-first layout for global feeds (Home, Explore, Notifications, Profile)
 * Features bottom navigation bar, fixed header, and slide-out profile drawer.
 */
const MainLayout = ({ children }) => {
    const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);

    const handleProfileClick = () => {
        setIsProfileDrawerOpen(true);
    };

    const handleSettingsClick = () => {
        // Handle settings click - could open settings drawer or navigate
        console.log('Settings clicked');
    };

    return (
        <div className="min-h-screen bg-dark-bg">
            {/* Mobile Header */}
            <MobileHeader
                onProfileClick={handleProfileClick}
                onSettingsClick={handleSettingsClick}
            />

            {/* Profile Drawer */}
            <ProfileDrawer
                isOpen={isProfileDrawerOpen}
                onClose={() => setIsProfileDrawerOpen(false)}
            />

            <div className="flex min-h-screen lg:max-w-[75rem] mx-auto pt-16 lg:pt-0 pb-16 lg:pb-0">
                {/* Desktop Left Sidebar */}
                <div className="hidden lg:block">
                    <SidebarNav />
                </div>

                {/* Main content area */}
                <main className="flex-1 lg:ml-20 px-4 lg:px-0 overflow-y-auto h-screen">
                    {children}
                </main>

                {/* Desktop Right Sidebar */}
                <div className="hidden xl:block">
                    <RightSidebar />
                </div>

                {/* Mobile Right Sidebar Toggle - Now handled by MobileFloatingMenu */}
            </div>

            {/* Mobile Floating Menu */}
            <MobileFloatingMenu />

            {/* Bottom Navigation Bar */}
            <BottomNavBar />
        </div>
    );
};

export default MainLayout;