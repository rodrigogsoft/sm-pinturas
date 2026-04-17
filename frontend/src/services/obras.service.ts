import { api } from './api';

const API_URL = '/obras';

export enum StatusObraEnum {
  PLANEJAMENTO = 'PLANEJAMENTO',
  ATIVA = 'ATIVA',
  SUSPENSA = 'SUSPENSA',
  CONCLUIDA = 'CONCLUIDA',
}

export interface Obra {
  id: string;
  id_cliente: string;
  nome: string;
  endereco_completo: string;
  status: StatusObraEnum;
  data_inicio: string;
  data_previsao_fim?: string;
  data_conclusao?: string;
  observacoes?: string;
  geo_lat?: number;
  geo_long?: number;
  margem_minima_percentual: number;
  progresso: number;
  deletado: boolean;
  created_at: string;
  updated_at: string;
  cliente?: any;
}

class ObrasService {
  private normalizarLista(payload: unknown): Obra[] {
    if (Array.isArray(payload)) {
      return payload as Obra[];
    }

    if (payload && typeof payload === 'object') {
      const maybe = payload as { data?: unknown; items?: unknown };

      if (Array.isArray(maybe.data)) {
        return maybe.data as Obra[];
      }

      if (Array.isArray(maybe.items)) {
        return maybe.items as Obra[];
      }
    }

    return [];
  }

  async listar(): Promise<Obra[]> {
    const response = await api.get(API_URL);
    return this.normalizarLista(response.data);
  }

  async listarAtivas(): Promise<Obra[]> {
    const response = await api.get(API_URL);
    const obras = this.normalizarLista(response.data);
    return obras.filter(obra => obra.status === StatusObraEnum.ATIVA && !obra.deletado);
  }

  async buscarPorId(id: string): Promise<Obra> {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  }

  async criar(dados: Partial<Obra>): Promise<Obra> {
    const response = await api.post(API_URL, dados);
    return response.data;
  }

  async atualizar(id: string, dados: Partial<Obra>): Promise<Obra> {
    const response = await api.patch(`${API_URL}/${id}`, dados);
    return response.data;
  }

  async deletar(id: string): Promise<void> {
    await api.delete(`${API_URL}/${id}`);
  }
}

export default new ObrasService();
