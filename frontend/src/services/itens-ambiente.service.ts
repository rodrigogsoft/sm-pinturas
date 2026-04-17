import { api } from './api';

const API_URL = '/itens-ambiente';

export interface ItemAmbiente {
  id: string;
  id_ambiente: string;
  nome_elemento?: string | null;
  id_tabela_preco?: string | null;
  area_planejada: number | string;
  area_medida_total?: number;
  progresso?: number;
  status?: string;
  created_at: string;
  updated_at: string;
  ambiente?: any;
  tabelaPreco?: any;
}

export interface CreateItemAmbienteDto {
  id_ambiente: string;
  nome_elemento?: string;
  id_tabela_preco?: string;
  area_planejada: number;
}

export interface ItemLoteDto {
  nome_elemento: string;
  area_planejada: number;
}

export interface CreateItensAmbienteLoteDto {
  id_ambiente: string;
  id_ambientes?: string[];
  itens: ItemLoteDto[];
}

export interface ResultadoLote {
  criados: ItemAmbiente[];
  erros: string[];
}

export interface UpdateItemAmbienteDto {
  area_planejada?: number;
}

class ItensAmbienteService {
  async listar(idAmbiente?: string): Promise<ItemAmbiente[]> {
    const response = await api.get(API_URL, {
      params: idAmbiente ? { idAmbiente } : {},
    });
    return response.data;
  }

  async listarPorAmbiente(idAmbiente: string): Promise<ItemAmbiente[]> {
    const response = await api.get(`${API_URL}/ambiente/${idAmbiente}`);
    return response.data;
  }

  async listarPorObra(idObra: string): Promise<ItemAmbiente[]> {
    const response = await api.get(`${API_URL}/obra/${idObra}`);
    return response.data;
  }

  async listarPorPavimento(idPavimento: string): Promise<ItemAmbiente[]> {
    const response = await api.get(`${API_URL}/pavimento/${idPavimento}`);
    return response.data;
  }

  async buscarPorId(id: string): Promise<ItemAmbiente> {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  }

  async criar(dados: CreateItemAmbienteDto): Promise<ItemAmbiente> {
    const response = await api.post(API_URL, dados);
    return response.data;
  }

  async criarLote(dados: CreateItensAmbienteLoteDto): Promise<ResultadoLote> {
    const response = await api.post(`${API_URL}/lote`, dados);
    return response.data;
  }

  async atualizar(id: string, dados: UpdateItemAmbienteDto): Promise<ItemAmbiente> {
    const response = await api.patch(`${API_URL}/${id}`, dados);
    return response.data;
  }

  async deletar(id: string): Promise<void> {
    await api.delete(`${API_URL}/${id}`);
  }
}

export default new ItensAmbienteService();
