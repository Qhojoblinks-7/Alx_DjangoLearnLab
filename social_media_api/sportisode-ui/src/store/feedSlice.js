// src/store/feedSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Feed type selection
  feedType: 'forYou', // 'forYou' or 'following'

  // Pagination state
  pagination: {
    isLoading: false,
    hasNextPage: true,
    isFetchingNextPage: false,
    error: null,
  },

  // Feed preferences
  preferences: {
    postsPerPage: 10,
    autoLoadMore: true,
    showReadPosts: true,
    contentFilters: {
      hideSensitive: false,
      hideReposts: false,
      languageFilter: 'all', // 'all', 'english', 'spanish', etc.
    },
  },

  // Feed statistics
  stats: {
    totalPostsViewed: 0,
    averageSessionTime: 0,
    lastRefreshTime: null,
  },

  // Cached feed data (for offline support)
  cache: {
    posts: [],
    lastUpdated: null,
    isStale: false,
  },
};

const feedSlice = createSlice({
  name: 'feed',
  initialState,
  reducers: {
    // Feed type management
    setFeedType: (state, action) => {
      state.feedType = action.payload;
      // Reset pagination when switching feed types
      state.pagination.hasNextPage = true;
      state.pagination.error = null;
    },

    // Pagination state management
    setPaginationLoading: (state, action) => {
      state.pagination.isLoading = action.payload;
    },

    setPaginationFetching: (state, action) => {
      state.pagination.isFetchingNextPage = action.payload;
    },

    setHasNextPage: (state, action) => {
      state.pagination.hasNextPage = action.payload;
    },

    setPaginationError: (state, action) => {
      state.pagination.error = action.payload;
      state.pagination.isLoading = false;
      state.pagination.isFetchingNextPage = false;
    },

    clearPaginationError: (state) => {
      state.pagination.error = null;
    },

    // Feed preferences
    updateFeedPreferences: (state, action) => {
      state.preferences = {
        ...state.preferences,
        ...action.payload,
      };
    },

    setContentFilter: (state, action) => {
      const { filterType, value } = action.payload;
      state.preferences.contentFilters[filterType] = value;
    },

    // Feed statistics
    incrementPostsViewed: (state) => {
      state.stats.totalPostsViewed += 1;
    },

    updateSessionTime: (state, action) => {
      const sessionTime = action.payload;
      // Calculate running average
      const currentAverage = state.stats.averageSessionTime;
      const totalSessions = Math.max(1, state.stats.totalPostsViewed);
      state.stats.averageSessionTime = (currentAverage * (totalSessions - 1) + sessionTime) / totalSessions;
    },

    setLastRefreshTime: (state) => {
      state.stats.lastRefreshTime = new Date().toISOString();
    },

    // Cache management
    updateFeedCache: (state, action) => {
      const { posts } = action.payload;
      state.cache.posts = posts;
      state.cache.lastUpdated = new Date().toISOString();
      state.cache.isStale = false;
    },

    markCacheStale: (state) => {
      state.cache.isStale = true;
    },

    clearFeedCache: (state) => {
      state.cache.posts = [];
      state.cache.lastUpdated = null;
      state.cache.isStale = false;
    },

    // Reset feed state (useful for logout or feed refresh)
    resetFeedState: (state) => {
      state.feedType = 'forYou';
      state.pagination = initialState.pagination;
      state.stats = initialState.stats;
      state.cache = initialState.cache;
    },
  },
});

export const {
  setFeedType,
  setPaginationLoading,
  setPaginationFetching,
  setHasNextPage,
  setPaginationError,
  clearPaginationError,
  updateFeedPreferences,
  setContentFilter,
  incrementPostsViewed,
  updateSessionTime,
  setLastRefreshTime,
  updateFeedCache,
  markCacheStale,
  clearFeedCache,
  resetFeedState,
} = feedSlice.actions;

export default feedSlice.reducer;