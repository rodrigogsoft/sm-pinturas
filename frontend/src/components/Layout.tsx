import React from 'react';
import { Outlet } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem, ListItemText } from '@mui/material';
import { Menu as MenuIcon, Contrast as ContrastIcon } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useHighContrastTheme } from '../hooks/useHighContrastTheme';
import { toggleAltoContraste, toggleMenu } from '../store/slices/uiSlice';
import { logout } from '../store/slices/authSlice';
import type { AppDispatch, RootState } from '../store';
import { useNavigate } from 'react-router-dom';

const drawerWidth = 240;

// Layout principal com tema de alto contraste aplicado
const Layout: React.FC = () => {
  const theme = useHighContrastTheme();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const menuAberto = useSelector((state: RootState) => state.ui.menuAberto);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton color="inherit" edge="start" onClick={() => dispatch(toggleMenu())} sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              SM Pinturas
            </Typography>
            <IconButton color="inherit" onClick={() => dispatch(toggleAltoContraste())} title="Alternar alto contraste">
              <ContrastIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Drawer
          variant="persistent"
          open={menuAberto}
          sx={{ width: drawerWidth, flexShrink: 0, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' } }}
        >
          <Toolbar />
          <Box sx={{ overflow: 'auto' }}>
            <List>
              {[
                { texto: 'Obras', rota: '/obras' },
                { texto: 'Clientes', rota: '/clientes' },
                { texto: 'Colaboradores', rota: '/colaboradores' },
                { texto: 'Serviços', rota: '/servicos' },
              ].map(({ texto, rota }) => (
                <ListItem key={texto} onClick={() => navigate(rota)} sx={{ cursor: 'pointer' }}>
                  <ListItemText primary={texto} />
                </ListItem>
              ))}
              <ListItem onClick={handleLogout} sx={{ cursor: 'pointer' }}>
                <ListItemText primary="Sair" />
              </ListItem>
            </List>
          </Box>
        </Drawer>

        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
          <Outlet />
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Layout;
