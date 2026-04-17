import { AxiosError } from 'axios';
import { api } from './api';

export interface CreateAlocacaoDto {
  id_sessao: string;
  id_ambiente: string;
  id_colaborador: string;
  id_item_ambiente?: string;
  id_servico_catalogo?: string;
  observacoes?: string;
}

export interface AlocacaoTarefa {
  id: string;
  id_sessao: string;
  id_ambiente: string;
  id_colaborador: string;
  id_item_ambiente: string | null;
  id_servico_catalogo: string | null;
  status: 'EM_ANDAMENTO' | 'CONCLUIDO' | 'PAUSADO';
  hora_inicio: string;
  hora_fim: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  ambiente: {
    id: string;
    nome: string;
    area_m2: number;
    pavimento: {
      id: string;
      nome: string;
    };
  };
  colaborador: {
    id: string;
    nome_completo: string;
    cpf: string;
  };
  item_ambiente?: {
    id: string;
    nome_item: string;
  };
}

export interface ConflictError {
  message: string;
  codigo: 'AMBIENTE_OCUPADO' | 'COLABORADOR_OCUPADO';
  colaborador_atual?: {
    id: string;
    nome: string;
  };
  ambiente_atual?: {
    id: string;
    nome: string;
  };
  alocacao_id: string;
}

interface ApiErrorPayload {
  message?: string;
  codigo?: string;
  [key: string]: unknown;
}

export class AlocacoesService {
  private static toErrorMessage(error: unknown, fallback: string): string {
    const axiosError = error as AxiosError<ApiErrorPayload>;
    return axiosError.response?.data?.message || fallback;
  }

  /**
   * Criar nova alocação (drag & drop)
   */
  static async criar(data: CreateAlocacaoDto): Promise<AlocacaoTarefa> {
    try {
      const response = await api.post('/alocacoes', data);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ApiErrorPayload>;
      if (axiosError.response?.status === 409) {
        // ConflictException - ambiente ou colaborador ocupado
        throw axiosError.response.data as ConflictError;
      }
      throw new Error(this.toErrorMessage(error, 'Erro ao criar alocação'));
    }
  }

  /**
   * Listar alocações da sessão
   */
  static async listarPorSessao(id_sessao: string): Promise<AlocacaoTarefa[]> {
    try {
      const response = await api.get('/alocacoes', {
        params: { id_sessao },
      });
      return response.data;
    } catch (error: unknown) {
      throw new Error(this.toErrorMessage(error, 'Erro ao listar alocações'));
    }
  }

  /**
   * Listar alocações ativas (Em Andamento)
   */
  static async listarAtivas(id_sessao: string): Promise<AlocacaoTarefa[]> {
    try {
      const response = await api.get('/alocacoes', {
        params: {
          id_sessao,
          status: 'EM_ANDAMENTO',
        },
      });
      return response.data;
    } catch (error: unknown) {
      throw new Error(this.toErrorMessage(error, 'Erro ao listar alocações ativas'));
    }
  }

  /**
   * Buscar alocação por ID
   */
  static async buscarPorId(id: string): Promise<AlocacaoTarefa> {
    try {
      const response = await api.get(`/alocacoes/${id}`);
      return response.data;
    } catch (error: unknown) {
      throw new Error(this.toErrorMessage(error, 'Erro ao buscar alocação'));
    }
  }

  /**
   * Concluir alocação
   */
  static async concluir(
    id: string,
    data: { observacoes?: string }
  ): Promise<AlocacaoTarefa> {
    try {
      const response = await api.patch(`/alocacoes/${id}/concluir`, data);
      return response.data;
    } catch (error: unknown) {
      throw new Error(this.toErrorMessage(error, 'Erro ao concluir alocação'));
    }
  }

  /**
   * Pausar alocação
   */
  static async pausar(id: string): Promise<AlocacaoTarefa> {
    try {
      const response = await api.patch(`/alocacoes/${id}/pausar`, {});
      return response.data;
    } catch (error: unknown) {
      throw new Error(this.toErrorMessage(error, 'Erro ao pausar alocação'));
    }
  }

  /**
   * Retomar alocação pausada
   */
  static async retomar(id: string): Promise<AlocacaoTarefa> {
    try {
      const response = await api.patch(`/alocacoes/${id}/retomar`, {});
      return response.data;
    } catch (error: unknown) {
      throw new Error(this.toErrorMessage(error, 'Erro ao retomar alocação'));
    }
  }

  /**
   * Verificar se ambiente está ocupado
   */
  static async verificarAmbienteOcupado(id_ambiente: string): Promise<{
    ocupado: boolean;
    alocacao?: AlocacaoTarefa;
  }> {
    try {
      const response = await api.get('/alocacoes', {
        params: {
          id_ambiente,
          status: 'EM_ANDAMENTO',
        },
      });
      const alocacoes = response.data as AlocacaoTarefa[];
      return {
        ocupado: alocacoes.length > 0,
        alocacao: alocacoes[0],
      };
    } catch (error: unknown) {
      throw new Error(this.toErrorMessage(error, 'Erro ao verificar ambiente'));
    }
  }

  /**
   * Obter estatísticas da sessão
   */
  static async obterEstatisticas(id_sessao: string): Promise<{
    total_alocacoes: number;
    em_andamento: number;
    concluidas: number;
    pausadas: number;
    colaboradores_ativos: number;
    ambientes_ativos: number;
  }> {
    try {
      const response = await api.get(`/alocacoes/estatisticas/${id_sessao}`);
      return response.data;
    } catch (error: unknown) {
      throw new Error(this.toErrorMessage(error, 'Erro ao obter estatísticas'));
    }
  }
}
