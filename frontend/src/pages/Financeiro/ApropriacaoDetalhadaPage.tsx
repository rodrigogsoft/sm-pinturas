import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
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
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/Toast/ToastProvider';
import financeiroService, {
  ApropriacaoDetalhadaItem,
  FiltrosApropriacaoDetalhada,
} from '../../services/financeiro.service';
import obrasService, { Obra } from '../../services/obras.service';
import { colaboradoresAPI } from '../../services/api';

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const ApropriacaoDetalhadaPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [obras, setObras] = useState<Obra[]>([]);
  const [colaboradores, setColaboradores] = useState<any[]>([]);

  const [filters, setFilters] = useState<FiltrosApropriacaoDetalhada>({
    data_inicio: '',
    data_fim: '',
    id_colaborador: '',
    id_obra: '',
    id_item_ambiente: '',
    page: 1,
    limit: 20,
  });

  const [itens, setItens] = useState<ApropriacaoDetalhadaItem[]>([]);
  const [totais, setTotais] = useState({
    total_medicoes: 0,
    total_qtd_executada: 0,
    valor_total_apropriado: 0,
    total_excedentes: 0,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total_registros: 0,
    total_paginas: 0,
  });

  const params = useMemo(() => {
    const p: FiltrosApropriacaoDetalhada = {
      page: filters.page,
      limit: filters.limit,
    };

    if (filters.data_inicio) p.data_inicio = filters.data_inicio;
    if (filters.data_fim) p.data_fim = filters.data_fim;
    if (filters.id_colaborador) p.id_colaborador = filters.id_colaborador;
    if (filters.id_obra) p.id_obra = filters.id_obra;
    if (filters.id_item_ambiente) p.id_item_ambiente = filters.id_item_ambiente;

    return p;
  }, [filters]);

  const carregar = async (customParams?: FiltrosApropriacaoDetalhada) => {
    try {
      setLoading(true);
      setError('');

      const [resp, obrasResp] = await Promise.all([
        financeiroService.consultarApropriacaoDetalhada(customParams || params),
        Promise.resolve(obras),
      ]);

      const data = resp.data;
      setItens(data.itens || []);
      setTotais(data.totais);
      setPagination(data.paginacao);
      setObras(obrasResp || []);
      if (data.itens?.length === 0) {
        showToast({ message: 'Nenhum item encontrado para os filtros aplicados.', severity: 'info' });
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Erro ao carregar apropriação detalhada.';
      setError(errorMsg);
      showToast({ message: errorMsg, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.page, params.limit]);

  useEffect(() => {
    Promise.all([obrasService.listar(), colaboradoresAPI.getAll()])
      .then(([obrasResult, colaboradoresResp]) => {
        setObras(obrasResult || []);
        setColaboradores(colaboradoresResp?.data || []);
      })
      .catch(() => undefined);
  }, []);

  const handleFiltrar = async () => {
    const next = { ...params, page: 1 };
    setFilters((prev) => ({ ...prev, page: 1 }));
    await carregar(next);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/financeiro')}>
            Voltar
          </Button>
          <Typography variant="h4">Apropriação Detalhada</Typography>
        </Box>
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
              type="date"
              label="Data início"
              InputLabelProps={{ shrink: true }}
              value={filters.data_inicio}
              onChange={(e) => setFilters((prev) => ({ ...prev, data_inicio: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} md={2.4}>
            <TextField
              fullWidth
              type="date"
              label="Data fim"
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
              label="ID Item Ambiente"
              value={filters.id_item_ambiente}
              onChange={(e) => setFilters((prev) => ({ ...prev, id_item_ambiente: e.target.value }))}
            />
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
          <Grid item xs={12}>
            <Button variant="outlined" onClick={handleFiltrar} disabled={loading}>
              Aplicar filtros
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">Total de Medições</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{totais.total_medicoes}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">Qtd Executada</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{toNumber(totais.total_qtd_executada).toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">Valor Apropriado</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{formatCurrency(toNumber(totais.valor_total_apropriado))}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">Excedentes</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{totais.total_excedentes}</Typography>
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
                <TableCell align="right">Valor Apropriado</TableCell>
                <TableCell>Status Pagamento</TableCell>
                <TableCell>Excedente</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {itens.map((item) => {
                const precoVenda = toNumber(item.item_ambiente?.tabelaPreco?.preco_venda);
                return (
                  <TableRow key={item.id} hover>
                    <TableCell>{item.data_medicao ? new Date(item.data_medicao).toLocaleDateString('pt-BR') : '-'}</TableCell>
                    <TableCell>{item.colaborador?.nome_completo || '-'}</TableCell>
                    <TableCell>{item.item_ambiente?.ambiente?.pavimento?.obra?.nome || '-'}</TableCell>
                    <TableCell align="right">{toNumber(item.qtd_executada).toFixed(2)}</TableCell>
                    <TableCell align="right">{formatCurrency(precoVenda)}</TableCell>
                    <TableCell align="right">{formatCurrency(toNumber(item.valor_apropriado))}</TableCell>
                    <TableCell>{item.status_pagamento}</TableCell>
                    <TableCell>{item.flag_excedente ? 'Sim' : 'Não'}</TableCell>
                  </TableRow>
                );
              })}
              {itens.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">Nenhum registro encontrado.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <TablePagination
            component="div"
            count={pagination.total_registros}
            page={Math.max((pagination.page || 1) - 1, 0)}
            onPageChange={(_, nextPage) => setFilters((prev) => ({ ...prev, page: nextPage + 1 }))}
            rowsPerPage={pagination.limit || 20}
            onRowsPerPageChange={(event) =>
              setFilters((prev) => ({ ...prev, limit: parseInt(event.target.value, 10), page: 1 }))
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
    </Box>
  );
};
