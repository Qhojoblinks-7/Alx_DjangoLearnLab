// src/pages/NotificationsPage.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Heart, User, MessageSquare, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Shadcn/ui Imports
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

// Component & Utility Imports
import ProfilePicture from '@/components/ProfilePicture';
import { fetchNotifications } from '@/lib/api'; 
import { timeAgo } from '@/lib/utils'; // Assuming a utility to format time

// Helper map for notification icons and colors
const NOTIFICATION_ICONS = {
    like: { icon: Heart, color: 'text-red-500' },
    follow: { icon: User, color: 'text-sport-accent' },
    mention: { icon: MessageSquare, color: 'text-sky-500' },
    // Add other types like 'repost', 'reply' as needed
};

// --- Single Notification Item Component ---
const NotificationItem = ({ notification }) => {
    const IconComponent = NOTIFICATION_ICONS[notification.type]?.icon || MessageSquare;
    const colorClass = NOTIFICATION_ICONS[notification.type]?.color || 'text-gray-500';
    const navigate = useNavigate();

    // Determine target path (User profile for follow/like, Post detail for mention/reply)
    const targetPath = notification.type === 'follow' 
        ? `/${notification.source_user.username}`
        : notification.related_post 
        ? `/post/${notification.related_post.id}`
        : `/${notification.source_user.username}`;

    return (
        <div 
            onClick={() => navigate(targetPath)}
            className={`flex items-start p-3 border-b border-gray-700 cursor-pointer 
                        hover:bg-gray-800/50 transition-colors 
                        ${notification.is_read ? 'bg-dark-bg' : 'bg-sport-accent/10'}`} // Subtle indicator for unread
        >
            {/* Left Icon */}
            <div className={`mr-3 pt-1 ${colorClass}`}>
                <IconComponent className="h-5 w-5" />
            </div>

            {/* Content */}
            <div className="flex-1">
                <div className="flex items-center space-x-2">
                    <ProfilePicture user={notification.source_user} size="h-10 w-10"/>
                    <p className="text-sm text-gray-500">
                        {timeAgo(notification.created_at)} {/* Assuming timeAgo utility exists */}
                    </p>
                </div>
                
                <p className="mt-1 text-white leading-snug">
                    <span className="font-bold hover:underline">{notification.source_user.username}</span> 
                    {notification.type === 'like' && ' liked your post.'}
                    {notification.type === 'follow' && ' followed you.'}
                    {notification.type === 'mention' && ' mentioned you in a post.'}
                    {/* Fallback */}
                    {notification.type === 'default' && ' has a new activity.'}
                </p>
                
                {/* Display related content snippet for mentions/replies */}
                {notification.related_post && (
                    <p className="text-gray-500 text-sm mt-1 truncate max-w-full">
                        "{notification.related_post.content.substring(0, 50)}..."
                    </p>
                )}
            </div>
        </div>
    );
};


// --- Main Notifications Page Component ---
const NotificationsPage = () => {
    const [activeFilter, setActiveFilter] = useState('all');

    const { data: notifications, isLoading, isError, error } = useQuery({
        // Key includes the filter, so changing the tab triggers a new fetch
        queryKey: ['notifications', activeFilter],
        queryFn: () => fetchNotifications(activeFilter),
        staleTime: 60 * 1000, // 1 minute fresh
    });

    return (
        <div className="max-w-xl mx-auto min-h-screen">
            
            {/* Header and Tab Navigation */}
            <header className="sticky top-0 bg-dark-bg/80 backdrop-blur-sm z-10 border-b border-gray-700">
                <h1 className="text-xl font-extrabold p-3 text-white">Notifications</h1>
                <Tabs value={activeFilter} onValueChange={setActiveFilter}>
                    <TabsList className="grid w-full grid-cols-3 h-12 bg-dark-bg border-b border-gray-700 rounded-none">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="verified">Verified</TabsTrigger>
                        <TabsTrigger value="mentions">Mentions</TabsTrigger>
                    </TabsList>

                    {/* Content for All Notifications */}
                    <TabsContent value="all" className="mt-0">
                        <ScrollArea className="h-[calc(100vh-120px)]">
                            {isLoading && <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-sport-accent" /></div>}
                            {isError && (
                                <Alert variant="destructive" className="m-4">
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{error.message}</AlertDescription>
                                </Alert>
                            )}
                            {notifications?.length === 0 && !isLoading && (
                                <p className="p-8 text-center text-gray-500">No new notifications in this category.</p>
                            )}
                            {notifications?.map(notif => (
                                <NotificationItem key={notif.id} notification={notif} />
                            ))}
                        </ScrollArea>
                    </TabsContent>

                    {/* Content for Verified/Mentions (Shares the same fetching component and state) */}
                    <TabsContent value="verified" className="mt-0">
                         <ScrollArea className="h-[calc(100vh-120px)]">
                            <TabsContentComponent 
                                isLoading={isLoading} 
                                isError={isError} 
                                error={error} 
                                notifications={notifications} 
                            />
                        </ScrollArea>
                    </TabsContent>
                    
                    <TabsContent value="mentions" className="mt-0">
                        <ScrollArea className="h-[calc(100vh-120px)]">
                            <TabsContentComponent 
                                isLoading={isLoading} 
                                isError={isError} 
                                error={error} 
                                notifications={notifications} 
                            />
                        </ScrollArea>
                    </TabsContent>

                </Tabs>
            </header>
        </div>
    );
};

// Reusable component to render notifications for verified/mentions tabs
const TabsContentComponent = ({ isLoading, isError, error, notifications }) => {
    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-sport-accent" /></div>;
    if (isError) return (
        <Alert variant="destructive" className="m-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
        </Alert>
    );
    if (notifications?.length === 0) return <p className="p-8 text-center text-gray-500">No new notifications in this category.</p>;

    return (
        notifications.map(notif => (
            <NotificationItem key={notif.id} notification={notif} />
        ))
    );
};


export default NotificationsPage;