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
  LinearProgress,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useNavigate } from 'react-router-dom';
import LeftAlignedTablePagination from '../../components/LeftAlignedTablePagination';
import { useToast } from '../../components/Toast/ToastProvider';
import { useClientPagination } from '../../hooks/useClientPagination';
import api from '../../services/api';
import obrasService, { Obra } from '../../services/obras.service';

interface ItemAmbiente {
  id: string;
  id_ambiente: string;
  area_planejada: number;
  area_medida_total: number;
  progresso: number;
  status: 'ABERTO' | 'EM_PROGRESSO' | 'CONCLUIDO';
  tabelaPreco?: { descricao?: string };
  ambiente?: { nome?: string };
}

interface AlocacaoItem {
  id: string;
  id_colaborador: string;
  id_item_ambiente: string;
  status: string;
  colaborador?: { nome_completo?: string };
}

interface MedicaoIndividual {
  id: string;
  id_colaborador: string;
  id_item_ambiente: string;
  qtd_executada: number;
  area_planejada?: number;
  flag_excedente: boolean;
  justificativa?: string;
  data_medicao: string;
  status_pagamento: string;
  colaborador?: { nome_completo?: string };
  item_ambiente?: { tabelaPreco?: { descricao?: string } };
}

const statusColor: Record<string, 'default' | 'warning' | 'success'> = {
  ABERTO: 'default',
  EM_PROGRESSO: 'warning',
  CONCLUIDO: 'success',
};

