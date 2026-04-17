import { useState } from 'react';
import { PaletteMode, createTheme } from '@mui/material';
import { theme as defaultTheme } from '../theme';

const highContrastPalette = {
  mode: 'light' as PaletteMode,
  primary: {
    main: '#000',
    contrastText: '#fff',
  },
  secondary: {
    main: '#fff',
    contrastText: '#000',
  },
  background: {
    default: '#fff',
    paper: '#fff',
  },
  text: {
    primary: '#000',
    secondary: '#222',
  },
};

export function useHighContrastTheme() {
  const [highContrast, setHighContrast] = useState(false);
  const theme = highContrast
    ? createTheme({ ...defaultTheme, palette: { ...defaultTheme.palette, ...highContrastPalette } })
    : defaultTheme;
  return { theme, highContrast, setHighContrast };
}
