import {
  Box,
  Button,
  Typography,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { obrasAPI, clientesAPI } from '../../services/api';
import {
  Obra,
  CreateObraDto,
  StatusObraEnum,
  StatusObraLabels,
  StatusObraColors,
} from '../../types/obras';

interface Cliente {
  id: string;
  razao_social: string;
  cnpj_nif: string;
  email: string | null;
  telefone: string | null;
}

export const ObrasPage = () => {
  const [obras, setObras] = useState<Obra[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingObra, setEditingObra] = useState<Obra | null>(null);
  const [deletingObra, setDeletingObra] = useState<Obra | null>(null);
  const [formData, setFormData] = useState<CreateObraDto>({
    nome: '',
    endereco_completo: '',
    data_inicio: '',
    data_previsao_fim: '',
    id_cliente: '',
    observacoes: '',
    status: StatusObraEnum.AGUARDANDO,
  });

  const fetchObras = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await obrasAPI.getAll();
      setObras(response.data);
    } catch (err: any) {
      console.error('Erro ao carregar obras:', err);
      setError(err.message || 'Erro ao carregar obras');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientes = async () => {
    try {
      const response = await clientesAPI.getAll();
      setClientes(response.data);
    } catch (err: any) {
      console.error('Erro ao carregar clientes:', err);
    }
  };

  useEffect(() => {
    fetchObras();
    fetchClientes();
  }, []);

  const handleOpenDialog = (obra?: Obra) => {
    if (obra) {
      setEditingObra(obra);
      setFormData({
        nome: obra.nome,
        endereco_completo: obra.endereco_completo,
        data_inicio: obra.data_inicio.split('T')[0],
        data_previsao_fim: obra.data_previsao_fim?.split('T')[0] || '',
        id_cliente: obra.id_cliente,
        observacoes: obra.observacoes || '',
        status: obra.status,
      });
    } else {
      setEditingObra(null);
      setFormData({
        nome: '',
        endereco_completo: '',
        data_inicio: '',
        data_previsao_fim: '',
        id_cliente: '',
        observacoes: '',
        status: StatusObraEnum.AGUARDANDO,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingObra(null);
  };

  const handleSubmit = async () => {
    setError('');
    try {
      // Remove empty strings
      const payload: any = { ...formData };
      if (!payload.data_previsao_fim) delete payload.data_previsao_fim;
      if (!payload.observacoes) delete payload.observacoes;

      if (editingObra) {
        await obrasAPI.update(editingObra.id, payload);
      } else {
        await obrasAPI.create(payload);
      }
      handleCloseDialog();
      fetchObras();
    } catch (err: any) {
      console.error('Erro ao salvar obra:', err);
      setError(err.message || 'Erro ao salvar obra');
    }
  };

  const handleOpenDeleteDialog = (obra: Obra) => {
    setDeletingObra(obra);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setDeletingObra(null);
  };

  const handleDelete = async () => {
    if (!deletingObra) return;
    setError('');
    try {
      await obrasAPI.delete(deletingObra.id);
      handleCloseDeleteDialog();
      fetchObras();
    } catch (err: any) {
      console.error('Erro ao deletar obra:', err);
      setError(err.message || 'Erro ao deletar obra');
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'nome',
      headerName: 'Nome',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'cliente',
      headerName: 'Cliente',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => params.row.cliente?.razao_social || '-',
    },
    {
      field: 'endereco_completo',
      headerName: 'Endereço',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={StatusObraLabels[params.value as StatusObraEnum]}
          color={StatusObraColors[params.value as StatusObraEnum]}
          size="small"
        />
      ),
    },
    {
      field: 'data_inicio',
      headerName: 'Data Início',
      width: 120,
      valueFormatter: (params) => {
        if (!params.value) return '-';
        return new Date(params.value).toLocaleDateString('pt-BR');
      },
    },
    {
      field: 'data_previsao_fim',
      headerName: 'Previsão Fim',
      width: 120,
      valueFormatter: (params) => {
        if (!params.value) return '-';
        return new Date(params.value).toLocaleDateString('pt-BR');
      },
    },
    {
      field: 'actions',
      headerName: 'Ações',
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <IconButton
            size="small"
            onClick={() => handleOpenDialog(params.row)}
            color="primary"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleOpenDeleteDialog(params.row)}
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Obras
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nova Obra
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%', height: 600 }}>
        <DataGrid
          rows={obras}
          columns={columns}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 },
            },
          }}
          disableRowSelectionOnClick
        />
      </Paper>

      {/* Dialog de Criação/Edição */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingObra ? 'Editar Obra' : 'Nova Obra'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome da Obra"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Cliente"
                value={formData.id_cliente}
                onChange={(e) =>
                  setFormData({ ...formData, id_cliente: e.target.value })
                }
                required
              >
                {clientes.map((cliente) => (
                  <MenuItem key={cliente.id} value={cliente.id}>
                    {cliente.razao_social}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as StatusObraEnum,
                  })
                }
              >
                {Object.values(StatusObraEnum).map((status) => (
                  <MenuItem key={status} value={status}>
                    {StatusObraLabels[status]}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Endereço Completo"
                value={formData.endereco_completo}
                onChange={(e) =>
                  setFormData({ ...formData, endereco_completo: e.target.value })
                }
                required
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Data de Início"
                type="date"
                value={formData.data_inicio}
                onChange={(e) =>
                  setFormData({ ...formData, data_inicio: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Previsão de Fim"
                type="date"
                value={formData.data_previsao_fim}
                onChange={(e) =>
                  setFormData({ ...formData, data_previsao_fim: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observações"
                value={formData.observacoes}
                onChange={(e) =>
                  setFormData({ ...formData, observacoes: e.target.value })
                }
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingObra ? 'Salvar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir a obra{' '}
            <strong>{deletingObra?.nome}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancelar</Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
