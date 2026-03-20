import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { secureStorage } from '../../security/dataProtection';

export const loadUserSettings = createAsyncThunk(
  'ui/loadSettings',
  async () => {
    const theme = await secureStorage.getItem('theme') || 'dark';
    const language = await secureStorage.getItem('language') || 'en';
    return { theme, language };
  }
);

export const updateTheme = createAsyncThunk(
  'ui/updateTheme',
  async (theme) => {
    await secureStorage.setItem('theme', theme);
    return theme;
  }
);

export const updateLanguage = createAsyncThunk(
  'ui/updateLanguage',
  async (language) => {
    await secureStorage.setItem('language', language);
    return language;
  }
);

const initialState = {
  theme: 'dark',
  language: 'en',
  loading: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadUserSettings.fulfilled, (state, action) => {
        state.theme = action.payload.theme;
        state.language = action.payload.language;
      })
      .addCase(updateTheme.fulfilled, (state, action) => {
        state.theme = action.payload;
      })
      .addCase(updateLanguage.fulfilled, (state, action) => {
        state.language = action.payload;
      });
  },
});

export default uiSlice.reducer;
