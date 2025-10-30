// src/store/commentsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authenticatedFetch } from '../components/lib/api';

const initialState = {
  // Comments data by post
  comments: {
    // Structure: { postId: { list: [ {id: 'c1', content: '...', replyCount: 3, replies: { loaded: false, list: [] }}, {id: 'c2', content: '...', replyCount: 0} ] } }
  },

  // Comment composition state - per post
  composition: {
    // Structure: { postId: { newComment: '', replyingTo: null, showUserSuggestions: false, suggestions: [], cursorPosition: 0 } }
  },

  // UI state
  ui: {
    collapsedThreads: [], // Array of comment IDs that are collapsed
    taggedUsers: [], // Available users for tagging
  },

  // Loading states
  loading: {
    fetchingComments: false,
    postingComment: false,
    likingComment: [], // Array of comment IDs being liked
    fetchingReplies: [], // Array of comment IDs whose replies are being fetched
    editingComment: false,
    deletingComment: false,
  },

  // Errors
  errors: {
    fetchComments: null,
    postComment: null,
    likeComment: null,
    fetchReplies: null,
    editComment: null,
    deleteComment: null,
  },
};

// Async thunks
export const fetchComments = createAsyncThunk(
  'comments/fetchComments',
  async (postId, { rejectWithValue }) => {
    try {
      const response = await authenticatedFetch(`/posts/${postId}/comments/`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      const data = await response.json();
      return { postId, comments: data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const postComment = createAsyncThunk(
  'comments/postComment',
  async ({ postId, content, parentCommentId }, { rejectWithValue }) => {
    try {
      const commentData = {
        content,
        ...(parentCommentId && { parentId: parentCommentId })
      };

      const response = await authenticatedFetch(`/posts/${postId}/comments/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commentData),
      });

      if (!response.ok) {
        throw new Error('Failed to post comment');
      }

      const data = await response.json();
      return { postId, comment: data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const likeComment = createAsyncThunk(
  'comments/likeComment',
  async (commentId, { rejectWithValue }) => {
    try {
      const response = await authenticatedFetch(`/posts/comments/${commentId}/like/`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to like comment');
      }

      const data = await response.json();
      return { commentId, ...data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUsersForTagging = createAsyncThunk(
  'comments/fetchUsersForTagging',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authenticatedFetch('/accounts/users/');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchCommentReplies = createAsyncThunk(
  'comments/fetchCommentReplies',
  async ({ commentId, limit = 5, offset = 0 }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
      const response = await authenticatedFetch(`/posts/comments/${commentId}/replies/?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch comment replies');
      }
      const data = await response.json();
      console.log('fetchCommentReplies: API response for comment', commentId, ':', data);
      return { commentId, replies: data.replies || data, count: data.count || (data.replies || data).length };
    } catch (error) {
      console.error('fetchCommentReplies: Error fetching replies for comment', commentId, ':', error);
      return rejectWithValue(error.message);
    }
  }
);

export const editComment = createAsyncThunk(
  'comments/editComment',
  async ({ commentId, content, postId }, { rejectWithValue }) => {
    try {
      const response = await authenticatedFetch(`/posts/${postId}/comments/${commentId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error('Failed to edit comment');
      }

      const data = await response.json();
      return { commentId, comment: data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteComment = createAsyncThunk(
  'comments/deleteComment',
  async ({ commentId, postId }, { rejectWithValue }) => {
    try {
      const response = await authenticatedFetch(`/posts/${postId}/comments/${commentId}/`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete comment');
      }

      return commentId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const commentsSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {
    // Composition state management - per post
    setNewComment: (state, action) => {
      const { postId, comment } = action.payload;
      if (!state.composition[postId]) {
        state.composition[postId] = { newComment: '', replyingTo: null, showUserSuggestions: false, suggestions: [], cursorPosition: 0 };
      }
      state.composition[postId].newComment = comment;
    },

    setReplyingTo: (state, action) => {
      const { postId, replyingTo } = action.payload;
      if (!state.composition[postId]) {
        state.composition[postId] = { newComment: '', replyingTo: null, showUserSuggestions: false, suggestions: [], cursorPosition: 0 };
      }
      state.composition[postId].replyingTo = replyingTo;
    },

    clearReply: (state, action) => {
      const { postId } = action.payload;
      if (state.composition[postId]) {
        state.composition[postId].replyingTo = null;
        state.composition[postId].newComment = '';
      }
    },

    setCursorPosition: (state, action) => {
      state.composition.cursorPosition = action.payload;
    },

    setShowUserSuggestions: (state, action) => {
      state.composition.showUserSuggestions = action.payload;
    },

    setSuggestions: (state, action) => {
      state.composition.suggestions = action.payload;
    },

    // UI state management
    toggleThreadCollapse: (state, action) => {
      const commentId = action.payload;
      const index = state.ui.collapsedThreads.indexOf(commentId);
      if (index > -1) {
        state.ui.collapsedThreads.splice(index, 1);
      } else {
        state.ui.collapsedThreads.push(commentId);
      }
    },

    setTaggedUsers: (state, action) => {
      state.ui.taggedUsers = action.payload;
    },

    // Clear composition state for a specific post
    resetComposition: (state, action) => {
      const { postId } = action.payload;
      if (state.composition[postId]) {
        state.composition[postId] = { newComment: '', replyingTo: null, showUserSuggestions: false, suggestions: [], cursorPosition: 0 };
      }
    },

    // Clear errors
    clearError: (state, action) => {
      const { errorType } = action.payload;
      state.errors[errorType] = null;
    },

    // Reset comments for a post
    resetPostComments: (state, action) => {
      const postId = action.payload;
      if (state.comments[postId]) {
        state.comments[postId] = {
          comments: [],
          loading: false,
          error: null,
        };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch comments
      .addCase(fetchComments.pending, (state, action) => {
        const postId = action.meta.arg;
        if (!state.comments[postId]) {
          state.comments[postId] = { comments: [], loading: false, error: null };
        }
        state.comments[postId].loading = true;
        state.errors.fetchComments = null;
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        const { postId, comments } = action.payload;
        // Handle paginated response - extract results array and metadata
        const commentsArray = comments.results || comments;

        // Transform comments to include replies structure
        const transformedComments = (Array.isArray(commentsArray) ? commentsArray : []).map(comment => ({
          ...comment,
          replies: {
            loaded: false,
            list: [],
            count: comment.reply_count || 0,
          }
        }));

        state.comments[postId] = {
          list: transformedComments,
          count: comments.count || transformedComments.length,
          loading: false,
          error: null,
        };
        console.log('fetchComments.fulfilled: Updated state for post', postId, 'with', transformedComments.length, 'comments');
      })
      .addCase(fetchComments.rejected, (state, action) => {
        const postId = action.meta.arg;
        if (state.comments[postId]) {
          state.comments[postId].loading = false;
          state.comments[postId].error = action.payload;
        }
        state.errors.fetchComments = action.payload;
      })

      // Post comment
      .addCase(postComment.pending, (state) => {
        state.loading.postingComment = true;
        state.errors.postComment = null;
      })
      .addCase(postComment.fulfilled, (state, action) => {
        const { postId, comment } = action.payload;
        state.loading.postingComment = false;

        // Add new comment to the appropriate location
        if (comment.parentId) {
          // It's a reply - find the parent and add to replies
          const addReplyToComments = (comments) => {
            return comments.map(c => {
              if (c.id === comment.parentId) {
                return {
                  ...c,
                  replies: {
                    ...c.replies,
                    list: [...(c.replies?.list || []), comment],
                    count: (c.replies?.count || 0) + 1,
                  },
                  reply_count: (c.reply_count || 0) + 1,
                };
              } else if (c.replies?.list) {
                return {
                  ...c,
                  replies: {
                    ...c.replies,
                    list: addReplyToComments(c.replies.list)
                  }
                };
              }
              return c;
            });
          };

          if (state.comments[postId]) {
            state.comments[postId].list = addReplyToComments(state.comments[postId].list);
          }
        } else {
          // It's a top-level comment
          if (state.comments[postId]) {
            const newComment = {
              ...comment,
              replies: {
                loaded: false,
                list: [],
                count: comment.reply_count || 0,
              }
            };
            state.comments[postId].list.unshift(newComment);
          }
        }

        // Clear composition state for the specific post
        if (state.composition[postId]) {
          state.composition[postId].newComment = '';
          state.composition[postId].replyingTo = null;
        }
      })
      .addCase(postComment.rejected, (state, action) => {
        state.loading.postingComment = false;
        state.errors.postComment = action.payload;
      })

      // Like comment
      .addCase(likeComment.pending, (state, action) => {
        const commentId = action.meta.arg;
        if (!state.loading.likingComment.includes(commentId)) {
          state.loading.likingComment.push(commentId);
        }
        state.errors.likeComment = null;
      })
      .addCase(likeComment.fulfilled, (state, action) => {
        const { commentId, likes_count, is_liked } = action.payload;
        state.loading.likingComment = state.loading.likingComment.filter(id => id !== commentId);

        // Update like count in comments (recursive for nested comments)
        const updateCommentLikes = (comments) => {
          return comments.map(comment => {
            if (comment.id === commentId) {
              return { ...comment, likes_count, is_liked };
            } else if (comment.replies?.list) {
              return {
                ...comment,
                replies: {
                  ...comment.replies,
                  list: updateCommentLikes(comment.replies.list)
                }
              };
            }
            return comment;
          });
        };

        // Update in all posts
        Object.keys(state.comments).forEach(postId => {
          if (state.comments[postId].list) {
            state.comments[postId].list = updateCommentLikes(state.comments[postId].list);
          }
        });
      })
      .addCase(likeComment.rejected, (state, action) => {
        const commentId = action.meta.arg;
        state.loading.likingComment = state.loading.likingComment.filter(id => id !== commentId);
        state.errors.likeComment = action.payload;
      })

      // Fetch users for tagging
      .addCase(fetchUsersForTagging.fulfilled, (state, action) => {
        state.ui.taggedUsers = action.payload;
      })

      // Fetch comment replies
      .addCase(fetchCommentReplies.pending, (state, action) => {
        const commentId = action.meta.arg.commentId;
        if (!state.loading.fetchingReplies.includes(commentId)) {
          state.loading.fetchingReplies.push(commentId);
        }
        state.errors.fetchReplies = null;
      })
      .addCase(fetchCommentReplies.fulfilled, (state, action) => {
        const { commentId, replies, count } = action.payload;
        console.log('fetchCommentReplies.fulfilled: Updating state for comment', commentId, 'with replies:', replies, 'count:', count);
        state.loading.fetchingReplies = state.loading.fetchingReplies.filter(id => id !== commentId);

        // Update replies for the specific comment
        const updateCommentReplies = (comments) => {
          return comments.map(comment => {
            if (comment.id === commentId) {
              console.log('fetchCommentReplies.fulfilled: Found comment', commentId, 'updating replies');
              return {
                ...comment,
                replies: {
                  loaded: true,
                  list: replies,
                  count: count,
                }
              };
            } else if (comment.replies?.list) {
              return {
                ...comment,
                replies: {
                  ...comment.replies,
                  list: updateCommentReplies(comment.replies.list)
                }
              };
            }
            return comment;
          });
        };

        // Update in all posts
        Object.keys(state.comments).forEach(postId => {
          if (state.comments[postId].list) {
            console.log('fetchCommentReplies.fulfilled: Updating post', postId, 'comments');
            state.comments[postId].list = updateCommentReplies(state.comments[postId].list);
          }
        });
      })
      .addCase(fetchCommentReplies.rejected, (state, action) => {
        const commentId = action.meta.arg.commentId;
        state.loading.fetchingReplies = state.loading.fetchingReplies.filter(id => id !== commentId);
        state.errors.fetchReplies = action.payload;
      })

      // Edit comment
      .addCase(editComment.pending, (state) => {
        state.loading.editingComment = true;
        state.errors.editComment = null;
      })
      .addCase(editComment.fulfilled, (state, action) => {
        const { commentId, comment } = action.payload;
        state.loading.editingComment = false;

        // Update comment content in all posts
        const updateCommentContent = (comments) => {
          return comments.map(c => {
            if (c.id === commentId) {
              return { ...c, ...comment };
            } else if (c.replies?.list) {
              return {
                ...c,
                replies: {
                  ...c.replies,
                  list: updateCommentContent(c.replies.list)
                }
              };
            }
            return c;
          });
        };

        Object.keys(state.comments).forEach(postId => {
          if (state.comments[postId].list) {
            state.comments[postId].list = updateCommentContent(state.comments[postId].list);
          }
        });
      })
      .addCase(editComment.rejected, (state, action) => {
        state.loading.editingComment = false;
        state.errors.editComment = action.payload;
      })

      // Delete comment
      .addCase(deleteComment.pending, (state) => {
        state.loading.deletingComment = true;
        state.errors.deleteComment = null;
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        const commentId = action.payload;
        state.loading.deletingComment = false;

        // Remove comment from all posts
        const removeComment = (comments) => {
          return comments.filter(c => {
            if (c.id === commentId) {
              return false; // Remove this comment
            } else if (c.replies?.list) {
              c.replies.list = removeComment(c.replies.list);
              c.replies.count = c.replies.list.length;
              c.reply_count = c.replies.count;
            }
            return true;
          });
        };

        Object.keys(state.comments).forEach(postId => {
          if (state.comments[postId].list) {
            state.comments[postId].list = removeComment(state.comments[postId].list);
            state.comments[postId].count = state.comments[postId].list.length;
          }
        });
      })
      .addCase(deleteComment.rejected, (state, action) => {
        state.loading.deletingComment = false;
        state.errors.deleteComment = action.payload;
      });
  },
});

export const {
  setNewComment,
  setReplyingTo,
  clearReply,
  setCursorPosition,
  setShowUserSuggestions,
  setSuggestions,
  toggleThreadCollapse,
  setTaggedUsers,
  resetComposition,
  clearError,
  resetPostComments,
} = commentsSlice.actions;

export default commentsSlice.reducer;