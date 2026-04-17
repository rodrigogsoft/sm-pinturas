import { apiClient } from './api';

export interface ResumoHome {
  obrasAtivas: number;
  medicoesPendentes: number;
  rdosDiarias: number;
  saldoFaturamento: number;
}

export interface DashboardFinanceiro {
  metricas: {
    obras_ativas: number;
    total_medicoes: number;
    custo_total: number;
    receita_total: number;
    lucro_bruto: number;
    margem_percentual: number;
  };
  por_obra: Array<{
    obra_id: string;
    obra_nome: string;
    medicoes: number;
    custo: number;
    receita: number;
    lucro: number;
    margem: number;
  }>;
}

class DashboardService {
  private normalizePeriodo(periodo: string): string {
    return (periodo || 'mes').toLowerCase();
  }

  /**
   * Busca resumo para a tela inicial (Home)
   * Combina dados de obras ativas e dashboard financeiro
   */
  async getResumoHome(): Promise<ResumoHome> {
    try {
      // Buscar dashboard financeiro do mês atual
      const dashboardResponse = await apiClient.getClient().get<DashboardFinanceiro>(
        '/relatorios/dashboard-financeiro',
        {
          params: { periodo: this.normalizePeriodo('MES') },
        }
      );

      const dashboard = dashboardResponse.data;

      let medicoesPendentes = 0;

      // ERS 4.1: prioriza fonte de pendências por medição individual.
      try {
        const pendentesResponse = await apiClient
          .getClient()
          .get('/financeiro/medicoes-colaborador/para-lote');
        const raw = pendentesResponse.data;
        const lista = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.items)
          ? raw.items
          : [];
        medicoesPendentes = lista.length;
      } catch {
        // Fallback legado.
        const medicoesResponse = await apiClient.getClient().get('/medicoes', {
          params: {
            status: 'PENDENTE',
            limit: 1000,
          },
        });
        medicoesPendentes = medicoesResponse.data?.data?.length || 0;
      }

      return {
        obrasAtivas: dashboard.metricas.obras_ativas || 0,
        medicoesPendentes,
        rdosDiarias: dashboard.metricas.total_medicoes || 0,
        saldoFaturamento: dashboard.metricas.receita_total || 0,
      };
    } catch (error) {
      // Retornar dados vazios em caso de erro
      return {
        obrasAtivas: 0,
        medicoesPendentes: 0,
        rdosDiarias: 0,
        saldoFaturamento: 0,
      };
    }
  }

  /**
   * Busca dashboard financeiro completo
   */
  async getDashboardFinanceiro(
    periodo: 'DIA' | 'SEMANA' | 'MES' | 'ANO' = 'MES',
    idObra?: string
  ): Promise<DashboardFinanceiro | null> {
    try {
      const response = await apiClient.getClient().get<DashboardFinanceiro>(
        '/relatorios/dashboard-financeiro',
        {
          params: { periodo: this.normalizePeriodo(periodo), id_obra: idObra },
        }
      );
      return response.data;
    } catch (error) {
      return null;
    }
  }
}

export const dashboardService = new DashboardService();
