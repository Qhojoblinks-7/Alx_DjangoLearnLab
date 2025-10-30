// src/components/Page/mobile/MobileNotificationsPage.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Heart, User, MessageSquare, Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

// Component Imports
import MobileHeader from '../../MobileHeader';
import ProfileDrawer from '../../ProfileDrawer';
import ProfilePicture from '../../ProfilePicture';
import BottomNavBar from '../../BottomNavBar';
import MobileFloatingMenu from '../../MobileFloatingMenu';
import { fetchNotifications, markNotificationsAsUnread, markNotificationAsRead } from '../../lib/api';
import { timeAgo } from '../../lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { getNotificationMessage } from '../../lib/NotificationService';
import { processTextWithEntities } from '../../lib/textProcessor.jsx';
import { ProcessedText } from '../../ui/TextEntity';

// Shadcn/ui Imports
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/alert';

// Helper map for notification icons and colors
const NOTIFICATION_ICONS = {
    like: { icon: Heart, color: 'text-red-500' },
    follow: { icon: User, color: 'text-blue-500' },
    mention: { icon: MessageSquare, color: 'text-blue-500' },
    repost: { icon: Heart, color: 'text-green-500' },
    comment: { icon: MessageSquare, color: 'text-blue-500' },
    messaged: { icon: MessageSquare, color: 'text-blue-500' },
};

