import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../../services/api';
import { RDO, SyncStatus } from '../../types';

interface RDOState {
  rdos: RDO[];
  syncStatus: SyncStatus;
  isLoading: boolean;
  error: string | null;
}

const initialState: RDOState = {
  rdos: [],
  syncStatus: {
    isOnline: false,
    lastSync: null,
    pendingRDOs: 0,
    isSyncing: false,
    syncError: null,
  },
  isLoading: false,
  error: null,
};

export const carregarRDOsLocais = createAsyncThunk(
  'rdo/carregarLocais',
  async (_, { rejectWithValue }) => {
    try {
      const rdosStr = await AsyncStorage.getItem('rdos_local');
      return rdosStr ? JSON.parse(rdosStr) : [];
    } catch (error: any) {
      return rejectWithValue('Erro ao carregar RDOs locais');
    }
  }
);

export const salvarRDOLocal = createAsyncThunk(
  'rdo/salvarLocal',
  async (rdo: RDO, { rejectWithValue }) => {
    try {
      const rdosStr = await AsyncStorage.getItem('rdos_local');
      const rdos = rdosStr ? JSON.parse(rdosStr) : [];

      // Se tem ID backend, atualiza; senão cria novo
      if (rdo.id_rdo) {
        const index = rdos.findIndex((r: RDO) => r.id_rdo === rdo.id_rdo);
        if (index >= 0) {
          rdos[index] = rdo;
        }
      } else {
        rdo.id_rdo = `rdo_${Date.now()}_${Math.random()}`;
        rdos.push(rdo);
      }

      await AsyncStorage.setItem('rdos_local', JSON.stringify(rdos));
      return rdo;
    } catch (error: any) {
      return rejectWithValue('Erro ao salvar RDO');
    }
  }
);

export const sincronizarRDOs = createAsyncThunk(
  'rdo/sincronizar',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const rdosComRascunho = state.rdo.rdos.filter(
        (r: RDO) => r.status === 'rascunho' || r.status === 'enviado'
      );

      if (rdosComRascunho.length === 0) {
        return { sincronizados: 0, erro: 0 };
      }

      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        return rejectWithValue('Sem conexão de internet');
      }

      // Enviar RDOs para o servidor
      const response = await apiClient.sincronizarRDOs(rdosComRascunho);

      // Atualizar status local
      const rdosStr = await AsyncStorage.getItem('rdos_local');
      const rdos = rdosStr ? JSON.parse(rdosStr) : [];
      const sincronizados = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.data)
        ? response.data.data
        : [];

      const sincronizadosMap = new Map<string, string | undefined>();
      sincronizados.forEach((item: any) => {
        if (item?.sucesso && item?.id_local) {
          sincronizadosMap.set(String(item.id_local), item.id_rdo ? String(item.id_rdo) : undefined);
        }
      });

      const rdosAtualizados = rdos.map((r: RDO) => {
        const idRemoto = sincronizadosMap.get(String(r.id_rdo));
        if (sincronizadosMap.has(String(r.id_rdo))) {
          r.status = 'sincronizado';
          if (idRemoto) {
            r.id_rdo = idRemoto;
          }
          r.enviado_em = new Date().toISOString();
        }
        return r;
      });

      await AsyncStorage.setItem('rdos_local', JSON.stringify(rdosAtualizados));

      return {
        sincronizados: rdosComRascunho.length,
        erro: 0,
        rdosAtualizados,
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Erro na sincronização'
      );
    }
  }
);

export const deletarRDOLocal = createAsyncThunk(
  'rdo/deletarLocal',
  async (rdoId: string, { rejectWithValue }) => {
    try {
      const rdosStr = await AsyncStorage.getItem('rdos_local');
      const rdos = rdosStr ? JSON.parse(rdosStr) : [];
      const filtered = rdos.filter((r: RDO) => r.id_rdo !== rdoId);
      await AsyncStorage.setItem('rdos_local', JSON.stringify(filtered));
      return rdoId;
    } catch (error: any) {
      return rejectWithValue('Erro ao deletar RDO');
    }
  }
);

const rdoSlice = createSlice({
  name: 'rdo',
  initialState,
  reducers: {
    updateConnectivityStatus: (state, action) => {
      state.syncStatus.isOnline = action.payload.isConnected;
    },
    clearSyncError: (state) => {
      state.syncStatus.syncError = null;
    },
  },
  extraReducers: (builder) => {
    // Carregar RDOs Locais
    builder
      .addCase(carregarRDOsLocais.fulfilled, (state, action) => {
        state.rdos = action.payload;
        state.syncStatus.pendingRDOs = action.payload.filter(
          (r: RDO) => r.status !== 'sincronizado'
        ).length;
      });

    // Salvar RDO Local
    builder
      .addCase(salvarRDOLocal.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(salvarRDOLocal.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.rdos.findIndex((r) => r.id_rdo === action.payload.id_rdo);
        if (index >= 0) {
          state.rdos[index] = action.payload;
        } else {
          state.rdos.push(action.payload);
        }
        state.syncStatus.pendingRDOs = state.rdos.filter(
          (r) => r.status !== 'sincronizado'
        ).length;
      })
      .addCase(salvarRDOLocal.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Sincronizar RDOs
    builder
      .addCase(sincronizarRDOs.pending, (state) => {
        state.syncStatus.isSyncing = true;
        state.syncStatus.syncError = null;
      })
      .addCase(sincronizarRDOs.fulfilled, (state, action) => {
        state.syncStatus.isSyncing = false;
        state.syncStatus.lastSync = new Date().toISOString();
        if (Array.isArray(action.payload?.rdosAtualizados)) {
          state.rdos = action.payload.rdosAtualizados;
        }
        state.syncStatus.pendingRDOs = state.rdos.filter(
          (r) => r.status !== 'sincronizado'
        ).length;
      })
      .addCase(sincronizarRDOs.rejected, (state, action) => {
        state.syncStatus.isSyncing = false;
        state.syncStatus.syncError = action.payload as string;
      });

    // Deletar RDO Local
    builder
      .addCase(deletarRDOLocal.fulfilled, (state, action) => {
        state.rdos = state.rdos.filter((r) => r.id_rdo !== action.payload);
        state.syncStatus.pendingRDOs = state.rdos.filter(
          (r) => r.status !== 'sincronizado'
        ).length;
      });
  },
});

export const { updateConnectivityStatus, clearSyncError } = rdoSlice.actions;
export default rdoSlice.reducer;
