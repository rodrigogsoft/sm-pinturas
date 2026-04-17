import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import rdoReducer from './slices/rdoSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    rdo: rdoReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
