import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

interface Obra {
  id: string;
  descricao: string;
  endereco?: string;
  status: string;
  clienteId?: string;
}

interface ObrasState {
  lista: Obra[];
  carregando: boolean;
  erro: string | null;
}

const initialState: ObrasState = {
  lista: [],
  carregando: false,
  erro: null,
};

export const buscarObras = createAsyncThunk('obras/buscar', async (_, { rejectWithValue }) => {
  try {
    const resposta = await api.get('/obras');
    return resposta.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Erro ao buscar obras');
  }
});

const obrasSlice = createSlice({
  name: 'obras',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(buscarObras.pending, (state) => {
        state.carregando = true;
        state.erro = null;
      })
      .addCase(buscarObras.fulfilled, (state, action) => {
        state.carregando = false;
        state.lista = action.payload;
      })
      .addCase(buscarObras.rejected, (state, action) => {
        state.carregando = false;
        state.erro = action.payload as string;
      });
  },
});

export default obrasSlice.reducer;
