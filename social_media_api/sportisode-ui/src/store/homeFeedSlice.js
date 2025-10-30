// src/store/homeFeedSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authenticatedFetch } from '../components/lib/api';

const initialState = {
  // Feed data
  posts: [],
  hasNextPage: true,
  isLoading: false,
  isFetchingNextPage: false,
  error: null,

  // Pagination
  offset: 0,
  pageSize: 10,

  // Feed type
  activeTab: 'for_you', // 'for_you' or 'following'
};

// Async thunk for fetching home feed
export const fetchHomeFeed = createAsyncThunk(
  'homeFeed/fetchHomeFeed',
  async ({ tab = 'for_you', offset = 0, isLoadMore = false }, { rejectWithValue }) => {
    try {
      console.log('homeFeedSlice: fetchHomeFeed called with', { tab, offset, isLoadMore });
      const params = new URLSearchParams({ tab, limit: '10', offset: offset.toString() });

      const response = await authenticatedFetch(`/feed/home/?${params}`, {
        method: 'GET',
      });

      console.log('homeFeedSlice: API response status', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('homeFeedSlice: API error response:', errorText);
        throw new Error(`Failed to fetch home feed: ${response.status} ${errorText}`);
      }

      const responseText = await response.text();
      console.log('homeFeedSlice: Raw response text', responseText.substring(0, 200));

      const data = JSON.parse(responseText);
      console.log('homeFeedSlice: Parsed data', { count: data.count, resultsLength: data.results?.length, next: data.next });

      // Handle both paginated response format and direct array format
      let posts = [];
      let hasNextPage = false;

      if (data.results) {
        // Paginated response format
        posts = data.results;
        hasNextPage = !!data.next;
      } else if (Array.isArray(data)) {
        // Direct array response
        posts = data;
        hasNextPage = posts.length === 10; // Assume more if we got a full page
      } else {
        // Fallback
        posts = [];
      }

      const result = {
        posts,
        nextOffset: offset + 10,
        hasNextPage,
        isLoadMore,
      };
      console.log('homeFeedSlice: Returning result', result);
      return result;
    } catch (error) {
      console.error('homeFeedSlice: Error in fetchHomeFeed', error);
      return rejectWithValue(error.message);
    }
  }
);

const homeFeedSlice = createSlice({
  name: 'homeFeed',
  initialState,
  reducers: {
    // Set active tab
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
      // Reset feed when switching tabs
      state.posts = [];
      state.offset = 0;
      state.hasNextPage = true;
      state.error = null;
    },

    // Clear feed data
    clearFeed: (state) => {
      state.posts = [];
      state.offset = 0;
      state.hasNextPage = true;
      state.error = null;
    },

    // Update post in feed (for real-time updates)
    updatePostInFeed: (state, action) => {
      const { postId, updates } = action.payload;
      const postIndex = state.posts.findIndex(post => post.id === postId);
      if (postIndex !== -1) {
        state.posts[postIndex] = { ...state.posts[postIndex], ...updates };
      }
    },

    // Add new post to feed (for real-time new posts)
    addPostToFeed: (state, action) => {
      const newPost = action.payload;
      // Add to beginning for chronological order
      state.posts.unshift(newPost);
    },

    // Remove post from feed
    removePostFromFeed: (state, action) => {
      const postId = action.payload;
      state.posts = state.posts.filter(post => post.id !== postId);
    },

    // Reset feed state
    resetHomeFeed: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHomeFeed.pending, (state, action) => {
        const { isLoadMore } = action.meta.arg;
        if (isLoadMore) {
          state.isFetchingNextPage = true;
        } else {
          state.isLoading = true;
        }
        state.error = null;
      })
      .addCase(fetchHomeFeed.fulfilled, (state, action) => {
        const { posts, nextOffset, hasNextPage, isLoadMore } = action.payload;

        console.log('homeFeedSlice: fulfilled action', { posts: posts.length, nextOffset, hasNextPage, isLoadMore });

        state.isLoading = false;
        state.isFetchingNextPage = false;

        if (isLoadMore) {
          // Append new posts for load more
          state.posts = [...state.posts, ...posts];
          state.offset = nextOffset;
        } else {
          // Replace posts for initial load
          state.posts = posts;
          state.offset = 10; // Next offset after first page
        }

        state.hasNextPage = hasNextPage;

        console.log('homeFeedSlice: Updated state', { postsCount: state.posts.length, hasNextPage: state.hasNextPage, offset: state.offset });
      })
      .addCase(fetchHomeFeed.rejected, (state, action) => {
        state.isLoading = false;
        state.isFetchingNextPage = false;
        state.error = action.payload;
      });
  },
});

export const {
  setActiveTab,
  clearFeed,
  updatePostInFeed,
  addPostToFeed,
  removePostFromFeed,
  resetHomeFeed,
} = homeFeedSlice.actions;

export default homeFeedSlice.reducer;