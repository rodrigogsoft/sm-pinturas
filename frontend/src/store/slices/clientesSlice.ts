import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

interface Cliente {
  id: string;
  nome: string;
  cpfCnpj?: string;
  telefone?: string;
  email?: string;
}

interface ClientesState {
  lista: Cliente[];
  carregando: boolean;
  erro: string | null;
}

const initialState: ClientesState = {
  lista: [],
  carregando: false,
  erro: null,
};

export const buscarClientes = createAsyncThunk('clientes/buscar', async (_, { rejectWithValue }) => {
  try {
    const resposta = await api.get('/clientes');
    return resposta.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Erro ao buscar clientes');
  }
});

const clientesSlice = createSlice({
  name: 'clientes',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(buscarClientes.pending, (state) => {
        state.carregando = true;
        state.erro = null;
      })
      .addCase(buscarClientes.fulfilled, (state, action) => {
        state.carregando = false;
        state.lista = action.payload;
      })
      .addCase(buscarClientes.rejected, (state, action) => {
        state.carregando = false;
        state.erro = action.payload as string;
      });
  },
});

export default clientesSlice.reducer;
