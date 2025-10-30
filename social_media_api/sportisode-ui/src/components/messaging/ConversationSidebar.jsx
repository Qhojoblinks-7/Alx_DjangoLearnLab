// src/components/messaging/ConversationSidebar.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { Search, Settings, ArrowRightLeft, MessageSquare } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useSelector, useDispatch } from 'react-redux';

// Shadcn/ui Imports
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';

// Component & Utility Imports
import ProfilePicture from '../ProfilePicture';
import { fetchConversations, fetchMessageRequests } from '../lib/api';
import { timeAgo } from '../lib/utils';

// Redux actions
import {
    setConversations,
    setMessageRequests,
    setActiveConversation,
    setLoadingConversations,
    setLoadingMessageRequests,
    setConversationsError,
    setMessageRequestsError,
} from '../../store/messagesSlice';

// --- Single Conversation Item Component ---
const ConversationItem = ({ chat, onClick, isActive }) => (
    <div
        onClick={() => {
            console.log('ConversationItem: Clicked on chat:', chat);
            onClick(chat);
        }}
        className={`flex items-start p-3 cursor-pointer transition-colors border-b border-gray-800
            ${isActive ? 'bg-sport-accent/20' : 'hover:bg-gray-800/50'}`}
    >
        <ProfilePicture user={chat.user} size="h-10 w-10" />
        <div className="flex-1 ml-3 overflow-hidden">
            <div className="flex justify-between items-center">
                <p className={`font-bold truncate ${chat.unread_count > 0 ? 'text-white' : 'text-gray-300'}`}>
                    {chat.user.name}
                </p>
                <span className="text-xs text-gray-500 flex-shrink-0">
                    {timeAgo(chat.last_message.created_at)}
                </span>
            </div>
            <p className={`text-sm truncate leading-snug ${chat.unread_count > 0 ? 'text-white font-semibold' : 'text-gray-500'}`}>
                {Array.isArray(chat.last_message.content) ? chat.last_message.content.join(' ') : chat.last_message.content}
            </p>
        </div>
    </div>
);

