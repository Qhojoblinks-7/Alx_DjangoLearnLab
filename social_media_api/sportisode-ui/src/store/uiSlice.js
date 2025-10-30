// src/store/uiSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Modal and drawer states
  modals: {
    postComment: {
      isOpen: false,
      post: null,
    },
    postDetail: {
      isOpen: false,
      post: null,
    },
    createPost: {
      isOpen: false,
    },
    editProfile: {
      isOpen: false,
    },
    listsModal: {
      isOpen: false,
      mode: 'create', // 'create' or 'edit'
      list: null,
    },
  },

  // Responsive breakpoints
  device: {
    isDesktop: false,
    isTablet: false,
    isMobile: true,
    screenWidth: 0,
  },

  // UI preferences
  preferences: {
    theme: 'dark', // 'light' or 'dark'
    reducedMotion: false,
    highContrast: false,
  },

  // Loading states
  loading: {
    global: false,
    specific: {}, // { 'actionName': true/false }
  },

  // Notifications/toasts
  notifications: [],

  // Navigation state
  navigation: {
    activeTab: 'feed',
    previousTab: null,
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Modal actions
    openModal: (state, action) => {
      const { modalType, data } = action.payload;
      if (state.modals[modalType]) {
        state.modals[modalType] = {
          ...state.modals[modalType],
          isOpen: true,
          ...data,
        };
      }
    },

    closeModal: (state, action) => {
      const { modalType } = action.payload;
      if (state.modals[modalType]) {
        state.modals[modalType] = {
          ...state.modals[modalType],
          isOpen: false,
        };
      }
    },

    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(modalType => {
        state.modals[modalType].isOpen = false;
      });
    },

    // Device/responsive actions
    setDeviceType: (state, action) => {
      const { screenWidth } = action.payload;
      state.device = {
        isDesktop: screenWidth >= 1024,
        isTablet: screenWidth >= 768 && screenWidth < 1024,
        isMobile: screenWidth < 768,
        screenWidth,
      };
    },

    // UI preferences
    setTheme: (state, action) => {
      state.preferences.theme = action.payload;
    },

    toggleReducedMotion: (state) => {
      state.preferences.reducedMotion = !state.preferences.reducedMotion;
    },

    toggleHighContrast: (state) => {
      state.preferences.highContrast = !state.preferences.highContrast;
    },

    // Loading states
    setGlobalLoading: (state, action) => {
      state.loading.global = action.payload;
    },

    setSpecificLoading: (state, action) => {
      const { actionName, isLoading } = action.payload;
      state.loading.specific[actionName] = isLoading;
    },

    // Notifications
    addNotification: (state, action) => {
      const notification = {
        id: Date.now(),
        ...action.payload,
        timestamp: new Date().toISOString(),
      };
      state.notifications.push(notification);
    },

    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },

    clearNotifications: (state) => {
      state.notifications = [];
    },

    // Navigation
    setActiveTab: (state, action) => {
      state.navigation.previousTab = state.navigation.activeTab;
      state.navigation.activeTab = action.payload;
    },
  },
});

export const {
  openModal,
  closeModal,
  closeAllModals,
  setDeviceType,
  setTheme,
  toggleReducedMotion,
  toggleHighContrast,
  setGlobalLoading,
  setSpecificLoading,
  addNotification,
  removeNotification,
  clearNotifications,
  setActiveTab,
} = uiSlice.actions;

export default uiSlice.reducer;