// --- Single Notification Item Component ---
const NotificationItem = ({ notification, activeFilter, queryClient }) => {
    const IconComponent = NOTIFICATION_ICONS[notification.type]?.icon || MessageSquare;
    const colorClass = NOTIFICATION_ICONS[notification.type]?.color || 'text-gray-500';
    const navigate = useNavigate();

    // Generate personalized message parts
    const messageParts = getNotificationMessage({
        type: notification.type,
        gender: notification.source_user.gender,
        userCount: 1, // Individual notifications
        post: notification.related_post
    });

    // Enhanced redirection logic based on notification type
    const handleNotificationClick = async () => {
        console.log('Notification clicked:', notification.type, notification.related_post);
        // Mark as read if not already read
        if (!notification.is_read) {
            try {
                await markNotificationAsRead(notification.id);
                // Invalidate query to refetch and update UI immediately
                queryClient.invalidateQueries(['notifications', activeFilter]);
                // The WebSocket will update the count
            } catch (error) {
                console.error('Failed to mark notification as read:', error);
            }
        }

        switch (notification.type) {
            case 'follow':
                // New Post from Followed User: Redirect to user's profile/feed
                navigate(`/${notification.source_user.username}`);
                break;

            case 'like':
                // Post Like / Comment Like / Subcomment Like: Redirect to post with context
                if (notification.related_post) {
                    navigate(`/post/${notification.related_post.id}`, {
                        state: {
                            scrollToComment: true,
                            highlightComment: true,
                            commentId: notification.related_post.id // Could be enhanced with specific comment ID
                        }
                    });
                }
                break;

            case 'comment':
                // Main Comment Notification: Navigate to post and scroll to comment
                if (notification.related_post) {
                    navigate(`/post/${notification.related_post.id}`, {
                        state: {
                            scrollToComment: true,
                            highlightComment: true,
                            commentId: notification.related_post.id // Could be enhanced with specific comment ID
                        }
                    });
                }
                break;

            case 'mention':
                // Post Notification (mention): Redirect to exact post in full view
                if (notification.related_post) {
                    navigate(`/post/${notification.related_post.id}`, {
                        state: {
                            scrollToContent: true,
                            highlightMention: true
                        }
                    });
                }
                break;

            case 'repost':
                // Repost Notification: Navigate to the reposted post
                if (notification.related_post) {
                    navigate(`/post/${notification.related_post.id}`, {
                        state: {
                            scrollToContent: true,
                            highlightRepost: true
                        }
                    });
                }
                break;

            case 'messaged':
                // Message Notification: Navigate to messaging page
                navigate('/messages');
                break;

            default:
                // Default fallback to user profile
                navigate(`/${notification.source_user.username}`);
                break;
        }
    };

    return (
        <div
            onClick={handleNotificationClick}
            className={`flex items-start p-4 border-b border-gray-700 cursor-pointer
                        hover:bg-gray-800/50 transition-colors
                        ${notification.is_read ? 'bg-dark-bg' : 'bg-sport-accent/20 border-l-4 border-l-sport-accent'}`} // Enhanced styling for unread
        >
            {/* Left Icon */}
            <div className={`mr-3 pt-1 ${colorClass}`}>
                <IconComponent className="h-5 w-5" />
            </div>

            {/* Content */}
            <div className="flex-1">
                <div className="flex items-center space-x-2">
                    <div
                        className="cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/${notification.source_user.username}`);
                        }}
                    >
                        <ProfilePicture user={notification.source_user} size="h-10 w-10"/>
                    </div>
                    <p className="text-sm text-gray-500">
                        {timeAgo(notification.created_at)}
                    </p>
                </div>

                <p className="mt-1 text-white leading-snug">
                    {messageParts.prefix}
                    <span
                        className="font-bold hover:underline cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/${notification.source_user.username}`);
                        }}
                    >
                        {notification.source_user.username}
                    </span>
                    {messageParts.suffix}
                </p>

                {/* Display related content snippet for mentions/replies */}
                {notification.related_post && (
                    <div className="text-gray-500 text-sm mt-1 truncate max-w-full">
                        <ProcessedText>
                            "{processTextWithEntities(notification.related_post.content.substring(0, 50))}..."
                        </ProcessedText>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Main Mobile Notifications Page Component ---
const MobileNotificationsPage = () => {
    const [activeFilter, setActiveFilter] = useState('all');
    const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: notifications, isLoading, isError, error } = useQuery({
        // Key includes the filter, so changing the tab triggers a new fetch
        queryKey: ['notifications', activeFilter],
        queryFn: () => fetchNotifications(activeFilter),
        staleTime: 60 * 1000, // 1 minute fresh
    });

    const handleProfileClick = () => {
        setIsProfileDrawerOpen(true);
    };

    const handleSettingsClick = () => {
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

            {/* Main Content */}
            <div className="pt-16">
                {/* Header */}
                <div className="sticky top-16 style={{ backgroundColor: 'var(--primary-bg)' }}/95 backdrop-blur-sm z-10 border-b border-gray-700">
                    <div className="flex items-center justify-between p-4">
                        <h1 className="text-xl font-semibold text-white">Notifications</h1>
                        <button
                            onClick={async () => {
                                try {
                                    await markNotificationsAsUnread();
                                    // Refetch notifications to update the list
                                    queryClient.invalidateQueries(['notifications', activeFilter]);
                                    // The WebSocket will update the count
                                } catch (error) {
                                    console.error('Failed to mark notifications as unread:', error);
                                }
                            }}
                            className="px-3 py-1 text-sm bg-sport-accent text-white rounded-lg hover:bg-sport-accent/80 transition-colors"
                        >
                            Mark All Unread
                        </button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <Tabs value={activeFilter} onValueChange={setActiveFilter}>
                    <TabsList className="grid w-full grid-cols-3 h-12 bg-dark-card border-b border-gray-700 rounded-none">
                        <TabsTrigger value="all" className="text-xs data-[state=active]:bg-sport-accent data-[state=active]:text-black">
                            All
                        </TabsTrigger>
                        <TabsTrigger value="verified" className="text-xs data-[state=active]:bg-sport-accent data-[state=active]:text-black">
                            Verified
                        </TabsTrigger>
                        <TabsTrigger value="mentions" className="text-xs data-[state=active]:bg-sport-accent data-[state=active]:text-black">
                            Mentions
                        </TabsTrigger>
                    </TabsList>

                    {/* Content for All Notifications */}
                    <TabsContent value="all" className="mt-0">
                        <ScrollArea className="h-[calc(100vh-200px)]">
                            {isLoading && (
                                <div className="flex justify-center p-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-sport-accent" />
                                </div>
                            )}
                            {isError && (
                                <Alert variant="destructive" className="m-4">
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{error.message}</AlertDescription>
                                </Alert>
                            )}
                            {notifications?.length === 0 && !isLoading && (
                                <p className="p-8 text-center text-gray-500">No new notifications in this category.</p>
                            )}
                            {Array.isArray(notifications) && notifications.map(notif => (
                                <NotificationItem key={notif.id} notification={notif} activeFilter={activeFilter} queryClient={queryClient} />
                            ))}
                        </ScrollArea>
                    </TabsContent>

                    {/* Content for Verified/Mentions */}
                    <TabsContent value="verified" className="mt-0">
                        <ScrollArea className="h-[calc(100vh-200px)]">
                            <TabsContentComponent
                                isLoading={isLoading}
                                isError={isError}
                                error={error}
                                notifications={notifications}
                                activeFilter={activeFilter}
                                queryClient={queryClient}
                            />
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="mentions" className="mt-0">
                        <ScrollArea className="h-[calc(100vh-200px)]">
                            <TabsContentComponent
                                isLoading={isLoading}
                                isError={isError}
                                error={error}
                                notifications={notifications}
                                activeFilter={activeFilter}
                                queryClient={queryClient}
                            />
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Mobile Floating Menu */}
            <MobileFloatingMenu />

            {/* Bottom Navigation */}
            <BottomNavBar />
        </div>
    );
};

// Reusable component to render notifications for verified/mentions tabs
const TabsContentComponent = ({ isLoading, isError, error, notifications, activeFilter, queryClient }) => {
    if (isLoading) return (
        <div className="flex justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-sport-accent" />
        </div>
    );
    if (isError) return (
        <Alert variant="destructive" className="m-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
        </Alert>
    );
    if (notifications?.length === 0) return (
        <p className="p-8 text-center text-gray-500">No new notifications in this category.</p>
    );

    return (
        Array.isArray(notifications) && notifications.map(notif => (
            <NotificationItem key={notif.id} notification={notif} activeFilter={activeFilter} queryClient={queryClient} />
        ))
    );
};

export default MobileNotificationsPage;