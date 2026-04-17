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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
import { useToast } from '../../components/Toast/ToastProvider';

export const UsuariosPage = () => {
  const { showToast } = useToast();
  const [dialogAberto, setDialogAberto] = useState(false);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processando, setProcessando] = useState(false);
  const [usuariosSelecionados, setUsuariosSelecionados] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    id: '',
    nome_completo: '',
    email: '',
    password: '',
    id_perfil: 4,
  });

  const [editando, setEditando] = useState(false);
  const {
    page,
    rowsPerPage,
    paginatedItems: paginatedUsuarios,
    handlePageChange,
    handleRowsPerPageChange,
  } = useClientPagination(usuarios);

  const perfis = [
    { id: 1, nome: 'Administrador' },
    { id: 2, nome: 'Gestor' },
    { id: 3, nome: 'Financeiro' },
    { id: 4, nome: 'Encarregado' },
  ];

  // Carregar usuários
  useEffect(() => {
    carregarUsuarios();
  }, []);

  useEffect(() => {
    setUsuariosSelecionados((anteriores) =>
      anteriores.filter((id) => usuarios.some((usuario) => String(usuario.id) === id))
    );
  }, [usuarios]);

  const carregarUsuarios = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/usuarios');
      setUsuarios(response.data);
    } catch (err: any) {
      setError('Erro ao carregar usuários');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirDialog = () => {
    setFormData({
      id: '',
      nome_completo: '',
      email: '',
      password: '',
      id_perfil: 4,
    });
    setEditando(false);
    setDialogAberto(true);
  };

  const handleEditar = (usuario: any) => {
    setFormData({
      id: usuario.id,
      nome_completo: usuario.nome_completo,
      email: usuario.email,
      password: '',
      id_perfil: usuario.id_perfil,
    });
    setEditando(true);
    setDialogAberto(true);
  };

  const handleSalvar = async () => {
    if (!formData.nome_completo.trim()) {
      showToast({
        message: 'Nome completo é obrigatório',
        severity: 'error',
      });
      return;
    }

    if (!formData.email.trim()) {
      showToast({
        message: 'Email é obrigatório',
        severity: 'error',
      });
      return;
    }

    if (!editando && !formData.password.trim()) {
      showToast({
        message: 'Senha é obrigatória para novo usuário',
        severity: 'error',
      });
      return;
    }

    try {
      setProcessando(true);
      const dados: any = {
        nome_completo: formData.nome_completo,
        email: formData.email,
        id_perfil: formData.id_perfil,
      };

      if (formData.password) {
        dados.password = formData.password;
      }

      if (editando) {
        await api.patch(`/usuarios/${formData.id}`, dados);
        showToast({
          message: 'Usuário atualizado com sucesso!',
          severity: 'success',
        });
      } else {
        await api.post('/usuarios', dados);
        showToast({
          message: 'Usuário criado com sucesso!',
          severity: 'success',
        });
      }

      setDialogAberto(false);
      await carregarUsuarios();
    } catch (err: any) {
      showToast({
        message: 'Erro ao salvar usuário: ' + (err.message || 'Erro desconhecido'),
        severity: 'error',
      });
    } finally {
      setProcessando(false);
    }
  };

  const deletarUsuarioPorId = async (id: string) => {
    await api.delete(`/usuarios/${id}`);
  };

  const handleDeletar = async (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar este usuário?')) {
      try {
        await deletarUsuarioPorId(id);
        setUsuariosSelecionados((anteriores) => anteriores.filter((itemId) => itemId !== id));
        showToast({
          message: 'Usuário deletado com sucesso!',
          severity: 'success',
        });
        await carregarUsuarios();
      } catch (err: any) {
        showToast({
          message: 'Erro ao deletar usuário: ' + err.message,
          severity: 'error',
        });
      }
    }
  };

  const handleSelecionarUsuario = (id: string) => {
    setUsuariosSelecionados((anteriores) =>
      anteriores.includes(id)
        ? anteriores.filter((itemId) => itemId !== id)
        : [...anteriores, id]
    );
  };

  const handleSelecionarTodosUsuarios = () => {
    if (usuariosSelecionados.length === usuarios.length) {
      setUsuariosSelecionados([]);
      return;
    }

    setUsuariosSelecionados(usuarios.map((usuario) => String(usuario.id)));
  };

  const handleDeletarSelecionados = async () => {
    if (usuariosSelecionados.length === 0) {
      return;
    }

    if (!window.confirm(`Tem certeza que deseja deletar ${usuariosSelecionados.length} usuário(s)?`)) {
      return;
    }

    try {
      setProcessando(true);
      const resultados = await Promise.allSettled(
        usuariosSelecionados.map((id) => deletarUsuarioPorId(id))
      );
      const falhas = resultados.filter((resultado) => resultado.status === 'rejected').length;
      const sucessos = resultados.length - falhas;

      await carregarUsuarios();
      setUsuariosSelecionados([]);

      showToast({
        message:
          falhas > 0
            ? `${sucessos} usuário(s) deletado(s) e ${falhas} falharam.`
            : `${sucessos} usuário(s) deletado(s) com sucesso!`,
        severity: falhas > 0 ? 'warning' : 'success',
      });
    } catch (err: any) {
      showToast({
        message: 'Erro ao deletar usuários selecionados: ' + err.message,
        severity: 'error',
      });
    } finally {
      setProcessando(false);
    }
  };

  const getNomePerfil = (id: number) => {
    return perfis.find((p) => p.id === id)?.nome || 'Desconhecido';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          👥 Usuários
        </Typography>
        <Typography color="textSecondary">
          Gestão de usuários e permissões do sistema
        </Typography>
      </Box>

      {/* Stats */}
      <Card sx={{ mb: 3, bgcolor: '#e3f2fd' }}>
        <CardContent>
          <Typography>
            <strong>Total de Usuários:</strong> {usuarios.length}
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
          + Novo Usuário
        </Button>
        <Button
          variant="outlined"
          color="error"
          onClick={handleDeletarSelecionados}
          disabled={loading || processando || usuariosSelecionados.length === 0}
        >
          Apagar Selecionados ({usuariosSelecionados.length})
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
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={usuarios.length > 0 && usuariosSelecionados.length === usuarios.length}
                    indeterminate={
                      usuariosSelecionados.length > 0 && usuariosSelecionados.length < usuarios.length
                    }
                    onChange={handleSelecionarTodosUsuarios}
                    disabled={usuarios.length === 0}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Nome</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Perfil</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={usuariosSelecionados.includes(String(usuario.id))}
                        onChange={() => handleSelecionarUsuario(String(usuario.id))}
                      />
                    </TableCell>
                    <TableCell>{usuario.nome_completo}</TableCell>
                    <TableCell>{usuario.email}</TableCell>
                    <TableCell>{getNomePerfil(usuario.id_perfil)}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEditar(usuario)}
                        title="Editar"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeletar(usuario.id)}
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
            count={usuarios.length}
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
          {editando ? 'Editar Usuário' : 'Novo Usuário'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Nome Completo"
            value={formData.nome_completo}
            onChange={(e) =>
              setFormData({ ...formData, nome_completo: e.target.value })
            }
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            margin="normal"
            required
          />
          {!editando && (
            <TextField
              fullWidth
              label="Senha"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              margin="normal"
              required
            />
          )}
          {editando && (
            <TextField
              fullWidth
              label="Nova Senha (deixe em branco para manter)"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              margin="normal"
            />
          )}
          <FormControl fullWidth margin="normal">
            <InputLabel>Perfil</InputLabel>
            <Select
              value={formData.id_perfil}
              label="Perfil"
              onChange={(e) =>
                setFormData({ ...formData, id_perfil: e.target.value as number })
              }
            >
              {perfis.map((perfil) => (
                <MenuItem key={perfil.id} value={perfil.id}>
                  {perfil.nome}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