// --- Main Sidebar Component ---
const ConversationSidebar = ({ activeConversation }) => {
    const dispatch = useDispatch();
    const [searchQuery, setSearchQuery] = useState('');

    // Get data from Redux state
    const conversations = useSelector(state => state.messages.conversations);
    const messageRequests = useSelector(state => state.messages.messageRequests);
    const loadingConversations = useSelector(state => state.messages.loadingConversations);
    const loadingMessageRequests = useSelector(state => state.messages.loadingMessageRequests);

    // Filter conversations based on search query
    const filteredConversations = useMemo(() => {
        if (!searchQuery.trim() || !conversations) return conversations || [];

        const query = searchQuery.toLowerCase();
        return conversations.filter(chat =>
            chat.user.name.toLowerCase().includes(query) ||
            chat.user.username.toLowerCase().includes(query) ||
            (chat.last_message?.content &&
             (Array.isArray(chat.last_message.content)
                ? chat.last_message.content.join(' ').toLowerCase().includes(query)
                : chat.last_message.content.toLowerCase().includes(query)))
        );
    }, [conversations, searchQuery]);

    console.log('ConversationSidebar: Redux state - conversations:', conversations, 'length:', conversations?.length, 'loading:', loadingConversations);

    // Fetch conversations and message requests
    console.log('ConversationSidebar: Setting up conversations query...');
    const conversationsQuery = useQuery({
        queryKey: ['conversations'],
        queryFn: () => {
            console.log('ConversationSidebar: queryFn called, executing fetchConversations...');
            return fetchConversations();
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
    });

    // Update Redux state when query data changes
    useEffect(() => {
        if (conversationsQuery.data) {
            console.log('ConversationSidebar: Updating Redux with conversations data:', conversationsQuery.data);
            dispatch(setConversations(conversationsQuery.data));
            dispatch(setLoadingConversations(false));
        }
        if (conversationsQuery.error) {
            console.log('ConversationSidebar: Query error, updating Redux:', conversationsQuery.error);
            dispatch(setConversationsError(conversationsQuery.error.message));
            dispatch(setLoadingConversations(false));
        }
    }, [conversationsQuery.data, conversationsQuery.error, dispatch]);

    console.log('ConversationSidebar: Query state:', {
        isLoading: conversationsQuery.isLoading,
        isError: conversationsQuery.isError,
        isSuccess: conversationsQuery.isSuccess,
        data: conversationsQuery.data,
        error: conversationsQuery.error,
        isFetching: conversationsQuery.isFetching,
        isStale: conversationsQuery.isStale,
    });

    const messageRequestsQuery = useQuery({
        queryKey: ['messageRequests'],
        queryFn: fetchMessageRequests,
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
    });

    // Update Redux state when messageRequests query data changes
    useEffect(() => {
        if (messageRequestsQuery.data) {
            console.log('ConversationSidebar: Updating Redux with message requests data:', messageRequestsQuery.data);
            dispatch(setMessageRequests(messageRequestsQuery.data));
            dispatch(setLoadingMessageRequests(false));
        }
        if (messageRequestsQuery.error) {
            console.log('ConversationSidebar: Message requests query error, updating Redux:', messageRequestsQuery.error);
            dispatch(setMessageRequestsError(messageRequestsQuery.error.message));
            dispatch(setLoadingMessageRequests(false));
        }
    }, [messageRequestsQuery.data, messageRequestsQuery.error, dispatch]);

    // Handle conversation selection
    const handleSelectChat = (conversation) => {
        console.log('ConversationSidebar: Selecting conversation:', conversation);
        dispatch(setActiveConversation(conversation));
    };

    return (
        <div className="w-96 flex flex-col h-full border-r border-gray-700 bg-dark-bg">
            
            {/* Header and Search */}
            <div className="p-3 border-b border-gray-700">
                <div className="flex justify-between items-center mb-3">
                    <h1 className="text-xl font-medium text-white">Messages</h1>
                    <div className="flex space-x-2">
                        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-sport-accent"><Settings className="h-5 w-5"/></Button>
                        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-sport-accent"><ArrowRightLeft className="h-5 w-5"/></Button>
                    </div>
                </div>
                <div className="relative hidden lg:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search Direct Messages"
                        className="w-full pl-10 bg-dark-card border-gray-700 focus:border-sport-accent rounded-full text-white"
                    />
                </div>
            </div>

            {/* Message Requests Section */}
            {(messageRequests?.length > 0 || loadingMessageRequests) && (
                <div className="p-3 border-b border-gray-700">
                    <p className="text-white font-medium mb-1 flex items-center">
                        <MessageSquare className="h-4 w-4 mr-2 text-sport-accent"/>
                        Message requests
                    </p>
                    <p className="text-sm text-gray-500">{messageRequests?.length || '0'} pending requests</p>
                </div>
            )}

            {/* Conversation List */}
            <ScrollArea className="flex-1 overflow-y-auto">
                {loadingConversations ? (
                    <div className="p-4 text-center text-gray-500">Loading chats...</div>
                ) : (
                    <>
                        {console.log('ConversationSidebar: About to render conversations:', filteredConversations, 'type:', typeof filteredConversations, 'isArray:', Array.isArray(filteredConversations))}
                        {filteredConversations && filteredConversations.length > 0 ? (
                            filteredConversations.map(chat => {
                                console.log('ConversationSidebar: Rendering chat item:', chat);
                                return (
                                    <ConversationItem
                                        key={chat.id}
                                        chat={chat}
                                        onClick={handleSelectChat}
                                        isActive={activeConversation?.id === chat.id}
                                    />
                                );
                            })
                        ) : (
                            console.log('ConversationSidebar: No conversations to render')
                        )}
                    </>
                )}
                {/* Placeholder for 'Start a chat' prompt if list is empty */}
                {!loadingConversations && filteredConversations?.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        {searchQuery ? 'No conversations match your search.' : 'No conversations yet. Start a new one!'}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
};

export default ConversationSidebar;