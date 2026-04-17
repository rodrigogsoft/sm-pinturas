import { MD3LightTheme } from 'react-native-paper';
import { SM_COLORS } from './colors';

export const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary:          SM_COLORS.primary,
    primaryContainer: SM_COLORS.secondary,
    secondary:        SM_COLORS.secondary,
    background:       SM_COLORS.background,
    surface:          SM_COLORS.surface,
    error:            SM_COLORS.error,
    onPrimary:        SM_COLORS.textOnDark,
    onSecondary:      SM_COLORS.textOnDark,
    onBackground:     SM_COLORS.textPrimary,
    onSurface:        SM_COLORS.textPrimary,
    onError:          SM_COLORS.textOnDark,
    outline:          SM_COLORS.divider,
  },
};
