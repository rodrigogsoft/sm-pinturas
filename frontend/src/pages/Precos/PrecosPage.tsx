import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Badge,
} from '@mui/material';
import { Add as AddIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { usePrecos } from '../../hooks/usePrecos';
import PrecosTable from './components/PrecosTable';
import PrecoForm from './components/PrecoForm';
import obrasService from '../../services/obras.service';
import servicosService from '../../services/servicos.service';
import precosService from '../../services/precos.service';
import { RootState } from '../../store';
import { PerfilEnum } from '../../store/slices/authSlice';

export const PrecosPage = () => {
  const navigate = useNavigate();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [precoEditando, setPrecoEditando] = useState<any | null>(null);
  const [precosSelecionados, setPrecosSelecionados] = useState<string[]>([]);
  const [filtroObra, setFiltroObra] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');

  const [obras, setObras] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [carregandoAuxiliar, setCarregandoAuxiliar] = useState(false);
  const [estatisticas, setEstatisticas] = useState<any>(null);

  const {
    precos,
    loading,
    error,
    carregarPrecos,
    criar,
    atualizar,
    aprovar,
    submeter,
    retornarParaRascunho,
    deletar,
  } =
    usePrecos(filtroObra);

  // Carregar obras, serviços e estatísticas
  useEffect(() => {
    const carregar = async () => {
      try {
        setCarregandoAuxiliar(true);
        const [obrasData, servicosData, stats] = await Promise.all([
          obrasService.listar(),
          servicosService.listar(),
          precosService.getEstatisticas(),
        ]);
        setObras(obrasData);
        setServicos(servicosData);
        setEstatisticas(stats);
      } catch (err) {
        console.error('Erro ao carregar dados auxiliares:', err);
      } finally {
        setCarregandoAuxiliar(false);
      }
    };

    carregar();
  }, [precos]); // Recarrega stats quando preços mudam

  // Filtrar preços por status
  const precosFiltrados = filtroStatus
    ? precos.filter((p) => p.status_aprovacao === filtroStatus)
    : precos;

  useEffect(() => {
    setPrecosSelecionados((anteriores) =>
      anteriores.filter((id) => precosFiltrados.some((preco) => String(preco.id) === id))
    );
  }, [precosFiltrados]);

  const stats = {
    total: precos.length,
    rascunhos: precos.filter((p) => p.status_aprovacao === 'RASCUNHO').length,
    pendentes: precos.filter((p) => p.status_aprovacao === 'PENDENTE').length,
    aprovados: precos.filter((p) => p.status_aprovacao === 'APROVADO').length,
    rejeitados: precos.filter((p) => p.status_aprovacao === 'REJEITADO').length,
  };

  const handleSalvarPreco = async (dados: any) => {
    try {
      if (precoEditando) {
        await atualizar(precoEditando.id, {
          preco_custo: dados.preco_custo,
          preco_venda: dados.preco_venda,
          observacoes: dados.observacoes,
        });
      } else {
        await criar(dados);
      }
      setDialogAberto(false);
      setPrecoEditando(null);
      await carregarPrecos();
    } catch (err: any) {
      const acao = precoEditando ? 'atualizar' : 'criar';
      alert(`Erro ao ${acao} preço: ${err.message}`);
    }
  };

  const handleEditarPreco = (id: string) => {
    const preco = precos.find((item) => item.id === id);
    if (!preco) {
      alert('Preço não encontrado');
      return;
    }

    if (
      preco.status_aprovacao === 'PENDENTE' ||
      preco.status_aprovacao === 'APROVADO'
    ) {
      alert('Só é permitido editar preços em RASCUNHO ou REJEITADO.');
      return;
    }

    setPrecoEditando(preco);
    setDialogAberto(true);
  };

  const handleAprovarPreco = async (id: string, status: 'APROVADO' | 'REJEITADO', obs?: string) => {
    try {
      await aprovar(id, { status, observacoes: obs });
      await carregarPrecos();
    } catch (err: any) {
      alert('Erro ao aprovar preço: ' + err.message);
    }
  };

  const handleSubmeterPreco = async (id: string) => {
    try {
      await submeter(id);
      await carregarPrecos();
    } catch (err: any) {
      alert('Erro ao submeter preço: ' + err.message);
    }
  };

  const handleRetornarParaRascunho = async (id: string) => {
    if (!window.confirm('Deseja realmente retornar este preço para rascunho?')) {
      return;
    }

    try {
      await retornarParaRascunho(id);
      await carregarPrecos();
    } catch (err: any) {
      alert('Erro ao retornar preço para rascunho: ' + err.message);
    }
  };

  const handleDeletarPreco = async (id: string) => {
    try {
      await deletar(id);
      setPrecosSelecionados((anteriores) => anteriores.filter((itemId) => itemId !== id));
      await carregarPrecos();
    } catch (err: any) {
      alert('Erro ao deletar preço: ' + err.message);
    }
  };

  const handleSelecionarPreco = (id: string) => {
    setPrecosSelecionados((anteriores) =>
      anteriores.includes(id)
        ? anteriores.filter((itemId) => itemId !== id)
        : [...anteriores, id]
    );
  };

  const handleSelecionarTodosPrecos = () => {
    if (precosSelecionados.length === precosFiltrados.length) {
      setPrecosSelecionados([]);
      return;
    }

    setPrecosSelecionados(precosFiltrados.map((preco) => String(preco.id)));
  };

  const handleDeletarPrecosSelecionados = async () => {
    if (precosSelecionados.length === 0) {
      return;
    }

    if (!window.confirm(`Tem certeza que deseja deletar ${precosSelecionados.length} preço(s)?`)) {
      return;
    }

    try {
      const resultados = await Promise.allSettled(
        precosSelecionados.map((id) => deletar(id))
      );
      const falhas = resultados.filter((resultado) => resultado.status === 'rejected').length;
      const sucessos = resultados.length - falhas;

      await carregarPrecos();
      setPrecosSelecionados([]);

      if (falhas > 0) {
        alert(`${sucessos} preço(s) deletado(s) e ${falhas} falharam.`);
      } else {
        alert(`${sucessos} preço(s) deletado(s) com sucesso.`);
      }
    } catch (err: any) {
      alert('Erro ao deletar preços selecionados: ' + err.message);
    }
  };

  const getPerfilFromToken = (): number | null => {
    try {
      const jwt = token || localStorage.getItem('token');
      if (!jwt) return null;
      const payloadBase64 = jwt.split('.')[1];
      if (!payloadBase64) return null;
      const normalized = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
      const json = atob(normalized);
      const payload = JSON.parse(json) as { perfil?: number | string };
      const perfil = Number(payload.perfil);
      return Number.isFinite(perfil) ? perfil : null;
    } catch {
      return null;
    }
  };

  // RN01: Verificar role para mostrar preços de venda
  const userPerfilNome = (user?.perfil_nome || '').toUpperCase();
  const userPerfilId = user?.id_perfil ?? getPerfilFromToken();
  const isAdmin = userPerfilId === PerfilEnum.ADMIN || userPerfilNome.includes('ADMIN');
  const isGestor = userPerfilId === PerfilEnum.GESTOR || userPerfilNome.includes('GESTOR');
  const isFinanceiro =
    userPerfilId === PerfilEnum.FINANCEIRO || userPerfilNome.includes('FINANCEIRO');
  const isEncarregado =
    userPerfilId === PerfilEnum.ENCARREGADO || userPerfilNome.includes('ENCARREGADO');

  const permissoesPrecos = (user?.permissoes_modulos as any)?.precos;
  const moduloPrecosAtivo = permissoesPrecos?.ativo !== false;
  const acaoPermitida = (
    acao: 'visualizar' | 'criar' | 'editar' | 'apagar' | 'aprovar',
    fallback: boolean,
  ) => {
    if (isAdmin) return true;
    if (!moduloPrecosAtivo) return false;
    const valor = permissoesPrecos?.acoes?.[acao];
    if (valor === undefined || valor === null) return fallback;
    return Boolean(valor);
  };

  const podeCriar = acaoPermitida('criar', isFinanceiro || isAdmin);
  const podeEditar = acaoPermitida('editar', isFinanceiro || isAdmin);
  const podeApagar = acaoPermitida('apagar', isAdmin);
  const podeSubmeter = acaoPermitida('aprovar', isFinanceiro || isAdmin);
  const podeAprovar = acaoPermitida('aprovar', isGestor || isAdmin);
  const podeVerAprovacoes = podeAprovar;
  const userPerfil = isAdmin
    ? 'ADMIN'
    : isGestor
    ? 'GESTOR'
    : isFinanceiro
    ? 'FINANCEIRO'
    : isEncarregado
    ? 'ENCARREGADO'
    : '';

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            💰 Tabela de Preços
          </Typography>
          <Typography color="textSecondary">
            RF04: Fluxo de Preço de Venda com Validação de Margem
          </Typography>
        </Box>
        
        {/* Botão para Aprovações (Admin/Gestor/Financeiro) */}
        {podeVerAprovacoes && estatisticas && (
          <Button
            variant="outlined"
            color="warning"
            startIcon={<CheckCircleIcon />}
            onClick={() => navigate('/precos/aprovacoes')}
          >
            <Badge badgeContent={estatisticas.por_status.pendente} color="error">
              <span>Aprovações Pendentes</span>
            </Badge>
          </Button>
        )}
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="caption">
                Total
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {estatisticas?.total || stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="caption">
                Rascunhos
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#607D8B' }}>
                {estatisticas?.por_status.rascunho || stats.rascunhos}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: 'warning.lighter' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="caption">
                Pendentes
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#FF9800' }}>
                {estatisticas?.por_status.pendente || stats.pendentes}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: 'success.lighter' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="caption">
                Aprovados
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#4CAF50' }}>
                {estatisticas?.por_status.aprovado || stats.aprovados}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: 'error.lighter' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="caption">
                Rejeitados
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#F44336' }}>
                {estatisticas?.por_status.rejeitado || stats.rejeitados}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* RN01: Aviso de Cegueira Financeira */}
      {isEncarregado && (
        <Alert severity="info" sx={{ mb: 3 }}>
          🔒 <strong>RN01 - Cegueira Financeira:</strong> Você está visualizando preços de custo apenas.
          Os preços de venda são mascarados para seu perfil.
        </Alert>
      )}

      <Alert severity="info" sx={{ mb: 2 }}>
        <strong>Fluxo de aprovação de preços:</strong> preço novo nasce em <strong>RASCUNHO</strong>.
        Para aparecer em <code>/precos/aprovacoes</code>, é preciso clicar em <strong>Submeter</strong> (status <strong>PENDENTE</strong>).
      </Alert>

      {stats.rascunhos > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Existem <strong>{stats.rascunhos}</strong> preço(s) em rascunho.
          {podeSubmeter
            ? ' Use o botão Submeter na tabela para enviar para aprovação.'
            : ' Seu perfil não pode submeter. Solicite ao Financeiro/Admin.'}
        </Alert>
      )}

      {stats.pendentes > 0 && podeVerAprovacoes && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Existem <strong>{stats.pendentes}</strong> preço(s) pendente(s) de aprovação em <code>/precos/aprovacoes</code>.
        </Alert>
      )}

      {/* Filtros e Ações */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Obra</InputLabel>
            <Select
              value={filtroObra}
              label="Obra"
              onChange={(e) => setFiltroObra(e.target.value)}
            >
              <MenuItem value="">Todas</MenuItem>
              {obras.map((obra) => (
                <MenuItem key={obra.id} value={obra.id}>
                  {obra.nome}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filtroStatus}
              label="Status"
              onChange={(e) => setFiltroStatus(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="RASCUNHO">Rascunhos</MenuItem>
              <MenuItem value="PENDENTE">Pendentes</MenuItem>
              <MenuItem value="APROVADO">Aprovados</MenuItem>
              <MenuItem value="REJEITADO">Rejeitados</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            color="success"
            startIcon={<AddIcon />}
            onClick={() => {
              setPrecoEditando(null);
              setDialogAberto(true);
            }}
            disabled={carregandoAuxiliar || !podeCriar}
          >
            Novo Preço
          </Button>

          <Button
            variant="outlined"
            color="error"
            onClick={handleDeletarPrecosSelecionados}
            disabled={loading || precosSelecionados.length === 0 || !podeApagar}
          >
            Apagar Selecionados ({precosSelecionados.length})
          </Button>

          {(loading || carregandoAuxiliar) && <CircularProgress size={24} />}
        </Box>
      </Paper>

      {/* Tabela de Preços */}
      <PrecosTable
        precos={precosFiltrados}
        loading={loading}
        error={error}
        userPerfil={userPerfil}
        podeAprovar={podeAprovar}
        podeSubmeter={podeSubmeter}
        podeEditar={podeEditar}
        podeDeletar={podeApagar}
        selectedIds={precosSelecionados}
        onToggleSelecionado={handleSelecionarPreco}
        onToggleSelecionarTodos={handleSelecionarTodosPrecos}
        onAprovar={podeAprovar ? handleAprovarPreco : undefined}
        onSubmeter={podeSubmeter ? handleSubmeterPreco : undefined}
        onRetornarParaRascunho={podeEditar ? handleRetornarParaRascunho : undefined}
        onEditar={podeEditar ? handleEditarPreco : undefined}
        onDeletar={podeApagar ? handleDeletarPreco : undefined}
      />

      {/* Dialog de Criação de Preço */}
      <PrecoForm
        open={dialogAberto}
        onClose={() => {
          setDialogAberto(false);
          setPrecoEditando(null);
        }}
        onSubmit={handleSalvarPreco}
        obras={obras}
        servicos={servicos}
        loading={carregandoAuxiliar}
        initialData={precoEditando}
      />
    </Container>
  );
};

export default PrecosPage;
