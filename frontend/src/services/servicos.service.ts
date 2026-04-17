import { api } from './api';

const API_URL = '/servicos';

export interface Servico {
  id: number;
  nome: string;
  descricao?: string;
  categoria: string;
  unidade: 'M' | 'M2' | 'M3' | 'UN' | 'H';
  custo_padrao?: number;
  created_at: string;
  updated_at: string;
}

class ServicosService {
  async listar(): Promise<Servico[]> {
    const response = await api.get(API_URL);
    return response.data;
  }

  async buscarPorId(id: number): Promise<Servico> {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  }

  async criar(dados: Partial<Servico>): Promise<Servico> {
    const response = await api.post(API_URL, dados);
    return response.data;
  }

  async atualizar(id: number, dados: Partial<Servico>): Promise<Servico> {
    const response = await api.patch(`${API_URL}/${id}`, dados);
    return response.data;
  }

  async deletar(id: number): Promise<void> {
    await api.delete(`${API_URL}/${id}`);
  }
}

export default new ServicosService();
