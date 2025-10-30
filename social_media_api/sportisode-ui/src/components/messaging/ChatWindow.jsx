// src/components/messaging/ChatWindow.jsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Send, Info, Loader2, ArrowLeft } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';

// Shadcn/ui Imports
import { Button } from '../components/ui/button';

// Component & Utility Imports
import ProfilePicture from '../ProfilePicture';
import EnhancedTextInput from '../ui/EnhancedTextInput';
import { fetchConversationMessages, sendMessage } from '../lib/api';
import { timeAgo } from '../lib/utils';
import { useWebSocket } from '@/hooks/useWebSocket';

// Redux actions
import {
    setConversationMessages,
    addMessage,
    addRealtimeMessage,
    setLoadingMessages,
    setMessagesError,
    setSendingMessage,
} from '../../store/messagesSlice';

// EnhancedTextInput component handles all picker functionality

// --- Single Message Bubble Component ---
const MessageBubble = ({ message, isSender }) => (
    <div className={`flex mb-4 ${isSender ? 'justify-end' : 'justify-start'}`}>
        <div className={`text-bold max-w-xs lg:max-w-md ${isSender ? 'ml-auto' : 'mr-auto'}`}>
            <div className={`rounded-3xl p-3
                ${isSender
                    ? 'bg-[#00BFFF] text-black rounded-br-none'
                    : 'bg-[#1E2732] text-white rounded-tl-none'
                }`}
            >
                {Array.isArray(message.content) ? message.content.join(' ') : message.content}
            </div>
            {/* Optional timestamp display below */}
            <p className={`text-xs text-gray-500 mt-1 ${isSender ? 'text-right' : 'text-left'}`}>
                {timeAgo(message.created_at)}
            </p>
        </div>
    </div>
);

