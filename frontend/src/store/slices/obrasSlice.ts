import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Obra } from '../../types/obras';

interface ObrasState {
  obras: Obra[];
  selectedObra: Obra | null;
  loading: boolean;
  error: string | null;
}

const initialState: ObrasState = {
  obras: [],
  selectedObra: null,
  loading: false,
  error: null,
};

const obrasSlice = createSlice({
  name: 'obras',
  initialState,
  reducers: {
    setObras: (state, action: PayloadAction<Obra[]>) => {
      state.obras = action.payload;
      state.loading = false;
    },
    setSelectedObra: (state, action: PayloadAction<Obra | null>) => {
      state.selectedObra = action.payload;
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

export const { setObras, setSelectedObra, setLoading, setError } = obrasSlice.actions;
export default obrasSlice.reducer;
