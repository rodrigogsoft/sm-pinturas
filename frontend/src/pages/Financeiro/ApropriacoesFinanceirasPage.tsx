import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LeftAlignedTablePagination from '../../components/LeftAlignedTablePagination';
import { useToast } from '../../components/Toast/ToastProvider';
import { useClientPagination } from '../../hooks/useClientPagination';
import api from '../../services/api';
import obrasService, { Obra } from '../../services/obras.service';
import { RootState } from '../../store';

interface ApropriacaoFinanceira {
  id: string;
  id_colaborador: string;
  id_obra: string;
  preco_venda_unitario: number;
  area_executada: number;
  valor_calculado: number;
  competencia: string;
  status: 'PENDENTE' | 'APROVADO' | 'REJEITADO' | 'PAGO';
  justificativa_rejeicao?: string;
  colaborador?: { nome_completo: string };
  aprovado_por?: { nome: string };
  data_aprovacao?: string;
}

const statusColor: Record<string, 'warning' | 'success' | 'error' | 'default'> = {
  PENDENTE: 'warning',
  APROVADO: 'success',
  REJEITADO: 'error',
  PAGO: 'default',
};

const formatCurrency = (v: number) =>
  Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const ApropriacoesFinanceirasPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { showToast } = useToast();
  const isGestorOuAdmin = (user?.id_perfil ?? 99) <= 2;

  const [obras, setObras] = useState<Obra[]>([]);
  const [obraSelecionada, setObraSelecionada] = useState('');
  const [apropriacoes, setApropriacoes] = useState<ApropriacaoFinanceira[]>([]);
  const [loading, setLoading] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('');

  // Rejeição
  const [openRejeitar, setOpenRejeitar] = useState(false);
  const [idRejeitando, setIdRejeitando] = useState('');
  const [justificativa, setJustificativa] = useState('');

  useEffect(() => {
    obrasService.listar().then(setObras).catch(() => {});
  }, []);

  const {
    page,
    rowsPerPage,
    paginatedItems: paginatedApropriacoes,
    handlePageChange,
    handleRowsPerPageChange,
    resetPagination,
  } = useClientPagination(apropriacoes);

  useEffect(() => {
    resetPagination();
  }, [obraSelecionada, filtroStatus, resetPagination]);

  const carregar = async (idObra = obraSelecionada) => {
    if (!idObra) return;
    setLoading(true);
    try {
      const params = filtroStatus ? `?status=${filtroStatus}` : '';
      const { data } = await api.get(`/apropriacoes-financeiras/obra/${idObra}${params}`);
      setApropriacoes(data);
    } catch {
      showToast({ message: 'Erro ao carregar apropriações.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleObra = (id: string) => {
    setObraSelecionada(id);
    carregar(id);
  };

  const handleGerar = async () => {
    if (!obraSelecionada) return;
    setGerando(true);
    try {
      const { data } = await api.post(
        `/apropriacoes-financeiras/gerar/${obraSelecionada}`,
      );
      showToast({ message: `${data.geradas} apropriação(ões) gerada(s). ${data.ignoradas} ignorada(s).`, severity: 'success' });
      carregar();
    } catch {
      showToast({ message: 'Erro ao gerar apropriações.', severity: 'error' });
    } finally {
      setGerando(false);
    }
  };

  const handleAprovar = async (id: string) => {
    try {
      await api.patch(`/apropriacoes-financeiras/${id}/aprovar`);
      showToast({ message: 'Apropriação aprovada!', severity: 'success' });
      carregar();
    } catch (err: any) {
      showToast({ message: err?.response?.data?.message ?? 'Erro ao aprovar.', severity: 'error' });
    }
  };

  const handleAbrirRejeitar = (id: string) => {
    setIdRejeitando(id);
    setJustificativa('');
    setOpenRejeitar(true);
  };

  const handleConfirmarRejeitar = async () => {
    try {
      await api.patch(`/apropriacoes-financeiras/${idRejeitando}/rejeitar`, {
        justificativa_rejeicao: justificativa,
      });
      showToast({ message: 'Apropriação rejeitada.', severity: 'info' });
      setOpenRejeitar(false);
      carregar();
    } catch (err: any) {
      showToast({ message: err?.response?.data?.message ?? 'Erro ao rejeitar.', severity: 'error' });
    }
  };

  return (
    <Box p={3}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/financeiro')} sx={{ mb: 2 }}>
        Voltar
      </Button>

      <Typography variant="h5" fontWeight="bold" mb={3}>
        Apropriações Financeiras por Colaborador
      </Typography>

      {/* Filtros */}
      <Box display="flex" gap={2} flexWrap="wrap" mb={3}>
        <TextField
          select
          label="Obra"
          value={obraSelecionada}
          onChange={(e) => handleObra(e.target.value)}
          sx={{ minWidth: 280 }}
          size="small"
        >
          {obras.map((o) => (
            <MenuItem key={o.id} value={o.id}>
              {o.nome}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Status"
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          sx={{ minWidth: 160 }}
          size="small"
        >
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="PENDENTE">Pendente</MenuItem>
          <MenuItem value="APROVADO">Aprovado</MenuItem>
          <MenuItem value="REJEITADO">Rejeitado</MenuItem>
          <MenuItem value="PAGO">Pago</MenuItem>
        </TextField>

        <Button variant="outlined" onClick={() => carregar()} disabled={!obraSelecionada}>
          Filtrar
        </Button>

        {isGestorOuAdmin && (
          <Button
            variant="contained"
            startIcon={gerando ? <CircularProgress size={16} color="inherit" /> : <AutorenewIcon />}
            onClick={handleGerar}
            disabled={!obraSelecionada || gerando}
          >
            Gerar Pendentes
          </Button>
        )}
      </Box>

      {loading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      )}

      {!loading && apropriacoes.length === 0 && obraSelecionada && (
        <Alert severity="info">Nenhuma apropriação encontrada para os filtros selecionados.</Alert>
      )}

      {!loading && apropriacoes.length > 0 && (
        <Paper>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Colaborador</TableCell>
                <TableCell align="right">Área (m²)</TableCell>
                <TableCell align="right">Preço Unit.</TableCell>
                <TableCell align="right">Valor</TableCell>
                <TableCell>Competência</TableCell>
                <TableCell>Status</TableCell>
                {isGestorOuAdmin && <TableCell align="center">Ações</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedApropriacoes.map((a) => (
                <TableRow key={a.id} hover>
                  <TableCell>{a.colaborador?.nome_completo ?? '—'}</TableCell>
                  <TableCell align="right">{Number(a.area_executada).toFixed(2)}</TableCell>
                  <TableCell align="right">{formatCurrency(a.preco_venda_unitario)}</TableCell>
                  <TableCell align="right">
                    <strong>{formatCurrency(a.valor_calculado)}</strong>
                  </TableCell>
                  <TableCell>
                    {new Date(a.competencia).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={a.status}
                      color={statusColor[a.status]}
                      size="small"
                    />
                  </TableCell>
                  {isGestorOuAdmin && (
                    <TableCell align="center">
                      {a.status === 'PENDENTE' && (
                        <Box display="flex" gap={1} justifyContent="center">
                          <Button
                            size="small"
                            variant="outlined"
                            color="success"
                            startIcon={<CheckIcon />}
                            onClick={() => handleAprovar(a.id)}
                          >
                            Aprovar
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<CloseIcon />}
                            onClick={() => handleAbrirRejeitar(a.id)}
                          >
                            Rejeitar
                          </Button>
                        </Box>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <LeftAlignedTablePagination
            count={apropriacoes.length}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </Paper>
      )}

      {/* Dialog de rejeição */}
      <Dialog open={openRejeitar} onClose={() => setOpenRejeitar(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Rejeitar Apropriação</DialogTitle>
        <DialogContent>
          <TextField
            label="Justificativa de rejeição"
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
            fullWidth
            multiline
            rows={3}
            sx={{ mt: 1 }}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRejeitar(false)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleConfirmarRejeitar}>
            Confirmar Rejeição
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
