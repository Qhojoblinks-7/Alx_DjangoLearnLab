import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    unreadCount: 0,
    notifications: [],
    loading: false,
    error: null,
};

const notificationsSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        setUnreadCount: (state, action) => {
            state.unreadCount = action.payload;
        },
        incrementUnreadCount: (state) => {
            state.unreadCount += 1;
        },
        decrementUnreadCount: (state) => {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
        },
        setNotifications: (state, action) => {
            state.notifications = action.payload;
        },
        addNotification: (state, action) => {
            state.notifications.unshift(action.payload);
            state.unreadCount += 1;
        },
        markNotificationRead: (state, action) => {
            const notificationId = action.payload;
            const notification = state.notifications.find(n => n.id === notificationId);
            if (notification && !notification.is_read) {
                notification.is_read = true;
                state.unreadCount = Math.max(0, state.unreadCount - 1);
            }
        },
        markAllNotificationsRead: (state) => {
            state.notifications.forEach(notification => {
                notification.is_read = true;
            });
            state.unreadCount = 0;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
    },
});

export const {
    setUnreadCount,
    incrementUnreadCount,
    decrementUnreadCount,
    setNotifications,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    setLoading,
    setError,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;