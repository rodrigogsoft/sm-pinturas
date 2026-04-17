import { api } from './api';

const API_URL = '';

export interface ListarExcedentesParams {
  id_sessao?: string;
  id_obra?: string;
  id_colaborador?: string;
  data_inicio?: string;
  data_fim?: string;
}

export interface CreateMedicaoDto {
  id_alocacao: string;
  qtd_executada: number;
  area_planejada?: number;
  flag_excedente?: boolean;
  justificativa?: string;
  foto_evidencia_url?: string;
  data_medicao?: string;
  justificativa_excecao_admin?: string;
}

class MedicoesService {
  async listar(filtros?: {
    id_sessao?: string;
    id_obra?: string;
    id_ambiente?: string;
    data_inicio?: string;
    data_fim?: string;
    flag_excedente?: boolean;
  }) {
    const params: any = {};
    if (filtros?.id_sessao) params.id_sessao = filtros.id_sessao;
    if (filtros?.id_obra) params.id_obra = filtros.id_obra;
    if (filtros?.id_ambiente) params.id_ambiente = filtros.id_ambiente;
    if (filtros?.data_inicio) params.data_inicio = filtros.data_inicio;
    if (filtros?.data_fim) params.data_fim = filtros.data_fim;
    if (filtros?.flag_excedente !== undefined) {
      params.flag_excedente = filtros.flag_excedente;
    }

    return api.get(`${API_URL}/medicoes`, { params });
  }

  async listarExcedentes(filtros?: ListarExcedentesParams) {
    const params: any = { flag_excedente: true };
    if (filtros?.id_sessao) params.id_sessao = filtros.id_sessao;
    
    if (filtros?.id_obra) params.id_obra = filtros.id_obra;
    if (filtros?.id_colaborador) params.id_colaborador = filtros.id_colaborador;
    if (filtros?.data_inicio) params.data_inicio = filtros.data_inicio;
    if (filtros?.data_fim) params.data_fim = filtros.data_fim;

    return api.get(`${API_URL}/medicoes`, { params });
  }

  async buscarPorId(id: string) {
    return api.get(`${API_URL}/medicoes/${id}`);
  }

  async criar(data: CreateMedicaoDto) {
    return api.post(`${API_URL}/medicoes`, data);
  }

  async atualizar(id: string, data: Partial<CreateMedicaoDto>) {
    return api.patch(`${API_URL}/medicoes/${id}`, data);
  }

  async deletar(id: string) {
    return api.delete(`${API_URL}/medicoes/${id}`);
  }

  async obterEstatisticas(id_obra?: string) {
    const params = id_obra ? { id_obra } : {};
    return api.get(`${API_URL}/medicoes/estatisticas`, { params });
  }
}

export const medicoesService = new MedicoesService();
