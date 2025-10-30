// src/layouts/DetailLayout.jsx
import React from 'react';
import SidebarNav from '../SidebarNav';

/**
 * Desktop layout for detailed pages (Communities, Leagues, Teams, Messaging, Post Detail)
 * where the main content area contains an internal right-hand panel.
 * Features left sidebar navigation only.
 */
const DetailLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-dark-bg">
            <div className="flex min-h-screen max-w-7xl mx-auto">
                {/* Left Sidebar */}
                <SidebarNav />

                {/* Main content area */}
                <main className="flex-1 ml-20">
                    {children}
                </main>

                {/* NO RightSidebar component here */}
            </div>
        </div>
    );
};

export default DetailLayout;