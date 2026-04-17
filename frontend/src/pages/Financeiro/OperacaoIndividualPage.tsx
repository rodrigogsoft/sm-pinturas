import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import LeftAlignedTablePagination from '../../components/LeftAlignedTablePagination';
import { useClientPagination } from '../../hooks/useClientPagination';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/Toast/ToastProvider';
import obrasService, { Obra } from '../../services/obras.service';
import pavimentosService, { Pavimento } from '../../services/pavimentos.service';
import ambientesService, { Ambiente } from '../../services/ambientes.service';
import itensAmbienteService, { ItemAmbiente } from '../../services/itens-ambiente.service';
import sessoesService, { Sessao } from '../../services/sessoes.service';
import alocacoesItensService, {
  AlocacaoItem,
  CreateAlocacaoItemDto,
} from '../../services/alocacoes-itens.service';
import medicoesColaboradorService, {
  CreateMedicaoColaboradorDto,
  MedicaoColaborador,
} from '../../services/medicoes-colaborador.service';
import { colaboradoresAPI } from '../../services/api';

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const getItemLabel = (item?: ItemAmbiente | null) => {
  if (!item) return '-';
  const nomeServico = item.tabelaPreco?.servico?.nome || `Item ${item.id.slice(0, 8)}`;
  return `${nomeServico} • ${toNumber(item.area_planejada).toFixed(2)} m²`;
};

