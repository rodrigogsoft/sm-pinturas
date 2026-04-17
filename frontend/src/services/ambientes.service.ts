import { api } from './api';

const API_URL = '/ambientes';

export interface Ambiente {
  id: string;
  id_pavimento: string;
  nome: string;
  area_m2: number | null;
  descricao: string | null;
  created_at: string;
  updated_at: string;
  pavimento?: any;
}

export interface CreateAmbienteDto {
  id_pavimento: string;
  nome: string;
  area_m2?: number;
  descricao?: string;
}

export interface UpdateAmbienteDto {
  nome?: string;
  area_m2?: number;
  descricao?: string;
}

export type CategoriaAmbienteLote = 'APARTAMENTO' | 'COMUM';
export type ModoConflitoLote = 'FAIL' | 'SKIP';

export interface TipoAmbienteLoteDto {
  categoria: CategoriaAmbienteLote;
  nomeBase?: string;
  areaM2: number;
  qtdPorPavimento: number;
}

export interface CreateAmbientesLoteDto {
  obraId: string;
  pavimentoIds: string[];
  tipos: TipoAmbienteLoteDto[];
  modoConflito?: ModoConflitoLote;
}

export interface CreateAmbientesLoteResponse {
  criados: number;
  pulados: number;
  conflitos: string[];
}

class AmbientesService {
  async listar(): Promise<Ambiente[]> {
    const response = await api.get(API_URL);
    return response.data;
  }

  async listarPorPavimento(idPavimento: string): Promise<Ambiente[]> {
    const response = await api.get(`${API_URL}/pavimento/${idPavimento}`);
    return response.data;
  }

  async listarPorObra(idObra: string): Promise<Ambiente[]> {
    const response = await api.get(`${API_URL}/obra/${idObra}`);
    return response.data;
  }

  async buscarPorId(id: string): Promise<Ambiente> {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  }

  async criar(dados: CreateAmbienteDto): Promise<Ambiente> {
    const response = await api.post(API_URL, dados);
    return response.data;
  }

  async criarLote(
    dados: CreateAmbientesLoteDto,
  ): Promise<CreateAmbientesLoteResponse> {
    const response = await api.post(`${API_URL}/lote`, dados);
    return response.data;
  }

  async atualizar(id: string, dados: UpdateAmbienteDto): Promise<Ambiente> {
    const response = await api.patch(`${API_URL}/${id}`, dados);
    return response.data;
  }

  async deletar(id: string): Promise<void> {
    await api.delete(`${API_URL}/${id}`);
  }
}

export default new AmbientesService();
