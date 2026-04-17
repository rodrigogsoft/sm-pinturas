import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

interface Colaborador {
  id: string;
  nome: string;
  perfil: string;
  telefone?: string;
}

interface ColaboradoresState {
  lista: Colaborador[];
  carregando: boolean;
  erro: string | null;
}

const initialState: ColaboradoresState = {
  lista: [],
  carregando: false,
  erro: null,
};

export const buscarColaboradores = createAsyncThunk(
  'colaboradores/buscar',
  async (_, { rejectWithValue }) => {
    try {
      const resposta = await api.get('/colaboradores');
      return resposta.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erro ao buscar colaboradores');
    }
  },
);

const colaboradoresSlice = createSlice({
  name: 'colaboradores',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(buscarColaboradores.pending, (state) => {
        state.carregando = true;
        state.erro = null;
      })
      .addCase(buscarColaboradores.fulfilled, (state, action) => {
        state.carregando = false;
        state.lista = action.payload;
      })
      .addCase(buscarColaboradores.rejected, (state, action) => {
        state.carregando = false;
        state.erro = action.payload as string;
      });
  },
});

export default colaboradoresSlice.reducer;
