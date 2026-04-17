import {
  Box,
  Paper,
  Typography,
  Tooltip,
  Grid,
  Chip,
  CircularProgress,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { lazy, Suspense, useCallback, useState } from 'react';
import type { KeyboardEvent, ComponentType, ElementType } from 'react';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PaymentIcon from '@mui/icons-material/Payment';
import SavingsIcon from '@mui/icons-material/Savings';
import RuleIcon from '@mui/icons-material/Rule';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

// Carregamento lazy dos conteúdos de cada relatório
const RelatorioMedicoes = lazy(() =>
  import('./RelatarioMedicoesPage').then((m) => ({ default: m.RelatarioMedicoesPage })),
);
const RelatorioMargem = lazy(() =>
  import('./RelatorioMargemPage').then((m) => ({ default: m.RelatorioMargemPage })),
);
const ContasPagar = lazy(() =>
  import('./ContasPagarPage').then((m) => ({ default: m.ContasPagarPage })),
);
const ContasReceber = lazy(() =>
  import('./ContasReceberPage').then((m) => ({ default: m.ContasReceberPage })),
);
const ValesAdiantamento = lazy(() =>
  import('./ValesAdiantamentoPage').then((m) => ({ default: m.ValesAdiantamentoPage })),
);
const AprovacoesPrecos = lazy(() =>
  import('../Precos/AprovacoesPage').then((m) => ({ default: m.AprovacoesPage })),
);

interface RelatorioItem {
  id: string;
  title: string;
  description: string;
  icon: ElementType;
  color: string;
  /** Componente inline a ser renderizado quando expandido. Null = navegar para rota. */
  conteudo: ComponentType;
}

const relatorios: RelatorioItem[] = [
  {
    id: 'medicoes',
    title: 'Relatório de Medições',
    description: 'Acompanhe todas as medições realizadas, valores e status de pagamento',
    icon: AssessmentIcon,
    color: '#1976d2',
    conteudo: RelatorioMedicoes,
  },
  {
    id: 'margem',
    title: 'Relatório de Margem de Lucro',
    description: 'Visualize a lucratividade de cada obra e margem média',
    icon: AttachMoneyIcon,
    color: '#f57c00',
    conteudo: RelatorioMargem,
  },
  {
    id: 'contas-a-pagar',
    title: 'Folha de Pagamento',
    description: 'Acompanhe lotes pendentes e total ainda a pagar',
    icon: PaymentIcon,
    color: '#8e24aa',
    conteudo: ContasPagar,
  },
  {
    id: 'contas-a-receber',
    title: 'Recebíveis',
    description: 'Visualize medições em aberto e total a receber',
    icon: SavingsIcon,
    color: '#00897b',
    conteudo: ContasReceber,
  },
  {
    id: 'vales-adiantamento',
    title: 'Vales (Adiantamento)',
    description: 'Gestão de solicitação, lançamento, desconto e resumo dos vales',
    icon: AccountBalanceWalletIcon,
    color: '#5d4037',
    conteudo: ValesAdiantamento,
  },
  {
    id: 'aprovacoes',
    title: 'Aprovação de Preços',
    description: 'Acesse os preços pendentes e gerencie aprovações',
    icon: RuleIcon,
    color: '#ef6c00',
    conteudo: AprovacoesPrecos,
  },
];

// ─── Card compacto (apenas ícone) ────────────────────────────────────────────

function CardCompacto({
  item,
  onExpand,
}: {
  item: RelatorioItem;
  onExpand: (id: string) => void;
}) {
  const Icon = item.icon;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onExpand(item.id);
    }
  };

  return (
    <Tooltip arrow placement="top" title={item.title}>
      <Paper
        variant="outlined"
        role="button"
        tabIndex={0}
        onClick={() => onExpand(item.id)}
        onKeyDown={handleKeyDown}
        sx={{
          width: 56,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          borderRadius: 3,
          borderColor: alpha(item.color, 0.3),
          background: `linear-gradient(180deg, ${alpha(item.color, 0.06)} 0%, ${alpha('#FFFFFF', 0.98)} 100%)`,
          transition: 'transform 380ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 380ms ease, border-color 380ms ease',
          '&:hover, &:focus-visible': {
            transform: 'scale(1.1)',
            boxShadow: `0 8px 20px ${alpha(item.color, 0.25)}`,
            borderColor: alpha(item.color, 0.55),
          },
        }}
      >
        <Icon sx={{ color: item.color, fontSize: 28 }} />
      </Paper>
    </Tooltip>
  );
}

// ─── Card normal (ícone + título + descrição) ──────────────────────────────

