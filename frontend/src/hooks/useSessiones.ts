import { useState, useEffect } from 'react';
import sessoesService, { Sessao, CreateSessaoDto, EncerrarSessaoDto } from '../services/sessoes.service';

export const useSessiones = (filtros?: any) => {
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carregarSessoes = async () => {
    try {
      setLoading(true);
      setError(null);
      const dados = await sessoesService.listar(filtros);
      setSessoes(dados);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar sessões');
    } finally {
      setLoading(false);
    }
  };

  const buscarSessaoAberta = async (id_encarregado: string) => {
    try {
      const sessao = await sessoesService.buscarSessaoAberta(id_encarregado);
      return sessao;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao buscar sessão aberta');
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
      const mensagem = err.response?.data?.message || 'Erro ao criar sessão';
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
      const mensagem = err.response?.data?.message || 'Erro ao encerrar sessão';
      setError(mensagem);
      throw new Error(mensagem);
    }
  };

  const calcularDuracao = async (id: string) => {
    try {
      const resultado = await sessoesService.calcularDuracao(id);
      return resultado.duracao_horas;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao calcular duração');
      return null;
    }
  };

  const deletarSessao = async (id: string) => {
    try {
      setError(null);
      await sessoesService.deletar(id);
      setSessoes(sessoes.filter((s) => s.id !== id));
    } catch (err: any) {
      const mensagem = err.response?.data?.message || 'Erro ao deletar sessão';
      setError(mensagem);
      throw new Error(mensagem);
    }
  };

  useEffect(() => {
    carregarSessoes();
  }, [filtros]);

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
