// src/store/exploreSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authenticatedFetch, fetchTrends, fetchLeagues, fetchTeams, fetchAthletes, fetchSuggestedUsers } from '../components/lib/api';

const initialState = {
  // Data states
  data: {
    trends: [],
    leagues: [],
    teams: [],
    athletes: [],
    headlines: [],
    suggestedUsers: [],
  },

  // Loading states
  loading: {
    trends: false,
    leagues: false,
    teams: false,
    athletes: false,
    headlines: false,
    suggestedUsers: false,
  },

  // Error states
  errors: {
    trends: null,
    leagues: null,
    teams: null,
    athletes: null,
    headlines: null,
    suggestedUsers: null,
  },

  // Last fetch timestamps for caching
  lastFetched: {
    trends: null,
    leagues: null,
    teams: null,
    athletes: null,
    headlines: null,
    suggestedUsers: null,
  },

  // Default page management
  defaultPage: 'for-you', // Default tab for explore page

  // Search navigation state
  searchQuery: '', // Current search query
  isSearchActive: false, // Whether user is actively searching
};

// Async thunks for fetching explore data
export const fetchExploreTrends = createAsyncThunk(
  'explore/fetchTrends',
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchTrends();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchExploreLeagues = createAsyncThunk(
  'explore/fetchLeagues',
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchLeagues();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchExploreTeams = createAsyncThunk(
  'explore/fetchTeams',
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchTeams();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchExploreAthletes = createAsyncThunk(
  'explore/fetchAthletes',
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchAthletes();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchExploreHeadlines = createAsyncThunk(
  'explore/fetchHeadlines',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authenticatedFetch('/feed/home/?tab=for_you&page=1');
      if (!response.ok) {
        throw new Error('Failed to fetch headlines');
      }
      const data = await response.json();
      // Return first 3 posts as headlines
      return data.results?.slice(0, 3) || [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchExploreSuggestedUsers = createAsyncThunk(
  'explore/fetchSuggestedUsers',
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchSuggestedUsers();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const exploreSlice = createSlice({
  name: 'explore',
  initialState,
  reducers: {
    // Clear errors
    clearExploreError: (state, action) => {
      const { dataType } = action.payload;
      state.errors[dataType] = null;
    },

    // Reset explore data
    resetExploreData: (state) => {
      state.data = initialState.data;
      state.lastFetched = initialState.lastFetched;
    },

    // Update specific data
    updateExploreData: (state, action) => {
      const { dataType, data } = action.payload;
      state.data[dataType] = data;
      state.lastFetched[dataType] = Date.now();
    },

    // Set default page for explore
    setDefaultExplorePage: (state, action) => {
      state.defaultPage = action.payload;
    },

    // Update default page based on user preferences or analytics
    updateDefaultExplorePage: (state, action) => {
      const { page, reason } = action.payload;
      state.defaultPage = page;
      // Could log analytics here for page preference tracking
      console.log(`Default explore page updated to ${page} (${reason})`);
    },

    // Search navigation actions
    setSearchQuery: (state, action) => {
      const query = action.payload;
      state.searchQuery = query;
      state.isSearchActive = query.trim().length > 0;
    },

    clearSearch: (state) => {
      state.searchQuery = '';
      state.isSearchActive = false;
    },

    // Navigate to search or explore based on query
    navigateBasedOnSearch: (state, action) => {
      const { query, navigate } = action.payload;
      state.searchQuery = query;
      state.isSearchActive = query.trim().length > 0;

      // Handle navigation logic
      if (query.trim().length > 0) {
        navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      } else {
        navigate('/explore');
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Trends
      .addCase(fetchExploreTrends.pending, (state) => {
        state.loading.trends = true;
        state.errors.trends = null;
      })
      .addCase(fetchExploreTrends.fulfilled, (state, action) => {
        state.loading.trends = false;
        state.data.trends = action.payload;
        state.lastFetched.trends = Date.now();
      })
      .addCase(fetchExploreTrends.rejected, (state, action) => {
        state.loading.trends = false;
        state.errors.trends = action.payload;
      })

      // Leagues
      .addCase(fetchExploreLeagues.pending, (state) => {
        state.loading.leagues = true;
        state.errors.leagues = null;
      })
      .addCase(fetchExploreLeagues.fulfilled, (state, action) => {
        state.loading.leagues = false;
        state.data.leagues = action.payload;
        state.lastFetched.leagues = Date.now();
      })
      .addCase(fetchExploreLeagues.rejected, (state, action) => {
        state.loading.leagues = false;
        state.errors.leagues = action.payload;
      })

      // Teams
      .addCase(fetchExploreTeams.pending, (state) => {
        state.loading.teams = true;
        state.errors.teams = null;
      })
      .addCase(fetchExploreTeams.fulfilled, (state, action) => {
        state.loading.teams = false;
        state.data.teams = action.payload;
        state.lastFetched.teams = Date.now();
      })
      .addCase(fetchExploreTeams.rejected, (state, action) => {
        state.loading.teams = false;
        state.errors.teams = action.payload;
      })

      // Athletes
      .addCase(fetchExploreAthletes.pending, (state) => {
        state.loading.athletes = true;
        state.errors.athletes = null;
      })
      .addCase(fetchExploreAthletes.fulfilled, (state, action) => {
        state.loading.athletes = false;
        state.data.athletes = action.payload;
        state.lastFetched.athletes = Date.now();
      })
      .addCase(fetchExploreAthletes.rejected, (state, action) => {
        state.loading.athletes = false;
        state.errors.athletes = action.payload;
      })

      // Headlines
      .addCase(fetchExploreHeadlines.pending, (state) => {
        state.loading.headlines = true;
        state.errors.headlines = null;
      })
      .addCase(fetchExploreHeadlines.fulfilled, (state, action) => {
        state.loading.headlines = false;
        state.data.headlines = action.payload;
        state.lastFetched.headlines = Date.now();
      })
      .addCase(fetchExploreHeadlines.rejected, (state, action) => {
        state.loading.headlines = false;
        state.errors.headlines = action.payload;
      })

      // Suggested Users
      .addCase(fetchExploreSuggestedUsers.pending, (state) => {
        state.loading.suggestedUsers = true;
        state.errors.suggestedUsers = null;
      })
      .addCase(fetchExploreSuggestedUsers.fulfilled, (state, action) => {
        state.loading.suggestedUsers = false;
        state.data.suggestedUsers = action.payload;
        state.lastFetched.suggestedUsers = Date.now();
      })
      .addCase(fetchExploreSuggestedUsers.rejected, (state, action) => {
        state.loading.suggestedUsers = false;
        state.errors.suggestedUsers = action.payload;
      });
  },
});

// Selectors
export const selectExploreData = (state) => state.explore.data;
export const selectExploreLoading = (state) => state.explore.loading;
export const selectExploreErrors = (state) => state.explore.errors;
export const selectExploreLastFetched = (state) => state.explore.lastFetched;

export const selectExploreTrends = (state) => state.explore.data.trends;
export const selectExploreLeagues = (state) => state.explore.data.leagues;
export const selectExploreTeams = (state) => state.explore.data.teams;
export const selectExploreAthletes = (state) => state.explore.data.athletes;
export const selectExploreHeadlines = (state) => state.explore.data.headlines;
export const selectExploreSuggestedUsers = (state) => state.explore.data.suggestedUsers;

export const selectExploreLoadingTrends = (state) => state.explore.loading.trends;
export const selectExploreLoadingLeagues = (state) => state.explore.loading.leagues;
export const selectExploreLoadingTeams = (state) => state.explore.loading.teams;
export const selectExploreLoadingAthletes = (state) => state.explore.loading.athletes;
export const selectExploreLoadingHeadlines = (state) => state.explore.loading.headlines;
export const selectExploreLoadingSuggestedUsers = (state) => state.explore.loading.suggestedUsers;

export const selectDefaultExplorePage = (state) => state.explore.defaultPage;
export const selectSearchQuery = (state) => state.explore.searchQuery;
export const selectIsSearchActive = (state) => state.explore.isSearchActive;

export const {
  clearExploreError,
  resetExploreData,
  updateExploreData,
  setDefaultExplorePage,
  updateDefaultExplorePage,
  setSearchQuery,
  clearSearch,
  navigateBasedOnSearch,
} = exploreSlice.actions;

export default exploreSlice.reducer;