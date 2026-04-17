import { useState, useEffect } from 'react';
import precosService, {
  TabelaPreco,
  CreatePrecoDto,
  UpdatePrecoDto,
  AprovarPrecoDto,
  MargemValidacao,
} from '../services/precos.service';

export const usePrecos = (idObra?: string) => {
  const [precos, setPrecos] = useState<TabelaPreco[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carregarPrecos = async () => {
    try {
      setLoading(true);
      setError(null);
      const dados = idObra
        ? await precosService.listarPorObra(idObra)
        : await precosService.listar();
      setPrecos(dados);
    } catch (err: any) {
      const mensagem = err.response?.data?.message || 'Erro ao carregar preços';
      setError(mensagem);
    } finally {
      setLoading(false);
    }
  };

  const criar = async (dados: CreatePrecoDto) => {
    try {
      setError(null);
      const novoPreco = await precosService.criar(dados);
      setPrecos([...precos, novoPreco]);
      return novoPreco;
    } catch (err: any) {
      const mensagem = err.response?.data?.message || 'Erro ao criar preço';
      setError(mensagem);
      throw new Error(mensagem);
    }
  };

  const atualizar = async (id: string, dados: UpdatePrecoDto) => {
    try {
      setError(null);
      const precoAtualizado = await precosService.atualizar(id, dados);
      setPrecos(precos.map((p) => (p.id === id ? precoAtualizado : p)));
      return precoAtualizado;
    } catch (err: any) {
      const mensagem = err.response?.data?.message || 'Erro ao atualizar preço';
      setError(mensagem);
      throw new Error(mensagem);
    }
  };

  const aprovar = async (id: string, dados: AprovarPrecoDto) => {
    try {
      setError(null);
      const precoAtualizado = await precosService.aprovar(id, dados);
      setPrecos(precos.map((p) => (p.id === id ? precoAtualizado : p)));
      return precoAtualizado;
    } catch (err: any) {
      const mensagem = err.response?.data?.message || 'Erro ao aprovar preço';
      setError(mensagem);
      throw new Error(mensagem);
    }
  };

  const submeter = async (id: string) => {
    try {
      setError(null);
      const precoAtualizado = await precosService.submeter(id);
      setPrecos(precos.map((p) => (p.id === id ? precoAtualizado : p)));
      return precoAtualizado;
    } catch (err: any) {
      const mensagem = err.response?.data?.message || 'Erro ao submeter preço';
      setError(mensagem);
      throw new Error(mensagem);
    }
  };

  const validarMargem = async (id: string): Promise<MargemValidacao | null> => {
    try {
      const validacao = await precosService.validarMargem(id);
      return validacao;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao validar margem');
      return null;
    }
  };

  const deletar = async (id: string) => {
    try {
      setError(null);
      await precosService.deletar(id);
      setPrecos(precos.filter((p) => p.id !== id));
    } catch (err: any) {
      const mensagem = err.response?.data?.message || 'Erro ao deletar preço';
      setError(mensagem);
      throw new Error(mensagem);
    }
  };

  useEffect(() => {
    carregarPrecos();
  }, [idObra]);

  return {
    precos,
    loading,
    error,
    carregarPrecos,
    criar,
    atualizar,
    aprovar,
    submeter,
    validarMargem,
    deletar,
  };
};
