import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Paper,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  ListItemText,
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
} from '@mui/material';
import LeftAlignedTablePagination from '../../components/LeftAlignedTablePagination';
import { useClientPagination } from '../../hooks/useClientPagination';
import { useAmbientes } from '../../hooks/useAmbientes';
import { usePavimentos } from '../../hooks/usePavimentos';
import obrasService from '../../services/obras.service';
import ambientesService from '../../services/ambientes.service';

type TipoComumForm = {
  nomeBase: string;
  qtdPorPavimento: number;
  areaM2: string;
};

// Helper: extrai o sufixo de um nome de pavimento para comparação
// Ex: "1º Andar" → " Andar", "Térreo" → "Térreo"
const extrairSufixoPavimento = (nome: string): string => {
  const match = nome.match(/º\s+(.+)/);
  return match ? match[1] : nome;
};

// Helper: encontra pavimentos similares (mesmo sufixo)
const encontrarPavimentosSimilares = (pavimentos: any[], pavimentoSelecionado: any): string[] => {
  if (!pavimentoSelecionado) return [];
  const sufixo = extrairSufixoPavimento(pavimentoSelecionado.nome);
  return pavimentos
    .filter((p) => extrairSufixoPavimento(p.nome) === sufixo)
    .map((p) => p.id);
};

