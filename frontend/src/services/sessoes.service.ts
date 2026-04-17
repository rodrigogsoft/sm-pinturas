import { api } from './api';

const API_URL = '/sessoes';

export interface Sessao {
  id: string;
  id_encarregado: string;
  id_obra: string;
  data_sessao: string;
  hora_inicio: string;
  hora_fim: string | null;
  geo_lat: number | null;
  geo_long: number | null;
  assinatura_url: string | null;
  nome_assinante: string | null;
  cpf_assinante: string | null;
  observacoes: string | null;
  status: 'ABERTA' | 'ENCERRADA';
  created_at: string;
  updated_at: string;
  encarregado?: {
    id: string;
    nome_completo?: string;
  };
}

export interface CreateSessaoDto {
  id_obra: string;
  data_sessao: string;
  hora_inicio: string;
  geo_lat: number;
  geo_long: number;
  assinatura_url: string;
  nome_assinante: string;
  cpf_assinante?: string;
  observacoes?: string;
}

export interface EncerrarSessaoDto {
  hora_fim?: string;
  assinatura_url?: string;
  observacoes?: string;
  justificativa?: string;
  nome_assinante?: string;
  cpf_assinante?: string;
}

class SessoesService {
  async listar(filtros?: {
    id_encarregado?: string;
    id_obra?: string;
    data_inicio?: string;
    data_fim?: string;
    status?: string;
  }): Promise<Sessao[]> {
    const response = await api.get(API_URL, {
      params: filtros,
    });
    return response.data;
  }

  async buscarPorId(id: string): Promise<Sessao> {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  }

  async buscarSessaoAberta(id_encarregado: string): Promise<Sessao | null> {
    try {
      const response = await api.get(`${API_URL}/aberta/${id_encarregado}`);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async criar(dados: CreateSessaoDto): Promise<Sessao> {
    const response = await api.post(API_URL, dados);
    return response.data;
  }

  async encerrar(id: string, dados: EncerrarSessaoDto): Promise<Sessao> {
    const response = await api.post(`${API_URL}/${id}/encerrar`, dados);
    return response.data;
  }

  async calcularDuracao(id: string): Promise<{ duracao_horas: number }> {
    const response = await api.get(`${API_URL}/${id}/duracao`);
    return response.data;
  }

  async deletar(id: string): Promise<void> {
    await api.delete(`${API_URL}/${id}`);
  }
}

export default new SessoesService();
