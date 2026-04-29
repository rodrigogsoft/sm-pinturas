import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  TextField,
  Tooltip,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useLocation } from 'react-router-dom';
import { medicoesService } from '../../services/medicoes.service';
import { MedicoesForm } from '../../components/MedicoesForm';
import { api } from '../../services/api';
import ImageIcon from '@mui/icons-material/Image';
import InfoIcon from '@mui/icons-material/Info';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { PerfilEnum } from '../../store/slices/authSlice';

interface Medicao {
  id: string;
  id_alocacao: string;
  nomeColaborador: string;
  nomeAmbiente: string;
  nomeServico: string;
  qtd_executada: number;
  preco_custo: number;
  area_planejada: number;
  data_medicao: string;
  status_pagamento: string;
  flag_excedente: boolean;
  justificativa?: string;
  foto_evidencia_url?: string;
  valor_total: number;
  nome_obra: string;
}

interface AlocacaoApi {
  id: string;
  id_servico_catalogo?: number;
  idServicoCatalogo?: number;
  id_servico?: number;
  idServico?: number;
  nome_servico?: string;
  nomeServico?: string;
  sessao?: {
    id_obra?: string;
  };
  colaborador?: {
    nome_completo?: string;
  };
  ambiente?: {
    nome?: string;
  };
}

interface ObraApi {
  id: string;
  nome: string;
}

interface ServicoApi {
  id: number;
  nome: string;
}

