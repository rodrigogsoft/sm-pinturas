import { createTheme } from '@mui/material/styles';
import { ptBR } from '@mui/material/locale';

// ─────────────────────────────────────────────
// Tokens de cor — SM Pinturas Design System
// ─────────────────────────────────────────────
export const SM_COLORS = {
  primary:    '#0D1B8C', // azul escuro da logo
  secondary:  '#4A6CF7', // azul claro — hover e elementos interativos
  success:    '#34C759', // verde — indicadores positivos
  warning:    '#FFD60A', // amarelo — notificações / status intermediário
  orange:     '#FF7043', // laranja — accent complementar
  error:      '#FF3B30', // vermelho — erros e alertas críticos
  bgDefault:  '#F2F2F2', // cinza claro — background geral
  bgPaper:    '#FFFFFF', // branco — cards e painéis
  textPrimary:   '#333333',
  textSecondary: '#666666',
};

export const theme = createTheme(
  {
    palette: {
      mode: 'light',
      primary: {
        main: SM_COLORS.primary,
        light: SM_COLORS.secondary,
        dark: '#09147A',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: SM_COLORS.secondary,
        light: '#7B96FF',
        dark: '#2B4ED4',
        contrastText: '#FFFFFF',
      },
      success: {
        main: SM_COLORS.success,
        light: '#5EDB80',
        dark: '#248A3D',
        contrastText: '#FFFFFF',
      },
      warning: {
        main: SM_COLORS.warning,
        light: '#FFE566',
        dark: '#C9A800',
        contrastText: '#333333',
      },
      error: {
        main: SM_COLORS.error,
        light: '#FF6B63',
        dark: '#C9231B',
        contrastText: '#FFFFFF',
      },
      info: {
        main: SM_COLORS.orange,
        light: '#FF9771',
        dark: '#C9430D',
        contrastText: '#FFFFFF',
      },
      background: {
        default: SM_COLORS.bgDefault,
        paper:   SM_COLORS.bgPaper,
      },
      text: {
        primary:   SM_COLORS.textPrimary,
        secondary: SM_COLORS.textSecondary,
      },
    },
    typography: {
      fontFamily: 'Inter, Roboto, "Helvetica Neue", Arial, sans-serif',
      h1: { fontSize: '2.5rem', fontWeight: 700 },
      h2: { fontSize: '2rem',   fontWeight: 700 },
      h3: { fontSize: '1.75rem',fontWeight: 600 },
      h4: { fontSize: '1.5rem', fontWeight: 600 },
      h5: { fontSize: '1.25rem',fontWeight: 600 },
      h6: { fontSize: '1rem',   fontWeight: 600 },
      subtitle1: { fontWeight: 500 },
      subtitle2: { fontWeight: 500 },
    },
    shape: {
      borderRadius: 10,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 8,
          },
          containedPrimary: {
            background: `linear-gradient(135deg, ${SM_COLORS.primary} 0%, ${SM_COLORS.secondary} 100%)`,
            '&:hover': {
              background: `linear-gradient(135deg, #09147A 0%, ${SM_COLORS.primary} 100%)`,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: '0 2px 12px rgba(13,27,140,0.08)',
            borderRadius: 12,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            borderRadius: 6,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 700,
            backgroundColor: SM_COLORS.bgDefault,
            color: SM_COLORS.textPrimary,
          },
        },
      },
      MuiDataGrid: {
        styleOverrides: {
          root: {
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: SM_COLORS.bgDefault,
              fontWeight: 700,
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'rgba(74,108,247,0.06)',
            },
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: { borderRadius: 4 },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: 10 },
        },
      },
    } as any,
  },
  ptBR
);
