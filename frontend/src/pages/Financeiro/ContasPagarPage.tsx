import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';
import LeftAlignedTablePagination from '../../components/LeftAlignedTablePagination';
import financeiroService, {
  FolhaIndividualAgregadaItem,
  FiltrosFolhaIndividual,
} from '../../services/financeiro.service';

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

type FiltroStatusFolha = 'ABERTO' | 'PAGO' | 'CANCELADO';

const getDataAtualIso = () => new Date().toISOString().split('T')[0];

const formatarCompetencia = (valor?: string) => {
  if (!valor) {
    return '-';
  }

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) {
    return valor;
  }

  return data.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' });
};

const getPeriodoAtual = () => {
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

  const toIso = (data: Date) => {
    const yyyy = data.getFullYear();
    const mm = String(data.getMonth() + 1).padStart(2, '0');
    const dd = String(data.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  return {
    dataInicio: toIso(inicio),
    dataFim: toIso(fim),
  };
};

export const ContasPagarPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [processandoPagamento, setProcessandoPagamento] = useState(false);
  const [error, setError] = useState('');
  const [folhaRows, setFolhaRows] = useState<FolhaIndividualAgregadaItem[]>([]);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [filtroDataInicio, setFiltroDataInicio] = useState(getPeriodoAtual().dataInicio);
  const [filtroDataFim, setFiltroDataFim] = useState(getPeriodoAtual().dataFim);
  const [filtroColaborador, setFiltroColaborador] = useState('');
  const [filtroServico, setFiltroServico] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatusFolha>('ABERTO');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [selecionadas, setSelecionadas] = useState<Record<string, string[]>>({});
  const [totaisTopo, setTotaisTopo] = useState({
    total_a_pagar: 0,
    total_pago: 0,
    colaboradores_no_periodo: 0,
  });

  const filtrosAtivos = useMemo<FiltrosFolhaIndividual>(() => ({
    data_inicio: filtroDataInicio || undefined,
    data_fim: filtroDataFim || undefined,
    colaborador: filtroColaborador || undefined,
    servico: filtroServico || undefined,
    status: filtroStatus,
  }), [filtroDataInicio, filtroDataFim, filtroColaborador, filtroServico, filtroStatus]);

  const normalizarItens = (itens: any[]): FolhaIndividualAgregadaItem[] => {
    return itens
      .filter((item) => item && Array.isArray(item.medicoes_ids))
      .map((item) => ({
        chave: String(item.chave),
        id_colaborador: String(item.id_colaborador),
        nome_colaborador: String(item.nome_colaborador || 'Colaborador não informado'),
        competencia: String(item.competencia || formatarCompetencia(item.data_medicao)),
        servicos: Array.isArray(item.servicos) ? item.servicos : [],
        medicao: toNumber(item.medicao),
        valor: toNumber(item.valor),
        status: item.status as 'ABERTO' | 'PAGO' | 'CANCELADO',
        medicoes_ids: item.medicoes_ids,
      }));
  };

  const carregar = async (pageToLoad = page + 1, limitToLoad = rowsPerPage) => {
    try {
      setLoading(true);
      setError('');

      const response = await financeiroService.consultarFolhaIndividual({
        ...filtrosAtivos,
        page: pageToLoad,
        limit: limitToLoad,
      });

      const data = response.data;
      const itens = Array.isArray(data.itens) ? data.itens : [];
      setFolhaRows(normalizarItens(itens));
      setTotalRegistros(Number(data.paginacao?.total_registros || 0));
      setTotaisTopo({
        total_a_pagar: toNumber(data.totais?.total_a_pagar),
        total_pago: toNumber(data.totais?.total_pago),
        colaboradores_no_periodo: toNumber(data.totais?.colaboradores_no_periodo),
      });
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar contas a pagar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      carregar(page + 1, rowsPerPage);
    }, 250);

    return () => clearTimeout(timer);
  }, [filtrosAtivos, page, rowsPerPage]);

  const medicoesSelecionadas = useMemo(() => {
    const ids = Object.values(selecionadas).flat();
    return Array.from(new Set(ids));
  }, [selecionadas]);

  const selecionarLinha = (row: FolhaIndividualAgregadaItem) => {
    setSelecionadas((prev) => {
      const proximo = { ...prev };
      if (proximo[row.chave]) {
        delete proximo[row.chave];
        return proximo;
      }
      proximo[row.chave] = row.medicoes_ids;
      return proximo;
    });
  };

  const selecionarPagina = (checked: boolean) => {
    setSelecionadas((prev) => {
      if (!checked) {
        const proximo = { ...prev };
        folhaRows.forEach((row) => {
          delete proximo[row.chave];
        });
        return proximo;
      }

      const proximo = { ...prev };
      folhaRows
        .filter((row) => row.status === 'ABERTO')
        .forEach((row) => {
          proximo[row.chave] = row.medicoes_ids;
        });
      return proximo;
    });
  };

  const processarPagamento = async (medicoes_ids: string[]) => {
    if (medicoes_ids.length === 0) {
      setError('Nenhuma medição selecionada para pagamento.');
      return;
    }

    try {
      setProcessandoPagamento(true);
      setError('');

      await financeiroService.processarPagamentoFolhaIndividual({
        medicoes_ids,
        data_pagamento: getDataAtualIso(),
        tipo_pagamento: 'PIX',
        observacoes: `Pagamento processado pela folha individual em ${new Date().toLocaleString('pt-BR')}`,
      });

      setSelecionadas({});
      await carregar(page + 1, rowsPerPage);
    } catch (err: any) {
      setError(err?.message || 'Erro ao processar pagamento da folha.');
    } finally {
      setProcessandoPagamento(false);
    }
  };

  const carregarTodasPaginas = async () => {
    const primeira = await financeiroService.consultarFolhaIndividual({
      ...filtrosAtivos,
      page: 1,
      limit: 200,
    });

    const data = primeira.data;
    const totalPaginas = Number(data.paginacao?.total_paginas || 0);
    let itens = normalizarItens(Array.isArray(data.itens) ? data.itens : []);

    for (let pagina = 2; pagina <= totalPaginas; pagina += 1) {
      const resp = await financeiroService.consultarFolhaIndividual({
        ...filtrosAtivos,
        page: pagina,
        limit: 200,
      });
      itens = [...itens, ...normalizarItens(Array.isArray(resp.data.itens) ? resp.data.itens : [])];
    }

    return itens;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const todasSelecionadasDaPagina =
    folhaRows.length > 0 &&
    folhaRows.filter((row) => row.status === 'ABERTO').every((row) => Boolean(selecionadas[row.chave]));

  const parcialmenteSelecionada =
    folhaRows.some((row) => Boolean(selecionadas[row.chave])) && !todasSelecionadasDaPagina;

  const headers = ['Colaborador', 'Competência', 'Serviços', 'Medição', 'Valor', 'Status'];

  const montarLinhasExportacao = (itens: FolhaIndividualAgregadaItem[]) =>
    itens.map((item) => [
      item.nome_colaborador,
      item.competencia,
      item.servicos.join(' | '),
      toNumber(item.medicao).toFixed(2),
      formatCurrency(toNumber(item.valor)),
      item.status,
    ]);

  const handleExportCSV = async () => {
    try {
      setExportando(true);
      const itens = await carregarTodasPaginas();
      if (itens.length === 0) {
        return;
      }

      const rows = montarLinhasExportacao(itens);
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
      link.setAttribute('download', `folha_individual_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
    } catch (err: any) {
      setError(err?.message || 'Erro ao exportar CSV.');
    } finally {
      setExportando(false);
    }
  };

  const handleExportXLSX = async () => {
    try {
      setExportando(true);
      const itens = await carregarTodasPaginas();
      if (itens.length === 0) {
        return;
      }

      const rows = montarLinhasExportacao(itens);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Folha Individual');
      XLSX.writeFile(wb, `folha_individual_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err: any) {
      setError(err?.message || 'Erro ao exportar XLSX.');
    } finally {
      setExportando(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExportando(true);
      const itens = await carregarTodasPaginas();
      if (itens.length === 0) {
        return;
      }

      const rows = montarLinhasExportacao(itens);
    const doc = new jsPDF();
      doc.text('Folha Individual - Contas a Pagar', 14, 16);
    (doc as any).autoTable({
      head: [headers],
      body: rows,
      startY: 22,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [22, 160, 133] },
    });
      doc.save(`folha_individual_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err: any) {
      setError(err?.message || 'Erro ao exportar PDF.');
    } finally {
      setExportando(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/financeiro')}>
            Voltar
          </Button>
          <Typography variant="h4">Contas a Pagar</Typography>
        </Box>
        <Box>
          <Button variant="outlined" sx={{ mr: 1 }} onClick={handleExportCSV} disabled={exportando || totalRegistros === 0}>Exportar CSV</Button>
          <Button variant="outlined" sx={{ mr: 1 }} onClick={handleExportXLSX} disabled={exportando || totalRegistros === 0}>Exportar XLSX</Button>
          <Button variant="outlined" onClick={handleExportPDF} disabled={exportando || totalRegistros === 0}>Exportar PDF</Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Total a Pagar
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {formatCurrency(totaisTopo.total_a_pagar)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Total Pago
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {formatCurrency(totaisTopo.total_pago)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Colaboradores no Período
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {totaisTopo.colaboradores_no_periodo}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              type="date"
              label="Data inicial"
              InputLabelProps={{ shrink: true }}
              value={filtroDataInicio}
              onChange={(e) => setFiltroDataInicio(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              type="date"
              label="Data final"
              InputLabelProps={{ shrink: true }}
              value={filtroDataFim}
              onChange={(e) => setFiltroDataFim(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Colaborador"
              placeholder="Nome do colaborador"
              value={filtroColaborador}
              onChange={(e) => {
                setPage(0);
                setFiltroColaborador(e.target.value);
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Serviço"
              placeholder="Nome do serviço"
              value={filtroServico}
              onChange={(e) => {
                setPage(0);
                setFiltroServico(e.target.value);
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              select
              label="Status"
              value={filtroStatus}
              onChange={(e) => {
                setPage(0);
                setFiltroStatus(e.target.value as FiltroStatusFolha);
              }}
            >
              <MenuItem value="ABERTO">Aberto</MenuItem>
              <MenuItem value="PAGO">Pago</MenuItem>
              <MenuItem value="CANCELADO">Cancelado</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button variant="contained" color="success" disabled={processandoPagamento || medicoesSelecionadas.length === 0} onClick={() => processarPagamento(medicoesSelecionadas)}>
              Pagar selecionados
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Alert severity="info" sx={{ mb: 2 }}>
        O grid considera medições no período selecionado. Por padrão, o status fica em Aberto para facilitar os recebimentos.
      </Alert>

      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={parcialmenteSelecionada}
                  checked={todasSelecionadasDaPagina}
                  onChange={(e) => selecionarPagina(e.target.checked)}
                />
              </TableCell>
              <TableCell>Colaborador</TableCell>
              <TableCell>Competência</TableCell>
              <TableCell>Serviço</TableCell>
              <TableCell align="right">Medição</TableCell>
              <TableCell align="right">Valor</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {folhaRows.map((row) => (
              <TableRow key={row.chave} hover>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={Boolean(selecionadas[row.chave])}
                    disabled={row.status !== 'ABERTO'}
                    onChange={() => selecionarLinha(row)}
                  />
                </TableCell>
                <TableCell>{row.nome_colaborador}</TableCell>
                <TableCell>{row.competencia}</TableCell>
                <TableCell>
                  {row.servicos.length > 0 ? row.servicos.join(', ') : 'Sem serviços'}
                </TableCell>
                <TableCell align="right">{toNumber(row.medicao).toFixed(2)}</TableCell>
                <TableCell align="right">{formatCurrency(toNumber(row.valor))}</TableCell>
                <TableCell>
                  <Chip
                    label={row.status}
                    size="small"
                    color={
                      row.status === 'PAGO'
                        ? 'success'
                        : row.status === 'CANCELADO'
                          ? 'default'
                          : 'warning'
                    }
                  />
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    disabled={
                      row.status !== 'ABERTO' ||
                      processandoPagamento
                    }
                    onClick={() => processarPagamento(row.medicoes_ids)}
                  >
                    {processandoPagamento ? 'Processando...' : 'Pagar linha'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {folhaRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Nenhum colaborador encontrado para o status selecionado no período informado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <LeftAlignedTablePagination
          count={totalRegistros}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>
    </Box>
  );
};
