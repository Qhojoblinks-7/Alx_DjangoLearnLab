import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    // Conversations and message requests
    conversations: [],
    messageRequests: [],

    // Current active conversation
    activeConversation: null,
    conversationMessages: [],

    // Loading states
    loadingConversations: false,
    loadingMessageRequests: false,
    loadingMessages: false,
    sendingMessage: false,

    // Error states
    conversationsError: null,
    messageRequestsError: null,
    messagesError: null,
    sendMessageError: null,

    // Real-time messages (for WebSocket updates)
    realtimeMessages: [],
};

const messagesSlice = createSlice({
    name: 'messages',
    initialState,
    reducers: {
        // Conversations
        setConversations: (state, action) => {
            state.conversations = action.payload;
        },
        addConversation: (state, action) => {
            state.conversations.unshift(action.payload);
        },
        updateConversation: (state, action) => {
            const index = state.conversations.findIndex(conv => conv.id === action.payload.id);
            if (index !== -1) {
                state.conversations[index] = { ...state.conversations[index], ...action.payload };
            }
        },
        removeConversation: (state, action) => {
            state.conversations = state.conversations.filter(conv => conv.id !== action.payload);
        },

        // Message Requests
        setMessageRequests: (state, action) => {
            state.messageRequests = action.payload;
        },
        addMessageRequest: (state, action) => {
            state.messageRequests.unshift(action.payload);
        },
        removeMessageRequest: (state, action) => {
            state.messageRequests = state.messageRequests.filter(req => req.id !== action.payload);
        },

        // Active Conversation
        setActiveConversation: (state, action) => {
            state.activeConversation = action.payload;
            // Clear previous messages when switching conversations
            state.conversationMessages = [];
            state.realtimeMessages = [];
        },

        // Conversation Messages
        setConversationMessages: (state, action) => {
            state.conversationMessages = action.payload;
        },
        addMessage: (state, action) => {
            // Add to conversation messages if it's for the active conversation
            if (state.activeConversation && action.payload.conversation_id === state.activeConversation.id) {
                state.conversationMessages.push(action.payload);
            }
        },
        addRealtimeMessage: (state, action) => {
            state.realtimeMessages.push(action.payload);
        },
        clearRealtimeMessages: (state) => {
            // Merge realtime messages into conversation messages
            state.conversationMessages = [...state.conversationMessages, ...state.realtimeMessages];
            state.realtimeMessages = [];
        },

        // Loading States
        setLoadingConversations: (state, action) => {
            state.loadingConversations = action.payload;
        },
        setLoadingMessageRequests: (state, action) => {
            state.loadingMessageRequests = action.payload;
        },
        setLoadingMessages: (state, action) => {
            state.loadingMessages = action.payload;
        },
        setSendingMessage: (state, action) => {
            state.sendingMessage = action.payload;
        },

        // Error States
        setConversationsError: (state, action) => {
            state.conversationsError = action.payload;
        },
        setMessageRequestsError: (state, action) => {
            state.messageRequestsError = action.payload;
        },
        setMessagesError: (state, action) => {
            state.messagesError = action.payload;
        },
        setSendMessageError: (state, action) => {
            state.sendMessageError = action.payload;
        },

        // Clear errors
        clearMessagesErrors: (state) => {
            state.conversationsError = null;
            state.messageRequestsError = null;
            state.messagesError = null;
            state.sendMessageError = null;
        },

        // Mark messages as read
        markConversationAsRead: (state, action) => {
            const conversationId = action.payload;
            const conversation = state.conversations.find(conv => conv.id === conversationId);
            if (conversation) {
                conversation.unread_count = 0;
                // Mark messages as read in conversationMessages
                state.conversationMessages.forEach(msg => {
                    if (!msg.is_read && msg.sender?.id !== state.activeConversation?.user?.id) {
                        msg.is_read = true;
                    }
                });
            }
        },
    },
});

export const {
    setConversations,
    addConversation,
    updateConversation,
    removeConversation,
    setMessageRequests,
    addMessageRequest,
    removeMessageRequest,
    setActiveConversation,
    setConversationMessages,
    addMessage,
    addRealtimeMessage,
    clearRealtimeMessages,
    setLoadingConversations,
    setLoadingMessageRequests,
    setLoadingMessages,
    setSendingMessage,
    setConversationsError,
    setMessageRequestsError,
    setMessagesError,
    setSendMessageError,
    clearMessagesErrors,
    markConversationAsRead,
} = messagesSlice.actions;

export default messagesSlice.reducer;