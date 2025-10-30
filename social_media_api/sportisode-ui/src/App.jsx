// src/App.jsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useWebSocket } from './hooks/useWebSocket';
import { setUnreadCount, incrementUnreadCount } from './store/notificationsSlice';
import { useDispatch } from 'react-redux';

// --- Page Imports (Paths adjusted to standard src/pages) ---
import Login from './components/Page/Login';
import Register from './components/Page/Register';
import Feed from './components/Page/Feed';
import ExplorePage from './components/Page/ExplorePage';
import SearchPage from './components/Page/SearchPage';
import LeaguesPage from './components/Page/LeaguesPage';
import TeamsPage from './components/Page/TeamsPage';
import NotificationsPage from './components/Page/NotificationsPage';
import MessagingPage from './components/Page/MessagingPage';
import CommunityPage from './components/Page/CommunityPage';
import CommunityPostDetail from './components/Page/CommunityPostDetail';
import StreamPage from './components/Page/StreamPage';
import ProfilePage from './components/Page/ProfilePage';
import DiscoverPage from './components/Page/DiscoverPage';

// --- Mobile Page Imports ---
import MobileFeed from './components/Page/mobile/MobileFeed';
import MobileExplorePage from './components/Page/mobile/MobileExplorePage';
import MobileMessagingPage from './components/Page/mobile/MobileMessagingPage';
import MobileCommunityPage from './components/Page/mobile/MobileCommunityPage';
import MobileNotificationsPage from './components/Page/mobile/MobileNotificationsPage';
import MobileLeaguesPage from './components/Page/mobile/MobileLeaguesPage';
import MobileTeamsPage from './components/Page/mobile/MobileTeamsPage';
import MobileProfilePage from './components/Page/mobile/MobileProfilePage';
import MobileCommunityPostDetail from './components/Page/mobile/MobileCommunityPostDetail';

// --- Layout Imports ---
import MainLayout from './components/layouts/MainLayout';  // Desktop Layout
import DetailLayout from './components/layouts/DetailLayout';  // Desktop Layout

// --- Responsive Component Wrapper ---
const ResponsivePage = ({ desktop: DesktopComponent, mobile: MobileComponent, layout: LayoutComponent, ...props }) => {
    return (
        <>
            {/* Desktop Version */}
            <div className="hidden lg:block">
                {LayoutComponent ? (
                    <LayoutComponent>
                        <DesktopComponent {...props} />
                    </LayoutComponent>
                ) : (
                    <DesktopComponent {...props} />
                )}
            </div>

            {/* Mobile Version */}
            <div className="lg:hidden">
                <MobileComponent {...props} />
            </div>
        </>
    );
};

// Authentication Guard Component
const AuthGuard = ({ children }) => {
    const dispatch = useDispatch();
    const { isAuthenticated, loading, user } = useSelector(state => state.auth);

    // WebSocket connection for real-time notifications
    const handleWsMessage = (message) => {
        console.log('WebSocket message received:', message);
        if (message.data && message.data.type === 'unread_count_update') {
            console.log('Updating unread count to:', message.data.unread_count);
            // Update notification count when notifications are marked as read
            dispatch(setUnreadCount(message.data.unread_count));
            console.log('Unread count updated in Redux');
        } else if (message.event_type === 'new_notification') {
            // Increment notification count when new notification arrives
            dispatch(incrementUnreadCount());
            console.log('Incremented unread count for new notification');
        }
    };

    // Connect to notifications WebSocket if authenticated and user is available
    useWebSocket(isAuthenticated && user ? '/notifications/' : null, handleWsMessage);

    // Show loading spinner while checking authentication
    if (loading === 'pending') {
        return (
            <div className="min-h-screen bg-dark-bg text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // If authenticated, render the protected content
    return children;
};

function App() {

    return (
        <div className="min-h-screen bg-dark-bg text-white">
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* ------------------ Protected Routes ------------------ */}
                <Route path="/*" element={
                    <AuthGuard>
                        <Routes>
                            {/* FULL LAYOUT (Home, Explore, Notifications, Profile) */}
                            <Route path="/" element={
                                <ResponsivePage
                                    desktop={Feed}
                                    mobile={MobileFeed}
                                    layout={MainLayout}
                                />
                            } />
                            <Route path="/explore" element={
                                <ResponsivePage
                                    desktop={ExplorePage}
                                    mobile={MobileExplorePage}
                                    layout={MainLayout}
                                />
                            } />
                            <Route path="/search" element={
                                <SearchPage />
                            } />
                            <Route path="/discover" element={
                                <DiscoverPage />
                            } />
                            <Route path="/notifications" element={
                                <ResponsivePage
                                    desktop={NotificationsPage}
                                    mobile={MobileNotificationsPage}
                                    layout={MainLayout}
                                />
                            } />

                            {/* DETAIL LAYOUT (Specific Pages with Internal Sidebars) */}
                            {/* Leagues and Teams - They typically feature their own sidebar of feed items */}
                            <Route path="/leagues" element={
                                <ResponsivePage
                                    desktop={LeaguesPage}
                                    mobile={MobileLeaguesPage}
                                    layout={DetailLayout}
                                />
                            } />
                            <Route path="/teams" element={
                                <ResponsivePage
                                    desktop={TeamsPage}
                                    mobile={MobileTeamsPage}
                                    layout={DetailLayout}
                                />
                            } />

                            {/* Messaging - Requires a dedicated two-column layout */}
                            <Route path="/messages" element={
                                <ResponsivePage
                                    desktop={MessagingPage}
                                    mobile={MobileMessagingPage}
                                    layout={DetailLayout}
                                />
                            } />

                            {/* Communities - Has its own sidebar for switching communities */}
                            <Route path="/communities" element={
                                <ResponsivePage
                                    desktop={CommunityPage}
                                    mobile={MobileCommunityPage}
                                    layout={DetailLayout}
                                />
                            } />

                            {/* Dynamic Profile Route - User profiles */}
                            <Route path="/:username" element={
                                <ResponsivePage
                                    desktop={ProfilePage}
                                    mobile={MobileProfilePage}
                                    layout={MainLayout}
                                />
                            } />

                            {/* Post Detail Route - Full-width thread view, no global sidebar */}
                            <Route path="/post/:postId" element={
                                <ResponsivePage
                                    desktop={CommunityPostDetail}
                                    mobile={MobileCommunityPostDetail}
                                    layout={DetailLayout}
                                />
                            } />

                            {/* Stream Viewing Route - Full-width stream player */}
                            <Route path="/stream/:streamId" element={<StreamPage />} />

                            {/* Catch-all route redirects to home */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </AuthGuard>
                } />
            </Routes>
        </div>
    );
}

export default App;