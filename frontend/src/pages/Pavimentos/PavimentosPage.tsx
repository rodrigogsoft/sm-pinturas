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
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from '@mui/material';
import LeftAlignedTablePagination from '../../components/LeftAlignedTablePagination';
import { useClientPagination } from '../../hooks/useClientPagination';
import { usePavimentos } from '../../hooks/usePavimentos';
import obrasService from '../../services/obras.service';
import pavimentosService from '../../services/pavimentos.service';

export const PavimentosPage = () => {
  const [dialogAberto, setDialogAberto] = useState(false);
  const [dialogLoteAberto, setDialogLoteAberto] = useState(false);
  const [pavimentoEditando, setPavimentoEditando] = useState<any | null>(null);
  const [filtroObra, setFiltroObra] = useState('');
  const [obras, setObras] = useState<any[]>([]);
  const [carregandoObras, setCarregandoObras] = useState(false);
  const [pavimentosSelecionados, setPavimentosSelecionados] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    id_obra: '',
    nome: '',
    ordem: 1,
  });

  const [processando, setProcessando] = useState(false);

  const [loteFormData, setLoteFormData] = useState({
    obraId: '',
    qtdPavimentosAcima: 1,
    temTerreo: true,
    temCobertura: false,
    temSubsolo: false,
    qtdSubsolos: 1,
  });

  const temFiltroAplicado = Boolean(filtroObra);

  const { pavimentos, loading, error, carregarPavimentos, criar, atualizar, deletar } =
    usePavimentos(filtroObra, temFiltroAplicado);
  const pavimentosOrdenados = [...pavimentos].sort((a, b) => a.ordem - b.ordem);
  const {
    page,
    rowsPerPage,
    paginatedItems: paginatedPavimentos,
    handlePageChange,
    handleRowsPerPageChange,
    resetPagination,
  } = useClientPagination(pavimentosOrdenados);

  // Carregar obras
  useEffect(() => {
    const carregar = async () => {
      try {
        setCarregandoObras(true);
        const obrasData = await obrasService.listar();
        setObras(obrasData);
      } catch (err) {
        console.error('Erro ao carregar obras:', err);
      } finally {
        setCarregandoObras(false);
      }
    };

    carregar();
  }, []);

  useEffect(() => {
    setPavimentosSelecionados((anteriores) =>
      anteriores.filter((id) => pavimentos.some((pavimento) => String(pavimento.id) === id))
    );
  }, [pavimentos]);

  useEffect(() => {
    resetPagination();
  }, [filtroObra, resetPagination]);

  const handleAbrirDialog = () => {
    setFormData({ id_obra: filtroObra || '', nome: '', ordem: 1 });
    setPavimentoEditando(null);
    setDialogAberto(true);
  };

  const handleAbrirDialogLote = () => {
    setLoteFormData((prev) => ({
      ...prev,
      obraId: filtroObra || prev.obraId || '',
    }));
    setDialogLoteAberto(true);
  };

  const handleEditarPavimento = (pavimento: any) => {
    setFormData({
      id_obra: pavimento.id_obra,
      nome: pavimento.nome || '',
      ordem: pavimento.ordem || 1,
    });
    setPavimentoEditando(pavimento);
    setDialogAberto(true);
  };

  const handleSalvarPavimento = async () => {
    if (!formData.id_obra) {
      alert('Selecione uma obra');
      return;
    }

    if (!formData.nome.trim()) {
      alert('Nome do pavimento é obrigatório');
      return;
    }

    try {
      setProcessando(true);
      if (pavimentoEditando) {
        await atualizar(pavimentoEditando.id, {
          nome: formData.nome,
          ordem: formData.ordem,
        });
      } else {
        await criar({
          id_obra: formData.id_obra,
          nome: formData.nome,
          ordem: formData.ordem,
        });
      }
      setDialogAberto(false);
      setPavimentoEditando(null);
      await carregarPavimentos();
    } catch (err: any) {
      const acao = pavimentoEditando ? 'atualizar' : 'criar';
      alert(`Erro ao ${acao} pavimento: ${err.message}`);
    } finally {
      setProcessando(false);
    }
  };

  const handleDeletarPavimento = async (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar este pavimento e todos os seus ambientes?')) {
      try {
        await deletar(id);
        setPavimentosSelecionados((anteriores) => anteriores.filter((itemId) => itemId !== id));
        await carregarPavimentos();
      } catch (err: any) {
        alert('Erro ao deletar pavimento: ' + err.message);
      }
    }
  };

  const handleSelecionarPavimento = (id: string) => {
    setPavimentosSelecionados((anteriores) =>
      anteriores.includes(id)
        ? anteriores.filter((itemId) => itemId !== id)
        : [...anteriores, id]
    );
  };

  const handleSelecionarTodosPavimentos = () => {
    if (pavimentosSelecionados.length === pavimentos.length) {
      setPavimentosSelecionados([]);
      return;
    }

    setPavimentosSelecionados(pavimentos.map((pavimento) => String(pavimento.id)));
  };

  const handleDeletarSelecionados = async () => {
    if (pavimentosSelecionados.length === 0) {
      return;
    }

    if (!window.confirm(`Tem certeza que deseja deletar ${pavimentosSelecionados.length} pavimento(s) e seus ambientes?`)) {
      return;
    }

    try {
      setProcessando(true);
      const resultados = await Promise.allSettled(
        pavimentosSelecionados.map((id) => deletar(id))
      );
      const falhas = resultados.filter((resultado) => resultado.status === 'rejected').length;
      const sucessos = resultados.length - falhas;

      await carregarPavimentos();
      setPavimentosSelecionados([]);

      if (falhas > 0) {
        alert(`${sucessos} pavimento(s) deletado(s) e ${falhas} falharam.`);
      } else {
        alert(`${sucessos} pavimento(s) deletado(s) com sucesso.`);
      }
    } catch (err: any) {
      alert('Erro ao deletar pavimentos selecionados: ' + err.message);
    } finally {
      setProcessando(false);
    }
  };

  const handleSalvarLote = async () => {
    if (!loteFormData.obraId) {
      alert('Selecione uma obra');
      return;
    }

    if (loteFormData.qtdPavimentosAcima < 1) {
      alert('qtdPavimentosAcima deve ser >= 1');
      return;
    }

    if (loteFormData.temSubsolo && loteFormData.qtdSubsolos < 1) {
      alert('qtdSubsolos deve ser >= 1 quando temSubsolo estiver ativo');
      return;
    }

    try {
      setProcessando(true);
      await pavimentosService.criarLote({
        obraId: loteFormData.obraId,
        qtdPavimentosAcima: loteFormData.qtdPavimentosAcima,
        temTerreo: loteFormData.temSubsolo ? true : loteFormData.temTerreo,
        temCobertura: loteFormData.temCobertura,
        temSubsolo: loteFormData.temSubsolo,
        qtdSubsolos: loteFormData.temSubsolo ? loteFormData.qtdSubsolos : undefined,
      });

      setDialogLoteAberto(false);
      await carregarPavimentos();
      alert('Pavimentos em lote criados com sucesso.');
    } catch (err: any) {
      alert(`Erro ao criar pavimentos em lote: ${err.message}`);
    } finally {
      setProcessando(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          🏢 Pavimentos
        </Typography>
        <Typography color="textSecondary">
          RF02: Parte da Hierarquia de Ativos (Obra &gt; Pavimento &gt; Ambiente)
        </Typography>
      </Box>

      {/* Stats */}
      <Card sx={{ mb: 3, bgcolor: '#e3f2fd' }}>
        <CardContent>
          <Typography>
            <strong>Total de Pavimentos:</strong> {pavimentos.length}
          </Typography>
        </CardContent>
      </Card>

      {/* Filtros e Ações */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 250 }}>
            <InputLabel>Filtrar por Obra</InputLabel>
            <Select
              value={filtroObra}
              label="Filtrar por Obra"
              onChange={(e) => setFiltroObra(e.target.value)}
            >
              <MenuItem value="">Todos os Pavimentos</MenuItem>
              {obras.map((obra) => (
                <MenuItem key={obra.id} value={obra.id}>
                  {obra.nome}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            color="success"
            onClick={handleAbrirDialog}
            disabled={carregandoObras || !filtroObra}
          >
            + Novo Pavimento
          </Button>

          <Button
            variant="contained"
            color="primary"
            onClick={handleAbrirDialogLote}
            disabled={carregandoObras}
          >
            + Cadastro em Lote
          </Button>

          <Button
            variant="outlined"
            color="error"
            onClick={handleDeletarSelecionados}
            disabled={loading || processando || pavimentosSelecionados.length === 0}
          >
            Apagar Selecionados ({pavimentosSelecionados.length})
          </Button>

          {(loading || carregandoObras) && <CircularProgress size={24} />}
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Tabela de Pavimentos */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={pavimentos.length > 0 && pavimentosSelecionados.length === pavimentos.length}
                  indeterminate={
                    pavimentosSelecionados.length > 0 && pavimentosSelecionados.length < pavimentos.length
                  }
                  onChange={handleSelecionarTodosPavimentos}
                  disabled={pavimentos.length === 0}
                />
              </TableCell>
              <TableCell>Ordem</TableCell>
              <TableCell>Nome do Pavimento</TableCell>
              <TableCell>Ambientes</TableCell>
              <TableCell>Criado em</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pavimentos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography color="textSecondary">
                    {temFiltroAplicado
                      ? 'Nenhum pavimento encontrado para o filtro selecionado.'
                      : 'Aplique ao menos um filtro para carregar os pavimentos.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedPavimentos.map((pavimento) => (
                  <TableRow key={pavimento.id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={pavimentosSelecionados.includes(String(pavimento.id))}
                        onChange={() => handleSelecionarPavimento(String(pavimento.id))}
                      />
                    </TableCell>
                    <TableCell>
                      <strong>{pavimento.ordem}</strong>
                    </TableCell>
                    <TableCell>{pavimento.nome}</TableCell>
                    <TableCell>
                      {pavimento.ambientes?.length || 0} ambiente(s)
                    </TableCell>
                    <TableCell>
                      {new Date(pavimento.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        sx={{ mr: 1 }}
                        onClick={() => handleEditarPavimento(pavimento)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleDeletarPavimento(pavimento.id)}
                      >
                        Deletar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
        <LeftAlignedTablePagination
          count={pavimentosOrdenados.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </TableContainer>

      {/* Dialog de Criação/Edição */}
      <Dialog open={dialogAberto} onClose={() => { setDialogAberto(false); setPavimentoEditando(null); }} fullWidth maxWidth="sm">
        <DialogTitle>{pavimentoEditando ? 'Editar Pavimento' : 'Novo Pavimento'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormControl fullWidth margin="normal" disabled={!!filtroObra || !!pavimentoEditando}>
            <InputLabel>Obra</InputLabel>
            <Select
              value={formData.id_obra}
              onChange={(e) => setFormData({ ...formData, id_obra: e.target.value })}
              label="Obra"
            >
              {obras.map((obra) => (
                <MenuItem key={obra.id} value={obra.id}>
                  {obra.nome}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Nome do Pavimento"
            placeholder="Ex: Térreo, 1º Andar, Subsolo"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Ordem"
            type="number"
            value={formData.ordem}
            onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) })}
            margin="normal"
            inputProps={{ min: 0 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDialogAberto(false); setPavimentoEditando(null); }}>Cancelar</Button>
          <Button
            onClick={handleSalvarPavimento}
            variant="contained"
            disabled={processando}
            color="success"
          >
            {processando ? <CircularProgress size={24} /> : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={dialogLoteAberto}
        onClose={() => setDialogLoteAberto(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Cadastro em Lote de Pavimentos</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Obra</InputLabel>
            <Select
              value={loteFormData.obraId}
              onChange={(e) => setLoteFormData({ ...loteFormData, obraId: e.target.value })}
              label="Obra"
            >
              {obras.map((obra) => (
                <MenuItem key={obra.id} value={obra.id}>
                  {obra.nome}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            margin="normal"
            type="number"
            label="Qtd Pavimentos Acima"
            value={loteFormData.qtdPavimentosAcima}
            onChange={(e) =>
              setLoteFormData({
                ...loteFormData,
                qtdPavimentosAcima: Number(e.target.value || 1),
              })
            }
            inputProps={{ min: 1 }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={loteFormData.temSubsolo}
                onChange={(e) =>
                  setLoteFormData({
                    ...loteFormData,
                    temSubsolo: e.target.checked,
                    temTerreo: e.target.checked ? true : loteFormData.temTerreo,
                  })
                }
              />
            }
            label="Tem Subsolo"
          />

          <FormControlLabel
            control={
              <Switch
                checked={loteFormData.temTerreo}
                onChange={(e) =>
                  setLoteFormData({ ...loteFormData, temTerreo: e.target.checked })
                }
                disabled={loteFormData.temSubsolo}
              />
            }
            label={loteFormData.temSubsolo ? 'Tem Térreo (obrigatório com subsolo)' : 'Tem Térreo'}
          />

          <FormControlLabel
            control={
              <Switch
                checked={loteFormData.temCobertura}
                onChange={(e) =>
                  setLoteFormData({ ...loteFormData, temCobertura: e.target.checked })
                }
              />
            }
            label="Tem Cobertura"
          />

          {loteFormData.temSubsolo && (
            <TextField
              fullWidth
              margin="normal"
              type="number"
              label="Qtd Subsolos"
              value={loteFormData.qtdSubsolos}
              onChange={(e) =>
                setLoteFormData({
                  ...loteFormData,
                  qtdSubsolos: Number(e.target.value || 1),
                })
              }
              inputProps={{ min: 1, max: 99 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogLoteAberto(false)}>Cancelar</Button>
          <Button onClick={handleSalvarLote} variant="contained" disabled={processando}>
            {processando ? <CircularProgress size={24} /> : 'Criar em Lote'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PavimentosPage;
