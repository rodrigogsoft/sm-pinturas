import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useToast } from '../../components/Toast/ToastProvider';
import obrasService, { Obra } from '../../services/obras.service';
import financeiroService, {
  FecharPeriodoFolhaDto,
  FiltrosFolhaIndividual,
  FolhaIndividualAgregadaItem,
  FolhaIndividualItem,
  LotePagamento,
  ReabrirPeriodoFolhaDto,
} from '../../services/financeiro.service';
import { colaboradoresAPI } from '../../services/api';
import { RootState } from '../../store';

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const FolhaIndividualPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [periodActionLoading, setPeriodActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any | null>(null);

  const [obras, setObras] = useState<Obra[]>([]);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [lotes, setLotes] = useState<LotePagamento[]>([]);
  const [itens, setItens] = useState<FolhaIndividualItem[]>([]);
  const [totais, setTotais] = useState({
    total_medicoes: 0,
    total_lotes: 0,
    valor_total_calculado: 0,
  });

  const [filters, setFilters] = useState<FiltrosFolhaIndividual>({
    data_inicio: '',
    data_fim: '',
    id_colaborador: '',
    id_lote_pagamento: '',
    id_obra: '',
    page: 1,
    limit: 20,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total_registros: 0,
    total_paginas: 0,
  });

  const itensIndividuais = (lista: Array<FolhaIndividualItem | FolhaIndividualAgregadaItem>) =>
    (lista || []).filter(
      (item): item is FolhaIndividualItem =>
        Boolean((item as FolhaIndividualItem).id) &&
        Boolean((item as FolhaIndividualItem).data_medicao),
    );

  const normalizarTotais = (totaisRaw: any) => ({
    total_medicoes: toNumber(totaisRaw?.total_medicoes),
    total_lotes: toNumber(totaisRaw?.total_lotes),
    valor_total_calculado: toNumber(totaisRaw?.valor_total_calculado),
  });

  const params = useMemo(() => {
    const p: FiltrosFolhaIndividual = {
      page: filters.page,
      limit: filters.limit,
    };

    if (filters.data_inicio) p.data_inicio = filters.data_inicio;
    if (filters.data_fim) p.data_fim = filters.data_fim;
    if (filters.id_colaborador) p.id_colaborador = filters.id_colaborador;
    if (filters.id_lote_pagamento) p.id_lote_pagamento = filters.id_lote_pagamento;
    if (filters.id_obra) p.id_obra = filters.id_obra;

    return p;
  }, [filters]);

  const carregarFolha = async () => {
    try {
      setLoading(true);
      setError('');

      const [respFolha, obrasData] = await Promise.all([
        financeiroService.consultarFolhaIndividual(params),
        Promise.resolve(obras),
      ]);

      setItens(itensIndividuais(respFolha.data.itens || []));
      setTotais(normalizarTotais(respFolha.data.totais));
      setPagination(respFolha.data.paginacao);
      setObras(obrasData || []);
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar folha individual.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarFolha();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.page, params.limit]);

  useEffect(() => {
    const interval = setInterval(() => {
      carregarFolha();
    }, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  useEffect(() => {
    const carregarAuxiliares = async () => {
      try {
        const [obrasData, colaboradoresResp, lotesResp] = await Promise.all([
          obrasService.listar(),
          colaboradoresAPI.getAll(),
          financeiroService.listarLotes(),
        ]);

        setObras(obrasData || []);
        setColaboradores(colaboradoresResp?.data || []);
        setLotes(lotesResp?.data || []);
      } catch {
        // Silencia erro de dados auxiliares para nao bloquear a consulta.
      }
    };

    carregarAuxiliares();
  }, []);

  const handleFiltrar = async () => {
    setFilters((prev) => ({ ...prev, page: 1 }));
    try {
      setLoading(true);
      setError('');
      const respFolha = await financeiroService.consultarFolhaIndividual({ ...params, page: 1 });
      const itens = itensIndividuais(respFolha.data.itens || []);
      setItens(itens);
      setTotais(normalizarTotais(respFolha.data.totais));
      setPagination(respFolha.data.paginacao);
      if (itens.length === 0) {
        showToast({ message: 'Nenhum item encontrado para os filtros aplicados.', severity: 'info' });
      } else {
        showToast({ message: `${itens.length} item(ns) carregado(s).`, severity: 'success' });
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Erro ao filtrar folha individual.';
      setError(errorMsg);
      showToast({ message: errorMsg, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleExportarCsv = async () => {
    try {
      setExporting(true);
      setError('');

      const { data } = await financeiroService.exportarFolhaIndividualCsv({
        ...params,
        page: undefined,
        limit: undefined,
      });

      const url = window.URL.createObjectURL(new Blob([data], { type: 'text/csv;charset=utf-8;' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `folha-individual-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast({ message: 'Folha individual exportada com sucesso!', severity: 'success' });
    } catch (err: any) {
      const errorMsg = err?.message || 'Erro ao exportar CSV da folha individual.';
      setError(errorMsg);
      showToast({ message: errorMsg, severity: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const handlePreviewVales = async () => {
    if (!filters.id_lote_pagamento) {
      setError('Informe o ID do lote para simular descontos de vales.');
      showToast({ message: 'Informe o ID do lote para simular descontos de vales.', severity: 'warning' });
      return;
    }

    try {
      setPreviewLoading(true);
      setError('');
      const response = await financeiroService.previewDescontosValesNoLote(
        filters.id_lote_pagamento,
      );
      setPreviewData(response.data);
      setPreviewOpen(true);
      showToast({ message: 'Prévia de descontos carregada com sucesso!', severity: 'success' });
    } catch (err: any) {
      const errorMsg = err?.message || 'Erro ao gerar prévia de descontos de vales.';
      setError(errorMsg);
      showToast({ message: errorMsg, severity: 'error' });
    } finally {
      setPreviewLoading(false);
    }
  };

  const validarPeriodoParaFolha = () => {
    if (!filters.data_inicio || !filters.data_fim) {
      showToast({ message: 'Informe data início e data fim para fechar ou reabrir o período.', severity: 'warning' });
      return false;
    }

    if (!user?.id || !uuidRegex.test(user.id)) {
      showToast({ message: 'Usuário autenticado inválido para fechamento do período.', severity: 'error' });
      return false;
    }

    return true;
  };

  const handleFecharPeriodo = async () => {
    if (!validarPeriodoParaFolha()) {
      return;
    }

    try {
      setPeriodActionLoading(true);
      const payload: FecharPeriodoFolhaDto = {
        data_inicio: filters.data_inicio!,
        data_fim: filters.data_fim!,
        id_criado_por: user!.id,
        id_colaborador: filters.id_colaborador || undefined,
        id_obra: filters.id_obra || undefined,
      };

      const response = await financeiroService.fecharPeriodoFolhaIndividual(payload);
      showToast({
        message: `${response.data?.total_medicoes_fechadas || 0} medição(ões) fechada(s) em ${response.data?.lotes_gerados?.length || 0} lote(s).`,
        severity: 'success',
      });
      await handleFiltrar();
    } catch (err: any) {
      const errorMsg = err?.message || 'Erro ao fechar período da folha individual.';
      setError(errorMsg);
      showToast({ message: errorMsg, severity: 'error' });
    } finally {
      setPeriodActionLoading(false);
    }
  };

  const handleReabrirPeriodo = async () => {
    if (!validarPeriodoParaFolha()) {
      return;
    }

    try {
      setPeriodActionLoading(true);
      const payload: ReabrirPeriodoFolhaDto = {
        data_inicio: filters.data_inicio!,
        data_fim: filters.data_fim!,
        id_colaborador: filters.id_colaborador || undefined,
        id_obra: filters.id_obra || undefined,
      };

      const response = await financeiroService.reabrirPeriodoFolhaIndividual(payload);
      showToast({
        message: `${response.data?.total_medicoes_reabertas || 0} medição(ões) reaberta(s) com sucesso.`,
        severity: 'success',
      });
      await handleFiltrar();
    } catch (err: any) {
      const errorMsg = err?.message || 'Erro ao reabrir período da folha individual.';
      setError(errorMsg);
      showToast({ message: errorMsg, severity: 'error' });
    } finally {
      setPeriodActionLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/financeiro')}>
            Voltar
          </Button>
          <Typography variant="h4">Folha Individual</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleExportarCsv}
          disabled={loading || exporting}
        >
          {exporting ? 'Exportando...' : 'Exportar CSV'}
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Button variant="outlined" onClick={handleFecharPeriodo} disabled={loading || periodActionLoading}>
          {periodActionLoading ? 'Processando...' : 'Fechar período'}
        </Button>
        <Button variant="outlined" color="secondary" onClick={handleReabrirPeriodo} disabled={loading || periodActionLoading}>
          {periodActionLoading ? 'Processando...' : 'Reabrir período'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={2.4}>
            <TextField
              fullWidth
              label="Data início"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={filters.data_inicio}
              onChange={(e) => setFilters((prev) => ({ ...prev, data_inicio: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} md={2.4}>
            <TextField
              fullWidth
              label="Data fim"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={filters.data_fim}
              onChange={(e) => setFilters((prev) => ({ ...prev, data_fim: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} md={2.4}>
            <TextField
              fullWidth
              select
              SelectProps={{ native: true }}
              InputLabelProps={{ shrink: true }}
              label="Colaborador"
              value={filters.id_colaborador}
              onChange={(e) => setFilters((prev) => ({ ...prev, id_colaborador: e.target.value }))}
            >
              <option value="">Todos</option>
              {colaboradores.map((colaborador) => (
                <option key={colaborador.id} value={colaborador.id}>
                  {colaborador.nome_completo}
                </option>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <TextField
              fullWidth
              select
              SelectProps={{ native: true }}
              InputLabelProps={{ shrink: true }}
              label="Lote"
              value={filters.id_lote_pagamento}
              onChange={(e) => setFilters((prev) => ({ ...prev, id_lote_pagamento: e.target.value }))}
            >
              <option value="">Todos</option>
              {lotes.map((lote) => (
                <option key={lote.id} value={lote.id}>
                  {`${lote.descricao} (${lote.status})`}
                </option>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <TextField
              fullWidth
              select
              SelectProps={{ native: true }}
              InputLabelProps={{ shrink: true }}
              label="Obra"
              value={filters.id_obra}
              onChange={(e) => setFilters((prev) => ({ ...prev, id_obra: e.target.value }))}
            >
              <option value="">Todas</option>
              {obras.map((obra) => (
                <option key={obra.id} value={obra.id}>
                  {obra.nome}
                </option>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button variant="outlined" onClick={handleFiltrar} disabled={loading}>
              Aplicar filtros
            </Button>
            <Button
              variant="contained"
              onClick={handlePreviewVales}
              disabled={loading || previewLoading || !filters.id_lote_pagamento}
            >
              {previewLoading ? 'Simulando...' : 'Prévia Descontos Vales'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Total de Medições
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {totais.total_medicoes}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Total de Lotes
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {totais.total_lotes}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Valor Total Calculado
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {formatCurrency(toNumber(totais.valor_total_calculado))}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Colaborador</TableCell>
                <TableCell>Obra</TableCell>
                <TableCell align="right">Qtd.</TableCell>
                <TableCell align="right">Preço Venda</TableCell>
                <TableCell align="right">Valor</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Lote</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {itens.map((item) => {
                const precoVenda = toNumber(item.item_ambiente?.tabelaPreco?.preco_venda);
                const qtd = toNumber(item.qtd_executada);
                const valor = qtd * precoVenda;

                return (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      {item.data_medicao ? new Date(item.data_medicao).toLocaleDateString('pt-BR') : '-'}
                    </TableCell>
                    <TableCell>{item.colaborador?.nome_completo || '-'}</TableCell>
                    <TableCell>{item.item_ambiente?.ambiente?.pavimento?.obra?.nome || '-'}</TableCell>
                    <TableCell align="right">{qtd.toFixed(2)}</TableCell>
                    <TableCell align="right">{formatCurrency(precoVenda)}</TableCell>
                    <TableCell align="right">{formatCurrency(valor)}</TableCell>
                    <TableCell>{item.status_pagamento}</TableCell>
                    <TableCell>{item.id_lote_pagamento || '-'}</TableCell>
                  </TableRow>
                );
              })}
              {itens.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <TablePagination
            component="div"
            count={pagination.total_registros}
            page={Math.max((pagination.page || 1) - 1, 0)}
            onPageChange={(_, nextPage) =>
              setFilters((prev) => ({
                ...prev,
                page: nextPage + 1,
              }))
            }
            rowsPerPage={pagination.limit || 20}
            onRowsPerPageChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                limit: parseInt(event.target.value, 10),
                page: 1,
              }))
            }
            rowsPerPageOptions={[10, 20, 50, 100]}
            labelRowsPerPage="Itens por página"
            sx={{
              '& .MuiTablePagination-toolbar': {
                justifyContent: 'flex-start',
                px: 2,
                gap: 2,
                flexWrap: 'wrap',
              },
              '& .MuiTablePagination-spacer': {
                display: 'none',
              },
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                margin: 0,
              },
              '& .MuiTablePagination-actions': {
                marginLeft: 0,
              },
            }}
          />
        </Paper>
      )}

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Prévia de Descontos de Vales por Lote</DialogTitle>
        <DialogContent>
          {!previewData ? (
            <Typography sx={{ mt: 1 }}>Sem dados para exibir.</Typography>
          ) : (
            <Box sx={{ mt: 1, display: 'grid', gap: 1 }}>
              <Typography>
                <strong>ID Lote:</strong> {previewData.id_lote_pagamento || filters.id_lote_pagamento}
              </Typography>
              <Typography>
                <strong>Total colaboradores:</strong> {previewData.total_colaboradores || 0}
              </Typography>
              <Typography>
                <strong>Total desconto simulado:</strong>{' '}
                {formatCurrency(toNumber(previewData.total_desconto_simulado || 0))}
              </Typography>

              <Paper variant="outlined" sx={{ mt: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Colaborador</TableCell>
                      <TableCell align="right">Valor Bruto</TableCell>
                      <TableCell align="right">Desconto Simulado</TableCell>
                      <TableCell align="right">Valor Líquido</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(previewData.colaboradores || []).map((item: any) => (
                      <TableRow key={item.id_colaborador}>
                        <TableCell>{item.nome_colaborador || item.id_colaborador}</TableCell>
                        <TableCell align="right">{formatCurrency(toNumber(item.valor_bruto || 0))}</TableCell>
                        <TableCell align="right">{formatCurrency(toNumber(item.valor_desconto_simulado || 0))}</TableCell>
                        <TableCell align="right">{formatCurrency(toNumber(item.valor_liquido_simulado || 0))}</TableCell>
                      </TableRow>
                    ))}
                    {(previewData.colaboradores || []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">Nenhum dado para o lote informado.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
