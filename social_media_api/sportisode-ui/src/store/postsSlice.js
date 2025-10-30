// src/store/postsSlice.js
import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { authenticatedFetch } from '../components/lib/api';

const initialState = {
  // Post interaction states
  interactions: {
    // Structure: { postId: { isLiked: boolean, likesCount: number, isReposted: boolean, repostsCount: number, isBookmarked: boolean, shareCount: number } }
  },

  // View tracking state
  viewTracking: {
    viewedPosts: [], // Array of postIds that have been viewed
    lastViewTimes: {}, // { postId: timestamp }
    cooldownPeriod: 5 * 60 * 1000, // 5 minutes in milliseconds
  },

  // Loading states for post actions (arrays for serializable state)
  loading: {
    liking: [], // Array of postIds currently being liked/unliked
    reposting: [], // Array of postIds currently being reposted/unreposted
    bookmarking: [], // Array of postIds currently being bookmarked/unbookmarked
    sharing: [], // Array of postIds currently being shared
    viewing: [], // Array of postIds currently being viewed
  },

  // Share state
  share: {
    copiedPostId: null, // ID of post that was just shared/copied
    copiedTimestamp: null, // When it was copied
  },

  // Error states
  errors: {
    like: null,
    repost: null,
    bookmark: null,
    share: null,
    view: null,
  },
};