export const AmbientesPage = () => {
  const [dialogAberto, setDialogAberto] = useState(false);
  const [dialogLoteAberto, setDialogLoteAberto] = useState(false);
  const [ambienteEditando, setAmbienteEditando] = useState<any | null>(null);
  const [filtroObra, setFiltroObra] = useState('');
  const [filtroPavimento, setFiltroPavimento] = useState('');
  
  const [obras, setObras] = useState<any[]>([]);
  const [carregandoObras, setCarregandoObras] = useState(false);
  const [ambientesSelecionados, setAmbientesSelecionados] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    id_pavimento: '',
    nome: '',
    area_m2: '',
    descricao: '',
  });

  const [processando, setProcessando] = useState(false);

  const [lotePavimentoIds, setLotePavimentoIds] = useState<string[]>([]);
  const [loteModoConflito, setLoteModoConflito] = useState<'FAIL' | 'SKIP'>('SKIP');
  const [loteGerarApartamento, setLoteGerarApartamento] = useState(true);
  const [loteAptoQtd, setLoteAptoQtd] = useState(4);
  const [loteAptoArea, setLoteAptoArea] = useState('65');
  const [tiposComuns, setTiposComuns] = useState<TipoComumForm[]>([
    { nomeBase: 'Hall', qtdPorPavimento: 1, areaM2: '18' },
  ]);

  const temFiltroAplicado = Boolean(filtroObra || filtroPavimento);

  const { pavimentos } = usePavimentos(filtroObra, Boolean(filtroObra));
  const { ambientes, loading, error, carregarAmbientes, criar, atualizar, deletar} =
    useAmbientes(
      filtroPavimento,
      filtroPavimento ? undefined : filtroObra,
      temFiltroAplicado,
    );
  const {
    page,
    rowsPerPage,
    paginatedItems: paginatedAmbientes,
    handlePageChange,
    handleRowsPerPageChange,
    resetPagination,
  } = useClientPagination(ambientes);

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
    setAmbientesSelecionados((anteriores) =>
      anteriores.filter((id) => ambientes.some((ambiente) => String(ambiente.id) === id))
    );
  }, [ambientes]);

  useEffect(() => {
    resetPagination();
  }, [filtroObra, filtroPavimento, resetPagination]);

  const handleAbrirDialog = () => {
    setFormData({
      id_pavimento: filtroPavimento || '',
      nome: '',
      area_m2: '',
      descricao: '',
    });
    setAmbienteEditando(null);
    setDialogAberto(true);
  };

  const handleAbrirDialogLote = () => {
    if (!filtroObra) {
      alert('Selecione uma obra para criar ambientes em lote.');
      return;
    }
    setLotePavimentoIds([]);
    setLoteModoConflito('SKIP');
    setDialogLoteAberto(true);
  };

  const handleEditarAmbiente = (ambiente: any) => {
    setFormData({
      id_pavimento: ambiente.id_pavimento,
      nome: ambiente.nome || '',
      area_m2: ambiente.area_m2?.toString() || '',
      descricao: ambiente.descricao || '',
    });
    setAmbienteEditando(ambiente);
    setDialogAberto(true);
  };

  const handleSalvarAmbiente = async () => {
    if (!formData.id_pavimento) {
      alert('Selecione um pavimento');
      return;
    }

    if (!formData.nome.trim()) {
      alert('Nome do ambiente é obrigatório');
      return;
    }

    try {
      setProcessando(true);
      if (ambienteEditando) {
        await atualizar(ambienteEditando.id, {
          nome: formData.nome,
          area_m2: formData.area_m2 ? parseFloat(formData.area_m2) : undefined,
          descricao: formData.descricao || undefined,
        });
      } else {
        await criar({
          id_pavimento: formData.id_pavimento,
          nome: formData.nome,
          area_m2: formData.area_m2 ? parseFloat(formData.area_m2) : undefined,
          descricao: formData.descricao || undefined,
        });
      }
      setDialogAberto(false);
      setAmbienteEditando(null);
      await carregarAmbientes();
    } catch (err: any) {
      const acao = ambienteEditando ? 'atualizar' : 'criar';
      alert(`Erro ao ${acao} ambiente: ${err.message}`);
    } finally {
      setProcessando(false);
    }
  };

  const handleDeletarAmbiente = async (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar este ambiente?')) {
      try {
        await deletar(id);
        setAmbientesSelecionados((anteriores) => anteriores.filter((itemId) => itemId !== id));
        await carregarAmbientes();
      } catch (err: any) {
        alert('Erro ao deletar ambiente: ' + err.message);
      }
    }
  };

  const handleSelecionarAmbiente = (id: string) => {
    setAmbientesSelecionados((anteriores) =>
      anteriores.includes(id)
        ? anteriores.filter((itemId) => itemId !== id)
        : [...anteriores, id]
    );
  };

  const handleSelecionarTodosAmbientes = () => {
    if (ambientesSelecionados.length === ambientes.length) {
      setAmbientesSelecionados([]);
      return;
    }

    setAmbientesSelecionados(ambientes.map((ambiente) => String(ambiente.id)));
  };

  const handleDeletarSelecionados = async () => {
    if (ambientesSelecionados.length === 0) {
      return;
    }

    if (!window.confirm(`Tem certeza que deseja deletar ${ambientesSelecionados.length} ambiente(s)?`)) {
      return;
    }

    try {
      setProcessando(true);
      const resultados = await Promise.allSettled(
        ambientesSelecionados.map((id) => deletar(id))
      );
      const falhas = resultados.filter((resultado) => resultado.status === 'rejected').length;
      const sucessos = resultados.length - falhas;

      await carregarAmbientes();
      setAmbientesSelecionados([]);

      if (falhas > 0) {
        alert(`${sucessos} ambiente(s) deletado(s) e ${falhas} falharam.`);
      } else {
        alert(`${sucessos} ambiente(s) deletado(s) com sucesso.`);
      }
    } catch (err: any) {
      alert('Erro ao deletar ambientes selecionados: ' + err.message);
    } finally {
      setProcessando(false);
    }
  };

  const handleAdicionarTipoComum = () => {
    setTiposComuns([
      ...tiposComuns,
      { nomeBase: '', qtdPorPavimento: 1, areaM2: '' },
    ]);
  };

  const handleRemoverTipoComum = (index: number) => {
    setTiposComuns(tiposComuns.filter((_, idx) => idx !== index));
  };

  const handleAlterarTipoComum = (
    index: number,
    field: keyof TipoComumForm,
    value: string | number,
  ) => {
    const next = [...tiposComuns];
    next[index] = { ...next[index], [field]: value };
    setTiposComuns(next);
  };

  const handleSelecionarTodosPavimentos = () => {
    if (lotePavimentoIds.length === pavimentos.length) {
      setLotePavimentoIds([]);
    } else {
      setLotePavimentoIds(pavimentos.map((p) => p.id));
    }
  };

  const handleSelecionarPavimentosSimilares = () => {
    if (lotePavimentoIds.length === 0) {
      alert('Selecione um pavimento primeiro para obter os similares.');
      return;
    }

    // Pega o primeiro pavimento selecionado como referência
    const pavimentoReferencia = pavimentos.find((p) => lotePavimentoIds.includes(p.id));
    if (!pavimentoReferencia) return;

    // Encontra os pavimentos com mesmo sufixo
    const similares = encontrarPavimentosSimilares(pavimentos, pavimentoReferencia);
    setLotePavimentoIds(similares);
  };

  const handleSalvarLote = async () => {
    if (!filtroObra) {
      alert('Selecione uma obra.');
      return;
    }
    if (lotePavimentoIds.length === 0) {
      alert('Selecione ao menos um pavimento.');
      return;
    }

    const tipos: Array<{
      categoria: 'APARTAMENTO' | 'COMUM';
      nomeBase?: string;
      areaM2: number;
      qtdPorPavimento: number;
    }> = [];

    if (loteGerarApartamento) {
      const areaApto = Number(loteAptoArea);
      if (!Number.isFinite(areaApto) || areaApto <= 0) {
        alert('Área de apartamento deve ser maior que zero.');
        return;
      }
      if (loteAptoQtd < 1 || loteAptoQtd > 99) {
        alert('Quantidade de apartamentos por pavimento deve estar entre 1 e 99.');
        return;
      }
      tipos.push({
        categoria: 'APARTAMENTO',
        areaM2: areaApto,
        qtdPorPavimento: loteAptoQtd,
      });
    }

    for (const comum of tiposComuns) {
      if (!comum.nomeBase.trim()) {
        alert('Nome base é obrigatório para tipo comum.');
        return;
      }
      const area = Number(comum.areaM2);
      if (!Number.isFinite(area) || area <= 0) {
        alert(`Área inválida para o tipo comum "${comum.nomeBase}".`);
        return;
      }
      if (comum.qtdPorPavimento < 1 || comum.qtdPorPavimento > 99) {
        alert(`Quantidade inválida para o tipo comum "${comum.nomeBase}".`);
        return;
      }
      tipos.push({
        categoria: 'COMUM',
        nomeBase: comum.nomeBase.trim(),
        areaM2: area,
        qtdPorPavimento: comum.qtdPorPavimento,
      });
    }

    if (tipos.length === 0) {
      alert('Configure ao menos um tipo de ambiente para o lote.');
      return;
    }

    try {
      setProcessando(true);
      const resultado = await ambientesService.criarLote({
        obraId: filtroObra,
        pavimentoIds: lotePavimentoIds,
        tipos,
        modoConflito: loteModoConflito,
      });
      await carregarAmbientes();
      setDialogLoteAberto(false);
      alert(
        `Lote concluído: ${resultado.criados} criados, ${resultado.pulados} pulados.`
      );
    } catch (err: any) {
      alert(`Erro ao criar ambientes em lote: ${err.message}`);
    } finally {
      setProcessando(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          🏛️ Ambientes
        </Typography>
        <Typography color="textSecondary">
          RF02: Último nível da Hierarquia de Ativos (Obra &gt; Pavimento &gt; Ambiente)
        </Typography>
      </Box>

      {/* Stats */}
      <Card sx={{ mb: 3, bgcolor: '#f3e5f5' }}>
        <CardContent>
          <Typography>
            <strong>Total de Ambientes:</strong> {ambientes.length}
          </Typography>
        </CardContent>
      </Card>

      {/* Filtros e Ações */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Obra</InputLabel>
            <Select
              value={filtroObra}
              label="Obra"
              onChange={(e) => {
                setFiltroObra(e.target.value);
                setFiltroPavimento('');
              }}
            >
              <MenuItem value="">Selecione uma obra</MenuItem>
              {obras.map((obra) => (
                <MenuItem key={obra.id} value={obra.id}>
                  {obra.nome}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Pavimento</InputLabel>
            <Select
              value={filtroPavimento}
              label="Pavimento"
              onChange={(e) => setFiltroPavimento(e.target.value)}
            >
              <MenuItem value="">Todos os Ambientes</MenuItem>
              {pavimentos.map((pav) => (
                <MenuItem key={pav.id} value={pav.id}>
                  {pav.nome}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            color="success"
            onClick={handleAbrirDialog}
            disabled={carregandoObras || !filtroPavimento}
          >
            + Novo Ambiente
          </Button>

          <Button
            variant="contained"
            onClick={handleAbrirDialogLote}
            disabled={carregandoObras}
          >
            + Cadastro em Lote
          </Button>

          <Button
            variant="outlined"
            color="error"
            onClick={handleDeletarSelecionados}
            disabled={loading || processando || ambientesSelecionados.length === 0}
          >
            Apagar Selecionados ({ambientesSelecionados.length})
          </Button>

          {(loading || carregandoObras) && <CircularProgress size={24} />}
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Tabela de Ambientes */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={ambientes.length > 0 && ambientesSelecionados.length === ambientes.length}
                  indeterminate={
                    ambientesSelecionados.length > 0 && ambientesSelecionados.length < ambientes.length
                  }
                  onChange={handleSelecionarTodosAmbientes}
                  disabled={ambientes.length === 0}
                />
              </TableCell>
              <TableCell>Nome do Ambiente</TableCell>
              <TableCell align="right">Área (m²)</TableCell>
              <TableCell>Descrição</TableCell>
              <TableCell>Criado em</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ambientes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography color="textSecondary">
                    {temFiltroAplicado
                      ? 'Nenhum ambiente encontrado para o filtro selecionado.'
                      : 'Aplique ao menos um filtro para carregar os ambientes.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedAmbientes.map((ambiente) => (
                <TableRow key={ambiente.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={ambientesSelecionados.includes(String(ambiente.id))}
                      onChange={() => handleSelecionarAmbiente(String(ambiente.id))}
                    />
                  </TableCell>
                  <TableCell>
                    <strong>{ambiente.nome}</strong>
                  </TableCell>
                  <TableCell align="right">
                    {ambiente.area_m2 ? Number(ambiente.area_m2).toFixed(2) : '—'}
                  </TableCell>
                  <TableCell>
                    {ambiente.descricao || '—'}
                  </TableCell>
                  <TableCell>
                    {new Date(ambiente.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{ mr: 1 }}
                      onClick={() => handleEditarAmbiente(ambiente)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => handleDeletarAmbiente(ambiente.id)}
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
          count={ambientes.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </TableContainer>

      {/* Dialog de Criação/Edição */}
      <Dialog open={dialogAberto} onClose={() => { setDialogAberto(false); setAmbienteEditando(null); }} fullWidth maxWidth="sm">
        <DialogTitle>{ambienteEditando ? 'Editar Ambiente' : 'Novo Ambiente'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormControl fullWidth margin="normal" disabled={!!filtroPavimento || !!ambienteEditando}>
            <InputLabel>Pavimento</InputLabel>
            <Select
              value={formData.id_pavimento}
              onChange={(e) => setFormData({ ...formData, id_pavimento: e.target.value })}
              label="Pavimento"
            >
              {pavimentos.map((pav) => (
                <MenuItem key={pav.id} value={pav.id}>
                  {pav.nome}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Nome do Ambiente"
            placeholder="Ex: Sala de estar, Cozinha, Quarto"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Área (m²)"
            type="number"
            inputProps={{ step: '0.01' }}
            value={formData.area_m2}
            onChange={(e) => setFormData({ ...formData, area_m2: e.target.value })}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Descrição (opcional)"
            multiline
            rows={2}
            value={formData.descricao}
            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDialogAberto(false); setAmbienteEditando(null); }}>Cancelar</Button>
          <Button
            onClick={handleSalvarAmbiente}
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
        maxWidth="md"
      >
        <DialogTitle>Cadastro em Lote de Ambientes</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Pavimentos</InputLabel>
            <Select
              multiple
              value={lotePavimentoIds}
              label="Pavimentos"
              onChange={(e) => setLotePavimentoIds(e.target.value as string[])}
              renderValue={(selected) =>
                pavimentos
                  .filter((p) => (selected as string[]).includes(p.id))
                  .map((p) => p.nome)
                  .join(', ')
              }
            >
              {pavimentos.map((pav) => (
                <MenuItem key={pav.id} value={pav.id}>
                  <Checkbox checked={lotePavimentoIds.includes(pav.id)} />
                  <ListItemText primary={pav.nome} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={handleSelecionarTodosPavimentos}
              sx={{ flex: 1 }}
            >
              {lotePavimentoIds.length === pavimentos.length ? 'Desselecionar Todos' : 'Selecionar Todos'}
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={handleSelecionarPavimentosSimilares}
              disabled={lotePavimentoIds.length === 0}
              sx={{ flex: 1 }}
            >
              Selecionar Similares
            </Button>
          </Box>

          <FormControl fullWidth margin="normal">
            <InputLabel>Modo de Conflito</InputLabel>
            <Select
              value={loteModoConflito}
              label="Modo de Conflito"
              onChange={(e) => setLoteModoConflito(e.target.value as 'FAIL' | 'SKIP')}
            >
              <MenuItem value="SKIP">SKIP (idempotente)</MenuItem>
              <MenuItem value="FAIL">FAIL (bloquear em conflito)</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ mt: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={loteGerarApartamento}
                  onChange={(e) => setLoteGerarApartamento(e.target.checked)}
                />
              }
              label="Gerar apartamentos"
            />

            {loteGerarApartamento && (
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Qtd aptos por pavimento"
                  value={loteAptoQtd}
                  onChange={(e) => setLoteAptoQtd(Number(e.target.value || 1))}
                  inputProps={{ min: 1, max: 99 }}
                />
                <TextField
                  fullWidth
                  type="number"
                  label="Área apto (m²)"
                  value={loteAptoArea}
                  onChange={(e) => setLoteAptoArea(e.target.value)}
                  inputProps={{ min: 0.01, step: 0.01 }}
                />
              </Box>
            )}
          </Box>

          <Box sx={{ mt: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Tipos Comuns
            </Typography>

            {tiposComuns.map((tipo, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                <TextField
                  label="Nome base"
                  value={tipo.nomeBase}
                  onChange={(e) => handleAlterarTipoComum(index, 'nomeBase', e.target.value)}
                  sx={{ flex: 2 }}
                />
                <TextField
                  label="Qtd"
                  type="number"
                  value={tipo.qtdPorPavimento}
                  onChange={(e) =>
                    handleAlterarTipoComum(
                      index,
                      'qtdPorPavimento',
                      Number(e.target.value || 1),
                    )
                  }
                  inputProps={{ min: 1, max: 99 }}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Área (m²)"
                  type="number"
                  value={tipo.areaM2}
                  onChange={(e) => handleAlterarTipoComum(index, 'areaM2', e.target.value)}
                  inputProps={{ min: 0.01, step: 0.01 }}
                  sx={{ flex: 1 }}
                />
                <Button
                  color="error"
                  onClick={() => handleRemoverTipoComum(index)}
                  disabled={tiposComuns.length === 1}
                >
                  Remover
                </Button>
              </Box>
            ))}

            <Button variant="outlined" onClick={handleAdicionarTipoComum}>
              + Tipo Comum
            </Button>
          </Box>
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

export default AmbientesPage;
