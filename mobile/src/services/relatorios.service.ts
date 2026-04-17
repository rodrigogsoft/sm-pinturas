import { apiClient } from './api';
import { DashboardFinanceiro } from './dashboard.service';

export enum PeriodoEnum {
  DIA = 'dia',
  SEMANA = 'semana',
  MES = 'mes',
  ANO = 'ano',
}

export enum GranularidadeEnum {
  DIARIA = 'DIARIA',
  SEMANAL = 'SEMANAL',
  MENSAL = 'MENSAL',
}

export enum MetricaEnum {
  RECEITA = 'RECEITA',
  CUSTO = 'CUSTO',
  LUCRO = 'LUCRO',
  MARGEM = 'MARGEM',
}

export enum MetricaRankingEnum {
  MARGEM = 'MARGEM',
  RECEITA = 'RECEITA',
  LUCRO = 'LUCRO',
  PRODUTIVIDADE = 'PRODUTIVIDADE',
}

export interface RelatorioMedicoes {
  data: Array<{
    id: string;
    obra_nome: string;
    ambiente_nome: string;
    servico_nome: string;
    quantidade: number;
    data_execucao: string;
    status: string;
  }>;
  total: number;
}

export interface RelatorioExcedentes {
  resumo: {
    total_medicoes: number;
    medicoes_excedentes: number;
    percentual_excedente: number;
    valor_total_excedente: number;
  };
  top_ambientes: Array<{
    ambiente_id: string;
    ambiente_nome: string;
    obra_nome: string;
    total_excedente: number;
    percentual_excedente: number;
  }>;
  top_colaboradores: Array<{
    colaborador_id: string;
    colaborador_nome: string;
    total_medicoes: number;
    medicoes_excedentes: number;
    percentual_excedente: number;
  }>;
}

export interface RankingObras {
  ranking: Array<{
    obra_id: string;
    obra_nome: string;
    posicao: number;
    margem: number;
    receita: number;
    lucro: number;
    produtividade: number;
    medicoes: number;
  }>;
}

export interface EvolucaoTemporal {
  metrica: MetricaEnum;
  granularidade: GranularidadeEnum;
  serie: Array<{
    periodo: string;
    valor: number;
  }>;
  total: number;
  media: number;
}

class RelatoriosService {
  /**
   * Busca dashboard financeiro com comparativo
   */
  async getDashboardComComparativo(
    periodo: PeriodoEnum = PeriodoEnum.MES,
    idObra?: string
  ): Promise<any> {
    try {
      const response = await apiClient.getClient().get(
        '/relatorios/dashboard-financeiro/comparativo',
        {
          params: { periodo, id_obra: idObra },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar dashboard com comparativo:', error);
      return null;
    }
  }

  /**
   * Busca relatório de medições
   */
  async getRelatorioMedicoes(filtros?: {
    periodo?: PeriodoEnum;
    idObra?: string;
    status?: string;
  }): Promise<RelatorioMedicoes | null> {
    try {
      const response = await apiClient.getClient().get<RelatorioMedicoes>(
        '/relatorios/medicoes',
        {
          params: {
            periodo: filtros?.periodo,
            id_obra: filtros?.idObra,
            status: filtros?.status,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar relatório de medições:', error);
      return null;
    }
  }

  /**
   * Busca relatório de excedentes
   */
  async getRelatorioExcedentes(
    periodo?: PeriodoEnum,
    idObra?: string
  ): Promise<RelatorioExcedentes | null> {
    try {
      const response = await apiClient.getClient().get<RelatorioExcedentes>(
        '/relatorios/excedentes',
        {
          params: { periodo, id_obra: idObra },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar relatório de excedentes:', error);
      return null;
    }
  }

  /**
   * Busca ranking de obras
   */
  async getRankingObras(
    metrica: MetricaRankingEnum,
    ordem: 'ASC' | 'DESC' = 'DESC',
    limit: number = 10,
    periodo?: PeriodoEnum
  ): Promise<RankingObras | null> {
    try {
      const response = await apiClient.getClient().get<RankingObras>(
        '/relatorios/ranking-obras',
        {
          params: { metrica, ordem, limit, periodo },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar ranking de obras:', error);
      return null;
    }
  }

  /**
   * Busca evolução temporal de uma métrica
   */
  async getEvolucaoTemporal(
    granularidade: GranularidadeEnum,
    metrica: MetricaEnum,
    idObra?: string,
    periodo?: PeriodoEnum
  ): Promise<EvolucaoTemporal | null> {
    try {
      const response = await apiClient.getClient().get<EvolucaoTemporal>(
        '/relatorios/evolucao-temporal',
        {
          params: { granularidade, metrica, id_obra: idObra, periodo },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar evolução temporal:', error);
      return null;
    }
  }

  /**
   * Exporta dashboard para CSV ou Excel
   * Retorna URL de download
   */
  getUrlExportDashboard(
    formato: 'csv' | 'excel',
    periodo?: PeriodoEnum,
    idObra?: string
  ): string {
    const baseUrl = apiClient.getClient().defaults.baseURL;
    const params = new URLSearchParams();
    params.append('formato', formato);
    if (periodo) params.append('periodo', periodo);
    if (idObra) params.append('id_obra', idObra);
    
    return `${baseUrl}/relatorios/dashboard-financeiro/export?${params.toString()}`;
  }
}

export const relatoriosService = new RelatoriosService();
