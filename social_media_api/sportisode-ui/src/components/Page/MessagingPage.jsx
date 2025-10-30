// src/pages/MessagingPage.jsx
import React from 'react';
import { useSelector } from 'react-redux';

// Component Imports
import ConversationSidebar from '../messaging/ConversationSidebar';
import ChatWindow from '../messaging/ChatWindow';

const MessagingPage = () => {
    // Get active conversation from Redux state
    const activeConversation = useSelector(state => state.messages.activeConversation);
    console.log('MessagingPage: activeConversation:', activeConversation);

    return (
        <div className="flex w-full lg:max-w-[65rem] lg:ml-10 h-screen">

            {/* Left Column: Conversation Sidebar */}
            <ConversationSidebar
                activeConversation={activeConversation}
            />

            {/* Right Column: Active Chat Window */}
            <ChatWindow
                activeConversation={activeConversation}
            />
        </div>
    );
};

export default MessagingPage;