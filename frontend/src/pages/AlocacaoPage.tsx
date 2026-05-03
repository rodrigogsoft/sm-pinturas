import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  CircularProgress,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Divider,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { api } from '../services/api';
import LeftAlignedTablePagination from '../components/LeftAlignedTablePagination';
import { useClientPagination } from '../hooks/useClientPagination';

interface Colaborador {
  id: string;
  nome_completo: string;
  cpf_nif?: string;
  ativo?: boolean;
  deletado?: boolean;
}

interface ItemAmbiente {
  id: string;
  id_ambiente: string;
  nome_ambiente: string;
  nome_elemento: string | null;
  descricao_item: string;
  area_m2: number;
  area_planejada?: number;
  unidade_medida: string;
}

interface Pavimento {
  id: string;
  nome: string;
}

interface Ambiente {
  id: string;
  nome: string;
}

interface ServicoCatalogo {
  id: number;
  nome?: string;
  nome_servico?: string;
  unidade_medida?: string;
}

const sanitizeServicoTexto = (input?: string): string => {
  if (!input) return '';

  return input
    .replace(/L\?\?tex/gi, 'Látex')
    .replace(/Dem\?\?os/gi, 'Demãos')
    .replace(/Rodap\?\?/gi, 'Rodapé')
    .replace(/Servi\?\?o/gi, 'Serviço')
    .replace(/Aplica\?\?\?\?o/gi, 'Aplicação')
    .replace(/Instala\?\?\?\?o/gi, 'Instalação')
    .replace(/LÃ¡tex/gi, 'Látex')
    .replace(/DemÃ£os/gi, 'Demãos')
    .replace(/RodapÃ©/gi, 'Rodapé')
    .trim();
};

const buildServicoKey = (serv: ServicoCatalogo): string => {
  const nome = sanitizeServicoTexto(serv.nome || serv.nome_servico || '').toLowerCase();
  const unidade = (serv.unidade_medida || '').trim().toUpperCase();
  return `${nome}|${unidade}`;
};

interface AlocacaoAtiva {
  id: string;
  id_colaborador: string;
  nome_colaborador: string;
  id_item_ambiente: string | null;
  nome_item: string;
  nome_ambiente: string;
  id_servico: number | null;
  nome_servico: string;
  quantidade_planejada: number;
  progresso_percentual: number;
  status: string;
}

interface MedicaoResumoApi {
  id_alocacao: string;
  qtd_executada: number;
}

interface AlocacaoApiResponse {
  id: string;
  id_ambiente?: string;
  id_colaborador: string;
  idColaborador?: string;
  id_item_ambiente?: string | null;
  idItemAmbiente?: string | null;
  id_servico?: number | null;
  idServico?: number | null;
  id_servico_catalogo?: number | null;
  idServicoCatalogo?: number | null;
  quantidade_planejada?: number;
  quantidadePlanejada?: number;
  status: string;
  nome_colaborador?: string;
  nomeColaborador?: string;
  nome_ambiente?: string;
  nomeAmbiente?: string;
  nome_item?: string;
  nomeItem?: string;
  nome_servico?: string;
  nomeServico?: string;
  colaborador?: {
    nome_completo?: string;
  };
  ambiente?: {
    nome?: string;
    pavimento?: {
      nome?: string;
    };
  };
  item_ambiente?: {
    id?: string;
    nome_elemento?: string;
    area_planejada?: number;
  };
}

interface ItemAmbienteLookup {
  id: string;
  nome_elemento?: string | null;
}

interface PrecoTabelaApi {
  id_servico_catalogo?: number;
  preco_custo?: number;
}

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatarNomeElemento = (nomeElemento?: string | null, nomePavimento?: string, nomeAmbiente?: string): string => {
  const nomeBase = (nomeElemento || '').trim() || 'Nao informado';
  const localizacao = [nomePavimento, nomeAmbiente].filter(Boolean).join(' / ');

  if (!localizacao) {
    return nomeBase;
  }

  return `${nomeBase} - ${localizacao}`;
};

