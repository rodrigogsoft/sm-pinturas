import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import obrasReducer from './slices/obrasSlice';
import clientesReducer from './slices/clientesSlice';
import colaboradoresReducer from './slices/colaboradoresSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    obras: obrasReducer,
    clientes: clientesReducer,
    colaboradores: colaboradoresReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['auth/setUser'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
