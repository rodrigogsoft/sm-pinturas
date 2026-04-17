import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Cliente } from '../../types/clientes';

interface ClientesState {
  clientes: Cliente[];
  loading: boolean;
  error: string | null;
}

const initialState: ClientesState = {
  clientes: [],
  loading: false,
  error: null,
};

const clientesSlice = createSlice({
  name: 'clientes',
  initialState,
  reducers: {
    setClientes: (state, action: PayloadAction<Cliente[]>) => {
      state.clientes = action.payload;
      state.loading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setClientes, setLoading, setError } = clientesSlice.actions;
export default clientesSlice.reducer;
