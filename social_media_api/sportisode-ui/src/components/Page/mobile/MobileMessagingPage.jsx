// src/components/Page/mobile/MobileMessagingPage.jsx
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

// Component Imports
import ConversationSidebar from '../../messaging/ConversationSidebar';
import ChatWindow from '../../messaging/ChatWindow';
import MobileHeader from '../../MobileHeader';
import ProfileDrawer from '../../ProfileDrawer';
import BottomNavBar from '../../BottomNavBar';

// Redux actions
import { setActiveConversation } from '../../../store/messagesSlice';

const MobileMessagingPage = () => {
    // Get active conversation from Redux state
    const activeConversation = useSelector(state => state.messages.activeConversation);
    const dispatch = useDispatch();
    const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);

    // Handle back navigation from chat
    const handleBackFromChat = () => {
        dispatch(setActiveConversation(null));
    };

    const handleProfileClick = () => {
        setIsProfileDrawerOpen(true);
    };

    const handleSettingsClick = () => {
        console.log('Settings clicked');
    };

    return (
        <div className="flex w-full min-h-screen bg-dark-bg">
            {/* Mobile Header with Search - Hide when chat is active */}
            {!activeConversation && (
                <MobileHeader
                    onProfileClick={handleProfileClick}
                    onSettingsClick={handleSettingsClick}
                    showSearch={true}
                    searchPlaceholder="Search messages..."
                />
            )}

            {/* Profile Drawer */}
            <ProfileDrawer
                isOpen={isProfileDrawerOpen}
                onClose={() => setIsProfileDrawerOpen(false)}
            />

            {/* Main Content */}
            <div className={`flex w-full h-full ${!activeConversation ? 'pt-16' : ''}`}>
                {/* Mobile: Show only active chat or conversation list */}
                <div className="flex w-full h-full">
                    {/* Mobile: Conversation Sidebar (shown when no chat is active) */}
                    {!activeConversation && (
                        <div className="w-full">
                            <ConversationSidebar
                                activeConversation={activeConversation}
                            />
                        </div>
                    )}

                    {/* Mobile: Chat Window (shown when chat is active) */}
                    {activeConversation && (
                        <div className="w-full">
                            <ChatWindow
                                activeConversation={activeConversation}
                                onBack={handleBackFromChat} // Mobile back button
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Navigation - Hide when chat is active */}
            {!activeConversation && <BottomNavBar />}
        </div>
    );
};

export default MobileMessagingPage;