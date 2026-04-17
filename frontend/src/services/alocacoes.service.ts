import { api } from './api';

const API_URL = '/alocacoes';

export interface CreateAlocacaoDto {
  id_colaborador: string;
  id_ambiente: string;
  data_inicio?: string;
  data_fim?: string;
}

export interface Alocacao {
  id: string;
  id_colaborador: string;
  id_ambiente: string;
  nomeColaborador: string;
  nomeAmbiente: string;
  area_planejada: number;
  status: string;
  data_inicio?: string;
  data_fim?: string;
}

class AlocacoesService {
  async listar(filtros?: {
    status?: string;
    id_sessao?: string;
    id_obra?: string;
    id_colaborador?: string;
    id_ambiente?: string;
  }) {
    const params: any = {};
    if (filtros?.status) params.status = filtros.status;
    if (filtros?.id_sessao) params.id_sessao = filtros.id_sessao;
    if (filtros?.id_obra) params.id_obra = filtros.id_obra;
    if (filtros?.id_colaborador) params.id_colaborador = filtros.id_colaborador;
    if (filtros?.id_ambiente) params.id_ambiente = filtros.id_ambiente;

    return api.get(API_URL, { params });
  }

  async listarAtivas() {
    return api.get(`${API_URL}/ativas`);
  }

  async buscarPorId(id: string) {
    return api.get(`${API_URL}/${id}`);
  }

  async criar(data: CreateAlocacaoDto) {
    return api.post(API_URL, data);
  }

  async atualizar(id: string, data: Partial<CreateAlocacaoDto>) {
    return api.patch(`${API_URL}/${id}`, data);
  }

  async deletar(id: string) {
    return api.delete(`${API_URL}/${id}`);
  }

  async verificarAmbienteOcupado(id_ambiente: string) {
    return api.get(`${API_URL}/ambiente/${id_ambiente}/ocupado`);
  }

  async calcularDuracao(id: string) {
    return api.get(`${API_URL}/${id}/duracao`);
  }
}

export const alocacoesService = new AlocacoesService();
