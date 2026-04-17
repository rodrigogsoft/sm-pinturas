import { api } from './api';

const API_URL = '/medicoes-colaborador';

export interface MedicaoColaborador {
  id: string;
  id_alocacao_item: string;
  id_colaborador: string;
  id_item_ambiente: string;
  id_lote_pagamento?: string | null;
  qtd_executada: number | string;
  area_planejada?: number | string | null;
  percentual_conclusao_item?: number | string | null;
  flag_excedente: boolean;
  justificativa?: string | null;
  foto_evidencia_url?: string | null;
  status_pagamento: string;
  data_medicao: string;
  created_at: string;
  colaborador?: {
    id?: string;
    nome_completo?: string;
  };
  item_ambiente?: {
    id?: string;
    area_planejada?: number | string;
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
  alocacao_item?: {
    id?: string;
    status?: string;
  };
}

export interface CreateMedicaoColaboradorDto {
  id_alocacao_item: string;
  id_colaborador: string;
  id_item_ambiente: string;
  id_medicao_legado?: string;
  qtd_executada: number;
  area_planejada?: number;
  percentual_conclusao_item?: number;
  justificativa?: string;
  foto_evidencia_url?: string;
  data_medicao?: string;
}

export interface ResumoProducaoItem {
  id_item_ambiente: string;
  total_medicoes: number;
  total_colaboradores: number;
  total_qtd_executada: number;
  percentual_conclusao_medio: number;
  por_colaborador: Array<{
    id_colaborador: string;
    nome_colaborador: string;
    total_medicoes: number;
    total_qtd_executada: number;
  }>;
}

class MedicoesColaboradorService {
  async listar() {
    return api.get<MedicaoColaborador[]>(API_URL);
  }

  async criar(payload: CreateMedicaoColaboradorDto) {
    return api.post<MedicaoColaborador>(API_URL, payload);
  }

  async listarPorColaborador(idColaborador: string) {
    return api.get<MedicaoColaborador[]>(`${API_URL}/colaborador/${idColaborador}`);
  }

  async listarPorItem(idItemAmbiente: string) {
    return api.get<MedicaoColaborador[]>(`${API_URL}/item/${idItemAmbiente}`);
  }

  async obterResumoProducaoItem(idItemAmbiente: string, params?: { data_inicio?: string; data_fim?: string }) {
    return api.get<ResumoProducaoItem>(`${API_URL}/item/${idItemAmbiente}/resumo-producao`, {
      params,
    });
  }

  async remover(id: string) {
    return api.delete(`${API_URL}/${id}`);
  }
}

export default new MedicoesColaboradorService();