import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Badge,
  List,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Menu,
  MenuItem,
  Collapse,
  ThemeProvider,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Business,
  People,
  AttachMoney,
  Person,
  Security,
  LocalOffer,
  Build,
  Layers,
  Architecture,
  Logout,
  AccountCircle,
  ExpandLess,
  ExpandMore,
  EventNote,
  ChevronLeft,
  Category,
  AdminPanelSettings,
  Devices,
  Settings,
  PhoneAndroid,
  Notifications,
} from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useHighContrastTheme } from '../hooks/useHighContrast';
import { useDispatch, useSelector } from 'react-redux';
import { logout, PerfilEnum } from '../store/slices/authSlice';
import { RootState } from '../store/index';
import { api, authAPI, notificacoesAPI } from '../services/api';
import { AuthSessionsDialog } from './AuthSessionsDialog';

const DRAWER_WIDTH = 240;
const DRAWER_MINI = 56;

interface NotificacaoItem {
  id: string;
  titulo?: string;
  mensagem?: string;
  lida?: boolean;
  created_at?: string;
}

const menuConfig = [
  {
    text: 'Dashboard',
    icon: <Dashboard />,
    path: '/dashboard',
    moduloKey: 'dashboard',
    perfis: [PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ENCARREGADO],
  },
  {
    text: 'Clientes',
    icon: <People />,
    path: '/clientes',
    moduloKey: 'clientes',
    perfis: [PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO],
  },
  {
    text: 'Colaboradores',
    icon: <People />,
    path: '/colaboradores',
    moduloKey: 'colaboradores',
    perfis: [PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.ENCARREGADO],
  },
  {
    text: 'Serviços',
    icon: <Build />,
    path: '/servicos',
    moduloKey: 'servicos',
    perfis: [PerfilEnum.ADMIN, PerfilEnum.GESTOR],
  },
  {
    text: 'Preço',
    icon: <LocalOffer />,
    path: '/precos',
    moduloKey: 'precos',
    perfis: [PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ENCARREGADO],
  },
  {
    text: 'Obras',
    icon: <Business />,
    path: '/obras',
    moduloKey: 'obras',
    perfis: [PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.ENCARREGADO],
    submenu: [
      { text: 'Pavimentos',          icon: <Layers />,       path: '/pavimentos',     moduloKey: 'obras.submodulos.pavimentos',     perfis: [PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.ENCARREGADO] },
      { text: 'Ambientes',           icon: <Architecture />, path: '/ambientes',      moduloKey: 'obras.submodulos.ambientes',      perfis: [PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.ENCARREGADO] },
      { text: 'Elementos de Serviço',icon: <Category />,     path: '/itens-ambiente', moduloKey: 'obras.submodulos.itens_ambiente', perfis: [PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.ENCARREGADO] },
      { text: 'O.S.',                icon: <EventNote />,    path: '/sessoes',        moduloKey: 'obras.submodulos.os',             perfis: [PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.ENCARREGADO] },
    ],
  },
  {
    text: 'Financeiro',
    icon: <AttachMoney />,
    path: '/financeiro',
    moduloKey: 'financeiro',
    perfis: [PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO],
  },
  {
    text: 'Usuários',
    icon: <Person />,
    path: '/usuarios',
    moduloKey: 'usuarios',
    perfis: [PerfilEnum.ADMIN],
  },
  {
    text: 'Auditoria',
    icon: <Security />,
    path: '/auditoria',
    moduloKey: 'auditoria',
    perfis: [PerfilEnum.ADMIN, PerfilEnum.GESTOR],
  },
  {
    text: 'Permissões',
    icon: <AdminPanelSettings />,
    path: '/admin/permissoes',
    moduloKey: 'permissoes',
    perfis: [PerfilEnum.ADMIN],
  },
  {
    text: 'Configurações',
    icon: <Settings />,
    path: '/admin/configuracoes',
    moduloKey: 'configuracoes',
    perfis: [PerfilEnum.ADMIN],
  },
];

