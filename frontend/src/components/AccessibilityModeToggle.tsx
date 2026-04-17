import { Box, Switch, Typography } from '@mui/material';

export function AccessibilityModeToggle({ onChange, checked }: { onChange: (v: boolean) => void; checked: boolean }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 1 }}>
      <Switch
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        size="small"
        sx={{ color: 'inherit' }}
        inputProps={{ 'aria-label': 'Ativar modo alto contraste' }}
      />
      <Typography variant="body2" sx={{ color: 'inherit', whiteSpace: 'nowrap' }}>
        Alto Contraste
      </Typography>
    </Box>
  );
}
