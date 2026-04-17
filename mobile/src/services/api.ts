import axios, { AxiosError, AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';

const configuredBaseUrl = Config.API_BASE_URL || Config.API_URL || '';
const configuredApiVersion = (Config.API_VERSION || '').replace(/^\/+|\/+$/g, '');

function buildApiBaseUrl(baseUrl: string, apiVersion: string) {
  const normalizedBase = (baseUrl || '').replace(/\/$/, '');
  if (!normalizedBase) {
    return 'http://10.0.2.2:3005/api/v1';
  }

  // Avoid duplicating version when API_BASE_URL already contains /v1 (or /v2, ...).
  if (/\/v\d+$/i.test(normalizedBase)) {
    return normalizedBase;
  }

  if (apiVersion) {
    return `${normalizedBase}/${apiVersion}`;
  }

  return normalizedBase;
}

const API_BASE_URL = buildApiBaseUrl(configuredBaseUrl, configuredApiVersion);

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Request interceptor - Add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          AsyncStorage.removeItem('token');
          AsyncStorage.removeItem('usuario');
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  login(email: string, senha: string) {
    // Backend web contract: /auth/login expects { email, password }
    return this.client.post('/auth/login', { email, password: senha });
  }

  logout() {
    return this.client.post('/auth/logout');
  }

  // Obras endpoints
  getObras(page = 1, limit = 50, filtros?: any) {
    return this.client.get('/obras', {
      params: { page, limit, ...filtros },
    });
  }

  getObraById(id: string) {
    return this.client.get(`/obras/${id}`);
  }

  // Colaboradores endpoints
  getColaboradores(page = 1, limit = 50) {
    return this.client.get('/colaboradores', {
      params: { page, limit, ativo: true },
    });
  }

  getColaboradorById(id: string) {
    return this.client.get(`/colaboradores/${id}`);
  }

  // Ambientes endpoints
  getAmbientesByObra(idObra: string) {
    return this.client.get(`/ambientes/obra/${idObra}`);
  }

  // Itens de ambiente
  getItensAmbienteByAmbiente(idAmbiente: string) {
    return this.client.get(`/itens-ambiente/ambiente/${idAmbiente}`);
  }

  // RDO endpoints
  private toMedicaoPayload(rdo: any) {
    const qtdExecutada = Number(rdo.area_pintada || rdo.qtd_executada || 0);
    const dataMedicao =
      rdo.data_medicao ||
      (rdo.data ? `${rdo.data}T00:00:00.000Z` : new Date().toISOString());

    return {
      id_alocacao_item: rdo.id_alocacao_item,
      id_colaborador: rdo.id_colaborador,
      id_item_ambiente: rdo.id_item_ambiente,
      qtd_executada: qtdExecutada,
      area_planejada: rdo.area_planejada,
      percentual_conclusao_item: rdo.percentual_conclusao_item,
      justificativa: rdo.observacoes || rdo.justificativa,
      foto_evidencia_url: rdo.foto_depois || rdo.foto_evidencia_url,
      data_medicao: dataMedicao,
    };
  }

  private toLegacyPayload(rdo: any) {
    const qtdExecutada = Number(rdo.area_pintada || rdo.qtd_executada || 0);
    const dataMedicao =
      rdo.data_medicao ||
      (rdo.data ? `${rdo.data}T00:00:00.000Z` : new Date().toISOString());

    return {
      id_alocacao: rdo.id_alocacao || rdo.id_alocacao_item,
      qtd_executada: qtdExecutada,
      data_medicao: dataMedicao,
      justificativa_excedente: rdo.observacoes || rdo.justificativa,
      foto_excedente: rdo.foto_depois || rdo.foto_evidencia_url,
    };
  }

  criarRDO(rdo: any) {
    const payload41 = this.toMedicaoPayload(rdo);
    if (payload41.id_alocacao_item && payload41.id_colaborador && payload41.id_item_ambiente) {
      return this.client.post('/medicoes-colaborador', payload41);
    }
    return this.client.post('/medicoes', this.toLegacyPayload(rdo));
  }

  atualizarRDO(id: string, rdo: any) {
    const payload41 = this.toMedicaoPayload(rdo);
    if (payload41.id_alocacao_item && payload41.id_colaborador && payload41.id_item_ambiente) {
      return this.client.patch(`/medicoes-colaborador/${id}`, payload41);
    }
    return this.client.patch(`/medicoes/${id}`, this.toLegacyPayload(rdo));
  }

  deletarRDO(id: string) {
    return this.client.delete(`/medicoes-colaborador/${id}`).catch((error: AxiosError) => {
      if (error.response?.status !== 404) {
        throw error;
      }
      return this.client.delete(`/medicoes/${id}`);
    });
  }

  getRDOsPorObra(idObra: string, page = 1, limit = 50) {
    return this.client
      .get('/financeiro/apropriacao-detalhada', {
        params: { page, limit, id_obra: idObra },
      })
      .catch((error: AxiosError) => {
        if (error.response?.status !== 404) {
          throw error;
        }
        return this.client.get('/medicoes', {
          params: { page, limit, id_obra: idObra },
        });
      });
  }

  getRDOById(id: string) {
    return this.client.get(`/medicoes-colaborador/${id}`).catch((error: AxiosError) => {
      if (error.response?.status !== 404) {
        throw error;
      }
      return this.client.get(`/medicoes/${id}`);
    });
  }

  // Sincronização - enviar múltiplos RDOs offline
  async sincronizarRDOs(rdos: any[]) {
    const resultados = await Promise.all(
      rdos.map(async (rdo) => {
        try {
          const response = await this.criarRDO(rdo);
          return {
            id_local: rdo.id_rdo,
            id_rdo: response.data?.id || response.data?.id_rdo,
            sucesso: true,
          };
        } catch (error: any) {
          return {
            id_local: rdo.id_rdo,
            sucesso: false,
            erro: error?.response?.data?.message || error?.message || 'Erro de sincronização',
          };
        }
      })
    );

    return { data: resultados };
  }

  getClient() {
    return this.client;
  }
}

export const apiClient = new ApiClient();
export const api = apiClient.getClient();
