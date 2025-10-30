// src/store/formsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authenticatedFetch, getUploadURL, uploadToS3 } from '../components/lib/api';
import { loginUser, registerUser } from './authSlice';

const initialState = {
  // Login form
  login: {
    username: '',
    password: '',
    errors: {},
    touched: {},
    isSubmitting: false,
    submitError: null,
  },

  // Register form
  register: {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    birthDate: '',
    errors: {},
    touched: {},
    isSubmitting: false,
    submitError: null,
  },

  // Post creation form
  postCreation: {
    content: '',
    mediaFiles: [],
    mediaPreviews: [],
    uploads: [], // Track upload status for each file
    isSubmitting: false,
    submitError: null,
  },

  // Profile edit form
  profileEdit: {
    username: '',
    bio: '',
    location: '',
    website: '',
    birthDate: '',
    gender: '',
    profilePicture: null,
    bannerImage: null,
    profilePicturePreview: null,
    bannerImagePreview: null,
    errors: {},
    touched: {},
    isSubmitting: false,
    submitError: null,
  },

  // General form utilities (patterns moved out of state for serializability)
  validationRules: {
    email: {
      required: true,
      pattern: '/^[^\s@]+@[^\s@]+\.[^\s@]+$/',
      message: 'Please enter a valid email address',
    },
    password: {
      required: true,
      minLength: 8,
      message: 'Password must be at least 8 characters long',
    },
    username: {
      required: true,
      minLength: 3,
      maxLength: 30,
      pattern: '/^[a-zA-Z0-9_]+$/',
      message: 'Username must be 3-30 characters and contain only letters, numbers, and underscores',
    },
  },
};

// Async thunks for form submissions
export const submitLogin = createAsyncThunk(
  'forms/submitLogin',
  async (credentials, { dispatch, rejectWithValue }) => {
    try {
      // Dispatch the auth login action
      const resultAction = await dispatch(loginUser(credentials));

      if (loginUser.fulfilled.match(resultAction)) {
        return resultAction.payload;
      } else {
        return rejectWithValue(resultAction.payload);
      }
    } catch (error) {
      return rejectWithValue({ non_field_errors: ['Network error. Please try again.'] });
    }
  }
);

export const submitRegister = createAsyncThunk(
  'forms/submitRegister',
  async (userData, { dispatch, rejectWithValue }) => {
    try {
      // Dispatch the auth register action
      const resultAction = await dispatch(registerUser(userData));

      if (registerUser.fulfilled.match(resultAction)) {
        return resultAction.payload;
      } else {
        return rejectWithValue(resultAction.payload);
      }
    } catch {
      return rejectWithValue({ non_field_errors: ['Network error. Please try again.'] });
    }
  }
);

export const uploadMediaToS3 = createAsyncThunk(
  'forms/uploadMediaToS3',
  async ({ file, fileIndex }, { rejectWithValue }) => {
    try {
      // Get upload URL from backend
      const { upload_url, key } = await getUploadURL(file.name, file.type);

      // Upload file directly to S3
      await uploadToS3(file, upload_url);

      return { key, fileName: file.name, fileIndex };
    } catch (error) {
      return rejectWithValue({
        fileName: file.name,
        fileIndex,
        error: error.message || 'Upload failed'
      });
    }
  },
  {
    // Allow non-serializable File objects in this action
    serializableCheck: {
      ignoredActions: ['forms/uploadMediaToS3/pending', 'forms/uploadMediaToS3/rejected'],
      ignoredPaths: ['payload.file']
    }
  }
);

export const submitPostCreation = createAsyncThunk(
  'forms/submitPostCreation',
  async (postData, { dispatch, rejectWithValue }) => {
    try {
      // Upload files to S3 first
      const uploadedKeys = [];
      const uploadPromises = postData.mediaFiles.map((file, index) =>
        dispatch(uploadMediaToS3({ file, fileIndex: index })).unwrap()
          .then(result => uploadedKeys[index] = result.key)
          .catch(error => {
            console.error(`Failed to upload ${file.name}:`, error);
            throw error;
          })
      );

      // Wait for all uploads to complete
      await Promise.all(uploadPromises);

      // Create FormData with content and S3 keys
      const formData = new FormData();
      formData.append('content', postData.content);

      // Send S3 keys instead of files
      uploadedKeys.forEach(key => {
        formData.append('media_keys', key);
      });

      const response = await authenticatedFetch('/posts/create/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue({
        non_field_errors: [error.message || 'Failed to create post. Please try again.']
      });
    }
  },
  {
    // Allow non-serializable File objects in this action
    serializableCheck: {
      ignoredActions: ['forms/submitPostCreation/pending', 'forms/submitPostCreation/rejected'],
      ignoredPaths: ['payload.mediaFiles']
    }
  }
);

