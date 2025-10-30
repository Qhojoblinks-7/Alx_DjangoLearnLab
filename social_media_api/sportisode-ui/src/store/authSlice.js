// src/store/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_BASE_URL = 'http://localhost:8000';

// Async Thunk for Registration
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async ({ username, email, password }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/accounts/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Registration failed.');
      }

      const data = await response.json();
      return { ...data, username }; // Returns { token, user details }
    } catch  {
      return rejectWithValue('Network error: Could not connect to Django server.');
    }
  }
);

// Async Thunk for Login
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/accounts/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Django's default 401 error message might be empty, so we provide a fallback
        return rejectWithValue(errorData.error || 'Invalid credentials.');
      }

      const data = await response.json();
      return { ...data, username }; // Returns { token, user_id, username }
    } catch{
      return rejectWithValue('Network error: Could not connect to Django server.');
    }
  }
);

// Async Thunk for Token Validation and User Data Fetching
export const validateToken = createAsyncThunk(
  'auth/validateToken',
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue('No token found');
      }

      // Try to fetch user profile to validate token
      const response = await fetch(`${API_BASE_URL}/accounts/profile/`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        // Token is invalid, clear it
        localStorage.removeItem('authToken');
        return rejectWithValue('Invalid token');
      }

      const userData = await response.json();
      return { user: userData, token };
    } catch {
      // Clear invalid token
      localStorage.removeItem('authToken');
      return rejectWithValue('Network error or invalid token');
    }
  }
);

// Initial State (Reads persisted token from localStorage but doesn't assume authentication)
const initialState = {
  token: localStorage.getItem('authToken') || null,
  user: null,
  isAuthenticated: false, // Will be validated on app start
  loading: localStorage.getItem('authToken') ? 'pending' : 'idle', // If token exists, we're validating
  error: null,
};

// Auth Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('authToken');
    },
    updateUserProfile: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Register cases
      .addCase(registerUser.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        state.token = action.payload.token;
        state.isAuthenticated = true;
        localStorage.setItem('authToken', action.payload.token);
        state.user = { id: action.payload.id, username: action.payload.username };
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload;
        state.token = null;
        state.isAuthenticated = false;
        localStorage.removeItem('authToken');
      })
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        state.token = action.payload.token;
        state.isAuthenticated = true;
        localStorage.setItem('authToken', action.payload.token);
        state.user = { id: action.payload.user_id, username: action.payload.username };
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload;
        state.token = null;
        state.isAuthenticated = false;
        localStorage.removeItem('authToken');
      })
      // Validate token cases
      .addCase(validateToken.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(validateToken.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(validateToken.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload;
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
        localStorage.removeItem('authToken');
      });
  },
});

export const { logout, updateUserProfile } = authSlice.actions;
export default authSlice.reducer;