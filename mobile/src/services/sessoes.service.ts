import { api } from './api';

export interface SessaoDiaria {
  id: string;
  id_obra?: string;
  id_encarregado: string;
  data_sessao: string;
  hora_inicio: string;
  hora_fim?: string | null;
  status?: string;
}

export interface CreateSessaoDto {
  id_encarregado: string;
  id_obra?: string;
  data_sessao: string;
  hora_inicio: string;
  geo_lat?: number;
  geo_long?: number;
  observacoes?: string;
}

export class SessoesService {
  static async buscarSessaoAberta(id_encarregado: string): Promise<SessaoDiaria | null> {
    try {
      const response = await api.get(`/sessoes/aberta/${id_encarregado}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw new Error(error.response?.data?.message || 'Erro ao buscar sessao aberta');
    }
  }

  static async criarSessao(data: CreateSessaoDto): Promise<SessaoDiaria> {
    try {
      const response = await api.post('/sessoes', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao criar sessao');
    }
  }
}