// --- Main Chat Window Component ---
const ChatWindow = ({ activeConversation, onBack }) => {
    const chatEndRef = useRef(null);
    const dispatch = useDispatch();
    const currentUser = useSelector(state => state.auth.user);

    // Get messages from Redux state
    const conversationMessages = useSelector(state => state.messages.conversationMessages);
    const realtimeMessages = useSelector(state => state.messages.realtimeMessages);
    const loadingMessages = useSelector(state => state.messages.loadingMessages);
    const sendingMessage = useSelector(state => state.messages.sendingMessage);

    console.log('ChatWindow: Redux messages state:', {
        conversationMessages: conversationMessages?.length || 0,
        realtimeMessages: realtimeMessages?.length || 0,
        loadingMessages,
        sendingMessage
    });

    // Local state for message input and typing indicators
    const [messageInput, setMessageInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [typingUser, setTypingUser] = useState(null);

    // Fetch message history for the active chat
    console.log('ChatWindow: activeConversation:', activeConversation);
    const messagesQuery = useQuery({
        queryKey: ['conversationMessages', activeConversation?.id],
        queryFn: () => {
            console.log('Fetching messages for conversation:', activeConversation.id);
            return fetchConversationMessages({ conversationId: activeConversation.id });
        },
        enabled: !!activeConversation?.id,
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
    });

    // Update Redux state when query data changes
    React.useEffect(() => {
        if (messagesQuery.data) {
            console.log('ChatWindow: Messages fetched successfully:', messagesQuery.data);
            dispatch(setConversationMessages(messagesQuery.data.results || []));
            dispatch(setLoadingMessages(false));
        }
        if (messagesQuery.error) {
            console.log('ChatWindow: Error fetching messages:', messagesQuery.error);
            dispatch(setMessagesError(messagesQuery.error.message));
            dispatch(setLoadingMessages(false));
        }
    }, [messagesQuery.data, messagesQuery.error, dispatch]);

    const { isLoading, isError } = messagesQuery;

    // Send message mutation
    const sendMessageMutation = useMutation({
        mutationFn: async (content) => {
            dispatch(setSendingMessage(true));
            return sendMessage({ conversationId: activeConversation?.id, content });
        },
        onSuccess: (newMessage) => {
            // Add the new message to Redux state
            dispatch(addMessage(newMessage));
            setMessageInput('');
            dispatch(setSendingMessage(false));
            // Scroll to bottom
            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        },
        onError: (error) => {
            console.error('Failed to send message:', error);
            dispatch(setMessagesError(error.message));
            dispatch(setSendingMessage(false));
        },
    });

    // WebSocket message handler
    const handleWsMessage = useCallback((message) => {
        if (message.type === 'message') {
            // Add new message to Redux state
            dispatch(addRealtimeMessage(message.message));
            // Scroll to bottom
            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } else if (message.type === 'typing_start') {
            setIsTyping(true);
            setTypingUser(message.user.username);
        } else if (message.type === 'typing_stop') {
            setIsTyping(false);
            setTypingUser(null);
        }
    }, [dispatch]);

    // Connect to WebSocket for real-time messaging
    useWebSocket(activeConversation?.user?.username ? `/chat/${activeConversation.user.username}/` : null, handleWsMessage);

    // Handle sending message
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (messageInput.trim() && !sendMessageMutation.isPending) {
            sendMessageMutation.mutate(messageInput.trim());
        }
    };

    // Handle input change
    const handleInputChange = (value) => {
        setMessageInput(value);
        // TODO: Implement typing indicator via WebSocket
    };

    // Scroll to the latest message whenever chat history or real-time messages change
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messagesQuery.data, realtimeMessages]);


    // Active chat user info
    const activeChatUser = {
        name: activeConversation?.user?.name || `@${activeConversation?.user?.username}`,
        username: activeConversation?.user?.username,
        isVerified: true,
    };

    // Combine historical messages with real-time messages from Redux
    const allMessages = [...conversationMessages, ...realtimeMessages];
    console.log('ChatWindow: Combined messages:', allMessages.length, 'total messages');

    // Remove duplicates based on message ID
    const uniqueMessages = allMessages.filter((message, index, self) =>
        index === self.findIndex(m => m.id === message.id)
    );
    console.log('ChatWindow: Unique messages to render:', uniqueMessages.length, uniqueMessages);

    if (!activeConversation) {
        return (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-lg">
                Select a conversation to begin chatting.
            </div>
        );
    }
    
    return (
        <div className="flex-1 flex flex-col h-full" style={{ backgroundColor: 'var(--primary-bg)' }}>
            
            {/* Header */}
            <header className="flex items-center justify-between p-3 border-b border-gray-700 sticky top-0 bg-[#15202B] z-10">
                <div className="flex items-center">
                    {/* Mobile Back Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onBack || (() => window.history.back())}
                        className="lg:hidden mr-2 text-gray-500 hover:text-sport-accent"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <ProfilePicture user={activeChatUser} size="h-10 w-10" />
                    <div className="ml-3">
                        <p className="font-semibold text-white leading-tight">{activeChatUser.name}</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="text-gray-500 hover:text-sport-accent">
                    <Info className="h-5 w-5" />
                </Button>
            </header>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-20">
                {(isLoading || loadingMessages) && (
                    <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-sport-accent" /></div>
                )}
                {isError && (
                    <p className="text-red-500 text-center">Error loading messages.</p>
                )}
                
                {uniqueMessages.map((message) => (
                    // isSender logic: Check if the message author's ID matches the current user's ID
                    <MessageBubble
                        key={message.id || message.tempId}
                        message={message}
                        isSender={message.sender?.id === currentUser?.id}
                    />
                ))}

                {/* Typing indicator */}
                {isTyping && typingUser !== currentUser?.username && (
                    <div className="flex mb-4 justify-start">
                        <div className="bg-gray-800 text-white rounded-3xl p-3 text-sm">
                            <div className="flex items-center space-x-2">
                                <div className="flex space-x-1">
                                    <div key="dot-1" className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div key="dot-2" className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                    <div key="dot-3" className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                </div>
                                <span className="text-gray-400 text-xs">{typingUser} is typing...</span>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Scroll anchor */}
                <div ref={chatEndRef} />
            </div>

            {/* Enhanced Input Footer */}
            <footer className="p-3 border-t border-gray-700 fixed bottom-0 left-0 right-0 bg-[#15202B] z-10">
                <EnhancedTextInput
                    value={messageInput}
                    onChange={handleInputChange}
                    onSubmit={handleSendMessage}
                    placeholder="Start a new message"
                    disabled={sendMessageMutation.isPending || sendingMessage}
                    isLoading={sendMessageMutation.isPending || sendingMessage}
                    context="chat"
                />
            </footer>
        </div>
    );
};

export default ChatWindow;