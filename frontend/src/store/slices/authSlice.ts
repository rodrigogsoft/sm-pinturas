import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

interface AuthState {
  usuario: { id: string; email: string; perfil: string } | null;
  accessToken: string | null;
  carregando: boolean;
  erro: string | null;
}

const initialState: AuthState = {
  usuario: null,
  accessToken: localStorage.getItem('accessToken'),
  carregando: false,
  erro: null,
};

// Thunk de login
export const login = createAsyncThunk(
  'auth/login',
  async (credenciais: { email: string; senha: string }, { rejectWithValue }) => {
    try {
      const resposta = await api.post('/auth/login', credenciais);
      return resposta.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erro ao fazer login');
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.usuario = null;
      state.accessToken = null;
      localStorage.removeItem('accessToken');
    },
    setUsuario(state, action: PayloadAction<AuthState['usuario']>) {
      state.usuario = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.carregando = true;
        state.erro = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.carregando = false;
        state.accessToken = action.payload.accessToken;
        localStorage.setItem('accessToken', action.payload.accessToken);
      })
      .addCase(login.rejected, (state, action) => {
        state.carregando = false;
        state.erro = action.payload as string;
      });
  },
});

export const { logout, setUsuario } = authSlice.actions;
export default authSlice.reducer;
