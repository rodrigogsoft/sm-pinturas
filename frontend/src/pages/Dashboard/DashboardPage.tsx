import {
  Typography,
  Grid,
  Paper,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Button,
  Chip,
  Menu,
  MenuItem,
  LinearProgress,
  Tooltip,
  Stack,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import type { KeyboardEvent } from 'react';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import DownloadIcon from '@mui/icons-material/Download';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import BusinessIcon from '@mui/icons-material/Business';
import LayersIcon from '@mui/icons-material/Layers';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import QueryStatsOutlinedIcon from '@mui/icons-material/QueryStatsOutlined';
import { relatoriosAPI } from '../../services/api';
import obrasService, { Obra, StatusObraEnum } from '../../services/obras.service';
import pavimentosService, { Pavimento } from '../../services/pavimentos.service';
import ambientesService, { Ambiente } from '../../services/ambientes.service';
import itensAmbienteService, { ItemAmbiente } from '../../services/itens-ambiente.service';
import { DashboardFinanceiroResponse } from '../../types/relatorios';
import { useToast } from '../../components/Toast/ToastProvider';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { PerfilEnum } from '../../store/slices/authSlice';

type Periodo = 'dia' | 'semana' | 'mes' | 'ano';

const periodoLabels: Record<Periodo, string> = {
  dia: 'Hoje',
  semana: 'Esta Semana',
  mes: 'Este Mês',
  ano: 'Este Ano',
};

interface DrilldownData {
  pavimentos: Pavimento[];
  ambientes: Ambiente[];
  itens: ItemAmbiente[];
  carregando: boolean;
  erro: boolean;
}

interface PavimentoResumo {
  pavimento: Pavimento;
  ambientes: Ambiente[];
  itens: ItemAmbiente[];
  areaPlanejada: number;
  areaMedida: number;
  progresso: number;
}

type DrilldownCache = Record<string, DrilldownData | undefined>;

const DASHBOARD_REQUEST_TIMEOUT_MS = 15000;

const toNumber = (value: number | string | null | undefined) => Number(value ?? 0);

const getClienteNome = (obra: Obra) => obra.cliente?.razao_social || 'Cliente não informado';

const getCorStatus = (status: StatusObraEnum) => (status === StatusObraEnum.ATIVA ? 'success' : 'default');

const getResumoPavimentos = (drill?: DrilldownData | null): PavimentoResumo[] => {
  if (!drill) {
    return [];
  }

  return drill.pavimentos
    .slice()
    .sort((a, b) => a.ordem - b.ordem)
    .map((pavimento) => {
      const ambientes = drill.ambientes.filter((ambiente) => ambiente.id_pavimento === pavimento.id);
      const ambienteIds = new Set(ambientes.map((ambiente) => ambiente.id));
      const itens = drill.itens.filter((item) => ambienteIds.has(item.id_ambiente));
      const itensUnicos = Array.from(new Map(itens.map((item) => [item.id, item])).values());
      const areaPlanejadaAmbientes = ambientes.reduce(
        (total, ambiente) => total + toNumber(ambiente.area_m2),
        0,
      );
      const areaPlanejadaItens = itensUnicos.reduce(
        (total, item) => total + toNumber(item.area_planejada),
        0,
      );
      const areaPlanejada =
        areaPlanejadaAmbientes > 0 ? areaPlanejadaAmbientes : areaPlanejadaItens;
      const areaMedida = itensUnicos.reduce(
        (total, item) => total + toNumber(item.area_medida_total),
        0,
      );
      // Usa progresso pré-calculado pelo backend (cascade RF17/RF18) como fonte primária
      const progressoPrecalculado = toNumber(pavimento.progresso);
      const progressoCalculado = areaPlanejada > 0 ? (areaMedida / areaPlanejada) * 100 : 0;
      const progresso = progressoPrecalculado > 0 ? progressoPrecalculado : progressoCalculado;

      return {
        pavimento,
        ambientes,
        itens,
        areaPlanejada,
        areaMedida,
        progresso,
      };
    });
};

function ObraCard({
  obra,
  dadosFin,
  mostraFin,
  expanded,
  compact,
  drill,
  onToggle,
}: {
  obra: Obra;
  dadosFin?: DashboardFinanceiroResponse['por_obra'][0];
  mostraFin: boolean;
  expanded: boolean;
  compact: boolean;
  drill?: DrilldownData | null;
  onToggle: (obraId: string) => void;
}) {
  const clienteNome = getClienteNome(obra);
  const corStatus = getCorStatus(obra.status);
  const pavimentosResumo = useMemo(() => getResumoPavimentos(drill), [drill]);
  const totalAmbientes = useMemo(
    () => pavimentosResumo.reduce((total, resumo) => total + resumo.ambientes.length, 0),
    [pavimentosResumo],
  );
  const totalItens = useMemo(
    () => pavimentosResumo.reduce((total, resumo) => total + resumo.itens.length, 0),
    [pavimentosResumo],
  );
  const areaPlanejada = useMemo(
    () => pavimentosResumo.reduce((total, resumo) => total + resumo.areaPlanejada, 0),
    [pavimentosResumo],
  );
  const areaMedida = useMemo(
    () => pavimentosResumo.reduce((total, resumo) => total + resumo.areaMedida, 0),
    [pavimentosResumo],
  );
  const areaMedidaExibida = useMemo(() => {
    const areaPorRelatorio = toNumber(dadosFin?.area_medida_total);
    if (areaMedida > 0) {
      return areaMedida;
    }
    return areaPorRelatorio;
  }, [areaMedida, dadosFin]);
  const areaPlanejadaExibida = useMemo(() => {
    const areaPorRelatorio = toNumber(dadosFin?.area_planejada_total);
    if (areaPlanejada > 0) {
      return areaPlanejada;
    }
    return areaPorRelatorio;
  }, [areaPlanejada, dadosFin]);
  const progresso = useMemo(() => {
    const progressoBackend = toNumber(obra.progresso);
    if (progressoBackend > 0) {
      return progressoBackend;
    }

    const pavimentosDaObra = ((obra as any).pavimentos || []) as Array<{ progresso?: number | string }>;
    if (pavimentosDaObra.length > 0) {
      const somaProgressoPavimentos = pavimentosDaObra.reduce(
        (sum, pavimento) => sum + toNumber(pavimento.progresso),
        0,
      );
      const mediaProgressoPavimentos = somaProgressoPavimentos / pavimentosDaObra.length;
      if (mediaProgressoPavimentos > 0) {
        return mediaProgressoPavimentos;
      }
    }

    if (areaPlanejadaExibida > 0) {
      return (areaMedidaExibida / areaPlanejadaExibida) * 100;
    }

    const progressoFinanceiro = toNumber(dadosFin?.progresso_percentual);
    if (progressoFinanceiro > 0) {
      return progressoFinanceiro;
    }

    return toNumber(obra.progresso);
  }, [areaMedidaExibida, areaPlanejadaExibida, dadosFin, obra.progresso]);

  const handleToggle = () => onToggle(obra.id);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggle();
    }
  };

  if (compact) {
    return (
      <Tooltip
        arrow
        placement="top"
        title={
          <Box sx={{ py: 0.5 }}>
            <Typography variant="subtitle2" fontWeight={700}>{obra.nome}</Typography>
            <Typography variant="caption" display="block">{clienteNome}</Typography>
            <Typography variant="caption" display="block">{obra.endereco_completo}</Typography>
            <Typography variant="caption" display="block" sx={{ mt: 0.75 }}>
              Progresso geral: {progresso.toFixed(1)}%
            </Typography>
          </Box>
        }
      >
        <Paper
          variant="outlined"
          role="button"
          tabIndex={0}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          sx={{
            width: 56,
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            borderRadius: 3,
            borderColor: alpha('#0B5FFF', 0.28),
            background: `linear-gradient(180deg, ${alpha('#F4F8FF', 0.96)} 0%, ${alpha('#FFFFFF', 0.98)} 100%)`,
            transition: 'transform 360ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 360ms ease, border-color 360ms ease',
            '&:hover, &:focus-visible': {
              transform: 'scale(1.08)',
              boxShadow: `0 8px 20px ${alpha('#0B5FFF', 0.18)}`,
              borderColor: alpha('#0B5FFF', 0.5),
            },
          }}
        >
          <BusinessIcon color="primary" />
        </Paper>
      </Tooltip>
    );
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        width: '100%',
        borderRadius: expanded ? 4 : 3,
        overflow: 'hidden',
        minHeight: expanded ? 560 : 120,
        height: '100%',
        borderColor: expanded ? alpha('#0B5FFF', 0.42) : 'divider',
        boxShadow: expanded ? `0 24px 48px ${alpha('#0B5FFF', 0.18)}` : `0 10px 28px ${alpha('#0F172A', 0.08)}`,
        background: expanded
          ? `linear-gradient(135deg, ${alpha('#F4F8FF', 0.98)} 0%, ${alpha('#FFFFFF', 0.96)} 58%, ${alpha('#EAF7F4', 0.95)} 100%)`
          : `linear-gradient(180deg, ${alpha('#FFFFFF', 0.98)} 0%, ${alpha('#F8FAFC', 0.98)} 100%)`,
        transition: 'transform 380ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 380ms ease, border-radius 380ms ease, min-height 380ms ease, border-color 380ms ease',
        '&:hover': !expanded ? {
          borderColor: alpha('#0B5FFF', 0.35),
          boxShadow: `0 14px 36px ${alpha('#0F172A', 0.12)}`,
        } : undefined,
      }}
    >
      <Box
        role="button"
        tabIndex={0}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        sx={{
          p: expanded ? 2.75 : 2.25,
          cursor: 'pointer',
          outline: 'none',
          transition: 'background-color 320ms ease',
          '&:hover': {
            bgcolor: alpha('#0B5FFF', !expanded ? 0.05 : 0.03),
          },
          '&:focus-visible': {
            boxShadow: `inset 0 0 0 2px ${alpha('#0B5FFF', 0.45)}`,
          },
        }}
        title={expanded ? 'Clique para recolher' : 'Clique para expandir'}
      >
        <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ mb: 1.5 }}>
          <Box
            sx={{
              width: expanded ? 48 : 42,
              height: expanded ? 48 : 42,
              borderRadius: 2.5,
              display: 'grid',
              placeItems: 'center',
              bgcolor: alpha('#0B5FFF', 0.08),
              color: 'primary.main',
              flexShrink: 0,
            }}
          >
            <BusinessIcon />
          </Box>

          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              sx={{ mb: 0.75, justifyContent: 'space-between' }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant={expanded ? 'h6' : 'subtitle1'}
                  fontWeight={800}
                  sx={{ minWidth: 0, overflowWrap: 'anywhere', mb: 0.5 }}
                >
                  {obra.nome}
                </Typography>
                <Chip label={obra.status} size="small" color={corStatus} />
                {expanded && (
                  <Chip
                    label="Card ativo"
                    size="small"
                    sx={{
                      bgcolor: alpha('#0B5FFF', 0.1),
                      color: 'primary.main',
                      fontWeight: 700,
                      ml: 1,
                    }}
                  />
                )}
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'primary.main',
                  transition: 'transform 380ms cubic-bezier(0.22, 1, 0.36, 1)',
                  fontSize: 28,
                  flexShrink: 0,
                  mt: { xs: 1, sm: 0 },
                }}
              >
                {expanded ? <ExpandLessIcon sx={{ fontSize: 28 }} /> : <ExpandMoreIcon sx={{ fontSize: 28 }} />}
              </Box>
            </Stack>

            <Typography variant="body2" color="text.primary" fontWeight={600} sx={{ mb: 0.5 }}>
              {clienteNome}
            </Typography>

            <Stack direction="row" spacing={0.75} alignItems="flex-start" sx={{ mb: 1.5 }}>
              <PlaceOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary', mt: 0.1 }} />
              <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                {obra.endereco_completo}
              </Typography>
            </Stack>

            <Box>
              <Stack direction="row" justifyContent="space-between" spacing={1} sx={{ mb: 0.75 }}>
                <Typography variant="caption" color="text.secondary">
                  Progresso geral
                </Typography>
                <Typography variant="caption" fontWeight={800} color="text.primary">
                  {progresso.toFixed(1)}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={Math.min(progresso, 100)}
                color={progresso >= 80 ? 'success' : progresso >= 40 ? 'warning' : 'primary'}
                sx={{
                  height: expanded ? 10 : 8,
                  borderRadius: 999,
                  bgcolor: alpha('#0F172A', 0.08),
                }}
              />
            </Box>
          </Box>
        </Stack>
      </Box>

      {expanded && (
        <Box
          sx={{
            px: 2.75,
            pb: 2.75,
            transformOrigin: 'top center',
            animation: 'dashboardCardExpand 380ms cubic-bezier(0.22, 1, 0.36, 1)',
            '@keyframes dashboardCardExpand': {
              '0%': { opacity: 0, transform: 'scale(0.98)' },
              '100%': { opacity: 1, transform: 'scale(1)' },
            },
          }}
        >
          <Grid container spacing={2} sx={{ mb: 2.5 }}>
            <Grid item xs={12} sm={6} xl={3}>
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 3, height: '100%' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <ApartmentOutlinedIcon color="primary" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Pavimentos</Typography>
                    <Typography variant="h6" fontWeight={800}>{pavimentosResumo.length}</Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} xl={3}>
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 3, height: '100%' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <LayersIcon color="primary" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Ambientes</Typography>
                    <Typography variant="h6" fontWeight={800}>{totalAmbientes}</Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} xl={3}>
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 3, height: '100%' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <CategoryOutlinedIcon color="primary" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Elementos</Typography>
                    <Typography variant="h6" fontWeight={800}>{totalItens}</Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} xl={3}>
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 3, height: '100%' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <QueryStatsOutlinedIcon color="primary" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Área medida</Typography>
                    <Typography variant="h6" fontWeight={800}>{areaMedidaExibida.toFixed(1)} m²</Typography>
                    <Typography variant="caption" color="text.secondary">
                      de {areaPlanejadaExibida.toFixed(1)} m² planejados
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          {mostraFin && dadosFin && (
            <Grid container spacing={2} sx={{ mb: 2.5 }}>
              <Grid item xs={12} md={6} lg={4}>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 3 }}>
                  <Typography variant="caption" color="text.secondary">Medições registradas</Typography>
                  <Typography variant="h6" fontWeight={800}>{dadosFin.medicoes}</Typography>
                </Paper>
              </Grid>
            </Grid>
          )}

          {!drill || drill.carregando ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress size={26} />
            </Box>
          ) : drill.erro ? (
            <Alert severity="warning">Não foi possível carregar os detalhes de progresso desta obra.</Alert>
          ) : pavimentosResumo.length === 0 ? (
            <Alert severity="info">Nenhum pavimento cadastrado para esta obra.</Alert>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: {
                  xs: '1fr',
                  lg: 'repeat(2, minmax(0, 1fr))',
                },
              }}
            >
              {pavimentosResumo.map((resumo) => {
                const ambientesPreview = resumo.ambientes.slice(0, 3).map((ambiente) => ambiente.nome).join(' • ');
                const ambientesRestantes = Math.max(resumo.ambientes.length - 3, 0);

                return (
                  <Paper
                    key={resumo.pavimento.id}
                    variant="outlined"
                    sx={{
                      p: 1.75,
                      borderRadius: 3,
                      borderColor: alpha('#0B5FFF', 0.14),
                      background: `linear-gradient(180deg, ${alpha('#FFFFFF', 0.96)} 0%, ${alpha('#F8FAFC', 0.94)} 100%)`,
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ mb: 1.25 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" fontWeight={800} sx={{ overflowWrap: 'anywhere' }}>
                          {resumo.pavimento.nome}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {resumo.ambientes.length} ambientes • {resumo.itens.length} elementos
                        </Typography>
                      </Box>
                      <Typography variant="subtitle2" fontWeight={800} color="primary.main">
                        {resumo.progresso.toFixed(0)}%
                      </Typography>
                    </Stack>

                    <LinearProgress
                      variant="determinate"
                      value={Math.min(resumo.progresso, 100)}
                      color={resumo.progresso >= 80 ? 'success' : resumo.progresso >= 40 ? 'warning' : 'primary'}
                      sx={{ height: 9, borderRadius: 999, mb: 1.25, bgcolor: alpha('#0F172A', 0.08) }}
                    />

                    <Grid container spacing={1} sx={{ mb: 1 }}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Área planejada</Typography>
                        <Typography variant="body2" fontWeight={700}>{resumo.areaPlanejada.toFixed(1)} m²</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Área medida</Typography>
                        <Typography variant="body2" fontWeight={700}>{resumo.areaMedida.toFixed(1)} m²</Typography>
                      </Grid>
                    </Grid>

                    {ambientesPreview ? (
                      <Typography variant="caption" color="text.secondary">
                        Ambientes: {ambientesPreview}
                        {ambientesRestantes > 0 ? ` +${ambientesRestantes}` : ''}
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        Sem ambientes vinculados.
                      </Typography>
                    )}
                  </Paper>
                );
              })}
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
}

export const DashboardPage = () => {
  const [obras, setObras] = useState<Obra[]>([]);
  const [financeiro, setFinanceiro] = useState<DashboardFinanceiroResponse | null>(null);
  const [loadingObras, setLoadingObras] = useState(true);
  const [erroObras, setErroObras] = useState('');
  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [expandedObraId, setExpandedObraId] = useState<string | null>(null);
  const [drillCache, setDrillCache] = useState<DrilldownCache>({});
  const { showToast } = useToast();
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const drillCacheRef = useRef<DrilldownCache>({});
  const dashboardFinanceiroForbiddenRef = useRef(false);

  const { user } = useSelector((state: RootState) => state.auth);
  const mostraFin = useMemo(
    () => user?.id_perfil !== undefined && [PerfilEnum.ADMIN, PerfilEnum.GESTOR].includes(user.id_perfil),
    [user?.id_perfil],
  );

  const idPerfil = user?.id_perfil;

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    drillCacheRef.current = drillCache;
  }, [drillCache]);

  const carregarDrill = useCallback(async (obraId: string, force = false) => {
    const atual = drillCacheRef.current[obraId];
    if (atual && !force && (atual.carregando || !atual.erro)) {
      return;
    }

    setDrillCache((cacheAtual) => ({
      ...cacheAtual,
      [obraId]: {
        pavimentos: cacheAtual[obraId]?.pavimentos ?? [],
        ambientes: cacheAtual[obraId]?.ambientes ?? [],
        itens: cacheAtual[obraId]?.itens ?? [],
        carregando: true,
        erro: false,
      },
    }));

    try {
      const [pavimentos, ambientes, itens] = await Promise.all([
        pavimentosService.listarPorObra(obraId),
        ambientesService.listarPorObra(obraId),
        itensAmbienteService.listarPorObra(obraId),
      ]);

      if (!mountedRef.current) {
        return;
      }

      setDrillCache((cacheAtual) => ({
        ...cacheAtual,
        [obraId]: {
          pavimentos,
          ambientes,
          itens,
          carregando: false,
          erro: false,
        },
      }));
    } catch {
      if (!mountedRef.current) {
        return;
      }

      setDrillCache((cacheAtual) => ({
        ...cacheAtual,
        [obraId]: {
          pavimentos: cacheAtual[obraId]?.pavimentos ?? [],
          ambientes: cacheAtual[obraId]?.ambientes ?? [],
          itens: cacheAtual[obraId]?.itens ?? [],
          carregando: false,
          erro: true,
        },
      }));
    }
  }, []);

  const carregarFinanceiro = useCallback(async () => {
    const podeVerFin = idPerfil !== undefined && [PerfilEnum.ADMIN, PerfilEnum.GESTOR].includes(idPerfil);

    if (!podeVerFin) {
      if (mountedRef.current) {
        setFinanceiro(null);
      }
      return;
    }

    if (dashboardFinanceiroForbiddenRef.current) {
      return;
    }

    try {
      const res = await relatoriosAPI.getDashboardFinanceiro({ periodo });
      if (mountedRef.current) {
        setFinanceiro(res.data);
      }
    } catch (err: any) {
      const status = err?.status ?? err?.response?.status;
      if (status === 403) {
        // Não insiste em polling quando o backend nega acesso para este usuário/contexto.
        dashboardFinanceiroForbiddenRef.current = true;
      }
      if (mountedRef.current) {
        setFinanceiro(null);
      }
    }
  }, [idPerfil, periodo]);

  useEffect(() => {
    // Permite nova tentativa ao trocar perfil/período.
    dashboardFinanceiroForbiddenRef.current = false;
  }, [idPerfil, periodo]);

  const carregarDashboard = useCallback(async (mostrarLoading = false, forceExpandedDrill = false) => {
    if (mostrarLoading) {
      setLoadingObras(true);
    }

    setErroObras('');

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Tempo limite ao carregar obras ativas.')), DASHBOARD_REQUEST_TIMEOUT_MS);
      });

      const data = await Promise.race([obrasService.listarAtivas(), timeoutPromise]);

      if (!mountedRef.current) {
        return;
      }

      setObras(data);

      void carregarFinanceiro();

      if (expandedObraId) {
        await carregarDrill(expandedObraId, forceExpandedDrill);
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setErroObras(err?.message || 'Erro ao carregar obras');
      }
    } finally {
      if (mountedRef.current) {
        // Garante que o loading inicial seja encerrado mesmo se houver
        // concorrencia entre chamadas de refresh/polling.
        setLoadingObras(false);
      }
    }
  }, [carregarDrill, carregarFinanceiro, expandedObraId]);

  useEffect(() => {
    void carregarDashboard(true, true);
    pollingRef.current = setInterval(() => {
      void carregarDashboard(false, true);
    }, 15_000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [carregarDashboard]);

  useEffect(() => {
    const handleRefresh = () => {
      void carregarDashboard(false, true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleRefresh();
      }
    };

    window.addEventListener('focus', handleRefresh);
    window.addEventListener('dashboard:refresh', handleRefresh as EventListener);
    window.addEventListener('medicao:salva', handleRefresh as EventListener);
    window.addEventListener('alocacao:atualizada', handleRefresh as EventListener);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleRefresh);
      window.removeEventListener('dashboard:refresh', handleRefresh as EventListener);
      window.removeEventListener('medicao:salva', handleRefresh as EventListener);
      window.removeEventListener('alocacao:atualizada', handleRefresh as EventListener);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [carregarDashboard]);

  const atualizar = () => {
    void carregarDashboard(true, true);
  };

  const handleToggleObra = useCallback((obraId: string) => {
    if (expandedObraId === obraId) {
      setExpandedObraId(null);
      return;
    }

    setExpandedObraId(obraId);
    void carregarDrill(obraId);
  }, [carregarDrill, expandedObraId]);

  const exportar = async (formato: 'csv' | 'excel' | 'pdf') => {
    try {
      const res = await relatoriosAPI.exportDashboardFinanceiro({ formato, periodo });
      const ext = formato === 'excel' ? 'xlsx' : formato;
      const mime = formato === 'csv'
        ? 'text/csv'
        : formato === 'excel'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/pdf';
      const blob = new Blob([res.data], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-${periodo}-${new Date().toISOString().slice(0, 10)}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast({ message: `Exportado para ${formato.toUpperCase()}!`, severity: 'success' });
    } catch (err: any) {
      showToast({ message: err?.message || 'Erro ao exportar', severity: 'error' });
    }
  };

  const finMap = new Map((financeiro?.por_obra ?? []).map((item) => [item.obra_id, item]));
  const obraExpandida = expandedObraId ? obras.find((obra) => obra.id === expandedObraId) ?? null : null;
  const obrasCompactas = expandedObraId ? obras.filter((obra) => obra.id !== expandedObraId) : [];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 3 }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>Dashboard</Typography>
        <Chip
          label={periodoLabels[periodo]}
          onClick={(event) => setAnchorEl(event.currentTarget)}
          icon={<FilterListIcon />}
          variant="outlined"
        />
        {mostraFin && (
          <>
            <Button size="small" variant="outlined" startIcon={<DownloadIcon />} onClick={() => exportar('csv')}>CSV</Button>
            <Button size="small" variant="outlined" startIcon={<DownloadIcon />} onClick={() => exportar('excel')}>Excel</Button>
            <Button size="small" variant="outlined" startIcon={<DownloadIcon />} onClick={() => exportar('pdf')}>PDF</Button>
          </>
        )}
        <IconButton onClick={atualizar} color="primary" title="Atualizar agora">
          <RefreshIcon />
        </IconButton>
      </Box>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        {(Object.keys(periodoLabels) as Periodo[]).map((itemPeriodo) => (
          <MenuItem
            key={itemPeriodo}
            selected={itemPeriodo === periodo}
            onClick={() => {
              setPeriodo(itemPeriodo);
              setAnchorEl(null);
            }}
          >
            {periodoLabels[itemPeriodo]}
          </MenuItem>
        ))}
      </Menu>

      {loadingObras && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {erroObras && <Alert severity="error" sx={{ mb: 2 }}>{erroObras}</Alert>}

      {!loadingObras && obras.length === 0 && !erroObras && (
        <Alert
          severity="info"
          action={(
            <Button color="inherit" size="small" onClick={atualizar}>
              Atualizar
            </Button>
          )}
        >
          Não há obra ativa no momento.
        </Alert>
      )}

      {!loadingObras && !!obraExpandida && (
        <Box sx={{ width: '100%' }}>
          <ObraCard
            obra={obraExpandida}
            dadosFin={finMap.get(obraExpandida.id)}
            mostraFin={mostraFin}
            expanded
            compact={false}
            drill={drillCache[obraExpandida.id]}
            onToggle={handleToggleObra}
          />

          {obrasCompactas.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                alignContent: 'flex-start',
                justifyContent: 'flex-start',
                mt: 2,
              }}
            >
              {obrasCompactas.map((obra) => (
                <ObraCard
                  key={obra.id}
                  obra={obra}
                  dadosFin={finMap.get(obra.id)}
                  mostraFin={mostraFin}
                  expanded={false}
                  compact
                  drill={drillCache[obra.id]}
                  onToggle={handleToggleObra}
                />
              ))}
            </Box>
          )}
        </Box>
      )}

      {!loadingObras && !obraExpandida && (
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(2, minmax(0, 1fr))',
              xl: 'repeat(3, minmax(0, 1fr))',
            },
          }}
        >
          {obras.map((obra) => (
            <ObraCard
              key={obra.id}
              obra={obra}
              dadosFin={finMap.get(obra.id)}
              mostraFin={mostraFin}
              expanded={false}
              compact={false}
              drill={drillCache[obra.id]}
              onToggle={handleToggleObra}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};
