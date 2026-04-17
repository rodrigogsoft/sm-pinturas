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
  Chip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { colaboradoresAPI } from '../../services/api';
import { Colaborador, CreateColaboradorDto } from '../../types/colaboradores';

export const ColaboradoresPage = () => {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [colaboradoresSelecionados, setColaboradoresSelecionados] = useState<string[]>([]);
  const [processandoExclusao, setProcessandoExclusao] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingColaborador, setEditingColaborador] = useState<Colaborador | null>(null);
  const [deletingColaborador, setDeletingColaborador] = useState<Colaborador | null>(null);
  const [formData, setFormData] = useState<CreateColaboradorDto>({
    nome_completo: '',
    cpf_nif: '',
    email: '',
    telefone: '',
    data_nascimento: '',
    endereco: '',
    ativo: true,
  });

  const fetchColaboradores = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await colaboradoresAPI.getAll();
      setColaboradores(response.data);
      setColaboradoresSelecionados((anteriores) =>
        anteriores.filter((id) => response.data.some((colaborador: Colaborador) => String(colaborador.id) === id))
      );
    } catch (err: any) {
      console.error('Erro ao carregar colaboradores:', err);
      setError(err.message || 'Erro ao carregar colaboradores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColaboradores();
  }, []);

  const handleOpenDialog = (colaborador?: Colaborador) => {
    if (colaborador) {
      setEditingColaborador(colaborador);
      setFormData({
        nome_completo: colaborador.nome_completo,
        cpf_nif: colaborador.cpf_nif,
        email: colaborador.email || '',
        telefone: colaborador.telefone || '',
        data_nascimento: colaborador.data_nascimento?.split('T')[0] || '',
        endereco: colaborador.endereco || '',
        ativo: colaborador.ativo,
      });
    } else {
      setEditingColaborador(null);
      setFormData({
        nome_completo: '',
        cpf_nif: '',
        email: '',
        telefone: '',
        data_nascimento: '',
        endereco: '',
        ativo: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingColaborador(null);
  };

  const handleSubmit = async () => {
    setError('');
    try {
      // Remove empty strings
      const payload: any = { ...formData };
      if (!payload.email) delete payload.email;
      if (!payload.telefone) delete payload.telefone;
      if (!payload.data_nascimento) delete payload.data_nascimento;
      if (!payload.endereco) delete payload.endereco;

      if (editingColaborador) {
        await colaboradoresAPI.update(editingColaborador.id, payload);
      } else {
        await colaboradoresAPI.create(payload);
      }
      handleCloseDialog();
      fetchColaboradores();
    } catch (err: any) {
      console.error('Erro ao salvar colaborador:', err);
      setError(err.message || 'Erro ao salvar colaborador');
    }
  };

  const handleOpenDeleteDialog = (colaborador: Colaborador) => {
    setDeletingColaborador(colaborador);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setDeletingColaborador(null);
  };

  const handleDelete = async () => {
    if (!deletingColaborador) return;
    setError('');
    try {
      await colaboradoresAPI.delete(deletingColaborador.id);
      handleCloseDeleteDialog();
      fetchColaboradores();
    } catch (err: any) {
      console.error('Erro ao deletar colaborador:', err);
      setError(err.message || 'Erro ao deletar colaborador');
    }
  };

  const handleDeleteSelecionados = async () => {
    if (colaboradoresSelecionados.length === 0) {
      return;
    }

    if (!window.confirm(`Tem certeza que deseja excluir ${colaboradoresSelecionados.length} colaborador(es)?`)) {
      return;
    }

    setError('');
    try {
      setProcessandoExclusao(true);
      const resultados = await Promise.allSettled(
        colaboradoresSelecionados.map((id) => colaboradoresAPI.delete(id))
      );
      const falhas = resultados.filter((resultado) => resultado.status === 'rejected').length;
      const sucessos = resultados.length - falhas;

      setColaboradoresSelecionados([]);
      await fetchColaboradores();

      if (falhas > 0) {
        setError(`${sucessos} colaborador(es) excluído(s) e ${falhas} falharam.`);
      }
    } catch (err: any) {
      console.error('Erro ao excluir colaboradores em lote:', err);
      setError(err.message || 'Erro ao excluir colaboradores selecionados');
    } finally {
      setProcessandoExclusao(false);
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'nome_completo',
      headerName: 'Nome Completo',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'cpf_nif',
      headerName: 'CPF/NIF',
      width: 150,
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
      field: 'data_nascimento',
      headerName: 'Nascimento',
      width: 130,
      valueFormatter: (params) => {
        if (!params.value) return '-';
        return new Date(params.value).toLocaleDateString('pt-BR');
      },
    },
    {
      field: 'ativo',
      headerName: 'Status',
      width: 110,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value ? 'Ativo' : 'Inativo'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
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
          Colaboradores
        </Typography>
        <Button
          variant="outlined"
          color="error"
          onClick={handleDeleteSelecionados}
          disabled={processandoExclusao || colaboradoresSelecionados.length === 0}
          sx={{ mr: 2 }}
        >
          Apagar Selecionados ({colaboradoresSelecionados.length})
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Novo Colaborador
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%', height: 600 }}>
        <DataGrid
          rows={colaboradores}
          columns={columns}
          checkboxSelection
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 },
            },
          }}
          rowSelectionModel={colaboradoresSelecionados}
          onRowSelectionModelChange={(novaSelecao) =>
            setColaboradoresSelecionados(novaSelecao.map((id) => String(id)))
          }
          disableRowSelectionOnClick
        />
      </Paper>

      {/* Dialog de Criação/Edição */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingColaborador ? 'Editar Colaborador' : 'Novo Colaborador'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome Completo"
                value={formData.nome_completo}
                onChange={(e) =>
                  setFormData({ ...formData, nome_completo: e.target.value })
                }
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="CPF/NIF"
                value={formData.cpf_nif}
                onChange={(e) =>
                  setFormData({ ...formData, cpf_nif: e.target.value })
                }
                required
                helperText="Formato: 123.456.789-00"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Data de Nascimento"
                type="date"
                value={formData.data_nascimento}
                onChange={(e) =>
                  setFormData({ ...formData, data_nascimento: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
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

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.ativo}
                    onChange={(e) =>
                      setFormData({ ...formData, ativo: e.target.checked })
                    }
                  />
                }
                label="Ativo"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingColaborador ? 'Salvar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir o colaborador{' '}
            <strong>{deletingColaborador?.nome_completo}</strong>?
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
