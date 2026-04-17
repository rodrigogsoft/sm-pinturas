import { api } from './api';

const API_URL = '/alocacoes-itens';

export type StatusAlocacaoItem = 'EM_ANDAMENTO' | 'CONCLUIDO' | 'PAUSADO';

export interface AlocacaoItem {
  id: string;
  id_sessao: string;
  id_ambiente: string;
  id_item_ambiente: string;
  id_colaborador: string;
  id_alocacao_legado?: string | null;
  status: StatusAlocacaoItem;
  hora_inicio: string;
  hora_fim?: string | null;
  observacoes?: string | null;
  created_at: string;
  sessao?: {
    id?: string;
    id_obra?: string;
    data_sessao?: string;
    status?: string;
  };
  ambiente?: {
    id?: string;
    nome?: string;
    id_pavimento?: string;
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
  };
  colaborador?: {
    id?: string;
    nome_completo?: string;
  };
}

export interface CreateAlocacaoItemDto {
  id_sessao: string;
  id_ambiente: string;
  id_item_ambiente: string;
  id_colaborador: string;
  id_alocacao_legado?: string;
  hora_inicio?: string;
  observacoes?: string;
}

export interface ConcluirAlocacaoItemDto {
  hora_fim?: string;
  observacoes?: string;
}

class AlocacoesItensService {
  async listar() {
    return api.get<AlocacaoItem[]>(API_URL);
  }

  async listarPorSessao(idSessao: string) {
    return api.get<AlocacaoItem[]>(`${API_URL}/sessao/${idSessao}`);
  }

  async criar(payload: CreateAlocacaoItemDto) {
    return api.post<AlocacaoItem>(API_URL, payload);
  }

  async concluir(id: string, payload?: ConcluirAlocacaoItemDto) {
    return api.patch<AlocacaoItem>(`${API_URL}/${id}/concluir`, payload || {});
  }

  async remover(id: string) {
    return api.delete(`${API_URL}/${id}`);
  }
}

export default new AlocacoesItensService();