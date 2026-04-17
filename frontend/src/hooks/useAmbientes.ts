import { useState, useEffect } from 'react';
import ambientesService, {
  Ambiente,
  CreateAmbienteDto,
  UpdateAmbienteDto,
} from '../services/ambientes.service';

export const useAmbientes = (
  idPavimento?: string,
  idObra?: string,
  autoLoad: boolean = true,
) => {
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carregarAmbientes = async (force: boolean = false) => {
    try {
      if (!force && !autoLoad) {
        setAmbientes([]);
        setLoading(false);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      let dados: Ambiente[];
      if (idPavimento) {
        dados = await ambientesService.listarPorPavimento(idPavimento);
      } else if (idObra) {
        dados = await ambientesService.listarPorObra(idObra);
      } else {
        dados = await ambientesService.listar();
      }
      setAmbientes(dados);
    } catch (err: any) {
      const mensagem = err.response?.data?.message || 'Erro ao carregar ambientes';
      setError(mensagem);
    } finally {
      setLoading(false);
    }
  };

  const criar = async (dados: CreateAmbienteDto) => {
    try {
      setError(null);
      const novoAmbiente = await ambientesService.criar(dados);
      setAmbientes([...ambientes, novoAmbiente]);
      return novoAmbiente;
    } catch (err: any) {
      const mensagem = err.response?.data?.message || 'Erro ao criar ambiente';
      setError(mensagem);
      throw new Error(mensagem);
    }
  };

  const atualizar = async (id: string, dados: UpdateAmbienteDto) => {
    try {
      setError(null);
      const ambienteAtualizado = await ambientesService.atualizar(id, dados);
      setAmbientes(ambientes.map((a) => (a.id === id ? ambienteAtualizado : a)));
      return ambienteAtualizado;
    } catch (err: any) {
      const mensagem = err.response?.data?.message || 'Erro ao atualizar ambiente';
      setError(mensagem);
      throw new Error(mensagem);
    }
  };

  const deletar = async (id: string) => {
    try {
      setError(null);
      await ambientesService.deletar(id);
      setAmbientes(ambientes.filter((a) => a.id !== id));
    } catch (err: any) {
      const mensagem = err.response?.data?.message || 'Erro ao deletar ambiente';
      setError(mensagem);
      throw new Error(mensagem);
    }
  };

  useEffect(() => {
    if (!autoLoad) {
      setAmbientes([]);
      setLoading(false);
      setError(null);
      return;
    }
    carregarAmbientes();
  }, [idPavimento, idObra, autoLoad]);

  return {
    ambientes,
    loading,
    error,
    carregarAmbientes,
    criar,
    atualizar,
    deletar,
  };
};
