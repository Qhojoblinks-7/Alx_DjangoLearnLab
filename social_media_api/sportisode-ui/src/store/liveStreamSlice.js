// src/store/liveStreamSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchLiveStreams, createLiveStream } from '../components/lib/api';

// Async thunks for API calls
export const fetchLiveStreamsAsync = createAsyncThunk(
  'liveStream/fetchLiveStreams',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchLiveStreams();
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createLiveStreamAsync = createAsyncThunk(
  'liveStream/createLiveStream',
  async (streamData, { rejectWithValue }) => {
    try {
      const response = await createLiveStream(streamData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  // Live streams list
  liveStreams: [],
  liveStreamsLoading: false,
  liveStreamsError: null,

  // Individual stream details
  currentStream: null,
  currentStreamLoading: false,
  currentStreamError: null,

  // Stream creation
  creatingStream: false,
  createStreamError: null,
  createdStream: null,

  // Real-time data
  viewerCounts: {}, // { streamId: count }
  streamStatuses: {}, // { streamId: status }
  chatMessages: {}, // { streamId: [messages] }

  // WebSocket connections
  wsConnections: {}, // { streamId: { isConnected: boolean, lastHeartbeat: timestamp } }

  // UI state
  activeModal: null, // 'create' | 'broadcasting' | null
  selectedStreamId: null,
};

const liveStreamSlice = createSlice({
  name: 'liveStream',
  initialState,
  reducers: {
    // Live streams list management
    setLiveStreams: (state, action) => {
      state.liveStreams = action.payload;
    },

    addLiveStream: (state, action) => {
      state.liveStreams.unshift(action.payload);
    },

    removeLiveStream: (state, action) => {
      state.liveStreams = state.liveStreams.filter(stream => stream.id !== action.payload);
    },

    updateLiveStream: (state, action) => {
      const index = state.liveStreams.findIndex(stream => stream.id === action.payload.id);
      if (index !== -1) {
        state.liveStreams[index] = { ...state.liveStreams[index], ...action.payload };
      }
    },

    // Current stream management
    setCurrentStream: (state, action) => {
      state.currentStream = action.payload;
      state.currentStreamLoading = false;
      state.currentStreamError = null;
    },

    clearCurrentStream: (state) => {
      state.currentStream = null;
      state.currentStreamLoading = false;
      state.currentStreamError = null;
    },

    // Real-time viewer count updates
    updateViewerCount: (state, action) => {
      const { streamId, count } = action.payload;
      state.viewerCounts[streamId] = count;

      // Update in live streams list
      const streamIndex = state.liveStreams.findIndex(stream => stream.id === streamId);
      if (streamIndex !== -1) {
        state.liveStreams[streamIndex].viewer_count = count;
      }

      // Update current stream if it's the active one
      if (state.currentStream && state.currentStream.id === streamId) {
        state.currentStream.viewer_count = count;
      }
    },

    // Real-time stream status updates
    updateStreamStatus: (state, action) => {
      const { streamId, status, is_live, viewer_count } = action.payload;
      state.streamStatuses[streamId] = { status, is_live, viewer_count };

      // Update in live streams list
      const streamIndex = state.liveStreams.findIndex(stream => stream.id === streamId);
      if (streamIndex !== -1) {
        state.liveStreams[streamIndex] = {
          ...state.liveStreams[streamIndex],
          status,
          is_live,
          viewer_count: viewer_count ?? state.liveStreams[streamIndex].viewer_count
        };
      }

      // Update current stream if it's the active one
      if (state.currentStream && state.currentStream.id === streamId) {
        state.currentStream = {
          ...state.currentStream,
          status,
          is_live,
          viewer_count: viewer_count ?? state.currentStream.viewer_count
        };
      }
    },

    // Chat message management
    addChatMessage: (state, action) => {
      const { streamId, message } = action.payload;
      if (!state.chatMessages[streamId]) {
        state.chatMessages[streamId] = [];
      }

      // Keep only last 50 messages
      state.chatMessages[streamId].push(message);
      if (state.chatMessages[streamId].length > 50) {
        state.chatMessages[streamId] = state.chatMessages[streamId].slice(-50);
      }
    },

    clearChatMessages: (state, action) => {
      const { streamId } = action.payload;
      state.chatMessages[streamId] = [];
    },

    // WebSocket connection management
    setWsConnection: (state, action) => {
      const { streamId, isConnected, lastHeartbeat } = action.payload;
      state.wsConnections[streamId] = {
        isConnected,
        lastHeartbeat: lastHeartbeat || Date.now()
      };
    },

    updateWsHeartbeat: (state, action) => {
      const { streamId } = action.payload;
      if (state.wsConnections[streamId]) {
        state.wsConnections[streamId].lastHeartbeat = Date.now();
      }
    },

    // UI state management
    setActiveModal: (state, action) => {
      state.activeModal = action.payload;
    },

    setSelectedStreamId: (state, action) => {
      state.selectedStreamId = action.payload;
    },

    // Stream creation modal state
    setCreatedStream: (state, action) => {
      state.createdStream = action.payload;
      state.activeModal = 'broadcasting';
    },

    clearCreatedStream: (state) => {
      state.createdStream = null;
      state.activeModal = null;
    },

    // Reset all state
    resetLiveStreamState: () => initialState,
  },

  extraReducers: (builder) => {
    builder
      // Fetch live streams
      .addCase(fetchLiveStreamsAsync.pending, (state) => {
        state.liveStreamsLoading = true;
        state.liveStreamsError = null;
      })
      .addCase(fetchLiveStreamsAsync.fulfilled, (state, action) => {
        state.liveStreamsLoading = false;
        state.liveStreams = action.payload;
        state.liveStreamsError = null;
      })
      .addCase(fetchLiveStreamsAsync.rejected, (state, action) => {
        state.liveStreamsLoading = false;
        state.liveStreamsError = action.payload;
      })

      // Create live stream
      .addCase(createLiveStreamAsync.pending, (state) => {
        state.creatingStream = true;
        state.createStreamError = null;
      })
      .addCase(createLiveStreamAsync.fulfilled, (state, action) => {
        state.creatingStream = false;
        state.createdStream = action.payload;
        state.activeModal = 'broadcasting';
        state.createStreamError = null;

        // Add to live streams list if it's live
        if (action.payload.is_live) {
          state.liveStreams.unshift(action.payload);
        }
      })
      .addCase(createLiveStreamAsync.rejected, (state, action) => {
        state.creatingStream = false;
        state.createStreamError = action.payload;
      });
  },
});

// Action creators
export const {
  setLiveStreams,
  addLiveStream,
  removeLiveStream,
  updateLiveStream,
  setCurrentStream,
  clearCurrentStream,
  updateViewerCount,
  updateStreamStatus,
  addChatMessage,
  clearChatMessages,
  setWsConnection,
  updateWsHeartbeat,
  setActiveModal,
  setSelectedStreamId,
  setCreatedStream,
  clearCreatedStream,
  resetLiveStreamState,
} = liveStreamSlice.actions;

// Selectors
export const selectLiveStreams = (state) => state.liveStream.liveStreams;
export const selectLiveStreamsLoading = (state) => state.liveStream.liveStreamsLoading;
export const selectLiveStreamsError = (state) => state.liveStream.liveStreamsError;

export const selectCurrentStream = (state) => state.liveStream.currentStream;
export const selectCurrentStreamLoading = (state) => state.liveStream.currentStreamLoading;
export const selectCurrentStreamError = (state) => state.liveStream.currentStreamError;

export const selectCreatingStream = (state) => state.liveStream.creatingStream;
export const selectCreateStreamError = (state) => state.liveStream.createStreamError;
export const selectCreatedStream = (state) => state.liveStream.createdStream;

export const selectViewerCount = (streamId) => (state) => state.liveStream.viewerCounts[streamId] || 0;
export const selectStreamStatus = (streamId) => (state) => state.liveStream.streamStatuses[streamId];
export const selectChatMessages = (streamId) => (state) => state.liveStream.chatMessages[streamId] || [];

export const selectWsConnection = (streamId) => (state) => state.liveStream.wsConnections[streamId];
export const selectActiveModal = (state) => state.liveStream.activeModal;
export const selectSelectedStreamId = (state) => state.liveStream.selectedStreamId;

export default liveStreamSlice.reducer;