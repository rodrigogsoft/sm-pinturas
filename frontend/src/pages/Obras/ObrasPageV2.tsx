import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from '@mui/material';
import LeftAlignedTablePagination from '../../components/LeftAlignedTablePagination';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandIcon,
} from '@mui/icons-material';
import { useClientPagination } from '../../hooks/useClientPagination';
import { useNavigate } from 'react-router-dom';
import { ObraWizard, ObraWizardData } from './ObraWizard';
import { HierarchyViewer } from './HierarchyViewer';
import obrasService, { Obra } from '../../services/obras.service';
import pavimentosService from '../../services/pavimentos.service';
import ambientesService from '../../services/ambientes.service';

interface ObraComHierarquia extends Obra {
  pavimientos_count?: number;
  ambientes_count?: number;
}

export const ObrasPageV2 = () => {
  const navigate = useNavigate();
  const [obras, setObras] = useState<ObraComHierarquia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [wizardAberto, setWizardAberto] = useState(false);
  const [hierarchyDialogAberto, setHierarchyDialogAberto] = useState(false);
  const [hierarchyLoading, setHierarchyLoading] = useState(false);
  const [hierarchyData, setHierarchyData] = useState<any>(null);
  const [deletingObra, setDeletingObra] = useState<ObraComHierarquia | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [obrasSelecionadas, setObrasSelecionadas] = useState<string[]>([]);
  const {
    page,
    rowsPerPage,
    paginatedItems: paginatedObras,
    handlePageChange,
    handleRowsPerPageChange,
  } = useClientPagination(obras);

  useEffect(() => {
    carregarObras();
  }, []);

  useEffect(() => {
    setObrasSelecionadas((anteriores) =>
      anteriores.filter((id) => obras.some((obra) => String(obra.id) === id))
    );
  }, [obras]);

  const carregarObras = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await obrasService.listar();
      setObras(data as ObraComHierarquia[]);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar obras');
    } finally {
      setLoading(false);
    }
  };

  const carregarHierarquia = async (obraId: string) => {
    try {
      setHierarchyLoading(true);
      setError('');

      // Carregar obra
      const obra = await obrasService.buscarPorId(obraId);

      // Carregar pavimentos
      const pavimentos = await pavimentosService.listarPorObra(obraId) || [];

      // Carregar ambientes para cada pavimento
      const pavimentosComAmbientes = await Promise.all(
        pavimentos.map(async (pav) => {
          const ambientes = await ambientesService.listarPorPavimento(pav.id) || [];
          return {
            ...pav,
            ambientes,
          };
        })
      );

      setHierarchyData({
        ...obra,
        pavimentos: pavimentosComAmbientes,
      });
      setHierarchyDialogAberto(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar hierarquia');
    } finally {
      setHierarchyLoading(false);
    }
  };

  const handleSubmitWizard = async (wizardData: ObraWizardData) => {
    try {
      setLoading(true);
      setError('');

      // 1. Criar obra
      const novaObra = await obrasService.criar({
        nome: wizardData.obra.nome,
        endereco_completo: wizardData.obra.endereco_completo,
        data_inicio: wizardData.obra.data_inicio,
        data_previsao_fim: wizardData.obra.data_previsao_fim,
        status: wizardData.obra.status as any,
        margem_minima_percentual: wizardData.obra.margem_minima_percentual,
      });

      // 2. Criar pavimentos com ambientes
      for (const pavimento of wizardData.pavimentos) {
        const novoPavimento = await pavimentosService.criar({
          id_obra: novaObra.id,
          nome: pavimento.nome,
          ordem: pavimento.ordem,
        });

        // 3. Criar ambientes para cada pavimento
        for (const ambiente of pavimento.ambientes) {
          await ambientesService.criar({
            id_pavimento: novoPavimento.id,
            nome: ambiente.nome,
            area_m2: ambiente.area_m2,
          });
        }
      }

      // 4. Recarregar obras
      await carregarObras();
      setWizardAberto(false);

      // Mostrar mensagem de sucesso
      alert(`Obra "${wizardData.obra.nome}" criada com sucesso com ${wizardData.pavimentos.length} pavimento(s)!`);
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteObra = async () => {
    if (!deletingObra) return;

    try {
      setLoading(true);
      await obrasService.deletar(deletingObra.id);
      setObrasSelecionadas((anteriores) => anteriores.filter((id) => id !== String(deletingObra.id)));
      await carregarObras();
      setDeleteConfirmOpen(false);
      setDeletingObra(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar obra');
    } finally {
      setLoading(false);
    }
  };

  const handleSelecionarObra = (id: string) => {
    setObrasSelecionadas((anteriores) =>
      anteriores.includes(id)
        ? anteriores.filter((itemId) => itemId !== id)
        : [...anteriores, id]
    );
  };

  const handleSelecionarTodasObras = () => {
    if (obrasSelecionadas.length === obras.length) {
      setObrasSelecionadas([]);
      return;
    }

    setObrasSelecionadas(obras.map((obra) => String(obra.id)));
  };

  const handleDeleteSelecionadas = async () => {
    if (obrasSelecionadas.length === 0) {
      return;
    }

    if (!window.confirm(`Tem certeza que deseja deletar ${obrasSelecionadas.length} obra(s)?`)) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      const resultados = await Promise.allSettled(
        obrasSelecionadas.map((id) => obrasService.deletar(id))
      );
      const falhas = resultados.filter((resultado) => resultado.status === 'rejected').length;
      const sucessos = resultados.length - falhas;

      await carregarObras();
      setObrasSelecionadas([]);

      if (falhas > 0) {
        setError(`${sucessos} obra(s) deletada(s) e ${falhas} falharam.`);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar obras selecionadas');
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
    PLANEJAMENTO: 'default',
    ATIVA: 'success',
    SUSPENSA: 'warning',
    CONCLUIDA: 'primary',
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            🏗️ Gerenciamento de Obras
          </Typography>
          <Typography color="textSecondary">
            RF02: Hierarquia de Ativos (Obra &gt; Pavimento &gt; Ambiente)
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            color="error"
            onClick={handleDeleteSelecionadas}
            disabled={loading || obrasSelecionadas.length === 0}
            size="large"
          >
            Apagar Selecionados ({obrasSelecionadas.length})
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<AddIcon />}
            onClick={() => setWizardAberto(true)}
            disabled={loading}
            size="large"
          >
            Criar Obra Completa
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total de Obras
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {obras.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Ativas
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#4CAF50' }}>
                {obras.filter(o => o.status === 'ATIVA').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Em Planejamento
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#FF9800' }}>
                {obras.filter(o => o.status === 'PLANEJAMENTO').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Concluídas
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2196F3' }}>
                {obras.filter(o => o.status === 'CONCLUIDA').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabela de Obras */}
      {loading && !obras.length ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : obras.length === 0 ? (
        <Alert severity="info">
          Nenhuma obra cadastrada. Clique em "Criar Obra Completa" para começar.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={obras.length > 0 && obrasSelecionadas.length === obras.length}
                    indeterminate={
                      obrasSelecionadas.length > 0 && obrasSelecionadas.length < obras.length
                    }
                    onChange={handleSelecionarTodasObras}
                    disabled={obras.length === 0}
                  />
                </TableCell>
                <TableCell>Nome</TableCell>
                <TableCell>Endereço</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Data Início</TableCell>
                <TableCell align="center">Data Fim Prevista</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedObras.map((obra) => (
                <TableRow key={obra.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={obrasSelecionadas.includes(String(obra.id))}
                      onChange={() => handleSelecionarObra(String(obra.id))}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: '600' }}>{obra.nome}</TableCell>
                  <TableCell>{obra.endereco_completo}</TableCell>
                  <TableCell>
                    <Chip
                      label={obra.status}
                      size="small"
                      color={statusColors[obra.status]}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {new Date(obra.data_inicio).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell align="center">
                    {obra.data_previsao_fim
                      ? new Date(obra.data_previsao_fim).toLocaleDateString('pt-BR')
                      : '-'}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => carregarHierarquia(obra.id)}
                      title="Ver Hierarquia"
                    >
                      <ExpandIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/obras/${obra.id}/editar`)}
                      title="Editar"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        setDeletingObra(obra);
                        setDeleteConfirmOpen(true);
                      }}
                      title="Deletar"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <LeftAlignedTablePagination
            count={obras.length}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </TableContainer>
      )}

      {/* Dialog de Hierarquia */}
      <Dialog
        open={hierarchyDialogAberto}
        onClose={() => setHierarchyDialogAberto(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Hierarquia da Obra: {hierarchyData?.nome}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {hierarchyLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : hierarchyData ? (
            <HierarchyViewer
              obra={hierarchyData}
              onAddPavimento={(obraId) => {
                navigate(`/pavimentos/nova?obra_id=${obraId}`);
                setHierarchyDialogAberto(false);
              }}
              onAddAmbiente={(pavimentoId) => {
                navigate(`/ambientes/novo?pavimento_id=${pavimentoId}`);
                setHierarchyDialogAberto(false);
              }}
              onEditPavimento={(pavimentoId) => {
                navigate(`/pavimentos/${pavimentoId}/editar`);
                setHierarchyDialogAberto(false);
              }}
              onEditAmbiente={(ambienteId) => {
                navigate(`/ambientes/${ambienteId}/editar`);
                setHierarchyDialogAberto(false);
              }}
              onDeletePavimento={async (pavimentoId) => {
                try {
                  await pavimentosService.deletar(pavimentoId);
                  // Recarregar hierarquia
                  if (hierarchyData?.id) {
                    await carregarHierarquia(hierarchyData.id);
                  }
                } catch (err: any) {
                  setError(err.message || 'Erro ao deletar pavimento');
                }
              }}
              onDeleteAmbiente={async (ambienteId) => {
                try {
                  await ambientesService.deletar(ambienteId);
                  // Recarregar hierarquia
                  if (hierarchyData?.id) {
                    await carregarHierarquia(hierarchyData.id);
                  }
                } catch (err: any) {
                  setError(err.message || 'Erro ao deletar ambiente');
                }
              }}
            />
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHierarchyDialogAberto(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Wizard de Criação */}
      <ObraWizard
        open={wizardAberto}
        onClose={() => setWizardAberto(false)}
        onSubmit={handleSubmitWizard}
        loading={loading}
      />

      {/* Dialog de Confirmação de Deleção */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirmar Deleção</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja deletar a obra "<strong>{deletingObra?.nome}</strong>"?
            Todos os pavimentos e ambientes serão removidos.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancelar</Button>
          <Button onClick={handleDeleteObra} color="error" variant="contained">
            Deletar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ObrasPageV2;