export const OperacaoIndividualPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [obras, setObras] = useState<Obra[]>([]);
  const [pavimentos, setPavimentos] = useState<Pavimento[]>([]);
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [itens, setItens] = useState<ItemAmbiente[]>([]);
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [alocacoes, setAlocacoes] = useState<AlocacaoItem[]>([]);
  const [medicoes, setMedicoes] = useState<MedicaoColaborador[]>([]);

  const [openAlocacao, setOpenAlocacao] = useState(false);
  const [openMedicao, setOpenMedicao] = useState(false);
  const [saving, setSaving] = useState(false);

  const [alocacaoForm, setAlocacaoForm] = useState({
    id_sessao: '',
    id_colaborador: '',
    id_pavimento: '',
    id_ambiente: '',
    id_item_ambiente: '',
    observacoes: '',
  });

  const [medicaoForm, setMedicaoForm] = useState({
    id_alocacao_item: '',
    qtd_executada: 0,
    data_medicao: new Date().toISOString().split('T')[0],
    justificativa: '',
    foto_evidencia_url: '',
  });

  const carregar = async () => {
    try {
      setLoading(true);
      setError('');

      const [
        obrasData,
        pavimentosData,
        ambientesData,
        itensData,
        sessoesData,
        colaboradoresResp,
        alocacoesResp,
        medicoesResp,
      ] = await Promise.all([
        obrasService.listar(),
        pavimentosService.listar(),
        ambientesService.listar(),
        itensAmbienteService.listar(),
        sessoesService.listar({ status: 'ABERTA' }),
        colaboradoresAPI.getAll(),
        alocacoesItensService.listar(),
        medicoesColaboradorService.listar(),
      ]);

      setObras(obrasData || []);
      setPavimentos(pavimentosData || []);
      setAmbientes(ambientesData || []);
      setItens(itensData || []);
      setSessoes(sessoesData || []);
      setColaboradores(colaboradoresResp.data || []);
      setAlocacoes(alocacoesResp.data || []);
      setMedicoes(medicoesResp.data || []);
    } catch (err: any) {
      const errorMsg = err?.message || 'Erro ao carregar operação individual.';
      setError(errorMsg);
      showToast({ message: errorMsg, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const obrasMap = useMemo(() => new Map(obras.map((obra) => [obra.id, obra])), [obras]);
  const ambientesMap = useMemo(
    () => new Map(ambientes.map((ambiente) => [ambiente.id, ambiente])),
    [ambientes],
  );
  const itensMap = useMemo(() => new Map(itens.map((item) => [item.id, item])), [itens]);

  const sessaoSelecionada = useMemo(
    () => sessoes.find((sessao) => sessao.id === alocacaoForm.id_sessao) || null,
    [sessoes, alocacaoForm.id_sessao],
  );

  const obraSessao = sessaoSelecionada ? obrasMap.get(sessaoSelecionada.id_obra) : null;

  const pavimentosDisponiveis = useMemo(
    () => pavimentos.filter((pavimento) => pavimento.id_obra === sessaoSelecionada?.id_obra),
    [pavimentos, sessaoSelecionada],
  );

  const ambientesDisponiveis = useMemo(
    () => ambientes.filter((ambiente) => ambiente.id_pavimento === alocacaoForm.id_pavimento),
    [ambientes, alocacaoForm.id_pavimento],
  );

  const itensDisponiveis = useMemo(
    () => itens.filter((item) => item.id_ambiente === alocacaoForm.id_ambiente),
    [itens, alocacaoForm.id_ambiente],
  );

  const alocacoesAtivas = useMemo(
    () => alocacoes.filter((alocacao) => alocacao.status === 'EM_ANDAMENTO'),
    [alocacoes],
  );
  const {
    page: alocacoesPage,
    rowsPerPage: alocacoesRowsPerPage,
    paginatedItems: paginatedAlocacoesAtivas,
    handlePageChange: handleAlocacoesPageChange,
    handleRowsPerPageChange: handleAlocacoesRowsPerPageChange,
  } = useClientPagination(alocacoesAtivas);

  const {
    page: medicoesPage,
    rowsPerPage: medicoesRowsPerPage,
    paginatedItems: paginatedMedicoes,
    handlePageChange: handleMedicoesPageChange,
    handleRowsPerPageChange: handleMedicoesRowsPerPageChange,
  } = useClientPagination(medicoes);

  const colaboradoresOcupados = useMemo(
    () => new Set(alocacoesAtivas.map((alocacao) => alocacao.id_colaborador)),
    [alocacoesAtivas],
  );

  const colaboradoresDisponiveis = useMemo(
    () =>
      colaboradores.filter(
        (colaborador) =>
          !colaboradoresOcupados.has(colaborador.id) && (colaborador.ativo ?? true) && !(colaborador.deletado ?? false),
      ),
    [colaboradores, colaboradoresOcupados],
  );

  const medicaoSelecionada = useMemo(
    () => alocacoesAtivas.find((alocacao) => alocacao.id === medicaoForm.id_alocacao_item) || null,
    [alocacoesAtivas, medicaoForm.id_alocacao_item],
  );

  const itemMedicaoSelecionado = medicaoSelecionada
    ? itensMap.get(medicaoSelecionada.id_item_ambiente)
    : null;

  const totais = useMemo(() => {
    const totalQtdExecutada = medicoes.reduce(
      (sum, medicao) => sum + toNumber(medicao.qtd_executada),
      0,
    );
    const totalValor = medicoes.reduce((sum, medicao) => {
      const precoVenda = toNumber(medicao.item_ambiente?.tabelaPreco?.preco_venda);
      return sum + toNumber(medicao.qtd_executada) * precoVenda;
    }, 0);

    return {
      sessoes_abertas: sessoes.length,
      alocacoes_ativas: alocacoesAtivas.length,
      medicoes_individuais: medicoes.length,
      qtd_executada: totalQtdExecutada,
      valor_estimado: totalValor,
    };
  }, [sessoes, alocacoesAtivas, medicoes]);

  const resetAlocacaoForm = () => {
    setAlocacaoForm({
      id_sessao: '',
      id_colaborador: '',
      id_pavimento: '',
      id_ambiente: '',
      id_item_ambiente: '',
      observacoes: '',
    });
  };

  const resetMedicaoForm = () => {
    setMedicaoForm({
      id_alocacao_item: '',
      qtd_executada: 0,
      data_medicao: new Date().toISOString().split('T')[0],
      justificativa: '',
      foto_evidencia_url: '',
    });
  };

  const handleCriarAlocacao = async () => {
    if (
      !alocacaoForm.id_sessao ||
      !alocacaoForm.id_colaborador ||
      !alocacaoForm.id_ambiente ||
      !alocacaoForm.id_item_ambiente
    ) {
      showToast({ message: 'Preencha sessão, colaborador, ambiente e item.', severity: 'warning' });
      return;
    }

    try {
      setSaving(true);
      const payload: CreateAlocacaoItemDto = {
        id_sessao: alocacaoForm.id_sessao,
        id_colaborador: alocacaoForm.id_colaborador,
        id_ambiente: alocacaoForm.id_ambiente,
        id_item_ambiente: alocacaoForm.id_item_ambiente,
        observacoes: alocacaoForm.observacoes || undefined,
      };

      await alocacoesItensService.criar(payload);
      showToast({ message: 'Alocação por item criada com sucesso.', severity: 'success' });
      setOpenAlocacao(false);
      resetAlocacaoForm();
      await carregar();
    } catch (err: any) {
      const errorMsg = err?.message || 'Erro ao criar alocação por item.';
      setError(errorMsg);
      showToast({ message: errorMsg, severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleConcluirAlocacao = async (alocacao: AlocacaoItem) => {
    try {
      await alocacoesItensService.concluir(alocacao.id, { observacoes: 'Concluída pelo painel web 4.1' });
      showToast({ message: 'Alocação concluída com sucesso.', severity: 'success' });
      await carregar();
    } catch (err: any) {
      const errorMsg = err?.message || 'Erro ao concluir alocação.';
      setError(errorMsg);
      showToast({ message: errorMsg, severity: 'error' });
    }
  };

  const handleCriarMedicao = async () => {
    if (!medicaoSelecionada) {
      showToast({ message: 'Selecione uma alocação em andamento.', severity: 'warning' });
      return;
    }

    const areaPlanejada = toNumber(itemMedicaoSelecionado?.area_planejada);
    const excedente = areaPlanejada > 0 && toNumber(medicaoForm.qtd_executada) > areaPlanejada;

    if (toNumber(medicaoForm.qtd_executada) <= 0) {
      showToast({ message: 'Informe uma quantidade executada maior que zero.', severity: 'warning' });
      return;
    }

    if (excedente && (!medicaoForm.justificativa || !medicaoForm.foto_evidencia_url)) {
      showToast({
        message: 'Excedente exige justificativa e URL da foto de evidência.',
        severity: 'warning',
      });
      return;
    }

    try {
      setSaving(true);
      const percentualConclusao = areaPlanejada > 0
        ? Number(((toNumber(medicaoForm.qtd_executada) / areaPlanejada) * 100).toFixed(2))
        : undefined;

      const payload: CreateMedicaoColaboradorDto = {
        id_alocacao_item: medicaoSelecionada.id,
        id_colaborador: medicaoSelecionada.id_colaborador,
        id_item_ambiente: medicaoSelecionada.id_item_ambiente,
        qtd_executada: toNumber(medicaoForm.qtd_executada),
        area_planejada: areaPlanejada || undefined,
        percentual_conclusao_item: percentualConclusao,
        justificativa: medicaoForm.justificativa || undefined,
        foto_evidencia_url: medicaoForm.foto_evidencia_url || undefined,
        data_medicao: medicaoForm.data_medicao,
      };

      await medicoesColaboradorService.criar(payload);
      showToast({ message: 'Medição individual registrada com sucesso.', severity: 'success' });
      setOpenMedicao(false);
      resetMedicaoForm();
      await carregar();
    } catch (err: any) {
      const errorMsg = err?.message || 'Erro ao registrar medição individual.';
      setError(errorMsg);
      showToast({ message: errorMsg, severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/financeiro')}>
            Voltar
          </Button>
          <Typography variant="h4">Operação Individual 4.1</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setOpenMedicao(true)}>
            Nova Medição
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenAlocacao(true)}>
            Nova Alocação
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">Sessões Abertas</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{totais.sessoes_abertas}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">Alocações Ativas</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{totais.alocacoes_ativas}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">Medições Individuais</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{totais.medicoes_individuais}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">Qtd. Executada</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{totais.qtd_executada.toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">Valor Estimado</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{formatCurrency(totais.valor_estimado)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">RF11 • Alocações por Item</Typography>
              <Button size="small" startIcon={<AddIcon />} onClick={() => setOpenAlocacao(true)}>
                Adicionar
              </Button>
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Colaborador</TableCell>
                  <TableCell>Obra / Ambiente</TableCell>
                  <TableCell>Item</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedAlocacoesAtivas.map((alocacao) => {
                  const sessao = sessoes.find((item) => item.id === alocacao.id_sessao) || alocacao.sessao;
                  const obra = sessao?.id_obra ? obrasMap.get(sessao.id_obra) : undefined;
                  const ambiente = ambientesMap.get(alocacao.id_ambiente) || alocacao.ambiente;
                  const item = itensMap.get(alocacao.id_item_ambiente) || (alocacao.item_ambiente as ItemAmbiente | undefined);
                  return (
                    <TableRow key={alocacao.id} hover>
                      <TableCell>{alocacao.colaborador?.nome_completo || alocacao.id_colaborador}</TableCell>
                      <TableCell>{`${obra?.nome || 'Obra'} / ${ambiente?.nome || 'Ambiente'}`}</TableCell>
                      <TableCell>{getItemLabel(item || undefined)}</TableCell>
                      <TableCell>{alocacao.status}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<DoneAllIcon />}
                          onClick={() => handleConcluirAlocacao(alocacao)}
                        >
                          Concluir
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {alocacoesAtivas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">Nenhuma alocação ativa.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <LeftAlignedTablePagination
              count={alocacoesAtivas.length}
              page={alocacoesPage}
              rowsPerPage={alocacoesRowsPerPage}
              onPageChange={handleAlocacoesPageChange}
              onRowsPerPageChange={handleAlocacoesRowsPerPageChange}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">RF12 • Medições Individuais</Typography>
              <Button size="small" startIcon={<AddIcon />} onClick={() => setOpenMedicao(true)}>
                Registrar
              </Button>
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Data</TableCell>
                  <TableCell>Colaborador</TableCell>
                  <TableCell>Item</TableCell>
                  <TableCell align="right">Qtd.</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedMedicoes.map((medicao) => {
                  const item = itensMap.get(medicao.id_item_ambiente) || (medicao.item_ambiente as ItemAmbiente | undefined);
                  return (
                    <TableRow key={medicao.id} hover>
                      <TableCell>{new Date(medicao.data_medicao).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>{medicao.colaborador?.nome_completo || medicao.id_colaborador}</TableCell>
                      <TableCell>{getItemLabel(item || undefined)}</TableCell>
                      <TableCell align="right">{toNumber(medicao.qtd_executada).toFixed(2)}</TableCell>
                      <TableCell>{medicao.status_pagamento}</TableCell>
                    </TableRow>
                  );
                })}
                {medicoes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">Nenhuma medição individual registrada.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <LeftAlignedTablePagination
              count={medicoes.length}
              page={medicoesPage}
              rowsPerPage={medicoesRowsPerPage}
              onPageChange={handleMedicoesPageChange}
              onRowsPerPageChange={handleMedicoesRowsPerPageChange}
            />
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={openAlocacao} onClose={() => setOpenAlocacao(false)} fullWidth maxWidth="sm">
        <DialogTitle>Nova Alocação por Item</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            select
            margin="normal"
            label="Sessão aberta"
            value={alocacaoForm.id_sessao}
            onChange={(e) =>
              setAlocacaoForm((prev) => ({
                ...prev,
                id_sessao: e.target.value,
                id_pavimento: '',
                id_ambiente: '',
                id_item_ambiente: '',
              }))
            }
          >
            {sessoes.map((sessao) => (
              <MenuItem key={sessao.id} value={sessao.id}>
                {`${obrasMap.get(sessao.id_obra)?.nome || 'Obra'} • ${new Date(sessao.data_sessao).toLocaleDateString('pt-BR')}`}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            margin="normal"
            label="Obra da sessão"
            value={obraSessao?.nome || ''}
            disabled
          />

          <TextField
            fullWidth
            select
            margin="normal"
            label="Colaborador disponível"
            value={alocacaoForm.id_colaborador}
            onChange={(e) => setAlocacaoForm((prev) => ({ ...prev, id_colaborador: e.target.value }))}
          >
            {colaboradoresDisponiveis.map((colaborador) => (
              <MenuItem key={colaborador.id} value={colaborador.id}>
                {colaborador.nome_completo}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            select
            margin="normal"
            label="Pavimento"
            value={alocacaoForm.id_pavimento}
            onChange={(e) =>
              setAlocacaoForm((prev) => ({
                ...prev,
                id_pavimento: e.target.value,
                id_ambiente: '',
                id_item_ambiente: '',
              }))
            }
          >
            {pavimentosDisponiveis.map((pavimento) => (
              <MenuItem key={pavimento.id} value={pavimento.id}>
                {pavimento.nome}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            select
            margin="normal"
            label="Ambiente"
            value={alocacaoForm.id_ambiente}
            onChange={(e) =>
              setAlocacaoForm((prev) => ({
                ...prev,
                id_ambiente: e.target.value,
                id_item_ambiente: '',
              }))
            }
          >
            {ambientesDisponiveis.map((ambiente) => (
              <MenuItem key={ambiente.id} value={ambiente.id}>
                {ambiente.nome}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            select
            margin="normal"
            label="Item de ambiente"
            value={alocacaoForm.id_item_ambiente}
            onChange={(e) => setAlocacaoForm((prev) => ({ ...prev, id_item_ambiente: e.target.value }))}
          >
            {itensDisponiveis.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {getItemLabel(item)}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            margin="normal"
            label="Observações"
            multiline
            rows={3}
            value={alocacaoForm.observacoes}
            onChange={(e) => setAlocacaoForm((prev) => ({ ...prev, observacoes: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAlocacao(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCriarAlocacao} disabled={saving}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openMedicao} onClose={() => setOpenMedicao(false)} fullWidth maxWidth="sm">
        <DialogTitle>Nova Medição Individual</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            select
            margin="normal"
            label="Alocação por item"
            value={medicaoForm.id_alocacao_item}
            onChange={(e) => setMedicaoForm((prev) => ({ ...prev, id_alocacao_item: e.target.value }))}
          >
            {alocacoesAtivas.map((alocacao) => {
              const colaborador = alocacao.colaborador?.nome_completo || alocacao.id_colaborador;
              const item = itensMap.get(alocacao.id_item_ambiente) || (alocacao.item_ambiente as ItemAmbiente | undefined);
              return (
                <MenuItem key={alocacao.id} value={alocacao.id}>
                  {`${colaborador} • ${getItemLabel(item || undefined)}`}
                </MenuItem>
              );
            })}
          </TextField>

          <TextField
            fullWidth
            margin="normal"
            label="Área planejada do item"
            value={itemMedicaoSelecionado ? `${toNumber(itemMedicaoSelecionado.area_planejada).toFixed(2)} m²` : ''}
            disabled
          />

          <TextField
            fullWidth
            margin="normal"
            label="Quantidade executada"
            type="number"
            value={medicaoForm.qtd_executada}
            onChange={(e) => setMedicaoForm((prev) => ({ ...prev, qtd_executada: toNumber(e.target.value) }))}
          />

          <TextField
            fullWidth
            margin="normal"
            type="date"
            label="Data da medição"
            InputLabelProps={{ shrink: true }}
            value={medicaoForm.data_medicao}
            onChange={(e) => setMedicaoForm((prev) => ({ ...prev, data_medicao: e.target.value }))}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Justificativa de excedente"
            multiline
            rows={2}
            value={medicaoForm.justificativa}
            onChange={(e) => setMedicaoForm((prev) => ({ ...prev, justificativa: e.target.value }))}
          />

          <TextField
            fullWidth
            margin="normal"
            label="URL da foto de evidência"
            value={medicaoForm.foto_evidencia_url}
            onChange={(e) => setMedicaoForm((prev) => ({ ...prev, foto_evidencia_url: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMedicao(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCriarMedicao} disabled={saving}>
            Registrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};