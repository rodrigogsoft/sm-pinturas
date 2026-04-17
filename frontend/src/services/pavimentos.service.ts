import { api } from './api';

const API_URL = '/pavimentos';

export interface Pavimento {
  id: string;
  id_obra: string;
  nome: string;
  ordem: number;
  progresso: number;
  status_progresso: string;
  created_at: string;
  updated_at: string;
  obra?: any;
  ambientes?: any[];
}

export interface CreatePavimentoDto {
  id_obra: string;
  nome: string;
  ordem: number;
}

export interface UpdatePavimentoDto {
  nome?: string;
  ordem?: number;
}

export interface CreatePavimentosLoteDto {
  obraId: string;
  qtdPavimentosAcima: number;
  temTerreo: boolean;
  temCobertura: boolean;
  temSubsolo: boolean;
  qtdSubsolos?: number;
}

class PavimentosService {
  async listar(): Promise<Pavimento[]> {
    const response = await api.get(API_URL);
    return response.data;
  }

  async listarPorObra(idObra: string): Promise<Pavimento[]> {
    const response = await api.get(`${API_URL}/obra/${idObra}`);
    return response.data;
  }

  async buscarPorId(id: string): Promise<Pavimento> {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  }

  async criar(dados: CreatePavimentoDto): Promise<Pavimento> {
    const response = await api.post(API_URL, dados);
    return response.data;
  }

  async criarLote(dados: CreatePavimentosLoteDto): Promise<Pavimento[]> {
    const response = await api.post(`${API_URL}/lote`, dados);
    return response.data;
  }

  async atualizar(id: string, dados: UpdatePavimentoDto): Promise<Pavimento> {
    const response = await api.patch(`${API_URL}/${id}`, dados);
    return response.data;
  }

  async deletar(id: string): Promise<void> {
    await api.delete(`${API_URL}/${id}`);
  }
}

export default new PavimentosService();
