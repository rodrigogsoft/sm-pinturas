// Dashboard Financeiro
export interface DashboardFinanceiroResponse {
  periodo: {
    tipo: string;
    inicio: string;
    fim: string;
  };
  metricas: {
    total_medicoes: number;
    obras_ativas: number;
    custo_total: number;
    receita_total: number;
    lucro_bruto: number;
    margem_percentual: number;
    area_medida_total?: number;
  };
  por_obra: Array<{
    obra_id: string;
    obra_nome: string;
    custo: number;
    receita: number;
    lucro: number;
    margem: number;
    medicoes: number;
    area_medida_total?: number;
    area_planejada_total?: number;
    progresso_percentual?: number;
  }>;
}

// Medições
export interface MedicaoRelatorio {
  id_medicao: string;
  nome_obra: string;
  data_medicao: string;
  area_pintada: number;
  valor_total: number;
  status_pagamento: string;
  encarregado: string;
}

export interface MedicoesResponse {
  medicoes: MedicaoRelatorio[];
  total: number;
  page: number;
  limit: number;
}

// Produtividade
export interface ProdutividadeColaborador {
  id_colaborador: string;
  nome_colaborador: string;
  total_horas: number;
  area_total_pintada: number;
  horas_por_m2: number;
}

export interface ProdutividadeResponse {
  periodo: string;
  data_inicio: string;
  data_fim: string;
  colaboradores: ProdutividadeColaborador[];
}

// Margem de Lucro
export interface MargemObraRelatorio {
  id_obra: string;
  nome_obra: string;
  servico?: string;
  valor_contrato: number;
  custo_total: number;
  margem_lucro: number;
  percentual_margem: number;
}

export interface MargemLucroResponse {
  obras: MargemObraRelatorio[];
  total: number;
  page: number;
  limit: number;
}
