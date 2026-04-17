import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  altoContraste: boolean;
  menuAberto: boolean;
  notificacao: { mensagem: string; tipo: 'success' | 'error' | 'info' | 'warning' } | null;
}

const initialState: UiState = {
  altoContraste: false,
  menuAberto: true,
  notificacao: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleAltoContraste(state) {
      state.altoContraste = !state.altoContraste;
    },
    toggleMenu(state) {
      state.menuAberto = !state.menuAberto;
    },
    exibirNotificacao(state, action: PayloadAction<UiState['notificacao']>) {
      state.notificacao = action.payload;
    },
    limparNotificacao(state) {
      state.notificacao = null;
    },
  },
});

export const { toggleAltoContraste, toggleMenu, exibirNotificacao, limparNotificacao } = uiSlice.actions;
export default uiSlice.reducer;
