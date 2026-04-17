import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  IconButton,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import LeftAlignedTablePagination from '../../components/LeftAlignedTablePagination';
import { useClientPagination } from '../../hooks/useClientPagination';
import { api } from '../../services/api';

export const ServicosPage = () => {
  const [dialogAberto, setDialogAberto] = useState(false);
  const [servicos, setServicos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processando, setProcessando] = useState(false);
  const [servicosSelecionados, setServicosSelecionados] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    id: '',
    nome: '',
    descricao: '',
    categoria: '',
    unidade_medida: '',
  });

  const [editando, setEditando] = useState(false);
  const {
    page,
    rowsPerPage,
    paginatedItems: paginatedServicos,
    handlePageChange,
    handleRowsPerPageChange,
  } = useClientPagination(servicos);

  const normalizarUnidadeMedida = (valor?: string) => {
    if (!valor) return '';

    const normalizado = valor.trim().toUpperCase();
    if (normalizado === 'M2' || normalizado === 'M²') return 'M2';
    if (normalizado === 'ML' || normalizado === 'M') return 'ML';
    if (normalizado === 'UN' || normalizado === 'UND') return 'UN';

    return normalizado;
  };

  // Carregar serviços
  useEffect(() => {
    carregarServicos();
  }, []);

  useEffect(() => {
    setServicosSelecionados((anteriores) =>
      anteriores.filter((id) => servicos.some((servico) => String(servico.id) === id))
    );
  }, [servicos]);

  const carregarServicos = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/servicos');
      setServicos(response.data);
    } catch (err: any) {
      setError('Erro ao carregar serviços');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirDialog = () => {
    setFormData({
      id: '',
      nome: '',
      descricao: '',
      categoria: '',
      unidade_medida: '',
    });
    setEditando(false);
    setDialogAberto(true);
  };

  const handleEditar = async (servico: any) => {
    try {
      setProcessando(true);

      // Busca o detalhe para garantir que o valor atual da unidade venha completo.
      const detalheResponse = await api.get(`/servicos/${servico.id}`);
      const detalhe = detalheResponse.data || servico;

      setFormData({
        id: detalhe.id ?? servico.id,
        nome: detalhe.nome ?? servico.nome ?? '',
        descricao: detalhe.descricao ?? servico.descricao ?? '',
        categoria: detalhe.categoria ?? servico.categoria ?? '',
        unidade_medida: normalizarUnidadeMedida(
          detalhe.unidade_medida ?? detalhe.unidadeMedida ?? detalhe.unidade ?? servico.unidade_medida ?? servico.unidade
        ),
      });

      setEditando(true);
      setDialogAberto(true);
    } catch (err: any) {
      alert('Erro ao carregar dados completos do serviço: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setProcessando(false);
    }
  };

  const handleSalvar = async () => {
    if (!formData.nome.trim()) {
      alert('Nome é obrigatório');
      return;
    }

    if (!formData.unidade_medida) {
      alert('Unidade de Medida é obrigatória');
      return;
    }

    // Valor base removido do cadastro

    try {
      setProcessando(true);
      const dados = {
        nome: formData.nome,
        descricao: formData.descricao,
        categoria: formData.categoria,
        unidade_medida: normalizarUnidadeMedida(formData.unidade_medida),
      };

      if (editando) {
        await api.patch(`/servicos/${formData.id}`, dados);
      } else {
        await api.post('/servicos', dados);
      }

      setDialogAberto(false);
      await carregarServicos();
    } catch (err: any) {
      alert('Erro ao salvar serviço: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setProcessando(false);
    }
  };

  const deletarServicoPorId = async (id: string) => {
    await api.delete(`/servicos/${id}`);
  };

  const handleDeletar = async (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar este serviço?')) {
      try {
        await deletarServicoPorId(id);
        setServicosSelecionados((anteriores) => anteriores.filter((itemId) => itemId !== id));
        await carregarServicos();
      } catch (err: any) {
        alert('Erro ao deletar serviço: ' + err.message);
      }
    }
  };

  const handleSelecionarServico = (id: string) => {
    setServicosSelecionados((anteriores) =>
      anteriores.includes(id)
        ? anteriores.filter((itemId) => itemId !== id)
        : [...anteriores, id]
    );
  };

  const handleSelecionarTodosServicos = () => {
    if (servicosSelecionados.length === servicos.length) {
      setServicosSelecionados([]);
      return;
    }

    setServicosSelecionados(servicos.map((servico) => String(servico.id)));
  };

  const handleDeletarSelecionados = async () => {
    if (servicosSelecionados.length === 0) {
      return;
    }

    if (!window.confirm(`Tem certeza que deseja deletar ${servicosSelecionados.length} serviço(s)?`)) {
      return;
    }

    try {
      setProcessando(true);
      const resultados = await Promise.allSettled(
        servicosSelecionados.map((id) => deletarServicoPorId(id))
      );
      const falhas = resultados.filter((resultado) => resultado.status === 'rejected').length;
      const sucessos = resultados.length - falhas;

      await carregarServicos();
      setServicosSelecionados([]);

      if (falhas > 0) {
        alert(`${sucessos} serviço(s) deletado(s) e ${falhas} falharam.`);
      } else {
        alert(`${sucessos} serviço(s) deletado(s) com sucesso.`);
      }
    } catch (err: any) {
      alert('Erro ao deletar serviços selecionados: ' + err.message);
    } finally {
      setProcessando(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          🛠️ Catálogo de Serviços
        </Typography>
        <Typography color="textSecondary">
          Gestão de serviços oferecidos e seus valores padrão
        </Typography>
      </Box>

      {/* Stats */}
      <Card sx={{ mb: 3, bgcolor: '#e3f2fd' }}>
        <CardContent>
          <Typography>
            <strong>Total de Serviços:</strong> {servicos.length}
          </Typography>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Botão Novo */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          color="success"
          onClick={handleAbrirDialog}
          disabled={loading}
        >
          + Novo Serviço
        </Button>
        <Button
          variant="outlined"
          color="error"
          onClick={handleDeletarSelecionados}
          disabled={loading || processando || servicosSelecionados.length === 0}
        >
          Apagar Selecionados ({servicosSelecionados.length})
        </Button>
      </Box>

      {/* Tabela */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ width: 72, fontWeight: 'bold' }}>
                  Sel.
                  <Checkbox
                    checked={servicos.length > 0 && servicosSelecionados.length === servicos.length}
                    indeterminate={
                      servicosSelecionados.length > 0 && servicosSelecionados.length < servicos.length
                    }
                    onChange={handleSelecionarTodosServicos}
                    disabled={servicos.length === 0}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Nome</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Categoria</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Descrição</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {servicos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    Nenhum serviço encontrado
                  </TableCell>
                </TableRow>
              ) : (
                paginatedServicos.map((servico) => (
                  <TableRow key={servico.id}>
                    <TableCell sx={{ width: 72 }}>
                      <Checkbox
                        checked={servicosSelecionados.includes(String(servico.id))}
                        onChange={() => handleSelecionarServico(String(servico.id))}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{servico.nome}</TableCell>
                    <TableCell>{servico.categoria || '-'}</TableCell>
                    <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {servico.descricao}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEditar(servico)}
                        title="Editar"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeletar(servico.id)}
                        title="Deletar"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <LeftAlignedTablePagination
            count={servicos.length}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </TableContainer>
      )}

      {/* Dialog */}
      <Dialog open={dialogAberto} onClose={() => setDialogAberto(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editando ? 'Editar Serviço' : 'Novo Serviço'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Nome"
            value={formData.nome}
            onChange={(e) =>
              setFormData({ ...formData, nome: e.target.value })
            }
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Categoria"
            select
            SelectProps={{ native: true }}
            InputLabelProps={{ shrink: true }}
            value={formData.categoria}
            onChange={(e) =>
              setFormData({ ...formData, categoria: e.target.value })
            }
            margin="normal"
            required
          >
            <option value="">Selecione uma opção</option>
            <option value="PINTURA">Pintura</option>
            <option value="ELETRICA">Eletrica</option>
            <option value="HIDRAULICA">Hidraulica</option>
            <option value="ALVENARIA">Alvenaria</option>
            <option value="ACABAMENTO">Acabamento</option>
            <option value="MARCENARIA">Marcenaria</option>
            <option value="GESSO">Gesso</option>
            <option value="ESQUADRIAS">Esquadrias</option>
            <option value="OUTROS">Outros</option>
          </TextField>
          <TextField
            fullWidth
            label="Unidade de Medida"
            select
            SelectProps={{ native: true }}
            InputLabelProps={{ shrink: true }}
            value={formData.unidade_medida}
            onChange={(e) =>
              setFormData({ ...formData, unidade_medida: e.target.value })
            }
            margin="normal"
            required
          >
            <option value="">Selecione uma opção</option>
            <option value="M2">Metro Quadrado (m²)</option>
            <option value="ML">Metro Linear (m)</option>
            <option value="UN">Unidade (un)</option>
            <option value="VB">Verba (VB)</option>
          </TextField>
          <TextField
            fullWidth
            label="Descrição"
            value={formData.descricao}
            onChange={(e) =>
              setFormData({ ...formData, descricao: e.target.value })
            }
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogAberto(false)}>Cancelar</Button>
          <Button
            onClick={handleSalvar}
            variant="contained"
            color="primary"
            disabled={processando}
          >
            {processando ? <CircularProgress size={24} /> : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
