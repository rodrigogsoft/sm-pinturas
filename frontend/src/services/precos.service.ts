import { api } from './api';

const API_URL = '/precos';

export interface TabelaPreco {
  id: string;
  id_obra: string;
  id_servico_catalogo: number;
  preco_custo: number;
  preco_venda: number;
  margem_percentual: number;
  status_aprovacao: 'RASCUNHO' | 'PENDENTE' | 'APROVADO' | 'REJEITADO';
  data_aprovacao: string | null;
  id_usuario_aprovador: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  obra?: any;
  servico?: any;
  aprovador?: any;
}

export interface CreatePrecoDto {
  id_obra: string;
  id_servico_catalogo: number;
  preco_custo: number;
  preco_venda: number;
  observacoes?: string;
}

export interface UpdatePrecoDto {
  preco_custo?: number;
  preco_venda?: number;
  observacoes?: string;
}

export interface AprovarPrecoDto {
  status: 'APROVADO' | 'REJEITADO';
  observacoes?: string;
}

export interface MargemValidacao {
  id: string;
  preco_custo: number;
  preco_venda: number;
  margem_percentual: number;
  margem_minima_exigida: number;
  atende_margem_minima: boolean;
  mensagem_validacao: string;
}

class PrecosService {
  async listar(idObra?: string): Promise<TabelaPreco[]> {
    const response = await api.get(API_URL, {
      params: idObra ? { idObra } : {},
    });
    return response.data;
  }

  async listarPorObra(idObra: string): Promise<TabelaPreco[]> {
    const response = await api.get(`${API_URL}/obra/${idObra}`);
    return response.data;
  }

  async buscarPorId(id: string): Promise<TabelaPreco> {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  }

  async criar(dados: CreatePrecoDto): Promise<TabelaPreco> {
    const response = await api.post(API_URL, dados);
    return response.data;
  }

  async atualizar(id: string, dados: UpdatePrecoDto): Promise<TabelaPreco> {
    const response = await api.patch(`${API_URL}/${id}`, dados);
    return response.data;
  }

  async aprovar(id: string, dados: AprovarPrecoDto): Promise<TabelaPreco> {
    const response = await api.patch(`${API_URL}/${id}/aprovar`, dados);
    return response.data;
  }

  async submeter(id: string): Promise<TabelaPreco> {
    // Nest/Express JSON parser in strict mode rejects primitive JSON bodies like `null`.
    // Send an empty object to keep the endpoint body-less in practice and avoid 400 parse errors.
    const response = await api.patch(`${API_URL}/${id}/submeter`, {});
    return response.data;
  }

  async retornarParaRascunho(id: string): Promise<TabelaPreco> {
    const response = await api.patch(`${API_URL}/${id}/retornar-rascunho`, {});
    return response.data;
  }

  async validarMargem(id: string): Promise<MargemValidacao> {
    const response = await api.get(`${API_URL}/${id}/margem`);
    return response.data;
  }

  async deletar(id: string): Promise<void> {
    await api.delete(`${API_URL}/${id}`);
  }

  async listarPendentes(): Promise<TabelaPreco[]> {
    const response = await api.get(`${API_URL}/pendentes/aprovacao`);
    return response.data;
  }

  async getEstatisticas(): Promise<{
    total: number;
    por_status: {
      rascunho: number;
      pendente: number;
      aprovado: number;
      rejeitado: number;
    };
  }> {
    const response = await api.get(`${API_URL}/estatisticas`);
    return response.data;
  }
}

export default new PrecosService();