interface MedicaoApi {
  id: string;
  id_alocacao: string;
  nomeColaborador?: string;
  nome_colaborador?: string;
  nomeAmbiente?: string;
  nome_ambiente?: string;
  nomeServico?: string;
  nome_servico?: string;
  qtd_executada: number;
  area_planejada: number;
  data_medicao: string;
  status_pagamento: string;
  flag_excedente: boolean;
  justificativa?: string;
  foto_evidencia_url?: string;
  valor_total: number;
  valor_calculado?: number;
  preco_custo?: number;
  nome_obra: string;
  id_obra?: string;
  created_at?: string;
  alocacao?: {
    id_servico_catalogo?: number;
    colaborador?: {
      nome_completo?: string;
    };
    ambiente?: {
      nome?: string;
    };
    sessao?: {
      id_obra?: string;
    };
    item_ambiente?: {
      tabelaPreco?: {
        id_servico_catalogo?: number;
        preco_custo?: number;
      };
      tabela_preco?: {
        id_servico_catalogo?: number;
        preco_custo?: number;
      };
    };
  };
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const MedicoesPage = () => {
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  const [tabValue, setTabValue] = useState(0);
  const [medicoes, setMedicoes] = useState<Medicao[]>([]);
  const [excedentes, setExcedentes] = useState<Medicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedExcedente, setSelectedExcedente] = useState<Medicao | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [stats, setStats] = useState({
    total_medicoes: 0,
    total_excedentes: 0,
    valor_total: 0,
    pendentes_pagamento: 0,
  });
  const [medicaoEditando, setMedicaoEditando] = useState<Medicao | null>(null);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editQtdExecutada, setEditQtdExecutada] = useState('');
  const [editAreaPlanejada, setEditAreaPlanejada] = useState('');
  const [editJustificativa, setEditJustificativa] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const perfilBruto = (user as any)?.id_perfil ?? (user as any)?.perfil;
  const perfil = perfilBruto !== undefined ? Number(perfilBruto) : undefined;
  const podeEditar = perfil === PerfilEnum.ADMIN || perfil === PerfilEnum.GESTOR;
  const podeApagar = perfil === PerfilEnum.ADMIN;

  const toNumber = (value: unknown): number => {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  // Carregar medicões e excedentes
  useEffect(() => {
    carregarDados();
  }, [location.search]);

  const normalizarMedicoes = (
    medicoesRaw: MedicaoApi[],
    alocacoesMap: Map<string, {
      nomeServico?: string;
      idServico?: number;
      nomeColaborador?: string;
      nomeAmbiente?: string;
      idObra?: string;
    }>,
    servicosMap: Map<number, string>,
    obrasMap: Map<string, string>,
  ): Medicao[] => {
    return medicoesRaw.map((medicao) => {
      const alocacaoRef = alocacoesMap.get(medicao.id_alocacao);
      const idServicoRef =
        medicao.alocacao?.id_servico_catalogo ??
        alocacaoRef?.idServico;
      const nomeServico =
        medicao.nomeServico ||
        medicao.nome_servico ||
        alocacaoRef?.nomeServico ||
        (idServicoRef ? servicosMap.get(Number(idServicoRef)) : undefined) ||
        'Servico nao informado';

      const idObraRef = medicao.id_obra || medicao.alocacao?.sessao?.id_obra || alocacaoRef?.idObra;
      const dataMedicao = medicao.data_medicao || medicao.created_at || '';
      const qtdExecutada = toNumber(medicao.qtd_executada);
      const valorPersistido = toNumber(medicao.valor_calculado) || toNumber((medicao as any).valor_total);

      // Preço de custo: campo direto retornado pelo backend (já resolvido no controller)
      const precoCustoBackend = toNumber(medicao.preco_custo);
      const tabelaPreco = medicao.alocacao?.item_ambiente?.tabelaPreco ?? medicao.alocacao?.item_ambiente?.tabela_preco;
      const precoCustoTabela = tabelaPreco ? toNumber(tabelaPreco.preco_custo) : 0;

      // Prioridade: campo direto > nested tabelaPreco > derivado de valor_calculado
      const precoCusto = precoCustoBackend > 0
        ? precoCustoBackend
        : precoCustoTabela > 0
          ? precoCustoTabela
          : (qtdExecutada > 0 ? valorPersistido / qtdExecutada : 0);

      const valorFinal = precoCusto > 0 ? qtdExecutada * precoCusto : valorPersistido;

      return {
        id: medicao.id,
        id_alocacao: medicao.id_alocacao,
        nomeColaborador:
          medicao.nomeColaborador ||
          medicao.nome_colaborador ||
          medicao.alocacao?.colaborador?.nome_completo ||
          alocacaoRef?.nomeColaborador ||
          'Colaborador nao informado',
        nomeAmbiente:
          medicao.nomeAmbiente ||
          medicao.nome_ambiente ||
          medicao.alocacao?.ambiente?.nome ||
          alocacaoRef?.nomeAmbiente ||
          'Ambiente nao informado',
        nomeServico,
        qtd_executada: qtdExecutada,
        preco_custo: precoCusto,
        area_planejada: toNumber(medicao.area_planejada),
        data_medicao: dataMedicao,
        status_pagamento: medicao.status_pagamento || 'ABERTO',
        flag_excedente: Boolean(medicao.flag_excedente),
        justificativa: medicao.justificativa,
        foto_evidencia_url: medicao.foto_evidencia_url,
        valor_total: valorFinal,
        nome_obra: medicao.nome_obra || (idObraRef ? obrasMap.get(idObraRef) : undefined) || 'Obra nao informada',
      };
    });
  };

  const carregarDados = async () => {
    setLoading(true);
    setError('');
    try {
      const paramsUrl = new URLSearchParams(location.search);
      const idSessao = paramsUrl.get('id_sessao') || undefined;

      const [medicoesResponse, excedenteResponse, alocacoesResponse, servicosResponse, obrasResponse] = await Promise.all([
        medicoesService.listar({ id_sessao: idSessao }),
        medicoesService.listarExcedentes(idSessao ? { id_sessao: idSessao } : undefined),
        api.get('/alocacoes', { params: idSessao ? { id_sessao: idSessao } : {} }),
        api.get('/servicos'),
        api.get('/obras'),
      ]);

      const alocacoesRaw = (alocacoesResponse.data || []) as AlocacaoApi[];
      const servicosRaw = (servicosResponse.data || []) as ServicoApi[];
      const obrasRaw = (obrasResponse.data || []) as ObraApi[];

      const alocacoesMap = new Map<string, {
        nomeServico?: string;
        idServico?: number;
        nomeColaborador?: string;
        nomeAmbiente?: string;
        idObra?: string;
      }>(
        alocacoesRaw.map((alocacao) => {
          const idServico =
            alocacao.id_servico_catalogo ??
            alocacao.idServicoCatalogo ??
            alocacao.id_servico ??
            alocacao.idServico ??
            undefined;
          return [
            alocacao.id,
            {
              nomeServico: alocacao.nome_servico || alocacao.nomeServico,
              idServico,
              nomeColaborador: alocacao.colaborador?.nome_completo,
              nomeAmbiente: alocacao.ambiente?.nome,
              idObra: alocacao.sessao?.id_obra,
            },
          ];
        })
      );

      const servicosMap = new Map<number, string>(
        servicosRaw.map((servico) => [Number(servico.id), servico.nome])
      );

      const obrasMap = new Map<string, string>(
        obrasRaw.map((obra) => [obra.id, obra.nome])
      );

      const medicoesData = normalizarMedicoes(
        ((medicoesResponse.data || []) as MedicaoApi[]),
        alocacoesMap,
        servicosMap,
        obrasMap,
      );

      const excedenteData = normalizarMedicoes(
        ((excedenteResponse.data || []) as MedicaoApi[]),
        alocacoesMap,
        servicosMap,
        obrasMap,
      );
      
      setMedicoes(medicoesData);
      setExcedentes(excedenteData);

      const stats = {
        total_medicoes: medicoesData.length,
        total_excedentes: excedenteData.length,
        valor_total: medicoesData.reduce((acc, medicao) => acc + toNumber(medicao.valor_total), 0),
        pendentes_pagamento: medicoesData.filter((medicao) => medicao.status_pagamento !== 'PAGO').length,
      };
      setStats({
        total_medicoes: stats.total_medicoes,
        total_excedentes: stats.total_excedentes,
        valor_total: stats.valor_total,
        pendentes_pagamento: stats.pendentes_pagamento,
      });
    } catch (err: any) {
      console.error('Erro ao carregar medicões:', err);
      setMedicoes([]);
      setExcedentes([]);
      setStats({
        total_medicoes: 0,
        total_excedentes: 0,
        valor_total: 0,
        pendentes_pagamento: 0,
      });
      const mensagem = err?.response?.data?.message || err?.message || 'Erro ao carregar medições do backend.';
      setError(Array.isArray(mensagem) ? mensagem.join(' | ') : mensagem);
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirEdicao = (medicao: Medicao) => {
    setMedicaoEditando(medicao);
    setEditQtdExecutada(String(toNumber(medicao.qtd_executada)));
    setEditAreaPlanejada(String(toNumber(medicao.area_planejada)));
    setEditJustificativa(medicao.justificativa || '');
    setOpenEditModal(true);
  };

  const handleFecharEdicao = () => {
    setOpenEditModal(false);
    setMedicaoEditando(null);
    setEditQtdExecutada('');
    setEditAreaPlanejada('');
    setEditJustificativa('');
  };

  const handleSalvarEdicao = async () => {
    if (!medicaoEditando) {
      return;
    }

    const qtd = Number(editQtdExecutada.replace(',', '.'));
    const area = Number(editAreaPlanejada.replace(',', '.'));

    if (!Number.isFinite(qtd) || qtd <= 0) {
      setError('Quantidade executada deve ser maior que zero.');
      return;
    }

    if (!Number.isFinite(area) || area <= 0) {
      setError('Área planejada deve ser maior que zero.');
      return;
    }

    try {
      setEditLoading(true);
      setError('');
      await medicoesService.atualizar(medicaoEditando.id, {
        qtd_executada: qtd,
        area_planejada: area,
        justificativa: editJustificativa || undefined,
      });
      handleFecharEdicao();
      await carregarDados();
    } catch (err: any) {
      const mensagem = err?.response?.data?.message || err?.message || 'Erro ao editar medição.';
      setError(Array.isArray(mensagem) ? mensagem.join(' | ') : mensagem);
    } finally {
      setEditLoading(false);
    }
  };

  const handleApagar = async (medicao: Medicao) => {
    if (!window.confirm('Tem certeza que deseja apagar esta medição?')) {
      return;
    }

    try {
      setError('');
      await medicoesService.deletar(medicao.id);
      await carregarDados();
    } catch (err: any) {
      const mensagem = err?.response?.data?.message || err?.message || 'Erro ao apagar medição.';
      setError(Array.isArray(mensagem) ? mensagem.join(' | ') : mensagem);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleViewExcedente = (medicao: Medicao) => {
    setSelectedExcedente(medicao);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedExcedente(null);
  };

  const columns: GridColDef[] = [
    {
      field: 'nomeColaborador',
      headerName: 'Colaborador',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'nomeAmbiente',
      headerName: 'Ambiente',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'nomeServico',
      headerName: 'Serviço',
      flex: 1,
      minWidth: 180,
    },
    {
      field: 'data_medicao',
      headerName: 'Data',
      width: 120,
      renderCell: (params) => {
        if (!params.value) {
          return '-';
        }
        const parsed = new Date(String(params.value));
        return Number.isNaN(parsed.getTime()) ? '-' : parsed.toLocaleDateString('pt-BR');
      },
    },
    {
      field: 'qtd_executada',
      headerName: 'Qtd. Executada (m²)',
      width: 130,
      renderCell: (params) => toNumber(params.value).toFixed(2),
    },
    {
      field: 'preco_custo',
      headerName: 'Preço de Custo (R$)',
      flex: 1,
      minWidth: 150,
      renderCell: (params) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
          toNumber(params.value)
        ),
    },
    {
      field: 'area_planejada',
      headerName: 'Área Planejada (m²)',
      width: 130,
      renderCell: (params) => toNumber(params.value).toFixed(2),
    },
    {
      field: 'valor_total',
      headerName: 'Valor (R$)',
      width: 130,
      renderCell: (params) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
          toNumber(params.value)
        ),
    },
    {
      field: 'status_pagamento',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === 'PAGO' ? 'success' : 'warning'}
          size="small"
        />
      ),
    },
    {
      field: 'acoes',
      headerName: 'Ações',
      width: 220,
      sortable: false,
      filterable: false,
      renderCell: (params: any) => {
        const medicao = params.row as Medicao;
        const bloqueada = medicao.status_pagamento === 'PAGO';
        const editarDesabilitado = !podeEditar || bloqueada;
        const apagarDesabilitado = !podeApagar || bloqueada;

        const tooltipEditar = !podeEditar
          ? 'Sem permissão para editar'
          : bloqueada
            ? 'Medição paga não pode ser editada'
            : 'Editar medição';

        const tooltipApagar = !podeApagar
          ? 'Sem permissão para apagar'
          : bloqueada
            ? 'Medição paga não pode ser apagada'
            : 'Apagar medição';

        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={tooltipEditar}>
              <span>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleAbrirEdicao(medicao)}
                  disabled={editarDesabilitado}
                >
                  Editar
                </Button>
              </span>
            </Tooltip>

            <Tooltip title={tooltipApagar}>
              <span>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={() => handleApagar(medicao)}
                  disabled={apagarDesabilitado}
                >
                  Apagar
                </Button>
              </span>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  const columnasExcedentes: GridColDef[] = [
    ...columns,
    {
      field: 'flag_excedente',
      headerName: 'Ações',
      width: 120,
      renderCell: (params) => (
        <Button
          size="small"
          startIcon={<ImageIcon />}
          onClick={() => handleViewExcedente(params.row)}
        >
          Ver Justificativa
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
          Gerenciamento de Medições
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Card de ação */}
        <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f5f5f5' }}>
          <MedicoesForm />
        </Paper>

        {/* Estatísticas */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total de Medições
                </Typography>
                <Typography variant="h5">{stats.total_medicoes}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Excedentes
                </Typography>
                <Typography variant="h5" color="warning.main">
                  {stats.total_excedentes}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Pendentes de Pagamento
                </Typography>
                <Typography variant="h5">{stats.pendentes_pagamento}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Valor Total
                </Typography>
                <Typography variant="h5" color="primary.main">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    stats.valor_total
                  )}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Tabs */}
      <Paper>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="Abas de medições"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Todas as Medições" />
          <Tab label={`Excedentes (${stats.total_excedentes})`} />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {medicoes.length === 0 ? (
            <Alert severity="info">Nenhuma medição registrada ainda.</Alert>
          ) : (
            <Box sx={{ height: 500, width: '100%' }}>
              <DataGrid
                rows={medicoes}
                columns={columns}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10, page: 0 } },
                }}
                pageSizeOptions={[10, 25, 50]}
                disableRowSelectionOnClick
                sx={{
                  '& .MuiDataGrid-cell': {
                    borderBottom: '1px solid #e0e0e0',
                  },
                }}
              />
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {excedentes.length === 0 ? (
            <Alert severity="success">Nenhum excedente registrado.</Alert>
          ) : (
            <Box sx={{ height: 500, width: '100%' }}>
              <Alert severity="warning" icon={<InfoIcon />} sx={{ mb: 2 }}>
                Medições que ultrapassaram a área planejada. Verifique justificativas e fotos de evidência.
              </Alert>
              <DataGrid
                rows={excedentes}
                columns={columnasExcedentes}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10, page: 0 } },
                }}
                pageSizeOptions={[10, 25, 50]}
                disableRowSelectionOnClick
                sx={{
                  '& .MuiDataGrid-cell': {
                    borderBottom: '1px solid #e0e0e0',
                  },
                }}
              />
            </Box>
          )}
        </TabPanel>
      </Paper>

      {/* Modal de detalhe do excedente */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>Detalhe do Excedente</DialogTitle>
        <DialogContent>
          {selectedExcedente && (
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Colaborador
                </Typography>
                <Typography variant="body1">{selectedExcedente.nomeColaborador}</Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="textSecondary">
                  Ambiente
                </Typography>
                <Typography variant="body1">{selectedExcedente.nomeAmbiente}</Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="textSecondary">
                  Serviço
                </Typography>
                <Typography variant="body1">{selectedExcedente.nomeServico || 'Servico nao informado'}</Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="textSecondary">
                  Obra
                </Typography>
                <Typography variant="body1">{selectedExcedente.nome_obra}</Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="textSecondary">
                  Quantidade Planejada vs Executada
                </Typography>
                <Typography variant="body1">
                  {toNumber(selectedExcedente.area_planejada).toFixed(2)}m2 {'->'} {toNumber(selectedExcedente.qtd_executada).toFixed(2)}m2
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="textSecondary">
                  Data
                </Typography>
                <Typography variant="body1">
                  {new Date(selectedExcedente.data_medicao).toLocaleDateString('pt-BR')}
                </Typography>
              </Box>

              {selectedExcedente.justificativa && (
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Justificativa
                  </Typography>
                  <Paper sx={{ p: 1.5, backgroundColor: '#f5f5f5' }}>
                    <Typography variant="body2">{selectedExcedente.justificativa}</Typography>
                  </Paper>
                </Box>
              )}

              {selectedExcedente.foto_evidencia_url && (
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Foto de Evidência
                  </Typography>
                  <Box
                    component="img"
                    src={selectedExcedente.foto_evidencia_url}
                    sx={{
                      width: '100%',
                      borderRadius: 1,
                      mt: 1,
                      maxHeight: '300px',
                      objectFit: 'cover',
                    }}
                    alt="Evidência do excedente"
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Fechar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openEditModal} onClose={handleFecharEdicao} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Medição</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Qtd. Executada (m²)"
              value={editQtdExecutada}
              onChange={(e) => setEditQtdExecutada(e.target.value)}
              type="number"
              inputProps={{ min: 0, step: '0.01' }}
              fullWidth
            />
            <TextField
              label="Área Planejada (m²)"
              value={editAreaPlanejada}
              onChange={(e) => setEditAreaPlanejada(e.target.value)}
              type="number"
              inputProps={{ min: 0, step: '0.01' }}
              fullWidth
            />
            <TextField
              label="Justificativa"
              value={editJustificativa}
              onChange={(e) => setEditJustificativa(e.target.value)}
              multiline
              minRows={3}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFecharEdicao} disabled={editLoading}>Cancelar</Button>
          <Button onClick={handleSalvarEdicao} variant="contained" disabled={editLoading}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
