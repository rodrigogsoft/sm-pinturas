import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../../services/api';
import { AuthState, Usuario } from '../../types';
import { PushNotificationService } from '../../services/push.service';

const initialState: AuthState = {
  usuario: null,
  token: null,
  isLoading: false,
  error: null,
};

const mapPerfilParaPapel = (idPerfil: number): Usuario['papel'] => {
  if (idPerfil === 1) return 'admin';
  if (idPerfil === 2) return 'gerente';
  return 'encarregado';
};

const normalizarAuthPayload = (data: any) => {
  const token = data?.access_token || data?.token || null;
  const rawUser = data?.user || data?.usuario || {};
  const idPerfil = Number(rawUser?.id_perfil ?? rawUser?.perfil ?? 0) || 0;

  const usuarioNormalizado: Usuario & Record<string, any> = {
    id_usuario: String(rawUser?.id_usuario ?? rawUser?.id ?? ''),
    nome: String(rawUser?.nome ?? rawUser?.nome_completo ?? ''),
    nome_completo: String(rawUser?.nome_completo ?? rawUser?.nome ?? ''),
    email: String(rawUser?.email ?? ''),
    telefone: rawUser?.telefone,
    papel: mapPerfilParaPapel(idPerfil),
    ativo: rawUser?.ativo ?? true,
    id_perfil: idPerfil,
    perfil_nome: rawUser?.perfil_nome,
  };

  return { token, usuario: usuarioNormalizado };
};

export const loginAsync = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; senha: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.login(credentials.email, credentials.senha);
      const { token, usuario } = normalizarAuthPayload(response.data);

      if (!token) {
        return rejectWithValue('Token de autenticacao nao retornado pelo backend');
      }

      // Persist token and user to AsyncStorage
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('usuario', JSON.stringify(usuario));

      // Registrar token FCM (nao falhar o login se der erro)
      try {
        await PushNotificationService.initialize();
      } catch (error) {
        console.warn('Erro ao registrar FCM no login:', error);
      }

      return { token, usuario };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao fazer login');
    }
  }
);

export const restaurarSessaoAsync = createAsyncThunk(
  'auth/restaurarSessao',
  async (_, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const usuarioStr = await AsyncStorage.getItem('usuario');

      if (token && usuarioStr) {
        const usuario = JSON.parse(usuarioStr);
        try {
          await PushNotificationService.initialize();
        } catch (error) {
          console.warn('Erro ao registrar FCM na restauracao:', error);
        }
        return { token, usuario };
      }
      return rejectWithValue('Nenhuma sessão salva');
    } catch (error: any) {
      return rejectWithValue('Erro ao restaurar sessão');
    }
  }
);

export const logoutAsync = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await PushNotificationService.unregisterToken();
      await apiClient.logout();
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('usuario');
      return null;
    } catch (error: any) {
      // Even if logout fails on server, clear local storage
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('usuario');
      return null;
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    logout: (state) => {
      state.usuario = null;
      state.token = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.usuario = action.payload.usuario;
        state.error = null;
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Restaurar Sessão
    builder
      .addCase(restaurarSessaoAsync.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(restaurarSessaoAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.usuario = action.payload.usuario;
      })
      .addCase(restaurarSessaoAsync.rejected, (state) => {
        state.isLoading = false;
        state.usuario = null;
        state.token = null;
      });

    // Logout
    builder
      .addCase(logoutAsync.fulfilled, (state) => {
        state.usuario = null;
        state.token = null;
        state.error = null;
      });
  },
});

export const { clearError, logout } = authSlice.actions;
export default authSlice.reducer;