export const MedicoesIndividuaisPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [obras, setObras] = useState<Obra[]>([]);
  const [obraSelecionada, setObraSelecionada] = useState('');
  const [itens, setItens] = useState<ItemAmbiente[]>([]);
  const [alocacoes, setAlocacoes] = useState<AlocacaoItem[]>([]);
  const [medicoes, setMedicoes] = useState<MedicaoIndividual[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Formulário
  const [form, setForm] = useState({
    id_alocacao_item: '',
    id_colaborador: '',
    id_item_ambiente: '',
    qtd_executada: '',
    area_planejada: '',
    justificativa: '',
    foto_evidencia_url: '',
    data_medicao: new Date().toISOString().slice(0, 10),
  });

  const itemSelecionado = itens.find((it) => it.id === form.id_item_ambiente);
  const areaPlanejada = Number(itemSelecionado?.area_planejada ?? 0);
  const isExcedente = areaPlanejada > 0 && Number(form.qtd_executada) > areaPlanejada;

  useEffect(() => {
    obrasService.listar().then(setObras).catch(() => {});
  }, []);

  const carregarObra = async (idObra: string) => {
    setObraSelecionada(idObra);
    setLoading(true);
    try {
      const [itensRes, medicoesRes] = await Promise.all([
        api.get(`/itens-ambiente/obra/${idObra}`),
        api.get(`/medicoes-colaborador`),
      ]);
      setItens(itensRes.data);
      setMedicoes(medicoesRes.data);
    } catch {
      showToast({ message: 'Erro ao carregar dados.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const carregarAlocacoesPorItem = async (idItem: string) => {
    try {
      const { data } = await api.get(`/alocacoes-itens?id_item_ambiente=${idItem}`);
      setAlocacoes(data);
    } catch {
      setAlocacoes([]);
    }
  };

  const handleItemChange = (idItem: string) => {
    setForm((f) => ({ ...f, id_item_ambiente: idItem, id_alocacao_item: '', id_colaborador: '' }));
    if (idItem) carregarAlocacoesPorItem(idItem);
  };

  const handleAlocacaoChange = (idAlocacao: string) => {
    const aloc = alocacoes.find((a) => a.id === idAlocacao);
    setForm((f) => ({
      ...f,
      id_alocacao_item: idAlocacao,
      id_colaborador: aloc?.id_colaborador ?? '',
    }));
  };

  const handleSubmit = async () => {
    if (!form.id_alocacao_item || !form.id_colaborador || !form.id_item_ambiente || !form.qtd_executada) {
      showToast({ message: 'Preencha todos os campos obrigatórios.', severity: 'warning' });
      return;
    }
    if (isExcedente && (!form.justificativa || !form.foto_evidencia_url)) {
      showToast({ message: 'Excedente requer justificativa e foto de evidência.', severity: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/medicoes-colaborador', {
        id_alocacao_item: form.id_alocacao_item,
        id_colaborador: form.id_colaborador,
        id_item_ambiente: form.id_item_ambiente,
        qtd_executada: Number(form.qtd_executada),
        area_planejada: areaPlanejada || undefined,
        justificativa: form.justificativa || undefined,
        foto_evidencia_url: form.foto_evidencia_url || undefined,
        data_medicao: form.data_medicao,
      });
      showToast({ message: 'Medição registrada com sucesso!', severity: 'success' });
      setOpenDialog(false);
      carregarObra(obraSelecionada);
    } catch (err: any) {
      showToast({ message: err?.response?.data?.message ?? 'Erro ao registrar medição.', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const alocacoesFiltradas = alocacoes.filter((a) => a.status === 'EM_ANDAMENTO');
  const {
    page,
    rowsPerPage,
    paginatedItems: paginatedMedicoes,
    handlePageChange,
    handleRowsPerPageChange,
    resetPagination,
  } = useClientPagination(medicoes);

  useEffect(() => {
    resetPagination();
  }, [obraSelecionada, resetPagination]);

  return (
    <Box p={3}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/medicoes')} sx={{ mb: 2 }}>
        Voltar
      </Button>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Medições Individuais por Colaborador
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          disabled={!obraSelecionada}
        >
          Nova Medição
        </Button>
      </Box>

      {/* Seletor de obra */}
      <TextField
        select
        label="Obra"
        value={obraSelecionada}
        onChange={(e) => carregarObra(e.target.value)}
        sx={{ minWidth: 300, mb: 3 }}
        size="small"
      >
        {obras.map((o) => (
          <MenuItem key={o.id} value={o.id}>
            {o.nome}
          </MenuItem>
        ))}
      </TextField>

      {loading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      )}

      {/* Progresso dos elementos */}
      {!loading && itens.length > 0 && (
        <Box mb={4}>
          <Typography variant="h6" mb={2}>
            Progresso dos Elementos de Serviço
          </Typography>
          <Box display="flex" flexDirection="column" gap={1}>
            {itens.map((item) => (
              <Box key={item.id} display="flex" alignItems="center" gap={2}>
                <Typography variant="body2" sx={{ minWidth: 200 }}>
                  {item.tabelaPreco?.descricao ?? item.ambiente?.nome ?? item.id.slice(0, 8)}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(Number(item.progresso || 0), 100)}
                  sx={{ flex: 1, height: 8, borderRadius: 4 }}
                  color={item.status === 'CONCLUIDO' ? 'success' : 'primary'}
                />
                <Typography variant="body2" sx={{ minWidth: 50 }}>
                  {Number(item.progresso || 0).toFixed(1)}%
                </Typography>
                <Chip
                  label={item.status}
                  size="small"
                  color={statusColor[item.status]}
                />
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Tabela de medições individuais */}
      {!loading && medicoes.length > 0 && (
        <Paper>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Colaborador</TableCell>
                <TableCell>Elemento</TableCell>
                <TableCell align="right">Área (m²)</TableCell>
                <TableCell>Data</TableCell>
                <TableCell>Status Pgto</TableCell>
                <TableCell>Excedente</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedMedicoes.map((m) => (
                <TableRow key={m.id} hover>
                  <TableCell>{m.colaborador?.nome_completo ?? '—'}</TableCell>
                  <TableCell>
                    {m.item_ambiente?.tabelaPreco?.descricao ?? '—'}
                  </TableCell>
                  <TableCell align="right">{Number(m.qtd_executada).toFixed(2)}</TableCell>
                  <TableCell>{new Date(m.data_medicao).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>
                    <Chip label={m.status_pagamento} size="small" />
                  </TableCell>
                  <TableCell>
                    {m.flag_excedente && (
                      <Tooltip title={m.justificativa ?? 'Sem justificativa'}>
                        <WarningAmberIcon color="warning" fontSize="small" />
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <LeftAlignedTablePagination
            count={medicoes.length}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </Paper>
      )}

      {!loading && medicoes.length === 0 && obraSelecionada && (
        <Alert severity="info">Nenhuma medição individual registrada para esta obra.</Alert>
      )}

      {/* Dialog nova medição */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nova Medição Individual</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              select
              label="Elemento de Serviço"
              value={form.id_item_ambiente}
              onChange={(e) => handleItemChange(e.target.value)}
              fullWidth
              required
            >
              {itens.map((it) => (
                <MenuItem key={it.id} value={it.id}>
                  {it.tabelaPreco?.descricao ?? it.ambiente?.nome ?? it.id.slice(0, 8)}
                  {' — '}
                  <Chip
                    label={`${Number(it.progresso || 0).toFixed(0)}%`}
                    size="small"
                    color={statusColor[it.status]}
                    sx={{ ml: 1 }}
                  />
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Alocação ativa"
              value={form.id_alocacao_item}
              onChange={(e) => handleAlocacaoChange(e.target.value)}
              fullWidth
              required
              disabled={!form.id_item_ambiente}
              helperText={
                form.id_item_ambiente && alocacoesFiltradas.length === 0
                  ? 'Nenhuma alocação ativa para este elemento.'
                  : ''
              }
            >
              {alocacoesFiltradas.map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {a.colaborador?.nome_completo ?? a.id_colaborador}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Área executada (m²)"
              type="number"
              value={form.qtd_executada}
              onChange={(e) => setForm((f) => ({ ...f, qtd_executada: e.target.value }))}
              fullWidth
              required
              inputProps={{ min: 0, step: 0.01 }}
              helperText={
                areaPlanejada > 0
                  ? `Área planejada: ${areaPlanejada.toFixed(2)} m²`
                  : undefined
              }
              error={isExcedente}
            />

            {isExcedente && (
              <Alert severity="warning" icon={<WarningAmberIcon />}>
                Quantidade superior ao planejado. Justificativa e foto obrigatórias.
              </Alert>
            )}

            {isExcedente && (
              <>
                <TextField
                  label="Justificativa do excedente"
                  value={form.justificativa}
                  onChange={(e) => setForm((f) => ({ ...f, justificativa: e.target.value }))}
                  fullWidth
                  multiline
                  rows={2}
                  required
                />
                <TextField
                  label="URL da foto de evidência"
                  value={form.foto_evidencia_url}
                  onChange={(e) => setForm((f) => ({ ...f, foto_evidencia_url: e.target.value }))}
                  fullWidth
                  required
                  helperText="Faça o upload via /uploads e cole a URL aqui."
                />
              </>
            )}

            <TextField
              label="Data da medição"
              type="date"
              value={form.data_medicao}
              onChange={(e) => setForm((f) => ({ ...f, data_medicao: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
