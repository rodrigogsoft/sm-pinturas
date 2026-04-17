import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  mobileDrawerOpen: boolean;
  theme: 'light' | 'dark';
  snackbar: {
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  };
}

const initialState: UiState = {
  mobileDrawerOpen: false,
  theme: 'light',
  snackbar: {
    open: false,
    message: '',
    severity: 'info',
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleMobileDrawer: (state) => {
      state.mobileDrawerOpen = !state.mobileDrawerOpen;
    },
    setMobileDrawerOpen: (state, action: PayloadAction<boolean>) => {
      state.mobileDrawerOpen = action.payload;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    showSnackbar: (
      state,
      action: PayloadAction<{
        message: string;
        severity: 'success' | 'error' | 'warning' | 'info';
      }>
    ) => {
      state.snackbar = {
        open: true,
        ...action.payload,
      };
    },
    hideSnackbar: (state) => {
      state.snackbar.open = false;
    },
  },
});

export const {
  toggleMobileDrawer,
  setMobileDrawerOpen,
  toggleTheme,
  showSnackbar,
  hideSnackbar,
} = uiSlice.actions;

export default uiSlice.reducer;