// Async thunks for post interactions
export const toggleLike = createAsyncThunk(
  'posts/toggleLike',
  async (postId, { rejectWithValue }) => {
    console.log('postsSlice: toggleLike called for postId:', postId);
    try {
      const response = await authenticatedFetch(`/posts/${postId}/like/`, {
        method: 'POST',
      });

      if (!response.ok) {
        console.error('postsSlice: toggleLike failed with status:', response.status);
        throw new Error('Failed to toggle like');
      }

      const data = await response.json();
      console.log('postsSlice: toggleLike success, response data:', data);
      return { postId, ...data };
    } catch (error) {
      console.error('postsSlice: toggleLike error:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const createRepost = createAsyncThunk(
  'posts/createRepost',
  async ({ postId, comment }, { rejectWithValue }) => {
    console.log('postsSlice: createRepost called for postId:', postId, 'comment:', comment);
    try {
      console.log('postsSlice: createRepost - About to call authenticatedFetch');
      const response = await authenticatedFetch(`/posts/${postId}/repost/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment: comment || '',
        }),
      });

      console.log('postsSlice: createRepost - Got response from authenticatedFetch:', response);
      console.log('postsSlice: createRepost - Response status:', response.status);
      console.log('postsSlice: createRepost - Response ok:', response.ok);

      if (!response.ok) {
        console.error('postsSlice: createRepost failed with status:', response.status);
        const errorText = await response.text();
        console.error('postsSlice: createRepost error response body:', errorText);
        throw new Error(`Failed to create repost: ${response.status} - ${errorText}`);
      }

      console.log('postsSlice: createRepost - About to parse JSON response');
      const data = await response.json();
      console.log('postsSlice: createRepost success, response data:', data);
      console.log('postsSlice: createRepost - Response data keys:', Object.keys(data));

      const result = { originalPostId: postId, ...data };
      console.log('postsSlice: createRepost - Final result to return:', result);

      return result;
    } catch (error) {
      console.error('postsSlice: createRepost error:', error);
      console.error('postsSlice: createRepost - Error type:', typeof error);
      console.error('postsSlice: createRepost - Error message:', error.message);
      console.error('postsSlice: createRepost - Error stack:', error.stack);
      // Extract more detailed error information
      let errorMessage = 'Failed to create repost';
      if (error.message && error.message.includes('Failed to create repost:')) {
        errorMessage = error.message;
      } else if (error.message) {
        errorMessage = `Failed to create repost: ${error.message}`;
      }
      return rejectWithValue(errorMessage);
    }
  }
);

export const toggleBookmark = createAsyncThunk(
  'posts/toggleBookmark',
  async (postId, { rejectWithValue }) => {
    console.log('postsSlice: toggleBookmark called for postId:', postId);
    try {
      const response = await authenticatedFetch(`/posts/${postId}/bookmark/`, {
        method: 'POST',
      });

      if (!response.ok) {
        console.error('postsSlice: toggleBookmark failed with status:', response.status);
        const errorText = await response.text();
        console.error('postsSlice: toggleBookmark error response body:', errorText);
        throw new Error(`Failed to toggle bookmark: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('postsSlice: toggleBookmark success, response data:', data);
      return { postId, ...data };
    } catch (error) {
      console.error('postsSlice: toggleBookmark error:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const recordView = createAsyncThunk(
  'posts/recordView',
  async ({ postId, viewType = 'feed' }, { rejectWithValue, getState }) => {
    const state = getState();
    const { viewTracking } = state.posts;

    // Check cooldown period
    const lastViewTime = viewTracking.lastViewTimes[postId];
    const now = Date.now();

    if (lastViewTime && (now - lastViewTime) < viewTracking.cooldownPeriod) {
      // Still in cooldown, don't record view
      return { postId, skipped: true };
    }

    try {
      const response = await authenticatedFetch(`/posts/${postId}/view/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          view_type: viewType,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to record view');
      }

      return { postId, viewType };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const logShare = createAsyncThunk(
  'posts/logShare',
  async ({ postId, platform }, { rejectWithValue }) => {
    console.log('postsSlice: logShare called for postId:', postId, 'platform:', platform);
    try {
      const response = await authenticatedFetch(`/posts/${postId}/share/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: platform || 'unknown',
        }),
      });

      if (!response.ok) {
        console.error('postsSlice: logShare failed with status:', response.status);
        throw new Error('Failed to log share');
      }

      const data = await response.json();
      console.log('postsSlice: logShare success, response data:', data);
      return { postId, ...data };
    } catch (error) {
      console.error('postsSlice: logShare error:', error);
      return rejectWithValue(error.message);
    }
  }
);

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    // Initialize post interaction state
        initializePostInteractions: (state, action) => {
          const { postId, isLiked, likesCount, isReposted, repostsCount, isBookmarked, viewsCount } = action.payload;

          // Only initialize if not already exists
          if (!state.interactions[postId]) {
            const newInteraction = {
              isLiked: isLiked || false,
              likesCount: likesCount || 0,
              isReposted: isReposted || false,
              repostsCount: repostsCount || 0,
              isBookmarked: isBookmarked || false,
              viewsCount: viewsCount || 0,
              shareCount: 0,
            };
            state.interactions[postId] = newInteraction;
          }
        },

    // Update post data from server
    updatePostData: (state, action) => {
      const { postId, data } = action.payload;

      if (state.interactions[postId]) {
        state.interactions[postId] = {
          ...state.interactions[postId],
          ...data,
        };
      }
    },

    // Optimistic updates for immediate UI feedback
    optimisticToggleLike: (state, action) => {
      const { postId } = action.payload;
      const interaction = state.interactions[postId];

      if (interaction) {
        interaction.isLiked = !interaction.isLiked;
        // For optimistic updates, we still increment/decrement locally
        // Server will return the correct aggregated count
        interaction.likesCount += interaction.isLiked ? 1 : -1;
      }
    },

    optimisticToggleRepost: (state, action) => {
      const { postId } = action.payload;
      const interaction = state.interactions[postId];

      if (interaction) {
        interaction.isReposted = !interaction.isReposted;
        // For reposts, we only track the status, not the count
        // Server will return the correct aggregated count
      }
    },

    optimisticToggleBookmark: (state, action) => {
      const { postId } = action.payload;
      const interaction = state.interactions[postId];

      if (interaction) {
        interaction.isBookmarked = !interaction.isBookmarked;
      }
    },

    // Revert optimistic updates on failure
    revertLikeToggle: (state, action) => {
      const { postId } = action.payload;
      const interaction = state.interactions[postId];

      if (interaction) {
        interaction.isLiked = !interaction.isLiked;
        // Revert the optimistic count change
        interaction.likesCount += interaction.isLiked ? -1 : 1;
      }
    },

    revertRepostToggle: (state, action) => {
      const { postId } = action.payload;
      const interaction = state.interactions[postId];

      if (interaction) {
        // Revert optimistic update: set back to false
        interaction.isReposted = false;
      }
    },

    revertBookmarkToggle: (state, action) => {
      const { postId } = action.payload;
      const interaction = state.interactions[postId];

      if (interaction) {
        interaction.isBookmarked = !interaction.isBookmarked;
      }
    },

    // Share management
    setShareCopied: (state, action) => {
      const { postId } = action.payload;
      state.share.copiedPostId = postId;
      state.share.copiedTimestamp = Date.now();
    },

    clearShareCopied: (state) => {
      state.share.copiedPostId = null;
      state.share.copiedTimestamp = null;
    },

    // Clear errors
    clearError: (state, action) => {
      const { errorType } = action.payload;
      state.errors[errorType] = null;
    },

    // Reset view tracking (useful for testing or manual reset)
    resetViewTracking: (state) => {
      state.viewTracking.viewedPosts = [];
      state.viewTracking.lastViewTimes = {};
    },
  },
  extraReducers: (builder) => {
    builder
      // Like toggle
      .addCase(toggleLike.pending, (state, action) => {
        const postId = action.meta.arg;
        if (!state.loading.liking.includes(postId)) {
          state.loading.liking.push(postId);
        }
        state.errors.like = null;
      })
      .addCase(toggleLike.fulfilled, (state, action) => {
        const { postId, isLiked, likes_count } = action.payload;
        state.loading.liking = state.loading.liking.filter(id => id !== postId);

        // Update with server response - server now returns aggregated metrics
        if (state.interactions[postId]) {
          state.interactions[postId].isLiked = isLiked;
          state.interactions[postId].likesCount = likes_count;
        } else {
          // Initialize if not exists
          state.interactions[postId] = {
            isLiked: isLiked,
            likesCount: likes_count,
            isReposted: false,
            repostsCount: 0,
            isBookmarked: false,
            viewsCount: 0,
            shareCount: 0,
          };
        }
      })
      .addCase(toggleLike.rejected, (state, action) => {
        const postId = action.meta.arg;
        state.loading.liking = state.loading.liking.filter(id => id !== postId);
        state.errors.like = action.payload;
      })

      // Create repost
      .addCase(createRepost.pending, (state, action) => {
        const { postId } = action.meta.arg;
        if (!state.loading.reposting.includes(postId)) {
          state.loading.reposting.push(postId);
        }
        state.errors.repost = null;

        // Optimistic update: Set isReposted to true for the original post
        // Note: Since all posts now show aggregated metrics from original post,
        // we only need to track the repost status, not increment counts
        if (state.interactions[postId]) {
          state.interactions[postId].isReposted = true;
        }

        console.log('postsSlice: createRepost.pending - PostId:', postId, 'State before:', state.interactions[postId]);
      })
      .addCase(createRepost.fulfilled, (state, action) => {
        const { originalPostId, repostCount, newPostId } = action.payload;
        state.loading.reposting = state.loading.reposting.filter(id => id !== originalPostId);

        console.log('postsSlice: createRepost.fulfilled - OriginalPostId:', originalPostId, 'RepostCount:', repostCount, 'NewPostId:', newPostId);
        console.log('postsSlice: createRepost.fulfilled - State before update:', state.interactions[originalPostId]);

        // Update repost status and sync aggregated metrics from server
        if (state.interactions[originalPostId]) {
          state.interactions[originalPostId].isReposted = true;
          // Server returns aggregated metrics, update all counts to match
          state.interactions[originalPostId].repostsCount = repostCount;
        }

        // Also update the new repost post if it exists in our state
        if (newPostId && state.interactions[newPostId]) {
          state.interactions[newPostId].isReposted = true;
          // Repost posts should show the same aggregated metrics as original
          state.interactions[newPostId].repostsCount = repostCount;
        }

        console.log('postsSlice: createRepost.fulfilled - State after update:', state.interactions[originalPostId]);
        console.log('postsSlice: New repost created with ID:', newPostId);
      })
      .addCase(createRepost.rejected, (state, action) => {
        const { postId } = action.meta.arg;
        state.loading.reposting = state.loading.reposting.filter(id => id !== postId);
        state.errors.repost = action.payload;

        console.log('postsSlice: createRepost.rejected - PostId:', postId, 'Error:', action.payload);

        // Revert optimistic updates on failure
        if (state.interactions[postId]) {
          state.interactions[postId].isReposted = false;
        }

        console.log('postsSlice: createRepost.rejected - State after revert:', state.interactions[postId]);
      })

      // Bookmark toggle
      .addCase(toggleBookmark.pending, (state, action) => {
        const postId = action.meta.arg;
        if (!state.loading.bookmarking.includes(postId)) {
          state.loading.bookmarking.push(postId);
        }
        state.errors.bookmark = null;
      })
      .addCase(toggleBookmark.fulfilled, (state, action) => {
        const { postId, isBookmarked } = action.payload;
        state.loading.bookmarking = state.loading.bookmarking.filter(id => id !== postId);

        if (state.interactions[postId]) {
          state.interactions[postId].isBookmarked = isBookmarked;
        } else {
          // Initialize if not exists
          state.interactions[postId] = {
            isLiked: false,
            likesCount: 0,
            isReposted: false,
            repostsCount: 0,
            isBookmarked: isBookmarked,
            viewsCount: 0,
            shareCount: 0,
          };
        }
      })
      .addCase(toggleBookmark.rejected, (state, action) => {
        const postId = action.meta.arg;
        state.loading.bookmarking = state.loading.bookmarking.filter(id => id !== postId);
        state.errors.bookmark = action.payload;
      })

      // View recording
      .addCase(recordView.pending, (state, action) => {
        const { postId } = action.meta.arg;
        if (!state.loading.viewing.includes(postId)) {
          state.loading.viewing.push(postId);
        }
        state.errors.view = null;
      })
      .addCase(recordView.fulfilled, (state, action) => {
        const { postId, skipped } = action.payload;
        state.loading.viewing = state.loading.viewing.filter(id => id !== postId);

        if (!skipped) {
          if (!state.viewTracking.viewedPosts.includes(postId)) {
            state.viewTracking.viewedPosts.push(postId);
          }
          state.viewTracking.lastViewTimes[postId] = Date.now();

          // Increment view count
          if (state.interactions[postId]) {
            state.interactions[postId].viewsCount += 1;
          }
        }
      })
      .addCase(recordView.rejected, (state, action) => {
        const { postId } = action.meta.arg;
        state.loading.viewing = state.loading.viewing.filter(id => id !== postId);
        state.errors.view = action.payload;
      })

      // Share logging
      .addCase(logShare.pending, (state, action) => {
        const { postId } = action.meta.arg;
        if (!state.loading.sharing.includes(postId)) {
          state.loading.sharing.push(postId);
        }
        state.errors.share = null;
      })
      .addCase(logShare.fulfilled, (state, action) => {
        const { postId, shareCount } = action.payload;
        state.loading.sharing = state.loading.sharing.filter(id => id !== postId);

        // Update with server response - server returns aggregated metrics
        if (state.interactions[postId]) {
          state.interactions[postId].shareCount = shareCount;
        } else {
          // Initialize if not exists
          state.interactions[postId] = {
            isLiked: false,
            likesCount: 0,
            isReposted: false,
            repostsCount: 0,
            isBookmarked: false,
            viewsCount: 0,
            shareCount: shareCount,
          };
        }
      })
      .addCase(logShare.rejected, (state, action) => {
        const { postId } = action.meta.arg;
        state.loading.sharing = state.loading.sharing.filter(id => id !== postId);
        state.errors.share = action.payload;
      });
  },
});

// Memoized selectors for optimized performance
export const selectPostInteraction = createSelector(
  [(state) => state.posts.interactions, (state, postId) => postId],
  (interactions, postId) => interactions[postId] || { isLiked: false, likesCount: 0, isReposted: false, repostsCount: 0, isBookmarked: false, viewsCount: 0, shareCount: 0 }
);

export const selectIsLiking = createSelector(
  [(state) => state.posts.loading.liking, (state, postId) => postId],
  (liking, postId) => liking.includes(postId)
);

export const selectIsReposting = createSelector(
  [(state) => state.posts.loading.reposting, (state, postId) => postId],
  (reposting, postId) => reposting.includes(postId)
);

export const selectIsBookmarking = createSelector(
  [(state) => state.posts.loading.bookmarking, (state, postId) => postId],
  (bookmarking, postId) => bookmarking.includes(postId)
);

export const selectIsShareCopied = createSelector(
  [(state) => state.posts.share, (state, postId) => postId],
  (share, postId) => {
    if (share.copiedPostId === postId) {
      // Check if copied within last 2 seconds
      const timeDiff = Date.now() - (share.copiedTimestamp || 0);
      return timeDiff < 2000;
    }
    return false;
  }
);

export const {
  initializePostInteractions,
  updatePostData,
  optimisticToggleLike,
  optimisticToggleRepost,
  optimisticToggleBookmark,
  revertLikeToggle,
  revertRepostToggle,
  revertBookmarkToggle,
  setShareCopied,
  clearShareCopied,
  clearError,
  resetViewTracking,
} = postsSlice.actions;

export default postsSlice.reducer;