function CardNormal({
  item,
  onExpand,
}: {
  item: RelatorioItem;
  onExpand: (id: string) => void;
}) {
  const Icon = item.icon;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onExpand(item.id);
    }
  };

  return (
    <Paper
      variant="outlined"
      role="button"
      tabIndex={0}
      onClick={() => onExpand(item.id)}
      onKeyDown={handleKeyDown}
      sx={{
        height: '100%',
        minHeight: 120,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        p: 2.5,
        cursor: 'pointer',
        borderRadius: 3,
        borderColor: alpha(item.color, 0.22),
        background: `linear-gradient(180deg, ${alpha(item.color, 0.05)} 0%, ${alpha('#FFFFFF', 0.98)} 100%)`,
        transition: 'transform 380ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 380ms ease, border-color 380ms ease',
        outline: 'none',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 12px 32px ${alpha(item.color, 0.2)}`,
          borderColor: alpha(item.color, 0.45),
        },
        '&:focus-visible': {
          boxShadow: `inset 0 0 0 2px ${alpha(item.color, 0.55)}`,
        },
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2.5,
          display: 'grid',
          placeItems: 'center',
          bgcolor: item.color,
          mb: 1.5,
          flexShrink: 0,
        }}
      >
        <Icon sx={{ color: 'white', fontSize: 28 }} />
      </Box>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5, lineHeight: 1.3 }}>
        {item.title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {item.description}
      </Typography>
    </Paper>
  );
}

// ─── Card expandido ────────────────────────────────────────────────────────

function CardExpandido({
  item,
  onToggle,
}: {
  item: RelatorioItem;
  onToggle: (id: string) => void;
}) {
  const Icon = item.icon;
  const Conteudo = item.conteudo;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onToggle(item.id);
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 4,
        overflow: 'hidden',
        borderColor: alpha(item.color, 0.42),
        boxShadow: `0 24px 48px ${alpha(item.color, 0.14)}`,
        background: `linear-gradient(135deg, ${alpha(item.color, 0.05)} 0%, ${alpha('#FFFFFF', 0.97)} 60%, ${alpha('#F8FFFE', 0.95)} 100%)`,
        transition: 'box-shadow 380ms ease, border-color 380ms ease',
      }}
    >
      {/* Cabeçalho clicável para recolher */}
      <Box
        role="button"
        tabIndex={0}
        onClick={() => onToggle(item.id)}
        onKeyDown={handleKeyDown}
        sx={{
          p: 2.75,
          cursor: 'pointer',
          outline: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: `1px solid ${alpha(item.color, 0.12)}`,
          '&:hover': { bgcolor: alpha(item.color, 0.03) },
          '&:focus-visible': { boxShadow: `inset 0 0 0 2px ${alpha(item.color, 0.45)}` },
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2.5,
            display: 'grid',
            placeItems: 'center',
            bgcolor: item.color,
            flexShrink: 0,
          }}
        >
          <Icon sx={{ color: 'white', fontSize: 28 }} />
        </Box>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="h6" fontWeight={800}>
            {item.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {item.description}
          </Typography>
        </Box>
        <Chip
          label="Card ativo"
          size="small"
          sx={{
            bgcolor: alpha(item.color, 0.12),
            color: item.color,
            fontWeight: 700,
            border: `1px solid ${alpha(item.color, 0.3)}`,
          }}
        />
      </Box>

      {/* Conteúdo expandido com animação */}
      <Box
        sx={{
          transformOrigin: 'top center',
          animation: 'finCardExpand 380ms cubic-bezier(0.22, 1, 0.36, 1)',
          '@keyframes finCardExpand': {
            '0%': { opacity: 0, transform: 'scaleY(0.96)' },
            '100%': { opacity: 1, transform: 'scaleY(1)' },
          },
        }}
      >
        {Conteudo ? (
          <Suspense
            fallback={
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={28} />
              </Box>
            }
          >
            <Conteudo />
          </Suspense>
        ) : null}
      </Box>
    </Paper>
  );
}

// ─── Página principal ──────────────────────────────────────────────────────

export const FinanceiroPage = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleExpand = useCallback(
    (id: string) => {
      setExpandedId((atual) => (atual === id ? null : id));
    },
    [],
  );

  const itemExpandido = relatorios.find((r) => r.id === expandedId) ?? null;
  const itensCompactos = expandedId ? relatorios.filter((r) => r.id !== expandedId) : [];

  return (
    <Box>
      {/* Cabeçalho */}
      {!expandedId && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Módulo Financeiro
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Selecione um relatório para visualizar os dados completos
          </Typography>
        </Box>
      )}

      {/* Estado sem card expandido: grid normal */}
      {!expandedId && (
        <Grid container spacing={2.5}>
          {relatorios.map((item) => (
            <Grid item xs={12} sm={6} lg={4} key={item.id}>
              <CardNormal item={item} onExpand={handleExpand} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Estado com card expandido */}
      {expandedId && itemExpandido && (
        <Box>
          <Grid container spacing={2} alignItems="flex-start">
            {/* Card expandido */}
            <Grid item xs={12} xl={10}>
              <CardExpandido item={itemExpandido} onToggle={handleExpand} />
            </Grid>

            {/* Mini ícones dos outros cards */}
            <Grid item xs={12} xl={2}>
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  alignContent: 'flex-start',
                  pt: { xl: 0.5 },
                }}
              >
                {itensCompactos.map((item) => (
                  <CardCompacto key={item.id} item={item} onExpand={handleExpand} />
                ))}
              </Box>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Rodapé informativo (apenas na grade normal) */}
      {!expandedId && (
        <Box sx={{ mt: 5, p: 2.5, bgcolor: 'info.light', borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            Estrutura de Relatórios
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            • <strong>Medições:</strong> Base operacional das medições realizadas e seus valores •{' '}
            <strong>Margem de Lucro:</strong> Lucratividade das obras e resultado final •{' '}
            <strong>Folha de Pagamento:</strong> Lotes pendentes e valores programados •{' '}
            <strong>Recebíveis:</strong> Valores em aberto e acompanhamento de entrada
          </Typography>
        </Box>
      )}
    </Box>
  );
};
