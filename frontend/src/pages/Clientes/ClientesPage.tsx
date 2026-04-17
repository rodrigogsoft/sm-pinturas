import {
  Box,
  Button,
  Typography,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { clientesAPI } from '../../services/api';
import { Cliente, CreateClienteDto } from '../../types/clientes';

export const ClientesPage = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clientesSelecionados, setClientesSelecionados] = useState<string[]>([]);
  const [processandoExclusao, setProcessandoExclusao] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [deletingCliente, setDeletingCliente] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState<CreateClienteDto>({
    razao_social: '',
    cnpj_nif: '',
    email: '',
    telefone: '',
    endereco: '',
    dia_corte: 10,
  });

  const fetchClientes = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await clientesAPI.getAll();
      setClientes(response.data);
      setClientesSelecionados((anteriores) =>
        anteriores.filter((id) => response.data.some((cliente: Cliente) => String(cliente.id) === id))
      );
    } catch (err: any) {
      console.error('Erro ao carregar clientes:', err);
      setError(err.message || 'Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const handleOpenDialog = (cliente?: Cliente) => {
    if (cliente) {
      setEditingCliente(cliente);
      setFormData({
        razao_social: cliente.razao_social,
        cnpj_nif: cliente.cnpj_nif,
        email: cliente.email || '',
        telefone: cliente.telefone || '',
        endereco: cliente.endereco || '',
        dia_corte: cliente.dia_corte,
      });
    } else {
      setEditingCliente(null);
      setFormData({
        razao_social: '',
        cnpj_nif: '',
        email: '',
        telefone: '',
        endereco: '',
        dia_corte: 10,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCliente(null);
  };

  const handleSubmit = async () => {
    setError('');
    try {
      // Remove empty strings
      const payload: any = { ...formData };
      if (!payload.email) delete payload.email;
      if (!payload.telefone) delete payload.telefone;
      if (!payload.endereco) delete payload.endereco;

      if (editingCliente) {
        await clientesAPI.update(editingCliente.id, payload);
      } else {
        await clientesAPI.create(payload);
      }
      handleCloseDialog();
      fetchClientes();
    } catch (err: any) {
      console.error('Erro ao salvar cliente:', err);
      setError(err.message || 'Erro ao salvar cliente');
    }
  };

  const handleOpenDeleteDialog = (cliente: Cliente) => {
    setDeletingCliente(cliente);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setDeletingCliente(null);
  };

  const handleDelete = async () => {
    if (!deletingCliente) return;
    setError('');
    try {
      await clientesAPI.delete(deletingCliente.id);
      handleCloseDeleteDialog();
      fetchClientes();
    } catch (err: any) {
      console.error('Erro ao deletar cliente:', err);
      setError(err.message || 'Erro ao deletar cliente');
    }
  };

  const handleDeleteSelecionados = async () => {
    if (clientesSelecionados.length === 0) {
      return;
    }

    if (!window.confirm(`Tem certeza que deseja excluir ${clientesSelecionados.length} cliente(s)?`)) {
      return;
    }

    setError('');
    try {
      setProcessandoExclusao(true);
      const resultados = await Promise.allSettled(
        clientesSelecionados.map((id) => clientesAPI.delete(id))
      );
      const falhas = resultados.filter((resultado) => resultado.status === 'rejected').length;
      const sucessos = resultados.length - falhas;

      setClientesSelecionados([]);
      await fetchClientes();

      if (falhas > 0) {
        setError(`${sucessos} cliente(s) excluído(s) e ${falhas} falharam.`);
      }
    } catch (err: any) {
      console.error('Erro ao excluir clientes em lote:', err);
      setError(err.message || 'Erro ao excluir clientes selecionados');
    } finally {
      setProcessandoExclusao(false);
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'razao_social',
      headerName: 'Razão Social',
      flex: 1,
      minWidth: 250,
    },
    {
      field: 'cnpj_nif',
      headerName: 'CNPJ/NIF',
      width: 180,
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      minWidth: 200,
      valueFormatter: (params) => params.value || '-',
    },
    {
      field: 'telefone',
      headerName: 'Telefone',
      width: 150,
      valueFormatter: (params) => params.value || '-',
    },
    {
      field: 'dia_corte',
      headerName: 'Dia Corte',
      width: 110,
      align: 'center',
      headerAlign: 'center',
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
          Clientes
        </Typography>
        <Button
          variant="outlined"
          color="error"
          onClick={handleDeleteSelecionados}
          disabled={processandoExclusao || clientesSelecionados.length === 0}
          sx={{ mr: 2 }}
        >
          Apagar Selecionados ({clientesSelecionados.length})
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Novo Cliente
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%', height: 600 }}>
        <DataGrid
          rows={clientes}
          columns={columns}
          checkboxSelection
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 },
            },
          }}
          rowSelectionModel={clientesSelecionados}
          onRowSelectionModelChange={(novaSelecao) =>
            setClientesSelecionados(novaSelecao.map((id) => String(id)))
          }
          disableRowSelectionOnClick
        />
      </Paper>

      {/* Dialog de Criação/Edição */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Razão Social"
                value={formData.razao_social}
                onChange={(e) =>
                  setFormData({ ...formData, razao_social: e.target.value })
                }
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="CNPJ/NIF"
                value={formData.cnpj_nif}
                onChange={(e) =>
                  setFormData({ ...formData, cnpj_nif: e.target.value })
                }
                required
                helperText="Formato: 12.345.678/0001-99"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Dia de Corte"
                type="number"
                value={formData.dia_corte}
                onChange={(e) =>
                  setFormData({ ...formData, dia_corte: parseInt(e.target.value) })
                }
                required
                inputProps={{ min: 1, max: 28 }}
                helperText="Dia do mês para faturamento (1-28)"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefone"
                value={formData.telefone}
                onChange={(e) =>
                  setFormData({ ...formData, telefone: e.target.value })
                }
                helperText="Formato: (11) 98765-4321"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Endereço Completo"
                value={formData.endereco}
                onChange={(e) =>
                  setFormData({ ...formData, endereco: e.target.value })
                }
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingCliente ? 'Salvar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir o cliente{' '}
            <strong>{deletingCliente?.razao_social}</strong>?
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
