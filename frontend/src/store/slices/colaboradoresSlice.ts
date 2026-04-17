import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Colaborador } from '../../types/colaboradores';

interface ColaboradoresState {
  colaboradores: Colaborador[];
  loading: boolean;
  error: string | null;
}

const initialState: ColaboradoresState = {
  colaboradores: [],
  loading: false,
  error: null,
};

const colaboradoresSlice = createSlice({
  name: 'colaboradores',
  initialState,
  reducers: {
    setColaboradores: (state, action: PayloadAction<Colaborador[]>) => {
      state.colaboradores = action.payload;
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

export const { setColaboradores, setLoading, setError } = colaboradoresSlice.actions;
export default colaboradoresSlice.reducer;
