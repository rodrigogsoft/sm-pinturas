import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PermissoesModulos } from '../../services/permissoes.service';

export enum PerfilEnum {
  ADMIN = 1,
  GESTOR = 2,
  FINANCEIRO = 3,
  ENCARREGADO = 4,
}

export interface User {
  id: string;
  nome_completo: string;
  email: string;
  id_perfil: PerfilEnum;
  perfil_nome: string;
  permissoes_modulos?: PermissoesModulos | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

const getInitialToken = () => {
  try {
    return localStorage.getItem('token');
  } catch (e) {
    console.warn('⚠️ localStorage not available:', e);
    return null;
  }
};

const getInitialRefreshToken = () => {
  try {
    return localStorage.getItem('refresh_token');
  } catch (e) {
    console.warn('⚠️ localStorage not available:', e);
    return null;
  }
};

const initialToken = getInitialToken();
const initialRefreshToken = getInitialRefreshToken();

const initialState: AuthState = {
  user: null,
  token: initialToken,
  refreshToken: initialRefreshToken,
  isAuthenticated: !!initialToken,
  loading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ user: User; token: string; refreshToken?: string | null }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken || null;
      state.isAuthenticated = true;
      state.loading = false;
      localStorage.setItem('token', action.payload.token);
      if (action.payload.refreshToken) {
        localStorage.setItem('refresh_token', action.payload.refreshToken);
      }
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem('token', action.payload);
    },
    setRefreshToken: (state, action: PayloadAction<string | null>) => {
      state.refreshToken = action.payload;
      if (action.payload) {
        localStorage.setItem('refresh_token', action.payload);
      } else {
        localStorage.removeItem('refresh_token');
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.loading = false;
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setUser, setToken, setRefreshToken, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;