export const Layout = () => {
  const { theme } = useHighContrastTheme();
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [obrasOpen, setObrasOpen] = useState(() =>
    ['/obras', '/pavimentos', '/ambientes', '/itens-ambiente', '/sessoes'].includes(window.location.pathname),
  );
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificacoesAnchorEl, setNotificacoesAnchorEl] = useState<null | HTMLElement>(null);
  const [notificacoes, setNotificacoes] = useState<NotificacaoItem[]>([]);
  const [notificacoesLoading, setNotificacoesLoading] = useState(false);
  const [openAuthSessionsDialog, setOpenAuthSessionsDialog] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const perfilBruto = (user as any)?.id_perfil ?? (user as any)?.perfil;
  const perfil = perfilBruto !== undefined ? Number(perfilBruto) : undefined;
  const idUsuario = (user as any)?.id;
  const naoLidasCount = notificacoes.filter((notificacao) => !notificacao.lida).length;

  const extrairListaNotificacoes = (payload: any): NotificacaoItem[] => {
    if (Array.isArray(payload)) {
      return payload;
    }

    if (Array.isArray(payload?.data)) {
      return payload.data;
    }

    return [];
  };

  const ordenarNotificacoes = (lista: NotificacaoItem[]) => {
    return [...lista].sort((a, b) => {
      const dataA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dataB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dataB - dataA;
    });
  };

  const carregarNotificacoes = async () => {
    if (!idUsuario) {
      setNotificacoes([]);
      return;
    }

    try {
      setNotificacoesLoading(true);
      const response = await notificacoesAPI.minhasPaginado({ page: 1, limit: 30 });
      const lista = extrairListaNotificacoes(response.data);
      setNotificacoes(ordenarNotificacoes(lista));
    } catch {
      // Falha ao buscar notificações não deve interromper o layout.
    } finally {
      setNotificacoesLoading(false);
    }
  };

  useEffect(() => {
    if (!idUsuario) {
      setNotificacoes([]);
      return;
    }

    void carregarNotificacoes();

    const interval = window.setInterval(() => {
      void carregarNotificacoes();
    }, 30000);

    return () => window.clearInterval(interval);
  }, [idUsuario]);

  const marcarNotificacaoComoLida = async (idNotificacao: string) => {
    try {
      await api.post(`/notificacoes/${idNotificacao}/marcar-lida`);
      setNotificacoes((anteriores) =>
        anteriores.map((notificacao) =>
          notificacao.id === idNotificacao
            ? { ...notificacao, lida: true }
            : notificacao,
        ),
      );
    } catch {
      // Falha silenciosa para não bloquear a navegação.
    }
  };

  const marcarNotificacaoComoClicada = async (idNotificacao: string) => {
    try {
      await notificacoesAPI.marcarComoClicada(idNotificacao);
      setNotificacoes((anteriores) =>
        anteriores.map((notificacao) =>
          notificacao.id === idNotificacao
            ? { ...notificacao, lida: true }
            : notificacao,
        ),
      );
    } catch {
      // Falha silenciosa para não bloquear a navegação.
    }
  };

  const marcarTodasComoLidas = async () => {
    if (!idUsuario) {
      return;
    }

    try {
      try {
        await api.post('/notificacoes/minhas/marcar-todas-lidas');
      } catch {
        await api.post(`/notificacoes/usuario/${idUsuario}/marcar-todas-lidas`);
      }

      setNotificacoes((anteriores) =>
        anteriores.map((notificacao) => ({ ...notificacao, lida: true })),
      );
    } catch {
      // Falha silenciosa para manter a experiência do usuário.
    }
  };

  // Verifica se o perfil tem acesso estático ao item de menu
  const podeVer = (perfis: PerfilEnum[]) => perfil !== undefined && perfis.includes(perfil as PerfilEnum);

  // Verifica se há permissão granular explicitamente ativa para o módulo.
  // Isso cobre perfis customizados fora do enum estático do frontend.
  const temPermissaoExplicita = (moduloKey: string): boolean => {
    const perms = user?.permissoes_modulos;
    if (!perms) return false;
    const partes = moduloKey.split('.');
    if (partes.length === 1) {
      return perms[partes[0]]?.ativo === true;
    }
    const [modPai, , subKey] = partes;
    return perms[modPai]?.ativo === true && perms[modPai]?.submodulos?.[subKey]?.ativo === true;
  };

  // RN13/RN14: Verifica permissão granular do módulo (ADMIN sempre passa)
  // moduloKey pode ser 'obras' ou 'obras.submodulos.pavimentos'
  const moduloAtivo = (moduloKey: string): boolean => {
    if (perfil === PerfilEnum.ADMIN) return true;
    const perms = user?.permissoes_modulos;
    if (!perms) return true; // sem dados ainda: não bloqueia
    const partes = moduloKey.split('.');
    if (partes.length === 1) {
      return perms[partes[0]]?.ativo !== false;
    }
    // ex: obras.submodulos.pavimentos
    const [modPai, , subKey] = partes;
    return perms[modPai]?.ativo !== false && perms[modPai]?.submodulos?.[subKey]?.ativo !== false;
  };

  const isAtivo = (path: string) => location.pathname === path;
  const isSubmenuAtivo = (submenu: { path: string }[]) => submenu.some((s) => location.pathname === s.path);

  const ir = (path: string) => navigate(path);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // Mesmo se a chamada falhar, a sessao local deve ser encerrada.
    } finally {
      dispatch(logout());
      setAnchorEl(null);
      navigate('/login');
    }
  };

  const sidebarWidth = drawerOpen ? DRAWER_WIDTH : DRAWER_MINI;

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>

        {/* ───── AppBar ───── */}
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            zIndex: 1300,
            left: sidebarWidth,
            width: `calc(100% - ${sidebarWidth}px)`,
            transition: 'left 0.2s, width 0.2s',
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid rgba(13,27,140,0.10)',
            color: '#333333',
          }}
        >
          <Toolbar>
            <IconButton edge="start" onClick={() => setDrawerOpen((v) => !v)} sx={{ mr: 2, color: '#0D1B8C' }}>
              {drawerOpen ? <ChevronLeft /> : <MenuIcon />}
            </IconButton>
            <Box sx={{ flexGrow: 1 }} />
            <Tooltip title="Baixar App Mobile (Android)">
              <IconButton
                component="a"
                href="https://smpinturas.conecti.tec.br/sm-pinturas.apk"
                download="sm-pinturas.apk"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ mr: 1, color: '#0D1B8C' }}
              >
                <PhoneAndroid />
              </IconButton>
            </Tooltip>
            {user && (
              <>
                <Tooltip title="Notificações">
                  <IconButton onClick={(e) => setNotificacoesAnchorEl(e.currentTarget)} sx={{ mr: 1, color: '#0D1B8C' }}>
                    <Badge badgeContent={naoLidasCount} color="error" max={99}>
                      <Notifications />
                    </Badge>
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={notificacoesAnchorEl}
                  open={Boolean(notificacoesAnchorEl)}
                  onClose={() => setNotificacoesAnchorEl(null)}
                  PaperProps={{ sx: { width: 380, maxWidth: '90vw' } }}
                >
                  <MenuItem disableRipple divider>
                    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Notificações
                      </Typography>
                      <Button size="small" onClick={marcarTodasComoLidas} disabled={naoLidasCount === 0}>
                        Marcar todas
                      </Button>
                    </Box>
                  </MenuItem>

                  {notificacoesLoading && (
                    <MenuItem disabled>
                      <ListItemText primary="Carregando notificações..." />
                    </MenuItem>
                  )}

                  {!notificacoesLoading && notificacoes.length === 0 && (
                    <MenuItem disabled>
                      <ListItemText primary="Nenhuma notificação encontrada" />
                    </MenuItem>
                  )}

                  {!notificacoesLoading && notificacoes.slice(0, 8).map((notificacao) => (
                    <MenuItem
                      key={notificacao.id}
                      onClick={() => {
                        void marcarNotificacaoComoClicada(notificacao.id);
                        if (!notificacao.lida) {
                          void marcarNotificacaoComoLida(notificacao.id);
                        }
                      }}
                      sx={{
                        alignItems: 'flex-start',
                        backgroundColor: notificacao.lida ? 'transparent' : 'action.hover',
                      }}
                    >
                      <ListItemText
                        primary={notificacao.titulo || 'Notificação'}
                        secondary={notificacao.mensagem || ''}
                        primaryTypographyProps={{
                          variant: 'body2',
                          fontWeight: notificacao.lida ? 500 : 700,
                        }}
                        secondaryTypographyProps={{
                          variant: 'caption',
                          sx: {
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          },
                        }}
                      />
                    </MenuItem>
                  ))}
                </Menu>
              </>
            )}
            {user && (
              <>
                <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ ml: 1, color: '#0D1B8C' }}>
                  <AccountCircle />
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    {user.nome_completo || user.email}
                  </Typography>
                </IconButton>
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                  <MenuItem
                    onClick={() => {
                      setAnchorEl(null);
                      setOpenAuthSessionsDialog(true);
                    }}
                  >
                    <Devices sx={{ mr: 1 }} /> Sessões ativas
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>
                    <Logout sx={{ mr: 1 }} /> Sair
                  </MenuItem>
                </Menu>
              </>
            )}
          </Toolbar>
        </AppBar>

        {/* ───── Sidebar ───── */}
        <Paper
          elevation={4}
          square
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            height: '100vh',
            width: sidebarWidth,
            overflowX: 'hidden',
            overflowY: 'auto',
            transition: 'width 0.2s',
            zIndex: 1200,
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(180deg, #0D1B8C 0%, #091470 100%)',
            borderRadius: 0,
          }}
        >
          {/* Logo / cabeçalho da sidebar */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: drawerOpen ? 'flex-start' : 'center',
              px: drawerOpen ? 2 : 0,
              minHeight: 64,
              borderBottom: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <img
              src="/logo.png"
              alt="SM Pinturas"
              style={{ height: 36, objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
            />

          </Box>

          <List dense sx={{ pt: 1, flex: 1 }}>
            {menuConfig.map((item) => {
              if (!podeVer(item.perfis) && !temPermissaoExplicita(item.moduloKey)) return null;
              if (!moduloAtivo(item.moduloKey)) return null;

              if (item.submenu) {
                const submenuVisiveis = item.submenu.filter(
                  (s) => (podeVer(s.perfis) || temPermissaoExplicita(s.moduloKey)) && moduloAtivo(s.moduloKey),
                );
                const ativo = isAtivo(item.path) || isSubmenuAtivo(item.submenu);
                const expandido = obrasOpen;

                return (
                  <Box key={item.text}>
                    <ListItemButton
                      selected={ativo}
                      onClick={() => { setObrasOpen((v) => !v); ir(item.path); }}
                      sx={{
                        borderRadius: 2,
                        mx: 1,
                        mb: 0.5,
                        minHeight: 44,
                        color: ativo ? '#FFFFFF' : 'rgba(255,255,255,0.75)',
                        backgroundColor: ativo ? 'rgba(74,108,247,0.55)' : 'transparent',
                        '&:hover': { backgroundColor: 'rgba(74,108,247,0.35)', color: '#FFFFFF' },
                        '&.Mui-selected': { backgroundColor: 'rgba(74,108,247,0.55)' },
                        '&.Mui-selected:hover': { backgroundColor: 'rgba(74,108,247,0.65)' },
                      }}
                    >
                      <Tooltip title={!drawerOpen ? item.text : ''} placement="right">
                        <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>{item.icon}</ListItemIcon>
                      </Tooltip>
                      {drawerOpen && (
                        <>
                          <ListItemText primary={item.text} />
                          {expandido ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                        </>
                      )}
                    </ListItemButton>

                    <Collapse in={expandido && drawerOpen} timeout="auto" unmountOnExit>
                      <List dense disablePadding>
                        {submenuVisiveis.map((sub) => (
                          <ListItemButton
                            key={sub.path}
                            selected={isAtivo(sub.path)}
                            onClick={() => ir(sub.path)}
                            sx={{
                              pl: 4,
                              borderRadius: 2,
                              mx: 1,
                              mb: 0.5,
                              minHeight: 38,
                              color: isAtivo(sub.path) ? '#FFFFFF' : 'rgba(255,255,255,0.65)',
                              backgroundColor: isAtivo(sub.path) ? 'rgba(74,108,247,0.55)' : 'transparent',
                              '&:hover': { backgroundColor: 'rgba(74,108,247,0.25)', color: '#FFFFFF' },
                              '&.Mui-selected': { backgroundColor: 'rgba(74,108,247,0.55)' },
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>{sub.icon}</ListItemIcon>
                            <ListItemText primary={sub.text} primaryTypographyProps={{ variant: 'body2' }} />
                          </ListItemButton>
                        ))}
                      </List>
                    </Collapse>
                  </Box>
                );
              }

              return (
                <ListItemButton
                  key={item.path}
                  selected={isAtivo(item.path)}
                  onClick={() => ir(item.path)}
                  sx={{
                    borderRadius: 2,
                    mx: 1,
                    mb: 0.5,
                    minHeight: 44,
                    color: isAtivo(item.path) ? '#FFFFFF' : 'rgba(255,255,255,0.75)',
                    backgroundColor: isAtivo(item.path) ? 'rgba(74,108,247,0.55)' : 'transparent',
                    '&:hover': { backgroundColor: 'rgba(74,108,247,0.35)', color: '#FFFFFF' },
                    '&.Mui-selected': { backgroundColor: 'rgba(74,108,247,0.55)' },
                    '&.Mui-selected:hover': { backgroundColor: 'rgba(74,108,247,0.65)' },
                  }}
                >
                  <Tooltip title={!drawerOpen ? item.text : ''} placement="right">
                    <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>{item.icon}</ListItemIcon>
                  </Tooltip>
                  {drawerOpen && <ListItemText primary={item.text} />}
                </ListItemButton>
              );
            })}
          </List>
        </Paper>

        {/* ───── Conteúdo principal ───── */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            ml: `${sidebarWidth}px`,
            mt: '64px',
            minHeight: 'calc(100vh - 64px)',
            backgroundColor: '#F2F2F2',
            transition: 'margin-left 0.2s',
          }}
        >
          <Outlet />
        </Box>

        <AuthSessionsDialog
          open={openAuthSessionsDialog}
          onClose={() => setOpenAuthSessionsDialog(false)}
          onLogoutCurrentSession={handleLogout}
        />
      </Box>
    </ThemeProvider>
  );
};
