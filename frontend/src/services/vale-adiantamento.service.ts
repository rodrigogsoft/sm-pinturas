import { api } from './api';

const API_URL = '/vale-adiantamento';

export interface ValeAdiantamento {
  id: string;
  id_colaborador: string;
  id_obra?: string | null;
  valor_solicitado: number | string;
  valor_aprovado?: number | string | null;
  status: string;
  motivo?: string | null;
  observacoes?: string | null;
  created_at: string;
  colaborador?: {
    nome_completo?: string;
  };
  obra?: {
    nome?: string;
  };
}

export interface CreateValeAdiantamentoDto {
  id_colaborador: string;
  id_obra?: string;
  valor_solicitado: number;
  valor_aprovado?: number;
  motivo?: string;
  observacoes?: string;
  id_aprovado_por?: string;
  qtd_parcelas_auto?: number;
  data_primeira_parcela?: string;
}

export interface DescontarValeAdiantamentoDto {
  valor_desconto: number;
  data_desconto?: string;
  id_lote_pagamento?: string;
  observacoes?: string;
}

export interface AprovarValeAdiantamentoDto {
  id_aprovado_por?: string;
  valor_aprovado: number;
}

class ValeAdiantamentoService {
  async listar() {
    return api.get<ValeAdiantamento[]>(API_URL);
  }

  async buscarSaldoDevedorColaborador(idColaborador: string) {
    return api.get(`${API_URL}/colaborador/${idColaborador}/saldo-devedor`);
  }

  async buscarPorId(id: string) {
    return api.get(`${API_URL}/${id}`);
  }

  async buscarResumo(id: string) {
    return api.get(`${API_URL}/${id}/resumo`);
  }

  async criar(data: CreateValeAdiantamentoDto) {
    return api.post(API_URL, data);
  }

  async aprovar(id: string, data: AprovarValeAdiantamentoDto) {
    return api.patch(`${API_URL}/${id}/aprovar`, data);
  }

  async lancar(id: string) {
    return api.patch(`${API_URL}/${id}/lancar`);
  }

  async descontar(id: string, data: DescontarValeAdiantamentoDto) {
    return api.patch(`${API_URL}/${id}/descontar`, data);
  }

  async cancelar(id: string) {
    return api.patch(`${API_URL}/${id}/cancelar`);
  }

  async delete(id: string) {
    return api.delete(`${API_URL}/${id}`);
  }
}

const valeAdiantamentoService = new ValeAdiantamentoService();

export default valeAdiantamentoService;