export const AlocacaoPage: React.FC = () => {
  const { id_sessao, id_obra } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [itensAmbiente, setItensAmbiente] = useState<ItemAmbiente[]>([]);
  const [pavimentos, setPavimentos] = useState<Pavimento[]>([]);
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [servicos, setServicos] = useState<ServicoCatalogo[]>([]);
  const [precosPorServico, setPrecosPorServico] = useState<Map<number, number>>(new Map());
  const [alocacoes, setAlocacoes] = useState<AlocacaoAtiva[]>([]);
  const [sessao, setSessao] = useState<any>(null);
  const [nomeObra, setNomeObra] = useState('');

  // Dialog de alocação
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedColaborador, setSelectedColaborador] = useState('');
  const [selectedPavimento, setSelectedPavimento] = useState('');
  const [selectedAmbiente, setSelectedAmbiente] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedServico, setSelectedServico] = useState('');
  const [precoCusto, setPrecoCusto] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Dialog de edição
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [alocacaoEditando, setAlocacaoEditando] = useState<AlocacaoAtiva | null>(null);
  const [editColaborador, setEditColaborador] = useState('');
  const [editServico, setEditServico] = useState('');
  const [editPrecoCusto, setEditPrecoCusto] = useState('');
  const [editObservacoes, setEditObservacoes] = useState('');
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const normalizarAlocacoes = (
    alocacoesRaw: AlocacaoApiResponse[],
    servicosLista: ServicoCatalogo[],
    colaboradoresLista: Colaborador[],
    itensMap: Map<string, ItemAmbienteLookup>,
    progressoMap: Map<string, number>,
  ): AlocacaoAtiva[] => {
    const servicosMap = new Map<number, string>(
      servicosLista.map((servico) => [
        Number(servico.id),
        sanitizeServicoTexto(servico.nome || servico.nome_servico || ''),
      ]),
    );

    return alocacoesRaw.map((aloc) => {
      const idColaborador = aloc.id_colaborador || aloc.idColaborador || '';
      const nomeDireto =
        aloc.nome_colaborador ||
        aloc.nomeColaborador ||
        aloc.colaborador?.nome_completo ||
        '';
      const nomeColaboradorPorId = colaboradoresLista.find(
        (c) => c.id === idColaborador,
      )?.nome_completo;

      const idServico =
        aloc.id_servico_catalogo ??
        aloc.idServicoCatalogo ??
        aloc.id_servico ??
        aloc.idServico ??
        null;
      const nomeServicoPorCatalogo =
        idServico !== null ? servicosMap.get(Number(idServico)) || '' : '';
      const idItem =
        aloc.id_item_ambiente ??
        aloc.idItemAmbiente ??
        aloc.item_ambiente?.id ??
        null;
      const nomeElementoPorItem = idItem ? itensMap.get(idItem)?.nome_elemento || '' : '';
      const nomePavimento = aloc.ambiente?.pavimento?.nome;
      const nomeAmbiente = aloc.nome_ambiente || aloc.nomeAmbiente || aloc.ambiente?.nome || 'Nao informado';
      const quantidadePlanejada =
        aloc.quantidade_planejada ??
        aloc.quantidadePlanejada ??
        Number(aloc.item_ambiente?.area_planejada || 0);
      const qtdExecutada = toNumber(progressoMap.get(aloc.id));
      const progresso = quantidadePlanejada > 0
        ? Math.min(100, (qtdExecutada / Number(quantidadePlanejada)) * 100)
        : 0;

      return {
        id: aloc.id,
        id_colaborador: idColaborador,
        nome_colaborador: (nomeDireto || nomeColaboradorPorId || 'Nao informado').trim(),
        id_item_ambiente:
          aloc.id_item_ambiente ??
          aloc.idItemAmbiente ??
          aloc.item_ambiente?.id ??
          null,
        nome_item:
          formatarNomeElemento(
            aloc.nome_item ||
              aloc.nomeItem ||
              aloc.item_ambiente?.nome_elemento ||
              nomeElementoPorItem ||
              '',
            nomePavimento,
            nomeAmbiente,
          ),
        nome_ambiente: nomeAmbiente,
        id_servico: idServico,
        nome_servico:
          sanitizeServicoTexto(aloc.nome_servico || aloc.nomeServico || '') ||
          nomeServicoPorCatalogo ||
          'Nao informado',
        quantidade_planejada: quantidadePlanejada,
        progresso_percentual: progresso,
        status: aloc.status,
      };
    });
  };

  useEffect(() => {
    carregarDados();
  }, [id_sessao, id_obra]);

  const carregarDados = async () => {
    try {
      setLoading(true);

      // Carregar sessão
      const sessaoRes = await api.get(`/sessoes/${id_sessao}`);
      const sessaoData = sessaoRes.data;
      setSessao(sessaoData);

      // A obra da alocacao e sempre a mesma da sessao
      const obraId = sessaoData.id_obra;

      // Carregar colaboradores
      const colaborRes = await api.get('/colaboradores', {
        params: { apenasAtivos: true },
      });
      const colabs = colaborRes.data.data || colaborRes.data || [];
      setColaboradores(colabs);

      // Carregar dados hierarquicos de localizacao da tarefa
      if (obraId && obraId !== 'null') {
        const obraRes = await api.get(`/obras/${obraId}`);
        setNomeObra(obraRes.data?.nome || 'Obra da sessao');

        const pavRes = await api.get(`/pavimentos/obra/${obraId}`);
        setPavimentos(pavRes.data.data || pavRes.data || []);
      } else {
        setNomeObra('Sessao sem obra vinculada');
        setPavimentos([]);
      }

      // Carregar serviços
      const servicosRes = await api.get('/servicos', {
        params: { apenasAtivos: true },
      });
      const servicosRaw = servicosRes.data.data || servicosRes.data || [];
      const servicosUnicos = new Map<string, ServicoCatalogo>();

      for (const servico of servicosRaw) {
        const nomeCorrigido = sanitizeServicoTexto(servico.nome || servico.nome_servico || '');
        const servicoCorrigido: ServicoCatalogo = {
          ...servico,
          nome: nomeCorrigido,
          nome_servico: nomeCorrigido,
        };

        const key = buildServicoKey(servicoCorrigido);
        if (!servicosUnicos.has(key)) {
          servicosUnicos.set(key, servicoCorrigido);
        }
      }

      setServicos(
        Array.from(servicosUnicos.values()).sort((a, b) =>
          (a.nome || a.nome_servico || '').localeCompare(
            b.nome || b.nome_servico || '',
            'pt-BR',
          ),
        ),
      );

      if (obraId && obraId !== 'null') {
        try {
          const precosRes = await api.get('/precos', {
            params: { idObra: obraId },
          });
          const precosRaw = (precosRes.data.data || precosRes.data || []) as PrecoTabelaApi[];
          const precosMap = new Map<number, number>();

          precosRaw.forEach((preco) => {
            const idServico = Number(preco.id_servico_catalogo);
            const precoCusto = Number(preco.preco_custo);

            if (Number.isFinite(idServico) && Number.isFinite(precoCusto)) {
              precosMap.set(idServico, precoCusto);
            }
          });

          setPrecosPorServico(precosMap);
        } catch (error) {
          console.warn('Nao foi possivel carregar tabela de precos da obra:', error);
          setPrecosPorServico(new Map());
        }
      } else {
        setPrecosPorServico(new Map());
      }

      // Carregar alocações ativas
      const [alocRes, medicoesRes] = await Promise.all([
        api.get('/alocacoes', {
          params: { id_sessao, status: 'EM_ANDAMENTO' },
        }),
        api.get('/medicoes', { params: { id_sessao } }),
      ]);
      const alocacoesRaw = (alocRes.data.data || alocRes.data || []) as AlocacaoApiResponse[];
      const medicoesRaw = (medicoesRes.data.data || medicoesRes.data || []) as MedicaoResumoApi[];
      const progressoMap = new Map<string, number>();
      medicoesRaw.forEach((medicao) => {
        const atual = toNumber(progressoMap.get(medicao.id_alocacao));
        progressoMap.set(medicao.id_alocacao, atual + toNumber(medicao.qtd_executada));
      });
      const ambientesUnicos = Array.from(
        new Set(
          alocacoesRaw
            .map((a) => a.id_ambiente)
            .filter((id): id is string => Boolean(id)),
        ),
      );
      const itensMap = new Map<string, ItemAmbienteLookup>();
      await Promise.all(
        ambientesUnicos.map(async (idAmbiente) => {
          const itensRes = await api.get(`/itens-ambiente/ambiente/${idAmbiente}`);
          const itensRaw = itensRes.data.data || itensRes.data || [];
          itensRaw.forEach((item: ItemAmbienteLookup) => {
            itensMap.set(item.id, item);
          });
        }),
      );
      setAlocacoes(
        normalizarAlocacoes(
          alocacoesRaw,
          servicosUnicos.size > 0 ? Array.from(servicosUnicos.values()) : servicosRaw,
          colabs,
          itensMap,
          progressoMap,
        ),
      );
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      setSubmitError('Erro ao carregar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setSubmitError('');
    setSelectedColaborador('');
    setSelectedPavimento('');
    setSelectedAmbiente('');
    setSelectedItem('');
    setSelectedServico('');
    setPrecoCusto('');
    setObservacoes('');
    setAmbientes([]);
    setItensAmbiente([]);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSubmitAlocacao = async () => {
    if (submitLoading) return;

    if (!selectedColaborador || !selectedPavimento || !selectedAmbiente || !selectedItem || !selectedServico) {
      setSubmitError('Preencha colaborador, pavimento, ambiente, elemento de serviço e serviço.');
      return;
    }

    const precoCustoNormalizado = Number(precoCusto.replace(',', '.'));
    if (!Number.isFinite(precoCustoNormalizado) || precoCustoNormalizado <= 0) {
      setSubmitError('Informe um preço de custo válido (maior que zero).');
      return;
    }

    setSubmitLoading(true);
    setSubmitError('');

    try {

      const payload = {
        id_sessao,
        id_ambiente: selectedAmbiente,
        id_item_ambiente: selectedItem || null,
        id_colaborador: selectedColaborador,
        id_servico_catalogo: Number(selectedServico),
        preco_custo: precoCustoNormalizado,
        observacoes: observacoes || undefined,
        hora_inicio: new Date().toISOString(),
      };

      await api.post('/alocacoes', payload);

      // Recarregar alocações
      await carregarDados();
      handleCloseDialog();
    } catch (error: any) {
      const mensagem =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Erro ao alocar colaborador';
      setSubmitError(mensagem);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleAbrirEdicao = (aloc: AlocacaoAtiva) => {
    setAlocacaoEditando(aloc);
    setEditColaborador(aloc.id_colaborador);

    const idServicoAtual = aloc.id_servico !== null ? Number(aloc.id_servico) : undefined;
    const precoAtualServico =
      idServicoAtual !== undefined
        ? precosPorServico.get(idServicoAtual)
        : undefined;

    setEditServico(idServicoAtual !== undefined ? String(idServicoAtual) : '');
    setEditPrecoCusto(
      precoAtualServico !== undefined ? String(precoAtualServico.toFixed(2)) : '',
    );
    setEditObservacoes('');
    setEditError('');
    setOpenEditDialog(true);
  };

  const handleSalvarEdicao = async () => {
    if (!alocacaoEditando) return;
    if (!editColaborador) {
      setEditError('Selecione um colaborador.');
      return;
    }
    const precoCustoNorm = editPrecoCusto ? Number(editPrecoCusto.replace(',', '.')) : undefined;
    if (editPrecoCusto && (!Number.isFinite(precoCustoNorm) || (precoCustoNorm as number) <= 0)) {
      setEditError('Preço de custo inválido (deve ser maior que zero).');
      return;
    }
    setEditLoading(true);
    setEditError('');
    try {
      const payload: any = {
        id_colaborador: editColaborador,
      };
      if (editServico) payload.id_servico_catalogo = Number(editServico);
      if (precoCustoNorm !== undefined) payload.preco_custo = precoCustoNorm;
      if (editObservacoes.trim()) payload.observacoes = editObservacoes.trim();
      await api.patch(`/alocacoes/${alocacaoEditando.id}`, payload);
      setOpenEditDialog(false);
      setAlocacaoEditando(null);
      await carregarDados();
    } catch (error: any) {
      setEditError(error.response?.data?.message || 'Erro ao salvar edição.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDesalocar = async (alocacaoId: string) => {
    if (!window.confirm('Desalocar colaborador?')) return;

    try {
      await api.delete(`/alocacoes/${alocacaoId}`);
      await carregarDados();
    } catch (error: any) {
      console.error('Erro ao desalocar:', error);
      alert('Erro ao desalocar colaborador');
    }
  };

  // Colaboradores disponíveis: apenas ativos e não deletados
  // (Com a regra de alocações simultâneas, um mesmo colaborador pode ter múltiplas alocações)
  const colaboradoresDisponiveis = colaboradores.filter(
    c => (c.ativo ?? true) && !(c.deletado ?? false)
  );
  const {
    page,
    rowsPerPage,
    paginatedItems: paginatedAlocacoes,
    handlePageChange,
    handleRowsPerPageChange,
  } = useClientPagination(alocacoes);

  const handleSelectPavimento = async (pavimentoId: string) => {
    setSelectedPavimento(pavimentoId);
    setSelectedAmbiente('');
    setSelectedItem('');
    setAmbientes([]);
    setItensAmbiente([]);

    if (!pavimentoId) return;

    try {
      const ambRes = await api.get(`/ambientes/pavimento/${pavimentoId}`);
      setAmbientes(ambRes.data.data || ambRes.data || []);
    } catch (error) {
      setSubmitError('Erro ao carregar ambientes do pavimento.');
    }
  };

  const handleSelectAmbiente = async (ambienteId: string) => {
    setSelectedAmbiente(ambienteId);
    setSelectedItem('');
    setItensAmbiente([]);

    if (!ambienteId) return;

    try {
      const itensRes = await api.get(`/itens-ambiente/ambiente/${ambienteId}`);
      setItensAmbiente(itensRes.data.data || itensRes.data || []);
    } catch (error) {
      setSubmitError('Erro ao carregar itens de ambiente.');
    }
  };

  if (loading) {
    return (
      <Container sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ flex: 1 }}>
          Alocação de Tarefas
        </Typography>
        <Chip 
          label={`${alocacoes.length} Alocações Ativas`} 
          color={alocacoes.length > 0 ? 'success' : 'default'}
        />
      </Box>

      {/* Info da Sessão */}
      {sessao && (
        <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f5f5f5' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="textSecondary">
                Sessão ID
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                {id_sessao?.substring(0, 8)}...
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="textSecondary">
                Data
              </Typography>
              <Typography variant="body1">
                {new Date(sessao.data_sessao).toLocaleDateString('pt-BR')}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">
                Obra da Sessao
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {nomeObra || 'Nao informada'}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Resumo */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Colaboradores Disponíveis
              </Typography>
              <Typography variant="h5">
                {colaboradoresDisponiveis.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pavimentos
              </Typography>
              <Typography variant="h5">
                {pavimentos.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Serviços Disponíveis
              </Typography>
              <Typography variant="h5">
                {servicos.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Alocações Ativas
              </Typography>
              <Typography variant="h5">
                {alocacoes.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Botão Criar Alocação */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
          disabled={colaboradoresDisponiveis.length === 0 || !sessao?.id_obra}
        >
          Nova Alocação
        </Button>
        {colaboradoresDisponiveis.length === 0 && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            Nenhum colaborador disponível (todos deletados ou inativos).
          </Alert>
        )}
      </Box>

      {/* Tabela de Alocações Ativas */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Colaborador</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Ambiente</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Elemento de Serviço</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Serviço Alocado</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {alocacoes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography color="textSecondary">
                    Nenhuma alocação ativa. Clique em "Nova Alocação" para começar.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedAlocacoes.map((aloc) => (
                <TableRow key={aloc.id} hover>
                  <TableCell>{aloc.nome_colaborador || 'Nao informado'}</TableCell>
                  <TableCell>{aloc.nome_ambiente || 'Nao informado'}</TableCell>
                  <TableCell>{aloc.nome_item || 'Nao informado'}</TableCell>
                  <TableCell>{aloc.nome_servico || 'Nao informado'}</TableCell>
                  <TableCell>
                    <Chip
                      label={`${aloc.status} (${aloc.progresso_percentual.toFixed(1)}%)`}
                      size="small"
                      color={aloc.status === 'EM_ANDAMENTO' ? 'success' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleAbrirEdicao(aloc)}
                        title="Editar alocação"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDesalocar(aloc.id)}
                        title="Remover alocação"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <LeftAlignedTablePagination
          count={alocacoes.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </TableContainer>

      {/* Dialog de Edição de Alocação */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Alocação</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {editError && (
            <Alert severity="error" sx={{ mb: 2 }}>{editError}</Alert>
          )}

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Colaborador *</InputLabel>
            <Select
              value={editColaborador}
              label="Colaborador *"
              onChange={(e) => setEditColaborador(e.target.value)}
            >
              {colaboradoresDisponiveis.map((colab) => (
                <MenuItem key={colab.id} value={colab.id}>
                  {colab.nome_completo}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Serviço</InputLabel>
            <Select
              value={editServico}
              label="Serviço"
              onChange={(e) => {
                const proximoServico = String(e.target.value);
                setEditServico(proximoServico);

                const precoTabela = precosPorServico.get(Number(proximoServico));
                setEditPrecoCusto(
                  precoTabela !== undefined ? String(precoTabela.toFixed(2)) : '',
                );
              }}
            >
              <MenuItem value="">Manter atual</MenuItem>
              {servicos.map((serv) => (
                <MenuItem key={serv.id} value={String(serv.id)}>
                  {(serv.nome || serv.nome_servico || 'Serviço sem nome')} ({serv.unidade_medida || '-'})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            sx={{ mb: 2 }}
            label="Preço de Custo"
            type="number"
            inputProps={{ step: '0.01', min: 0 }}
            value={editPrecoCusto}
            onChange={(e) => setEditPrecoCusto(e.target.value)}
            placeholder="Deixe em branco para manter o valor atual"
          />

          <TextField
            fullWidth
            label="Observações"
            multiline
            rows={3}
            value={editObservacoes}
            onChange={(e) => setEditObservacoes(e.target.value)}
            placeholder="Deixe em branco para manter as observações atuais"
          />
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenEditDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSalvarEdicao}
            disabled={editLoading}
          >
            {editLoading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Nova Alocação */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Nova Alocação</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Colaborador *</InputLabel>
            <Select
              value={selectedColaborador}
              label="Colaborador *"
              onChange={(e) => setSelectedColaborador(e.target.value)}
            >
              {colaboradoresDisponiveis.map((colab) => (
                <MenuItem key={colab.id} value={colab.id}>
                  {colab.nome_completo}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <TextField
              label="Obra da Sessao"
              value={nomeObra || 'Nao informada'}
              InputProps={{ readOnly: true }}
              disabled
              fullWidth
            />
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Pavimento *</InputLabel>
            <Select
              value={selectedPavimento}
              label="Pavimento *"
              onChange={(e) => handleSelectPavimento(e.target.value)}
            >
              {pavimentos.map((pav) => (
                <MenuItem key={pav.id} value={pav.id}>
                  {pav.nome}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Ambiente *</InputLabel>
            <Select
              value={selectedAmbiente}
              label="Ambiente *"
              onChange={(e) => handleSelectAmbiente(e.target.value)}
              disabled={!selectedPavimento}
            >
              {ambientes.map((amb) => (
                <MenuItem key={amb.id} value={amb.id}>
                  {amb.nome}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Elemento de Serviço *</InputLabel>
            <Select
              value={selectedItem}
              label="Elemento de Serviço *"
              onChange={(e) => setSelectedItem(e.target.value)}
              disabled={!selectedAmbiente}
            >
              {itensAmbiente.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  <Box>
                    <Typography variant="body2">
                      {formatarNomeElemento(
                        item.nome_elemento || item.descricao_item,
                        pavimentos.find((pav) => pav.id === selectedPavimento)?.nome,
                        ambientes.find((amb) => amb.id === selectedAmbiente)?.nome,
                      )}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      {(item.area_planejada ?? item.area_m2)}m²
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Serviço *</InputLabel>
            <Select
              value={selectedServico}
              label="Serviço *"
              onChange={(e) => {
                const proximoServico = String(e.target.value);
                setSelectedServico(proximoServico);

                const precoTabela = precosPorServico.get(Number(proximoServico));
                setPrecoCusto(
                  precoTabela !== undefined ? String(precoTabela.toFixed(2)) : '',
                );
              }}
            >
              {servicos.map((serv) => (
                <MenuItem key={serv.id} value={serv.id}>
                  {(serv.nome || serv.nome_servico || 'Servico sem nome')} ({serv.unidade_medida || '-'})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Alert severity="info" sx={{ mb: 2 }}>
            Informe o preço de custo desta alocação.
          </Alert>

          <TextField
            fullWidth
            sx={{ mb: 2 }}
            label="Preço de Custo *"
            type="number"
            inputProps={{ step: '0.01', min: 0 }}
            value={precoCusto}
            onChange={(e) => setPrecoCusto(e.target.value)}
          />

          <TextField
            fullWidth
            label="Observações"
            multiline
            rows={3}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Ex: Prioridade high, iniciar pela parede norte..."
          />
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSubmitAlocacao}
            disabled={submitLoading}
          >
            {submitLoading ? 'Alocando...' : 'Alocar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AlocacaoPage;
