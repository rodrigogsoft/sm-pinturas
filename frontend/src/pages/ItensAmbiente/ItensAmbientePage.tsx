import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { useItensAmbiente, FiltrosItensAmbiente } from '../../hooks/useItensAmbiente';
import ItensAmbienteTable from './components/ItensAmbienteTable';
import ItemAmbienteForm from './components/ItemAmbienteForm';
import CadastroLoteDialog from './components/CadastroLoteDialog';
import ambientesService from '../../services/ambientes.service';
import obrasService from '../../services/obras.service';
import pavimentosService from '../../services/pavimentos.service';
import itensAmbienteService, { ItemLoteDto } from '../../services/itens-ambiente.service';

const normalizarNomeAmbiente = (nome: string) =>
  nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const obterChaveSemelhancaAmbiente = (nome: string) =>
  normalizarNomeAmbiente(nome)
    .replace(/(?:\s+|-|\/)?\d+[a-z]?$/i, '')
    .trim() || normalizarNomeAmbiente(nome);

export const ItensAmbientePage = () => {
  const [dialogAberto, setDialogAberto] = useState(false);
  const [dialogLoteAberto, setDialogLoteAberto] = useState(false);
  const [itensSelecionados, setItensSelecionados] = useState<string[]>([]);
  
  // Filtros
  const [filtroObra, setFiltroObra] = useState('');
  const [filtroPavimento, setFiltroPavimento] = useState('');
  const [filtroAmbiente, setFiltroAmbiente] = useState('');

  // Dados auxiliares
  const [obras, setObras] = useState<any[]>([]);
  const [pavimentos, setPavimentos] = useState<any[]>([]);
  const [ambientes, setAmbientes] = useState<any[]>([]);
  const [carregandoAuxiliar, setCarregandoAuxiliar] = useState(false);

  // Criar objeto de filtros para o hook
  const filtros: FiltrosItensAmbiente = {};
  if (filtroAmbiente) {
    filtros.idAmbiente = filtroAmbiente;
  } else if (filtroPavimento) {
    filtros.idPavimento = filtroPavimento;
  } else if (filtroObra) {
    filtros.idObra = filtroObra;
  }

  const { itens, loading, error, carregarItens, criar, deletar } =
    useItensAmbiente(filtros);

  // Carregar obtém e dados auxiliares
  useEffect(() => {
    const carregar = async () => {
      try {
        setCarregandoAuxiliar(true);
        const [obrasData, ambientesData] = await Promise.all([
          obrasService.listar(),
          ambientesService.listar(),
        ]);
        setObras(obrasData);
        setAmbientes(ambientesData);
      } catch (err) {
        console.error('Erro ao carregar dados auxiliares:', err);
      } finally {
        setCarregandoAuxiliar(false);
      }
    };

    carregar();
  }, []);

  // Carregar pavimentos quando obra for selecionada
  useEffect(() => {
    const carregarPavimentos = async () => {
      if (filtroObra) {
        try {
          const pavData = await pavimentosService.listarPorObra(filtroObra);
          setPavimentos(pavData);
          // Limpar filtros dependentes quando obra mudar
          setFiltroPavimento('');
          setFiltroAmbiente('');
        } catch (err) {
          console.error('Erro ao carregar pavimentos:', err);
          setPavimentos([]);
        }
      } else {
        setPavimentos([]);
        setFiltroPavimento('');
        setFiltroAmbiente('');
      }
    };

    carregarPavimentos();
  }, [filtroObra]);

  useEffect(() => {
    setItensSelecionados((anteriores) =>
      anteriores.filter((id) => itens.some((item) => String(item.id) === id))
    );
  }, [itens]);

  const handleCriarItem = async (dados: any) => {
    try {
      await criar(dados);
      setDialogAberto(false);
      await carregarItens();
    } catch (err: any) {
      alert('Erro ao criar item: ' + err.message);
    }
  };

  const handleCriarLote = async (itens: ItemLoteDto[], cadastrarSemelhantes: boolean) => {
    const idsAmbientesSemelhantes = cadastrarSemelhantes
      ? ambientesSemelhantes.map((ambiente) => ambiente.id)
      : undefined;

    const resultado = await itensAmbienteService.criarLote({
      id_ambiente: filtroAmbiente,
      id_ambientes: idsAmbientesSemelhantes,
      itens,
    });
    await carregarItens();
    return { criados: resultado.criados.length, erros: resultado.erros };
  };

  const handleDeletarItem = async (id: string) => {
    try {
      await deletar(id);
      setItensSelecionados((anteriores) => anteriores.filter((itemId) => itemId !== id));
      await carregarItens();
    } catch (err: any) {
      alert('Erro ao deletar item: ' + err.message);
    }
  };

  const ambientesDoFiltroObra = filtroObra
    ? ambientes.filter((ambiente) => pavimentos.some((pavimento) => pavimento.id === ambiente.id_pavimento))
    : [];
  const ambienteSelecionado = ambientes.find((ambiente) => ambiente.id === filtroAmbiente);
  const chaveSemelhancaAmbiente = ambienteSelecionado
    ? obterChaveSemelhancaAmbiente(ambienteSelecionado.nome)
    : '';
  const ambientesSemelhantes = ambienteSelecionado
    ? ambientesDoFiltroObra
        .filter((ambiente) => obterChaveSemelhancaAmbiente(ambiente.nome) === chaveSemelhancaAmbiente)
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    : [];

  const handleSelecionarItem = (id: string) => {
    setItensSelecionados((anteriores) =>
      anteriores.includes(id)
        ? anteriores.filter((itemId) => itemId !== id)
        : [...anteriores, id]
    );
  };

  const handleSelecionarTodosItens = () => {
    if (itensSelecionados.length === itens.length) {
      setItensSelecionados([]);
      return;
    }

    setItensSelecionados(itens.map((item) => String(item.id)));
  };

  const handleDeletarItensSelecionados = async () => {
    if (itensSelecionados.length === 0) {
      return;
    }

    if (!window.confirm(`Tem certeza que deseja deletar ${itensSelecionados.length} item(ns)?`)) {
      return;
    }

    try {
      const resultados = await Promise.allSettled(
        itensSelecionados.map((id) => deletar(id))
      );
      const falhas = resultados.filter((resultado) => resultado.status === 'rejected').length;
      const sucessos = resultados.length - falhas;

      await carregarItens();
      setItensSelecionados([]);

      if (falhas > 0) {
        alert(`${sucessos} item(ns) deletado(s) e ${falhas} falharam.`);
      } else {
        alert(`${sucessos} item(ns) deletado(s) com sucesso.`);
      }
    } catch (err: any) {
      alert('Erro ao deletar itens selecionados: ' + err.message);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          🔧 Elementos de Serviço
        </Typography>
        <Typography color="textSecondary">
          Cadastre e associe elementos de serviço aos ambientes de uma obra
        </Typography>
      </Box>

      {/* Filtros e Ações */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filtrar por Obra</InputLabel>
            <Select
              value={filtroObra}
              label="Filtrar por Obra"
              onChange={(e) => setFiltroObra(e.target.value)}
            >
              <MenuItem value="">Todas as Obras</MenuItem>
              {obras.map((obra) => (
                <MenuItem key={obra.id} value={obra.id}>
                  {obra.nome}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {filtroObra && (
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Filtrar por Pavimento</InputLabel>
              <Select
                value={filtroPavimento}
                label="Filtrar por Pavimento"
                onChange={(e) => {
                  setFiltroPavimento(e.target.value);
                  // Limpar filtro de ambiente que não pertence ao novo pavimento
                  if (e.target.value) {
                    setFiltroAmbiente('');
                  }
                }}
              >
                <MenuItem value="">Todos os Pavimentos</MenuItem>
                {pavimentos.map((pav) => (
                  <MenuItem key={pav.id} value={pav.id}>
                    {pav.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {filtroPavimento && (
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Filtrar por Ambiente</InputLabel>
              <Select
                value={filtroAmbiente}
                label="Filtrar por Ambiente"
                onChange={(e) => setFiltroAmbiente(e.target.value)}
              >
                <MenuItem value="">Todos os Ambientes</MenuItem>
                {ambientes
                  .filter((amb) => amb.id_pavimento === filtroPavimento)
                  .map((amb) => (
                    <MenuItem key={amb.id} value={amb.id}>
                      {amb.nome}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          )}

          <Button
            variant="contained"
            color="success"
            onClick={() => setDialogAberto(true)}
            disabled={carregandoAuxiliar}
          >
            + Novo Item
          </Button>

          <Button
            variant="outlined"
            color="primary"
            onClick={() => setDialogLoteAberto(true)}
            disabled={carregandoAuxiliar || !filtroAmbiente}
            title={!filtroAmbiente ? 'Selecione um ambiente para cadastrar em lote' : ''}
          >
            + Cadastro em Lote
          </Button>

          <Button
            variant="outlined"
            color="error"
            onClick={handleDeletarItensSelecionados}
            disabled={loading || itensSelecionados.length === 0}
          >
            Apagar Selecionados ({itensSelecionados.length})
          </Button>

          {(loading || carregandoAuxiliar) && <CircularProgress size={24} />}
        </Box>
      </Paper>

      {/* Tabela de Itens */}
      <ItensAmbienteTable
        itens={itens}
        loading={loading}
        error={error}
        selectedIds={itensSelecionados}
        onToggleSelecionado={handleSelecionarItem}
        onToggleSelecionarTodos={handleSelecionarTodosItens}
        onDeletar={handleDeletarItem}
      />

      {/* Dialog de Criação Individual */}
      <ItemAmbienteForm
        open={dialogAberto}
        onClose={() => setDialogAberto(false)}
        onSubmit={handleCriarItem}
        ambientes={ambientes}
        idAmbientePreSelecionado={filtroAmbiente}
      />

      {/* Dialog de Cadastro em Lote (RF21) */}
      <CadastroLoteDialog
        open={dialogLoteAberto}
        idAmbiente={filtroAmbiente}
        nomeAmbiente={ambienteSelecionado?.nome}
        quantidadeAmbientesSemelhantes={ambientesSemelhantes.length}
        ambientesSemelhantesPreview={ambientesSemelhantes.map((ambiente) => ambiente.nome)}
        onClose={() => setDialogLoteAberto(false)}
        onSubmit={handleCriarLote}
      />
    </Container>
  );
};

export default ItensAmbientePage;
