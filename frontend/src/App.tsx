import { lazy, Suspense, useEffect, useRef } from 'react';
import { initFirebaseMessaging } from './services/firebaseMessaging';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { ToastProvider } from './components/Toast/ToastProvider';
import { Layout } from './components/Layout';
import { useHighContrastTheme } from './hooks/useHighContrast';
import { LoginPage } from './pages/Auth/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useSelector } from 'react-redux';
import type { RootState } from './store';
import { notificacoesAPI } from './services/api';

const DashboardPage = lazy(() =>
  import('./pages/Dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const ObrasPage = lazy(() =>
  import('./pages/Obras/ObrasPage').then((m) => ({ default: m.ObrasPage })),
);
const ClientesPage = lazy(() =>
  import('./pages/Clientes/ClientesPage').then((m) => ({ default: m.ClientesPage })),
);
const ColaboradoresPage = lazy(() =>
  import('./pages/Colaboradores/ColaboradoresPage').then((m) => ({ default: m.ColaboradoresPage })),
);
const ServicosPage = lazy(() =>
  import('./pages/Servicos/ServicosPage').then((m) => ({ default: m.ServicosPage })),
);
const FinanceiroPage = lazy(() =>
  import('./pages/Financeiro/FinanceiroPage').then((m) => ({ default: m.FinanceiroPage })),
);
const RelatarioMedicoesPage = lazy(() =>
  import('./pages/Financeiro/RelatarioMedicoesPage').then((m) => ({ default: m.RelatarioMedicoesPage })),
);
const RelatarioProdutividadePage = lazy(() =>
  import('./pages/Financeiro/RelatarioProdutividadePage').then((m) => ({ default: m.RelatarioProdutividadePage })),
);
const RelatorioMargemPage = lazy(() =>
  import('./pages/Financeiro/RelatorioMargemPage').then((m) => ({ default: m.RelatorioMargemPage })),
);
const ContasPagarPage = lazy(() =>
  import('./pages/Financeiro/ContasPagarPage').then((m) => ({ default: m.ContasPagarPage })),
);
const ContasReceberPage = lazy(() =>
  import('./pages/Financeiro/ContasReceberPage').then((m) => ({ default: m.ContasReceberPage })),
);
const FolhaIndividualPage = lazy(() =>
  import('./pages/Financeiro/FolhaIndividualPage').then((m) => ({ default: m.FolhaIndividualPage })),
);
const ApropriacaoDetalhadaPage = lazy(() =>
  import('./pages/Financeiro/ApropriacaoDetalhadaPage').then((m) => ({ default: m.ApropriacaoDetalhadaPage })),
);
const ValesAdiantamentoPage = lazy(() =>
  import('./pages/Financeiro/ValesAdiantamentoPage').then((m) => ({ default: m.ValesAdiantamentoPage })),
);
const OperacaoIndividualPage = lazy(() =>
  import('./pages/Financeiro/OperacaoIndividualPage').then((m) => ({ default: m.OperacaoIndividualPage })),
);
const UsuariosPage = lazy(() =>
  import('./pages/Usuarios/UsuariosPage').then((m) => ({ default: m.UsuariosPage })),
);
const AuditoriaPage = lazy(() =>
  import('./pages/Auditoria/AuditoriaPage').then((m) => ({ default: m.AuditoriaPage })),
);
const SessoesPage = lazy(() =>
  import('./pages/Sessoes/SessoesPage').then((m) => ({ default: m.SessoesPage })),
);
const PrecosPage = lazy(() =>
  import('./pages/Precos/PrecosPage').then((m) => ({ default: m.PrecosPage })),
);
const AprovacoesPage = lazy(() =>
  import('./pages/Precos/AprovacoesPage').then((m) => ({ default: m.AprovacoesPage })),
);
const ItensAmbientePage = lazy(() =>
  import('./pages/ItensAmbiente/ItensAmbientePage').then((m) => ({ default: m.ItensAmbientePage })),
);
const PavimentosPage = lazy(() =>
  import('./pages/Pavimentos/PavimentosPage').then((m) => ({ default: m.PavimentosPage })),
);
const AmbientesPage = lazy(() =>
  import('./pages/Ambientes/AmbientesPage').then((m) => ({ default: m.AmbientesPage })),
);
const MedicoesPage = lazy(() =>
  import('./pages/Medicoes').then((m) => ({ default: m.MedicoesPage })),
);
const MedicoesIndividuaisPage = lazy(() =>
  import('./pages/Medicoes/MedicoesIndividuaisPage').then((m) => ({ default: m.MedicoesIndividuaisPage })),
);
const AlocacaoPage = lazy(() => import('./pages/AlocacaoPage'));
const OsFinalizacaoPage = lazy(() =>
  import('./pages/Obras/OsFinalizacaoPage').then((m) => ({ default: m.OsFinalizacaoPage })),
);
const ApropriacoesFinanceirasPage = lazy(() =>
  import('./pages/Financeiro/ApropriacoesFinanceirasPage').then((m) => ({ default: m.ApropriacoesFinanceirasPage })),
);
const PermissoesPage = lazy(() =>
  import('./pages/Permissoes/PermissoesPage').then((m) => ({ default: m.PermissoesPage })),
);
const ConfiguracoesPage = lazy(() =>
  import('./pages/Configuracoes/ConfiguracoesPage').then((m) => ({ default: m.ConfiguracoesPage })),
);

const RouteLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 320 }}>
    <CircularProgress />
  </Box>
);

