// src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import uiReducer from './uiSlice';
import postsReducer from './postsSlice';
import feedReducer from './feedSlice';
import homeFeedReducer from './homeFeedSlice';
import commentsReducer from './commentsSlice';
import formsReducer from './formsSlice';
import notificationsReducer from './notificationsSlice';
import messagesReducer from './messagesSlice';
import exploreReducer from './exploreSlice';
import liveStreamReducer from './liveStreamSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    posts: postsReducer,
    feed: feedReducer,
    homeFeed: homeFeedReducer,
    comments: commentsReducer,
    forms: formsReducer,
    notifications: notificationsReducer,
    messages: messagesReducer,
    explore: exploreReducer,
    liveStream: liveStreamReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serializable state check
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'forms/setProfileImage', 'forms/setBannerImage'],
        // Ignore these field paths in all actions
        ignoredPaths: ['posts.viewTracking.viewedPosts', 'forms.profileEdit.profilePicture', 'forms.profileEdit.bannerImage'],
      },
    }),
});

export default store;