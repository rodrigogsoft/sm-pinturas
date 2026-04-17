import { useState, useEffect } from 'react';
import itensAmbienteService, {
  ItemAmbiente,
  CreateItemAmbienteDto,
  UpdateItemAmbienteDto,
} from '../services/itens-ambiente.service';

export interface FiltrosItensAmbiente {
  idObra?: string;
  idPavimento?: string;
  idAmbiente?: string;
}

export const useItensAmbiente = (filtros?: FiltrosItensAmbiente) => {
  const [itens, setItens] = useState<ItemAmbiente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carregarItens = async () => {
    try {
      setLoading(true);
      setError(null);
      let dados: ItemAmbiente[];
      
      if (filtros?.idAmbiente) {
        dados = await itensAmbienteService.listarPorAmbiente(filtros.idAmbiente);
      } else if (filtros?.idPavimento) {
        dados = await itensAmbienteService.listarPorPavimento(filtros.idPavimento);
      } else if (filtros?.idObra) {
        dados = await itensAmbienteService.listarPorObra(filtros.idObra);
      } else {
        dados = await itensAmbienteService.listar();
      }
      setItens(dados);
    } catch (err: any) {
      const mensagem = err.response?.data?.message || 'Erro ao carregar itens';
      setError(mensagem);
    } finally {
      setLoading(false);
    }
  };

  const criar = async (dados: CreateItemAmbienteDto) => {
    try {
      setError(null);
      const novoItem = await itensAmbienteService.criar(dados);
      setItens([...itens, novoItem]);
      return novoItem;
    } catch (err: any) {
      const mensagem = err.response?.data?.message || 'Erro ao criar item';
      setError(mensagem);
      throw new Error(mensagem);
    }
  };

  const atualizar = async (id: string, dados: UpdateItemAmbienteDto) => {
    try {
      setError(null);
      const itemAtualizado = await itensAmbienteService.atualizar(id, dados);
      setItens(itens.map((i) => (i.id === id ? itemAtualizado : i)));
      return itemAtualizado;
    } catch (err: any) {
      const mensagem = err.response?.data?.message || 'Erro ao atualizar item';
      setError(mensagem);
      throw new Error(mensagem);
    }
  };

  const deletar = async (id: string) => {
    try {
      setError(null);
      await itensAmbienteService.deletar(id);
      setItens(itens.filter((i) => i.id !== id));
    } catch (err: any) {
      const mensagem = err.response?.data?.message || 'Erro ao deletar item';
      setError(mensagem);
      throw new Error(mensagem);
    }
  };

  useEffect(() => {
    carregarItens();
  }, [filtros?.idObra, filtros?.idPavimento, filtros?.idAmbiente]);

  return {
    itens,
    loading,
    error,
    carregarItens,
    criar,
    atualizar,
    deletar,
  };
};