const FallbackRedirect = () => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
};

declare global {
  interface Window {
    showToast?: (opts: { message: string; severity: string }) => void;
  }
}

function App() {
  useHighContrastTheme();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const authUser = useSelector((state: RootState) => state.auth.user);
  const notificacoesInicializadasRef = useRef(false);
  const notificacoesConhecidasRef = useRef<Set<string>>(new Set());

  // Exibe toast ao receber push notification
  useEffect(() => {
    initFirebaseMessaging((payload) => {
      const title = payload?.notification?.title || 'Notificação';
      const body = payload?.notification?.body || '';
      // Exibe toast customizado
      if (window?.showToast) {
        window.showToast({ message: `${title}: ${body}`, severity: 'info' });
      } else {
        alert(`${title}\n${body}`);
      }
    });
  }, []);

  useEffect(() => {
    // Só inicia polling com sessão realmente carregada.
    // Evita loop de 401/refresh na tela de login quando existe token legado no storage.
    if (!isAuthenticated || !authUser?.id) {
      notificacoesInicializadasRef.current = false;
      notificacoesConhecidasRef.current.clear();
      return;
    }

    const obterNotificacoes = async () => {
      try {
        const response = await notificacoesAPI.minhasPaginado({
          lida: false,
          page: 1,
          limit: 50,
        });
        const lista = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.data)
            ? response.data.data
            : [];

        const idsAtuais = new Set<string>();

        lista.forEach((item: any) => {
          if (!item?.id) {
            return;
          }

          idsAtuais.add(item.id);

          if (!notificacoesInicializadasRef.current) {
            notificacoesConhecidasRef.current.add(item.id);
            return;
          }

          if (!notificacoesConhecidasRef.current.has(item.id)) {
            notificacoesConhecidasRef.current.add(item.id);

            const titulo = item.titulo || 'Notificação';
            const mensagem = item.mensagem || '';

            if (window?.showToast) {
              window.showToast({
                message: mensagem ? `${titulo}: ${mensagem}` : titulo,
                severity: 'info',
              });
            }
          }
        });

        notificacoesConhecidasRef.current = idsAtuais;
        notificacoesInicializadasRef.current = true;
      } catch {
        // Falha no polling não deve interromper o app.
      }
    };

    void obterNotificacoes();
    const interval = window.setInterval(() => {
      void obterNotificacoes();
    }, 30000);

    return () => window.clearInterval(interval);
  }, [isAuthenticated, authUser?.id]);

  return (
    <ToastProvider>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rotas Protegidas */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Suspense fallback={<RouteLoader />}><DashboardPage /></Suspense>} />
            <Route path="obras" element={<Suspense fallback={<RouteLoader />}><ObrasPage /></Suspense>} />
            <Route path="clientes" element={<Suspense fallback={<RouteLoader />}><ClientesPage /></Suspense>} />
            <Route path="colaboradores" element={<Suspense fallback={<RouteLoader />}><ColaboradoresPage /></Suspense>} />
            <Route path="servicos" element={<Suspense fallback={<RouteLoader />}><ServicosPage /></Suspense>} />
            <Route path="financeiro" element={<Suspense fallback={<RouteLoader />}><FinanceiroPage /></Suspense>} />
            <Route path="financeiro/contas-a-pagar" element={<Suspense fallback={<RouteLoader />}><ContasPagarPage /></Suspense>} />
            <Route path="financeiro/contas-a-receber" element={<Suspense fallback={<RouteLoader />}><ContasReceberPage /></Suspense>} />
            <Route path="financeiro/folha-individual" element={<Suspense fallback={<RouteLoader />}><FolhaIndividualPage /></Suspense>} />
            <Route path="financeiro/apropriacao-detalhada" element={<Suspense fallback={<RouteLoader />}><ApropriacaoDetalhadaPage /></Suspense>} />
            <Route path="financeiro/vales-adiantamento" element={<Suspense fallback={<RouteLoader />}><ValesAdiantamentoPage /></Suspense>} />
            <Route path="financeiro/operacao-individual" element={<Suspense fallback={<RouteLoader />}><OperacaoIndividualPage /></Suspense>} />
            <Route path="financeiro/medicoes" element={<Suspense fallback={<RouteLoader />}><RelatarioMedicoesPage /></Suspense>} />
            <Route path="financeiro/produtividade" element={<Suspense fallback={<RouteLoader />}><RelatarioProdutividadePage /></Suspense>} />
            <Route path="financeiro/margem" element={<Suspense fallback={<RouteLoader />}><RelatorioMargemPage /></Suspense>} />
            <Route path="usuarios" element={<Suspense fallback={<RouteLoader />}><UsuariosPage /></Suspense>} />
            <Route path="auditoria" element={<Suspense fallback={<RouteLoader />}><AuditoriaPage /></Suspense>} />
            <Route path="admin/permissoes" element={<Suspense fallback={<RouteLoader />}><PermissoesPage /></Suspense>} />
            <Route path="admin/configuracoes" element={<Suspense fallback={<RouteLoader />}><ConfiguracoesPage /></Suspense>} />
            <Route path="sessoes" element={<Suspense fallback={<RouteLoader />}><SessoesPage /></Suspense>} />
            <Route path="medicoes" element={<Suspense fallback={<RouteLoader />}><MedicoesPage /></Suspense>} />
            <Route path="medicoes/individuais" element={<Suspense fallback={<RouteLoader />}><MedicoesIndividuaisPage /></Suspense>} />
            <Route path="precos" element={<Suspense fallback={<RouteLoader />}><PrecosPage /></Suspense>} />
            <Route path="precos/aprovacoes" element={<Suspense fallback={<RouteLoader />}><AprovacoesPage /></Suspense>} />
            <Route path="itens-ambiente" element={<Suspense fallback={<RouteLoader />}><ItensAmbientePage /></Suspense>} />
            <Route path="pavimentos" element={<Suspense fallback={<RouteLoader />}><PavimentosPage /></Suspense>} />
            <Route path="ambientes" element={<Suspense fallback={<RouteLoader />}><AmbientesPage /></Suspense>} />
            <Route path="alocacao/:id_sessao/:id_obra" element={<Suspense fallback={<RouteLoader />}><AlocacaoPage /></Suspense>} />
            <Route path="obras/:id_obra/finalizar" element={<Suspense fallback={<RouteLoader />}><OsFinalizacaoPage /></Suspense>} />
            <Route path="financeiro/apropriacoes" element={<Suspense fallback={<RouteLoader />}><ApropriacoesFinanceirasPage /></Suspense>} />
          </Route>

          {/* 404 — redireciona para login se não autenticado, dashboard se autenticado */}
          <Route path="*" element={<FallbackRedirect />} />
        </Routes>
      </Box>
    </ToastProvider>
  );
}

export default App;
