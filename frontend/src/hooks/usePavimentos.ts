import { useState, useEffect } from 'react';
import pavimentosService, {
  Pavimento,
  CreatePavimentoDto,
  UpdatePavimentoDto,
} from '../services/pavimentos.service';

export const usePavimentos = (idObra?: string, autoLoad: boolean = true) => {
  const [pavimentos, setPavimentos] = useState<Pavimento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carregarPavimentos = async (force: boolean = false) => {
    try {
      if (!force && !autoLoad) {
        setPavimentos([]);
        setLoading(false);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      const dados = idObra
        ? await pavimentosService.listarPorObra(idObra)
        : await pavimentosService.listar();
      setPavimentos(dados);
    } catch (err: any) {
      const mensagem = err.response?.data?.message || 'Erro ao carregar pavimentos';
      setError(mensagem);
    } finally {
      setLoading(false);
    }
  };

  const criar = async (dados: CreatePavimentoDto) => {
    try {
      setError(null);
      const novoPavimento = await pavimentosService.criar(dados);
      setPavimentos([...pavimentos, novoPavimento]);
      return novoPavimento;
    } catch (err: any) {
      const mensagem = err.response?.data?.message || 'Erro ao criar pavimento';
      setError(mensagem);
      throw new Error(mensagem);
    }
  };

  const atualizar = async (id: string, dados: UpdatePavimentoDto) => {
    try {
      setError(null);
      const pavimentoAtualizado = await pavimentosService.atualizar(id, dados);
      setPavimentos(pavimentos.map((p) => (p.id === id ? pavimentoAtualizado : p)));
      return pavimentoAtualizado;
    } catch (err: any) {
      const mensagem = err.response?.data?.message || 'Erro ao atualizar pavimento';
      setError(mensagem);
      throw new Error(mensagem);
    }
  };

  const deletar = async (id: string) => {
    try {
      setError(null);
      await pavimentosService.deletar(id);
      setPavimentos(pavimentos.filter((p) => p.id !== id));
    } catch (err: any) {
      const mensagem = err.response?.data?.message || 'Erro ao deletar pavimento';
      setError(mensagem);
      throw new Error(mensagem);
    }
  };

  useEffect(() => {
    if (!autoLoad) {
      setPavimentos([]);
      setLoading(false);
      setError(null);
      return;
    }
    carregarPavimentos();
  }, [idObra, autoLoad]);

  return {
    pavimentos,
    loading,
    error,
    carregarPavimentos,
    criar,
    atualizar,
    deletar,
  };
};
