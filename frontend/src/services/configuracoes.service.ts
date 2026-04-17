import { api } from './api';

const API_URL = '/configuracoes';

export interface Configuracao {
  id: string;
  chave: string;
  valor: string;
  tipo: 'integer' | 'boolean' | 'string';
  descricao: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateConfiguracaoDto {
  valor?: string;
  ativo?: boolean;
  descricao?: string;
  tipo?: string;
}

class ConfiguracoesService {
  async listar(): Promise<Configuracao[]> {
    const response = await api.get(API_URL);
    return response.data;
  }

  async buscarPorChave(chave: string): Promise<Configuracao> {
    const response = await api.get(`${API_URL}/${chave}`);
    return response.data;
  }

  async atualizar(chave: string, dados: UpdateConfiguracaoDto): Promise<Configuracao> {
    const response = await api.patch(`${API_URL}/${chave}`, dados);
    return response.data;
  }
}

export default new ConfiguracoesService();
