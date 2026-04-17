import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  CircularProgress,
  Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import configurcoesService, { Configuracao, UpdateConfiguracaoDto } from '../../services/configuracoes.service';
import { useToast } from '../../components/Toast/ToastProvider';

export const ConfiguracoesPage = () => {
  const [configuracoes, setConfiguracoes] = useState<Configuracao[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [configSelecionada, setConfigSelecionada] = useState<Configuracao | null>(null);
  const [novoValor, setNovoValor] = useState('');
  const [novoAtivo, setNovoAtivo] = useState(true);
  const [novaDescricao, setNovaDescricao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  const carregarConfiguracoes = async () => {
    try {
      setLoading(true);
      const dados = await configurcoesService.listar();
      setConfiguracoes(dados);
    } catch (err: any) {
      showToast({
        message: 'Erro ao carregar configurações',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirDialogo = (config: Configuracao) => {
    setConfigSelecionada(config);
    setNovoValor(config.valor);
    setNovoAtivo(config.ativo);
    setNovaDescricao(config.descricao);
    setDialogAberto(true);
  };

  const handleFecharDialogo = () => {
    setDialogAberto(false);
    setConfigSelecionada(null);
    setNovoValor('');
    setNovoAtivo(true);
    setNovaDescricao('');
  };

  const handleSalvar = async () => {
    if (!configSelecionada) return;

    try {
      setSalvando(true);
      const dto: UpdateConfiguracaoDto = {
        valor: novoValor,
        ativo: novoAtivo,
        descricao: novaDescricao,
      };

      const atualizada = await configurcoesService.atualizar(configSelecionada.chave, dto);
      setConfiguracoes((configs) =>
        configs.map((c) => (c.id === atualizada.id ? atualizada : c))
      );
      showToast({
        message: 'Configuração atualizada com sucesso',
        severity: 'success',
      });
      handleFecharDialogo();
    } catch (err: any) {
      showToast({
        message: 'Erro ao atualizar configuração',
        severity: 'error',
      });
    } finally {
      setSalvando(false);
    }
  };

  const renderValor = (config: Configuracao) => {
    if (config.tipo === 'boolean') {
      return config.valor === 'true' ? (
        <Chip label="Ativado" color="success" size="small" />
      ) : (
        <Chip label="Desativado" color="error" size="small" />
      );
    }
    return <strong>{config.valor}</strong>;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          ⚙️ Configurações do Sistema
        </Typography>
        <Typography color="textSecondary">
          Gerenciamento de regras e parâmetros configuráveis
        </Typography>
      </Box>

      {/* Info */}
      <Paper sx={{ p: 2.5, mb: 3, bgcolor: 'info.light', borderLeft: '4px solid', borderColor: '#1976d2' }}>
        <Typography variant="body2">
          <strong>Nota:</strong> Altere apenas se souber o que está fazendo. O valor 0 em configurações numéricas
          geralmente significa "sem limite" ou "desativado".
        </Typography>
      </Paper>

      {/* Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Chave</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Descrição</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Valor</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Ativo</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {configuracoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">Nenhuma configuração encontrada</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                configuracoes.map((config) => (
                  <TableRow key={config.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      {config.chave}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 300 }}>
                      <Typography variant="body2">{config.descricao}</Typography>
                    </TableCell>
                    <TableCell>{renderValor(config)}</TableCell>
                    <TableCell>
                      <Chip
                        label={config.tipo}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={config.ativo ? 'Sim' : 'Não'}
                        color={config.ativo ? 'success' : 'default'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleAbrirDialogo(config)}
                        title="Editar"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog de Edição */}
      <Dialog open={dialogAberto} onClose={handleFecharDialogo} fullWidth maxWidth="sm">
        <DialogTitle>Editar Configuração</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {configSelecionada && (
            <>
              <TextField
                fullWidth
                label="Chave"
                value={configSelecionada.chave}
                disabled
                margin="normal"
                size="small"
              />

              <TextField
                fullWidth
                label="Descrição"
                value={novaDescricao}
                onChange={(e) => setNovaDescricao(e.target.value)}
                margin="normal"
                multiline
                rows={2}
              />

              {configSelecionada.tipo === 'boolean' ? (
                <FormControlLabel
                  control={
                    <Switch
                      checked={novoValor === 'true'}
                      onChange={(e) => setNovoValor(e.target.checked ? 'true' : 'false')}
                    />
                  }
                  label="Ativado"
                  sx={{ mt: 2 }}
                />
              ) : (
                <TextField
                  fullWidth
                  label="Valor"
                  value={novoValor}
                  onChange={(e) => setNovoValor(e.target.value)}
                  margin="normal"
                  type={configSelecionada.tipo === 'integer' ? 'number' : 'text'}
                  helperText={
                    configSelecionada.chave === 'max_alocacoes_simultaneas_colaborador'
                      ? 'Zero (0) = sem limite'
                      : undefined
                  }
                />
              )}

              <FormControlLabel
                control={
                  <Switch
                    checked={novoAtivo}
                    onChange={(e) => setNovoAtivo(e.target.checked)}
                  />
                }
                label="Ativa"
                sx={{ mt: 1 }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFecharDialogo} startIcon={<CancelIcon />}>
            Cancelar
          </Button>
          <Button
            onClick={handleSalvar}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={salvando}
          >
            {salvando ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ConfiguracoesPage;