export const submitProfileEdit = createAsyncThunk(
  'forms/submitProfileEdit',
  async (profileData, { rejectWithValue }) => {
    try {
      const formData = new FormData();

      // Add text fields
      Object.keys(profileData).forEach(key => {
        if (key !== 'profilePicture' && key !== 'bannerImage' && profileData[key] !== null) {
          formData.append(key, profileData[key]);
        }
      });

      // Add file fields
      if (profileData.profilePicture) {
        formData.append('profile_picture', profileData.profilePicture);
      }
      if (profileData.bannerImage) {
        formData.append('banner_image', profileData.bannerImage);
      }

      const response = await authenticatedFetch('/accounts/profile/', {
        method: 'PATCH',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData);
      }

      const data = await response.json();
      return data;
    } catch  {
      return rejectWithValue({ non_field_errors: ['Failed to update profile. Please try again.'] });
    }
  }
);

const formsSlice = createSlice({
  name: 'forms',
  initialState,
  reducers: {
    // Login form actions
    updateLoginField: (state, action) => {
      const { field, value } = action.payload;
      state.login[field] = value;
      // Clear field error when user starts typing
      if (state.login.errors[field]) {
        delete state.login.errors[field];
      }
    },

    setLoginTouched: (state, action) => {
      state.login.touched[action.payload] = true;
    },

    setLoginErrors: (state, action) => {
      state.login.errors = action.payload;
    },

    clearLoginForm: (state) => {
      state.login = initialState.login;
    },

    // Register form actions
    updateRegisterField: (state, action) => {
      const { field, value } = action.payload;
      state.register[field] = value;
      // Clear field error when user starts typing
      if (state.register.errors[field]) {
        delete state.register.errors[field];
      }
    },

    setRegisterTouched: (state, action) => {
      state.register.touched[action.payload] = true;
    },

    setRegisterErrors: (state, action) => {
      state.register.errors = action.payload;
    },

    clearRegisterForm: (state) => {
      state.register = initialState.register;
    },

    // Post creation form actions
    updatePostContent: (state, action) => {
      state.postCreation.content = action.payload;
    },

    addMediaFile: (state, action) => {
      const { file, preview } = action.payload;
      // Store file metadata instead of the File object to avoid serialization issues
      state.postCreation.mediaFiles.push({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        // Don't store the actual File object
      });
      state.postCreation.mediaPreviews.push(preview);
      // Initialize upload status for new file
      state.postCreation.uploads.push({
        fileName: file.name,
        status: 'pending', // pending, uploading, completed, failed
        progress: 0,
        error: null,
      });
    },

    removeMediaFile: (state, action) => {
      const index = action.payload;
      state.postCreation.mediaFiles.splice(index, 1);
      state.postCreation.mediaPreviews.splice(index, 1);
      state.postCreation.uploads.splice(index, 1);
    },

    updateUploadStatus: (state, action) => {
      const { index, status, progress, error } = action.payload;
      if (state.postCreation.uploads[index]) {
        state.postCreation.uploads[index].status = status;
        if (progress !== undefined) {
          state.postCreation.uploads[index].progress = progress;
        }
        if (error !== undefined) {
          state.postCreation.uploads[index].error = error;
        }
      }
    },

    clearPostCreationForm: (state) => {
      state.postCreation = initialState.postCreation;
    },

    resetUploads: (state) => {
      state.postCreation.uploads = [];
    },

    // Profile edit form actions
    updateProfileField: (state, action) => {
      const { field, value } = action.payload;
      state.profileEdit[field] = value;
      // Clear field error when user starts typing
      if (state.profileEdit.errors[field]) {
        delete state.profileEdit.errors[field];
      }
    },

    setProfileImage: (state, action) => {
      const { type, file, preview } = action.payload;
      if (type === 'profile') {
        state.profileEdit.profilePicture = file;
        state.profileEdit.profilePicturePreview = preview;
      } else if (type === 'banner') {
        state.profileEdit.bannerImage = file;
        state.profileEdit.bannerImagePreview = preview;
      }
    },

    setProfileTouched: (state, action) => {
      state.profileEdit.touched[action.payload] = true;
    },

    setProfileErrors: (state, action) => {
      state.profileEdit.errors = action.payload;
    },

    initializeProfileEdit: (state, action) => {
      const profile = action.payload;
      state.profileEdit = {
        ...initialState.profileEdit,
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        birth_date: profile.birth_date || '',
        gender: profile.gender || '',
      };
    },

    clearProfileEditForm: (state) => {
      state.profileEdit = initialState.profileEdit;
    },

    // Validation helpers
    validateField: (state, action) => {
      const { form, field, value } = action.payload;
      const rules = state.validationRules[field];
      let error = null;

      if (rules) {
        if (rules.required && (!value || value.trim() === '')) {
          error = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
        } else if (rules.minLength && value && value.length < rules.minLength) {
          error = rules.message || `Minimum length is ${rules.minLength} characters`;
        } else if (rules.maxLength && value && value.length > rules.maxLength) {
          error = `Maximum length is ${rules.maxLength} characters`;
        } else if (rules.pattern && value) {
          // Recreate RegExp from string pattern
          const regex = new RegExp(rules.pattern.slice(1, -1)); // Remove surrounding slashes
          if (!regex.test(value)) {
            error = rules.message || 'Invalid format';
          }
        }
      }

      if (form === 'login') {
        state.login.errors[field] = error;
      } else if (form === 'register') {
        state.register.errors[field] = error;
      } else if (form === 'profile') {
        state.profileEdit.errors[field] = error;
      }
    },

    // Clear errors
    clearFormError: (state, action) => {
      const { form, errorType } = action.payload;
      if (form === 'login') {
        state.login[errorType] = null;
      } else if (form === 'register') {
        state.register[errorType] = null;
      } else if (form === 'postCreation') {
        state.postCreation[errorType] = null;
      } else if (form === 'profileEdit') {
        state.profileEdit[errorType] = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login submission
      .addCase(submitLogin.pending, (state) => {
        state.login.isSubmitting = true;
        state.login.submitError = null;
      })
      .addCase(submitLogin.fulfilled, (state) => {
        state.login.isSubmitting = false;
        // Clear form on success
        state.login = initialState.login;
      })
      .addCase(submitLogin.rejected, (state, action) => {
        state.login.isSubmitting = false;
        state.login.submitError = action.payload;
        // Set field errors if they exist
        if (action.payload && typeof action.payload === 'object') {
          Object.keys(action.payload).forEach(key => {
            if (key !== 'non_field_errors') {
              state.login.errors[key] = action.payload[key][0];
            }
          });
        }
      })

      // Register submission
      .addCase(submitRegister.pending, (state) => {
        state.register.isSubmitting = true;
        state.register.submitError = null;
      })
      .addCase(submitRegister.fulfilled, (state) => {
        state.register.isSubmitting = false;
        // Clear form on success
        state.register = initialState.register;
      })
      .addCase(submitRegister.rejected, (state, action) => {
        state.register.isSubmitting = false;
        state.register.submitError = action.payload;
        // Set field errors if they exist
        if (action.payload && typeof action.payload === 'object') {
          Object.keys(action.payload).forEach(key => {
            if (key !== 'non_field_errors') {
              state.register.errors[key] = action.payload[key][0];
            }
          });
        }
      })

      // S3 Media Upload
      .addCase(uploadMediaToS3.pending, (state, action) => {
        // Find the upload by file index and update status
        const fileIndex = action.meta.arg.fileIndex;
        if (state.postCreation.uploads[fileIndex]) {
          state.postCreation.uploads[fileIndex].status = 'uploading';
          state.postCreation.uploads[fileIndex].progress = 0;
          state.postCreation.uploads[fileIndex].error = null;
        }
      })
      .addCase(uploadMediaToS3.fulfilled, (state, action) => {
        // Update upload status to completed
        const fileIndex = action.meta.arg.fileIndex;
        if (state.postCreation.uploads[fileIndex]) {
          state.postCreation.uploads[fileIndex].status = 'completed';
          state.postCreation.uploads[fileIndex].progress = 100;
        }
      })
      .addCase(uploadMediaToS3.rejected, (state, action) => {
        // Update upload status to failed
        const fileIndex = action.meta.arg.fileIndex;
        if (state.postCreation.uploads[fileIndex]) {
          state.postCreation.uploads[fileIndex].status = 'failed';
          state.postCreation.uploads[fileIndex].error = action.payload?.error || 'Upload failed';
        }
      })

      // Post creation submission
      .addCase(submitPostCreation.pending, (state) => {
        state.postCreation.isSubmitting = true;
        state.postCreation.submitError = null;
      })
      .addCase(submitPostCreation.fulfilled, (state) => {
        state.postCreation.isSubmitting = false;
        // Clear form on success
        state.postCreation = initialState.postCreation;
      })
      .addCase(submitPostCreation.rejected, (state, action) => {
        state.postCreation.isSubmitting = false;
        state.postCreation.submitError = action.payload;
      })

      // Profile edit submission
      .addCase(submitProfileEdit.pending, (state) => {
        state.profileEdit.isSubmitting = true;
        state.profileEdit.submitError = null;
      })
      .addCase(submitProfileEdit.fulfilled, (state) => {
        state.profileEdit.isSubmitting = false;
        // Clear form on success
        state.profileEdit = initialState.profileEdit;
      })
      .addCase(submitProfileEdit.rejected, (state, action) => {
        state.profileEdit.isSubmitting = false;
        state.profileEdit.submitError = action.payload;
        // Set field errors if they exist
        if (action.payload && typeof action.payload === 'object') {
          Object.keys(action.payload).forEach(key => {
            if (key !== 'non_field_errors') {
              state.profileEdit.errors[key] = action.payload[key][0];
            }
          });
        }
      });
  },
});

export const {
  updateLoginField,
  setLoginTouched,
  setLoginErrors,
  clearLoginForm,
  updateRegisterField,
  setRegisterTouched,
  setRegisterErrors,
  clearRegisterForm,
  updatePostContent,
  addMediaFile,
  removeMediaFile,
  updateUploadStatus,
  clearPostCreationForm,
  resetUploads,
  initializeProfileEdit,
  updateProfileField,
  setProfileImage,
  setProfileTouched,
  setProfileErrors,
  clearProfileEditForm,
  validateField,
  clearFormError,
} = formsSlice.actions;

export default formsSlice.reducer;