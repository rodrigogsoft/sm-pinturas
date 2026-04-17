import { api } from './api';

export type StatusLote =
  | 'ABERTO'
  | 'PAGO'
  | 'CANCELADO';

export interface LotePagamento {
  id: string;
  descricao: string;
  data_competencia: string;
  data_pagamento: string | null;
  valor_total: number | string;
  qtd_medicoes: number;
  status: StatusLote;
  tipo_pagamento?: string | null;
}

export interface ProcessarPagamentoDto {
  data_pagamento: string;
  tipo_pagamento: 'PIX' | 'TED' | 'DINHEIRO' | 'CHEQUE';
  observacoes?: string;
}

export interface DashboardFinanceiroResumo {
  total_lotes: number;
  total_pago: number;
  total_pendente: number;
  por_status: {
    aberto: number;
    pago: number;
    cancelado: number;
  };
}

export interface FiltrosFolhaIndividual {
  data_inicio?: string;
  data_fim?: string;
  id_colaborador?: string;
  id_lote_pagamento?: string;
  id_obra?: string;
  colaborador?: string;
  servico?: string;
  status?: 'ABERTO' | 'PAGO' | 'CANCELADO';
  page?: number;
  limit?: number;
}

export interface FolhaIndividualAgregadaItem {
  chave: string;
  id_colaborador: string;
  nome_colaborador: string;
  competencia: string;
  servicos: string[];
  medicao: number;
  valor: number;
  status: 'ABERTO' | 'PAGO' | 'CANCELADO';
  medicoes_ids: string[];
}

export interface FolhaIndividualItem {
  id: string;
  id_colaborador: string;
  data_medicao: string;
  qtd_executada: number | string;
  status_pagamento: string;
  id_lote_pagamento?: string | null;
  colaborador?: {
    nome_completo?: string;
  };
  lote_pagamento?: {
    data_competencia?: string;
    status?: StatusLote;
  };
  item_ambiente?: {
    id?: string;
    tabelaPreco?: {
      preco_venda?: number | string;
      servico?: {
        nome?: string;
      };
    };
    ambiente?: {
      nome?: string;
      pavimento?: {
        obra?: {
          nome?: string;
        };
      };
    };
  };
}

export interface FolhaIndividualResponse {
  filtros: FiltrosFolhaIndividual;
  paginacao: {
    page: number;
    limit: number;
    total_registros: number;
    total_paginas: number;
  };
  totais: {
    total_medicoes?: number;
    total_lotes?: number;
    valor_total_calculado?: number;
    total_a_pagar?: number;
    total_pago?: number;
    colaboradores_no_periodo?: number;
  };
  itens: Array<FolhaIndividualItem | FolhaIndividualAgregadaItem>;
}

export interface ProcessarFolhaIndividualPagamentoDto {
  medicoes_ids: string[];
  data_pagamento: string;
  tipo_pagamento: 'PIX' | 'TED' | 'DINHEIRO' | 'CHEQUE';
  observacoes?: string;
}

export interface FecharPeriodoFolhaDto {
  data_inicio: string;
  data_fim: string;
  id_criado_por: string;
  id_colaborador?: string;
  id_obra?: string;
  observacoes?: string;
}

export interface ReabrirPeriodoFolhaDto {
  data_inicio: string;
  data_fim: string;
  id_colaborador?: string;
  id_obra?: string;
}

export interface FiltrosApropriacaoDetalhada {
  data_inicio?: string;
  data_fim?: string;
  id_colaborador?: string;
  id_obra?: string;
  id_item_ambiente?: string;
  page?: number;
  limit?: number;
}

export interface ApropriacaoDetalhadaItem {
  id: string;
  data_medicao: string;
  qtd_executada: number | string;
  flag_excedente: boolean;
  status_pagamento: string;
  id_lote_pagamento?: string | null;
  valor_apropriado: number;
  colaborador?: {
    nome_completo?: string;
  };
  item_ambiente?: {
    ambiente?: {
      nome?: string;
      pavimento?: {
        obra?: {
          nome?: string;
        };
      };
    };
    tabelaPreco?: {
      preco_venda?: number | string;
    };
  };
}

export interface ApropriacaoDetalhadaResponse {
  filtros: FiltrosApropriacaoDetalhada;
  paginacao: {
    page: number;
    limit: number;
    total_registros: number;
    total_paginas: number;
  };
  totais: {
    total_medicoes: number;
    total_qtd_executada: number;
    valor_total_apropriado: number;
    total_excedentes: number;
  };
  itens: ApropriacaoDetalhadaItem[];
}

class FinanceiroService {
  async obterDashboard() {
    return api.get<DashboardFinanceiroResumo>('/financeiro/dashboard');
  }

  async listarLotes(status?: StatusLote) {
    const params = status ? { status } : undefined;
    return api.get<LotePagamento[]>('/financeiro/lotes', { params });
  }

  async getMedicoesDoLote(idLote: string) {
    return api.get(`/financeiro/lotes/${idLote}/medicoes`);
  }

  async processarPagamentoLote(idLote: string, payload: ProcessarPagamentoDto) {
    return api.post(`/financeiro/lotes/${idLote}/processar-pagamento`, payload);
  }

  async consultarFolhaIndividual(filtros?: FiltrosFolhaIndividual) {
    return api.get<FolhaIndividualResponse>('/financeiro/folha-individual', {
      params: filtros,
    });
  }

  async fecharPeriodoFolhaIndividual(payload: FecharPeriodoFolhaDto) {
    return api.post('/financeiro/folha-individual/fechar-periodo', payload);
  }

  async reabrirPeriodoFolhaIndividual(payload: ReabrirPeriodoFolhaDto) {
    return api.patch('/financeiro/folha-individual/reabrir-periodo', payload);
  }

  async exportarFolhaIndividualCsv(filtros?: FiltrosFolhaIndividual) {
    return api.get<Blob>('/financeiro/folha-individual/export/csv', {
      params: filtros,
      responseType: 'blob',
    });
  }

  async processarPagamentoFolhaIndividual(payload: ProcessarFolhaIndividualPagamentoDto) {
    return api.post('/financeiro/folha-individual/processar-pagamento', payload);
  }

  async consultarApropriacaoDetalhada(filtros?: FiltrosApropriacaoDetalhada) {
    return api.get<ApropriacaoDetalhadaResponse>('/financeiro/apropriacao-detalhada', {
      params: filtros,
    });
  }

  async obterMedicoesColaboradorParaLote(filtros?: {
    id_colaborador?: string;
    id_obra?: string;
  }) {
    return api.get('/financeiro/medicoes-colaborador/para-lote', {
      params: filtros,
    });
  }

  async previewDescontosValesNoLote(idLote: string) {
    return api.get(`/financeiro/lotes/${idLote}/preview-vales`);
  }
}

const financeiroService = new FinanceiroService();

export default financeiroService;
