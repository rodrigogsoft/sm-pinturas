import { useMemo } from 'react';
import { createTheme } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

// Hook para aplicar tema de alto contraste conforme preferência do usuário
export function useHighContrastTheme(): Theme {
  const altoContraste = useSelector((state: RootState) => state.ui.altoContraste);

  return useMemo(() => {
    if (altoContraste) {
      return createTheme({
        palette: {
          mode: 'dark',
          background: { default: '#000000', paper: '#111111' },
          primary: { main: '#ffff00' },
          secondary: { main: '#00ffff' },
          text: { primary: '#ffffff', secondary: '#ffff00' },
        },
      });
    }
    return createTheme({
      palette: {
        mode: 'light',
        primary: { main: '#1976d2' },
        secondary: { main: '#ff6600' },
      },
    });
  }, [altoContraste]);
}
