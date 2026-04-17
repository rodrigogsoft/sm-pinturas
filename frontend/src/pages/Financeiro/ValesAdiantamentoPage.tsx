import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
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
import { useNavigate } from 'react-router-dom';
import LeftAlignedTablePagination from '../../components/LeftAlignedTablePagination';
import { useToast } from '../../components/Toast/ToastProvider';
import { useClientPagination } from '../../hooks/useClientPagination';
import valeAdiantamentoService, {
  AprovarValeAdiantamentoDto,
  CreateValeAdiantamentoDto,
  ValeAdiantamento,
} from '../../services/vale-adiantamento.service';
import { colaboradoresAPI } from '../../services/api';
import obrasService, { Obra } from '../../services/obras.service';

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const ValesAdiantamentoPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [vales, setVales] = useState<ValeAdiantamento[]>([]);

  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);

  const [openCriar, setOpenCriar] = useState(false);
  const [openDescontar, setOpenDescontar] = useState(false);
  const [openAprovar, setOpenAprovar] = useState(false);
  const [selectedVale, setSelectedVale] = useState<ValeAdiantamento | null>(null);
  const [resumoVale, setResumoVale] = useState<any | null>(null);
  const [saldoColaborador, setSaldoColaborador] = useState<any | null>(null);

  const [formCriar, setFormCriar] = useState<CreateValeAdiantamentoDto>({
    id_colaborador: '',
    id_obra: '',
    valor_solicitado: 0,
    valor_aprovado: 0,
    motivo: '',
    observacoes: '',
    qtd_parcelas_auto: 1,
    data_primeira_parcela: '',
  });

  const [formDesconto, setFormDesconto] = useState({
    valor_desconto: 0,
    data_desconto: '',
    observacoes: '',
  });

  // Exportação
  const exportHeaders = [
    'Data',
    'Colaborador',
    'Obra',
    'Solicitado',
    'Aprovado',
    'Status',
  ];
  const exportRows = vales
    ? vales.map((vale) => [
        vale.created_at ? new Date(vale.created_at).toLocaleDateString('pt-BR') : '-',
        vale.colaborador?.nome_completo || vale.id_colaborador,
        vale.obra?.nome || '-',
        formatCurrency(toNumber(vale.valor_solicitado)),
        formatCurrency(toNumber(vale.valor_aprovado || 0)),
        vale.status,
      ])
    : [];

  const handleExportCSV = () => {
    if (!vales || vales.length === 0) return;
    const csv = [exportHeaders, ...exportRows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `vales_adiantamento_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const handleExportXLSX = () => {
    if (!vales || vales.length === 0) return;
    const ws = XLSX.utils.aoa_to_sheet([exportHeaders, ...exportRows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Vales Adiantamento');
    XLSX.writeFile(wb, `vales_adiantamento_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPDF = () => {
    if (!vales || vales.length === 0) return;
    const doc = new jsPDF();
    doc.text('Vales Adiantamento', 14, 16);
    (doc as any).autoTable({
      head: [exportHeaders],
      body: exportRows,
      startY: 22,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [22, 160, 133] },
    });
    doc.save(`vales_adiantamento_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const [formAprovacao, setFormAprovacao] = useState({
    valor_aprovado: 0,
  });

  const [filtroStatus, setFiltroStatus] = useState('');

  const carregar = async () => {
    try {
      setLoading(true);
      setError('');
      const [valesResp, colabResp, obrasResp] = await Promise.all([
        valeAdiantamentoService.listar(),
        colaboradoresAPI.getAll(),
        obrasService.listar(),
      ]);

      setVales(valesResp.data || []);
      setColaboradores(colabResp.data || []);
      setObras(obrasResp || []);
      if (!valesResp.data || valesResp.data.length === 0) {
        showToast({ message: 'Nenhum vale de adiantamento encontrado.', severity: 'info' });
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Erro ao carregar vales adiantamento.';
      setError(errorMsg);
      showToast({ message: errorMsg, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const valesFiltrados = useMemo(
    () => (filtroStatus ? vales.filter((v) => v.status === filtroStatus) : vales),
    [vales, filtroStatus]
  );

  const totais = useMemo(() => {
    const valorSolicitado = valesFiltrados.reduce(
      (sum, v) => sum + toNumber(v.valor_solicitado),
      0
    );
    const valorAprovado = valesFiltrados.reduce(
      (sum, v) => sum + toNumber(v.valor_aprovado ?? 0),
      0
    );

    return {
      total: valesFiltrados.length,
      valorSolicitado,
      valorAprovado,
    };
  }, [valesFiltrados]);

  const {
    page,
    rowsPerPage,
    paginatedItems: paginatedVales,
    handlePageChange,
    handleRowsPerPageChange,
    resetPagination,
  } = useClientPagination(valesFiltrados);

  useEffect(() => {
    resetPagination();
  }, [filtroStatus, resetPagination]);

  const handleCriar = async () => {
    try {
      setError('');
      if (!formCriar.id_colaborador || toNumber(formCriar.valor_solicitado) <= 0) {
        setError('Preencha colaborador e valor solicitado maior que zero.');
        return;
      }

      const payload: CreateValeAdiantamentoDto = {
        ...formCriar,
        id_obra: formCriar.id_obra || undefined,
        valor_solicitado: toNumber(formCriar.valor_solicitado),
        valor_aprovado: toNumber(formCriar.valor_aprovado) || undefined,
        qtd_parcelas_auto: toNumber(formCriar.qtd_parcelas_auto) || undefined,
        data_primeira_parcela: formCriar.data_primeira_parcela || undefined,
      };

      await valeAdiantamentoService.criar(payload);
      showToast({ message: 'Vale adiantamento criado com sucesso.', severity: 'success' });
      setOpenCriar(false);
      await carregar();
    } catch (err: any) {
      const errorMsg = err?.message || 'Erro ao criar vale adiantamento.';
      setError(errorMsg);
      showToast({ message: errorMsg, severity: 'error' });
    }
  };

  const handleAbrirAprovacao = (vale: ValeAdiantamento) => {
    setSelectedVale(vale);
    setFormAprovacao({ valor_aprovado: toNumber(vale.valor_solicitado) });
    setOpenAprovar(true);
  };

  const handleAprovar = async () => {
    if (!selectedVale) {
      return;
    }

    if (toNumber(formAprovacao.valor_aprovado) <= 0) {
      showToast({ message: 'Informe um valor aprovado maior que zero.', severity: 'warning' });
      return;
    }

    try {
      const payload: AprovarValeAdiantamentoDto = {
        valor_aprovado: toNumber(formAprovacao.valor_aprovado),
      };

      await valeAdiantamentoService.aprovar(selectedVale.id, payload);
      showToast({ message: 'Vale aprovado com sucesso.', severity: 'success' });
      setOpenAprovar(false);
      setSelectedVale(null);
      await carregar();
    } catch (err: any) {
      const errorMsg = err?.message || 'Erro ao aprovar vale adiantamento.';
      setError(errorMsg);
      showToast({ message: errorMsg, severity: 'error' });
    }
  };

  const handleLancar = async (vale: ValeAdiantamento) => {
    try {
      await valeAdiantamentoService.lancar(vale.id);
      showToast({ message: 'Vale lançado para desconto com sucesso.', severity: 'success' });
      await carregar();
    } catch (err: any) {
      const errorMsg = err?.message || 'Erro ao lançar vale adiantamento.';
      setError(errorMsg);
      showToast({ message: errorMsg, severity: 'error' });
    }
  };

  const handleAbrirResumo = async (vale: ValeAdiantamento) => {
    try {
      const [resumoResp, saldoResp] = await Promise.all([
        valeAdiantamentoService.buscarResumo(vale.id),
        valeAdiantamentoService.buscarSaldoDevedorColaborador(vale.id_colaborador),
      ]);
      setSelectedVale(vale);
      setResumoVale(resumoResp.data);
      setSaldoColaborador(saldoResp.data);
    } catch (err: any) {
      const errorMsg = err?.message || 'Erro ao buscar resumo do vale.';
      setError(errorMsg);
      showToast({ message: errorMsg, severity: 'error' });
    }
  };

  const handleAbrirDesconto = (vale: ValeAdiantamento) => {
    setSelectedVale(vale);
    setFormDesconto({ valor_desconto: 0, data_desconto: '', observacoes: '' });
    setOpenDescontar(true);
  };

  const handleDescontar = async () => {
    if (!selectedVale) return;

    try {
      if (toNumber(formDesconto.valor_desconto) <= 0) {
        setError('Informe um valor de desconto maior que zero.');
        return;
      }

      await valeAdiantamentoService.descontar(selectedVale.id, {
        valor_desconto: toNumber(formDesconto.valor_desconto),
        data_desconto: formDesconto.data_desconto || undefined,
        observacoes: formDesconto.observacoes || undefined,
      });

      setOpenDescontar(false);
      setSelectedVale(null);
      showToast({ message: 'Desconto aplicado com sucesso.', severity: 'success' });
      await carregar();
    } catch (err: any) {
      const errorMsg = err?.message || 'Erro ao descontar vale adiantamento.';
      setError(errorMsg);
      showToast({ message: errorMsg, severity: 'error' });
    }
  };

  const handleApagar = async (vale: ValeAdiantamento) => {
    const confirmado = window.confirm('Deseja realmente apagar este vale?');
    if (!confirmado) {
      return;
    }

    try {
      await valeAdiantamentoService.delete(vale.id);
      showToast({ message: 'Vale apagado com sucesso.', severity: 'success' });
      await carregar();
    } catch (err: any) {
      const errorMsg = err?.message || 'Erro ao apagar vale adiantamento.';
      setError(errorMsg);
      showToast({ message: errorMsg, severity: 'error' });
    }
  };


  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/financeiro')}>
            Voltar
          </Button>
          <Typography variant="h4">Vales Adiantamento</Typography>
        </Box>
        <Box>
          <Button variant="outlined" sx={{ mr: 1 }} onClick={handleExportCSV} disabled={!vales || vales.length === 0}>Exportar CSV</Button>
          <Button variant="outlined" sx={{ mr: 1 }} onClick={handleExportXLSX} disabled={!vales || vales.length === 0}>Exportar XLSX</Button>
          <Button variant="outlined" sx={{ mr: 1 }} onClick={handleExportPDF} disabled={!vales || vales.length === 0}>Exportar PDF</Button>
          <Button variant="contained" onClick={() => setOpenCriar(true)} sx={{ ml: 2 }}>Novo Vale</Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              select
              label="Status"
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="SOLICITADO">SOLICITADO</MenuItem>
              <MenuItem value="APROVADO">APROVADO</MenuItem>
              <MenuItem value="PAGO">PAGO</MenuItem>
              <MenuItem value="PARCIALMENTE_COMPENSADO">PARCIALMENTE_COMPENSADO</MenuItem>
              <MenuItem value="COMPENSADO">COMPENSADO</MenuItem>
              <MenuItem value="CANCELADO">CANCELADO</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">Total de Vales</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{totais.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">Valor Solicitado</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{formatCurrency(totais.valorSolicitado)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">Valor Aprovado</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{formatCurrency(totais.valorAprovado)}</Typography>
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
                <TableCell align="right">Solicitado</TableCell>
                <TableCell align="right">Aprovado</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedVales.map((vale) => (
                <TableRow key={vale.id} hover>
                  <TableCell>{vale.created_at ? new Date(vale.created_at).toLocaleDateString('pt-BR') : '-'}</TableCell>
                  <TableCell>{vale.colaborador?.nome_completo || vale.id_colaborador}</TableCell>
                  <TableCell>{vale.obra?.nome || '-'}</TableCell>
                  <TableCell align="right">{formatCurrency(toNumber(vale.valor_solicitado))}</TableCell>
                  <TableCell align="right">{formatCurrency(toNumber(vale.valor_aprovado || 0))}</TableCell>
                  <TableCell>{vale.status}</TableCell>
                  <TableCell>
                    <Button size="small" sx={{ mr: 1 }} onClick={() => handleAbrirResumo(vale)}>Resumo</Button>
                    {vale.status === 'SOLICITADO' && (
                      <Button size="small" variant="outlined" sx={{ mr: 1 }} onClick={() => handleAbrirAprovacao(vale)}>
                        Aprovar
                      </Button>
                    )}
                    {(vale.status === 'APROVADO' || vale.status === 'PARCIALMENTE_COMPENSADO') && (
                      <Button size="small" variant="outlined" sx={{ mr: 1 }} onClick={() => handleLancar(vale)}>
                        Lançar
                      </Button>
                    )}
                    {(vale.status === 'PAGO' || vale.status === 'PARCIALMENTE_COMPENSADO' || vale.status === 'APROVADO') && (
                      <Button size="small" variant="contained" onClick={() => handleAbrirDesconto(vale)}>
                        Descontar
                      </Button>
                    )}
                    <Button
                      size="small"
                      color="error"
                      variant="text"
                      sx={{ ml: 1 }}
                      onClick={() => handleApagar(vale)}
                    >
                      Apagar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {valesFiltrados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">Nenhum vale encontrado.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <LeftAlignedTablePagination
            count={valesFiltrados.length}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </Paper>
      )}

      <Dialog open={openCriar} onClose={() => setOpenCriar(false)} fullWidth maxWidth="sm">
        <DialogTitle>Novo Vale Adiantamento</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            select
            margin="normal"
            label="Colaborador"
            value={formCriar.id_colaborador}
            onChange={(e) => setFormCriar((prev) => ({ ...prev, id_colaborador: e.target.value }))}
          >
            {colaboradores.map((c: any) => (
              <MenuItem key={c.id} value={c.id}>
                {c.nome_completo}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            select
            margin="normal"
            label="Obra (opcional)"
            value={formCriar.id_obra || ''}
            onChange={(e) => setFormCriar((prev) => ({ ...prev, id_obra: e.target.value }))}
          >
            <MenuItem value="">Sem obra vinculada</MenuItem>
            {obras.map((obra) => (
              <MenuItem key={obra.id} value={obra.id}>
                {obra.nome}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            margin="normal"
            label="Valor solicitado"
            type="number"
            value={formCriar.valor_solicitado}
            onChange={(e) => setFormCriar((prev) => ({ ...prev, valor_solicitado: toNumber(e.target.value) }))}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Valor aprovado (opcional)"
            type="number"
            value={formCriar.valor_aprovado || ''}
            onChange={(e) => setFormCriar((prev) => ({ ...prev, valor_aprovado: toNumber(e.target.value) }))}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Qtd parcelas automática"
            type="number"
            value={formCriar.qtd_parcelas_auto || 1}
            onChange={(e) => setFormCriar((prev) => ({ ...prev, qtd_parcelas_auto: toNumber(e.target.value) }))}
          />

          <TextField
            fullWidth
            margin="normal"
            type="date"
            label="Data primeira parcela"
            InputLabelProps={{ shrink: true }}
            value={formCriar.data_primeira_parcela || ''}
            onChange={(e) => setFormCriar((prev) => ({ ...prev, data_primeira_parcela: e.target.value }))}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Motivo"
            value={formCriar.motivo || ''}
            onChange={(e) => setFormCriar((prev) => ({ ...prev, motivo: e.target.value }))}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Observações"
            multiline
            rows={2}
            value={formCriar.observacoes || ''}
            onChange={(e) => setFormCriar((prev) => ({ ...prev, observacoes: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCriar(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCriar}>Salvar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openAprovar} onClose={() => setOpenAprovar(false)} fullWidth maxWidth="sm">
        <DialogTitle>Aprovar Vale Adiantamento</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="Valor aprovado"
            type="number"
            value={formAprovacao.valor_aprovado}
            onChange={(e) => setFormAprovacao({ valor_aprovado: toNumber(e.target.value) })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAprovar(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleAprovar}>Confirmar aprovação</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDescontar} onClose={() => setOpenDescontar(false)} fullWidth maxWidth="sm">
        <DialogTitle>Descontar Vale</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="Valor desconto"
            type="number"
            value={formDesconto.valor_desconto}
            onChange={(e) => setFormDesconto((prev) => ({ ...prev, valor_desconto: toNumber(e.target.value) }))}
          />
          <TextField
            fullWidth
            margin="normal"
            type="date"
            label="Data desconto"
            InputLabelProps={{ shrink: true }}
            value={formDesconto.data_desconto}
            onChange={(e) => setFormDesconto((prev) => ({ ...prev, data_desconto: e.target.value }))}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Observações"
            multiline
            rows={2}
            value={formDesconto.observacoes}
            onChange={(e) => setFormDesconto((prev) => ({ ...prev, observacoes: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDescontar(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleDescontar}>Confirmar desconto</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(resumoVale)} onClose={() => setResumoVale(null)} fullWidth maxWidth="sm">
        <DialogTitle>Resumo do Vale</DialogTitle>
        <DialogContent>
          {selectedVale && resumoVale && (
            <Box sx={{ pt: 1 }}>
              <Typography><strong>Colaborador:</strong> {selectedVale.colaborador?.nome_completo || selectedVale.id_colaborador}</Typography>
              <Typography><strong>Status:</strong> {resumoVale.status}</Typography>
              <Typography><strong>Valor Base:</strong> {formatCurrency(toNumber(resumoVale.valor_base))}</Typography>
              <Typography><strong>Valor Descontado:</strong> {formatCurrency(toNumber(resumoVale.valor_descontado))}</Typography>
              <Typography><strong>Saldo Devedor:</strong> {formatCurrency(toNumber(resumoVale.saldo_devedor))}</Typography>
              <Typography><strong>Parcelas Pendentes:</strong> {resumoVale.parcelas_pendentes}</Typography>
              <Typography><strong>Parcelas Descontadas:</strong> {resumoVale.parcelas_descontadas}</Typography>
              <Typography><strong>Parcelas Canceladas:</strong> {resumoVale.parcelas_canceladas}</Typography>
              {saldoColaborador && (
                <Box sx={{ mt: 2 }}>
                  <Typography><strong>Saldo do colaborador:</strong> {formatCurrency(toNumber(saldoColaborador.saldo_devedor))}</Typography>
                  <Typography><strong>Limite:</strong> {formatCurrency(toNumber(saldoColaborador.limite_saldo_devedor))}</Typography>
                  <Typography><strong>Total liberado:</strong> {formatCurrency(toNumber(saldoColaborador.valor_liberado))}</Typography>
                  <Typography><strong>Total descontado:</strong> {formatCurrency(toNumber(saldoColaborador.valor_descontado))}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResumoVale(null)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
