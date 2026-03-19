import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../api';
import { secureStorage } from '../../security/dataProtection';

export const registerUser = createAsyncThunk(
  'api/auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      return await api.auth.register(userData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const loginUser = createAsyncThunk(
  'api/auth/login',
  async (credentials, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.auth.login(credentials);
      // api.auth.login already stores tokens in SecureStore
      const resultAction = await dispatch(checkAuth());
      if (checkAuth.rejected.match(resultAction)) {
        return rejectWithValue(resultAction.payload);
      }
      return resultAction.payload;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const loginWithGoogle = createAsyncThunk(
  'api/auth/google',
  async ({ idToken }, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.auth.loginWithGoogle({ idToken });
      if (response?.accessToken) await secureStorage.setItem('accessToken', response.accessToken);
      if (response?.refreshToken) await secureStorage.setItem('refreshToken', response.refreshToken);
      await secureStorage.setItem('isLoggedIn', 'true');

      const resultAction = await dispatch(checkAuth({ force: true }));
      if (checkAuth.rejected.match(resultAction)) return rejectWithValue(resultAction.payload);
      return resultAction.payload;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const checkAuth = createAsyncThunk(
  'api/customers/me',
  async (payload = {}, { rejectWithValue }) => {
    const force = payload === true || (payload && payload.force === true);
    try {
      if (!force) {
        const cachedUser = await secureStorage.getItem('cachedUser');
        if (cachedUser) return cachedUser;
      }

      const response = await api.auth.getCurrentUser();
      if (response) {
        await secureStorage.setItem('cachedUser', JSON.stringify(response));
      }
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'api/auth/logoutTask',
  async (_, { dispatch }) => {
    try {
      await api.auth.logout();
    } catch (error) {
      console.error('[AuthSlice] Logout task error:', error);
    } finally {
      dispatch(logout());
    }
  }
);

export const updateProfile = createAsyncThunk(
  'api/customers/update',
  async (userData, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.auth.updateProfile(userData);
      await dispatch(checkAuth({ force: true }));
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteAccount = createAsyncThunk(
  'api/customers/delete',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      await api.auth.deleteAccount();
      dispatch(logout());
      return { success: true };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  isInitialized: false,
  error: null,
  registrationSuccess: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.registrationSuccess = false;
      state.isInitialized = true;
      // SecureStore cleanup is handled in api.auth.logout()
    },
    resetError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => { state.loading = true; state.error = null; state.registrationSuccess = false; })
      .addCase(registerUser.fulfilled, (state) => { state.loading = false; state.registrationSuccess = true; })
      .addCase(registerUser.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        const userData = action.payload?.responce || action.payload?.response || action.payload?.user || action.payload;
        if (userData && typeof userData === 'object' && Object.keys(userData).length > 0) {
          state.isAuthenticated = true;
          state.user = userData;
        } else {
          state.isAuthenticated = false;
          state.user = null;
        }
      })
      .addCase(loginUser.rejected, (state, action) => { state.loading = false; state.error = action.payload; state.isAuthenticated = false; })

      .addCase(loginWithGoogle.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.loading = false;
        const userData = action.payload?.responce || action.payload?.response || action.payload?.user || action.payload;
        if (userData && typeof userData === 'object' && Object.keys(userData).length > 0) {
          state.isAuthenticated = true;
          state.user = userData;
        }
      })
      .addCase(loginWithGoogle.rejected, (state, action) => { state.loading = false; state.error = action.payload; state.isAuthenticated = false; })

      .addCase(checkAuth.pending, (state) => { state.loading = true; })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        const userData = action.payload?.responce || action.payload?.response || action.payload?.user || action.payload;
        if (userData && typeof userData === 'object' && Object.keys(userData).length > 0) {
          state.isAuthenticated = true;
          state.user = userData;
        } else {
          state.isAuthenticated = false;
          state.user = null;
        }
        state.isInitialized = true;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.isInitialized = true;
      })

      .addCase(updateProfile.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateProfile.fulfilled, (state) => { state.loading = false; })
      .addCase(updateProfile.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(deleteAccount.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(deleteAccount.fulfilled, (state) => { state.loading = false; })
      .addCase(deleteAccount.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const { logout, resetError } = authSlice.actions;
export default authSlice.reducer;
