import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import sessoesService, { Sessao, CreateSessaoDto, EncerrarSessaoDto } from '../services/sessoes.service';

type FiltrosSessao = {
  id_encarregado?: string;
  id_obra?: string;
  data_inicio?: string;
  data_fim?: string;
  status?: string;
};

export const useSessiones = (filtros?: FiltrosSessao, filtrosKeyExterna?: string) => {
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const filtrosRef = useRef<FiltrosSessao | undefined>(filtros);
  const bloqueadoPorPermissaoRef = useRef(false);
  const requisicaoAtivaRef = useRef(false);
  const ultimaChaveCarregadaRef = useRef<string | null>(null);

  useEffect(() => {
    filtrosRef.current = filtros;
  }, [filtros]);

  // Evita recarregamentos em cascata quando o objeto de filtros muda apenas por referência.
  const filtrosKeyInterna = useMemo(() => {
    const filtrosAtuais = filtros ?? {};
    return JSON.stringify({
      id_encarregado: filtrosAtuais.id_encarregado ?? null,
      id_obra: filtrosAtuais.id_obra ?? null,
      data_inicio: filtrosAtuais.data_inicio ?? null,
      data_fim: filtrosAtuais.data_fim ?? null,
      status: filtrosAtuais.status ?? null,
    });
  }, [filtros]);

  const filtrosKey = filtrosKeyExterna ?? filtrosKeyInterna;

  const carregarSessoes = useCallback(async (force = false) => {
    if (bloqueadoPorPermissaoRef.current) {
      return;
    }

    const filtrosAtuais: FiltrosSessao = filtrosRef.current ?? {};
    const chaveAtual = JSON.stringify({
      id_encarregado: filtrosAtuais.id_encarregado ?? null,
      id_obra: filtrosAtuais.id_obra ?? null,
      data_inicio: filtrosAtuais.data_inicio ?? null,
      data_fim: filtrosAtuais.data_fim ?? null,
      status: filtrosAtuais.status ?? null,
    });

    if (!force && ultimaChaveCarregadaRef.current === chaveAtual) {
      return;
    }

    if (requisicaoAtivaRef.current) {
      return;
    }

    try {
      requisicaoAtivaRef.current = true;
      setLoading(true);
      setError(null);
      const dados = await sessoesService.listar(filtrosAtuais);
      setSessoes(dados);
      ultimaChaveCarregadaRef.current = chaveAtual;
    } catch (err: any) {
      const status = err?.status ?? err?.response?.status;
      if (status === 401 || status === 403) {
        // Evita repetir chamadas quando o backend já negou acesso para este contexto.
        // 401 costuma indicar token inválido/expirado; 403 indica falta de permissão.
        bloqueadoPorPermissaoRef.current = true;
        ultimaChaveCarregadaRef.current = chaveAtual;
      }
      setError(err?.response?.data?.message || err?.message || 'Erro ao carregar sessões');
    } finally {
      requisicaoAtivaRef.current = false;
      setLoading(false);
    }
  }, []);

  const buscarSessaoAberta = async (id_encarregado: string) => {
    try {
      const sessao = await sessoesService.buscarSessaoAberta(id_encarregado);
      return sessao;
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Erro ao buscar sessão aberta');
      return null;
    }
  };

  const criarSessao = async (dados: CreateSessaoDto) => {
    try {
      setError(null);
      const novaSessao = await sessoesService.criar(dados);
      setSessoes([...sessoes, novaSessao]);
      return novaSessao;
    } catch (err: any) {
      const mensagem = err?.response?.data?.message || err?.message || 'Erro ao criar sessão';
      setError(mensagem);
      throw new Error(mensagem);
    }
  };

  const encerrarSessao = async (id: string, dados: EncerrarSessaoDto) => {
    try {
      setError(null);
      const sessaoAtualizada = await sessoesService.encerrar(id, dados);
      setSessoes(
        sessoes.map((s) => (s.id === id ? sessaoAtualizada : s))
      );
      return sessaoAtualizada;
    } catch (err: any) {
      const mensagem = err?.response?.data?.message || err?.message || 'Erro ao encerrar sessão';
      setError(mensagem);
      throw new Error(mensagem);
    }
  };

  const calcularDuracao = async (id: string) => {
    try {
      const resultado = await sessoesService.calcularDuracao(id);
      return resultado.duracao_horas;
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Erro ao calcular duração');
      return null;
    }
  };

  const deletarSessao = async (id: string) => {
    try {
      setError(null);
      await sessoesService.deletar(id);
      setSessoes(sessoes.filter((s) => s.id !== id));
    } catch (err: any) {
      const mensagem = err?.response?.data?.message || err?.message || 'Erro ao deletar sessão';
      setError(mensagem);
      throw new Error(mensagem);
    }
  };

  useEffect(() => {
    // Ao mudar filtros, libera uma nova tentativa de carregamento.
    bloqueadoPorPermissaoRef.current = false;
    ultimaChaveCarregadaRef.current = null;
    void carregarSessoes();
  }, [carregarSessoes, filtrosKey]);

  return {
    sessoes,
    loading,
    error,
    carregarSessoes,
    buscarSessaoAberta,
    criarSessao,
    encerrarSessao,
    calcularDuracao,
    deletarSessao,
  };
};
