import { apiClient } from './api';

export enum CategoriaServicoEnum {
  PINTURA = 'PINTURA',
  ELETRICA = 'ELETRICA',
  HIDRAULICA = 'HIDRAULICA',
  ALVENARIA = 'ALVENARIA',
  ACABAMENTO = 'ACABAMENTO',
  MARCENARIA = 'MARCENARIA',
  GESSO = 'GESSO',
  ESQUADRIAS = 'ESQUADRIAS',
  OUTROS = 'OUTROS',
}

export interface Servico {
  id: string;
  nome: string;
  descricao?: string;
  unidade_medida: string;
  categoria: CategoriaServicoEnum;
  ativo: boolean;
}

export interface EstatisticasServico {
  servico: {
    id: string;
    nome: string;
    categoria: string;
  };
  total_obras: number;
  total_medicoes: number;
  ultima_utilizacao: string | null;
  obras_ativas: string[];
}

class ServicosService {
  /**
   * Busca todos os serviços com filtros
   */
  async getServicos(filtros?: {
    categoria?: CategoriaServicoEnum;
    unidade?: string;
    search?: string;
    orderBy?: 'nome' | 'categoria' | 'mais_usado';
    ativo?: boolean;
  }): Promise<Servico[]> {
    try {
      const response = await apiClient.getClient().get<Servico[]>('/servicos', {
        params: {
          categoria: filtros?.categoria,
          unidade: filtros?.unidade,
          search: filtros?.search,
          orderBy: filtros?.orderBy || 'nome',
          ativo: filtros?.ativo !== undefined ? filtros.ativo : true,
        },
      });
      return response.data || [];
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
      return [];
    }
  }

  /**
   * Busca um serviço por ID
   */
  async getServicoById(id: string): Promise<Servico | null> {
    try {
      const response = await apiClient.getClient().get<Servico>(`/servicos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar serviço:', error);
      return null;
    }
  }

  /**
   * Busca estatísticas de uso de um serviço
   */
  async getEstatisticasServico(id: string): Promise<EstatisticasServico | null> {
    try {
      const response = await apiClient.getClient().get<EstatisticasServico>(
        `/servicos/${id}/estatisticas`
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return null;
    }
  }

  /**
   * Lista todas as categorias disponíveis
   */
  getCategorias(): { value: CategoriaServicoEnum; label: string }[] {
    return [
      { value: CategoriaServicoEnum.PINTURA, label: 'Pintura' },
      { value: CategoriaServicoEnum.ELETRICA, label: 'Elétrica' },
      { value: CategoriaServicoEnum.HIDRAULICA, label: 'Hidráulica' },
      { value: CategoriaServicoEnum.ALVENARIA, label: 'Alvenaria' },
      { value: CategoriaServicoEnum.ACABAMENTO, label: 'Acabamento' },
      { value: CategoriaServicoEnum.MARCENARIA, label: 'Marcenaria' },
      { value: CategoriaServicoEnum.GESSO, label: 'Gesso' },
      { value: CategoriaServicoEnum.ESQUADRIAS, label: 'Esquadrias' },
      { value: CategoriaServicoEnum.OUTROS, label: 'Outros' },
    ];
  }

  /**
   * Retorna ícone para cada categoria
   */
  getIconeCategoria(categoria: CategoriaServicoEnum): string {
    const icones: Record<CategoriaServicoEnum, string> = {
      [CategoriaServicoEnum.PINTURA]: 'format-paint',
      [CategoriaServicoEnum.ELETRICA]: 'lightning-bolt',
      [CategoriaServicoEnum.HIDRAULICA]: 'water',
      [CategoriaServicoEnum.ALVENARIA]: 'wall',
      [CategoriaServicoEnum.ACABAMENTO]: 'brush',
      [CategoriaServicoEnum.MARCENARIA]: 'saw-blade',
      [CategoriaServicoEnum.GESSO]: 'ceiling-light',
      [CategoriaServicoEnum.ESQUADRIAS]: 'door',
      [CategoriaServicoEnum.OUTROS]: 'wrench',
    };
    return icones[categoria] || 'tools';
  }

  /**
   * Retorna cor para cada categoria
   */
  getCorCategoria(categoria: CategoriaServicoEnum): string {
    const cores: Record<CategoriaServicoEnum, string> = {
      [CategoriaServicoEnum.PINTURA]: '#2196f3',
      [CategoriaServicoEnum.ELETRICA]: '#ff9800',
      [CategoriaServicoEnum.HIDRAULICA]: '#00bcd4',
      [CategoriaServicoEnum.ALVENARIA]: '#795548',
      [CategoriaServicoEnum.ACABAMENTO]: '#9c27b0',
      [CategoriaServicoEnum.MARCENARIA]: '#8d6e63',
      [CategoriaServicoEnum.GESSO]: '#9e9e9e',
      [CategoriaServicoEnum.ESQUADRIAS]: '#607d8b',
      [CategoriaServicoEnum.OUTROS]: '#757575',
    };
    return cores[categoria] || '#666';
  }
}

export const servicosService = new ServicosService();
