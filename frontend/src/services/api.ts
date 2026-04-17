import axios, { AxiosError, AxiosResponse } from 'axios';
import { store } from '../store';
import { logout, setRefreshToken, setToken } from '../store/slices/authSlice';
import { mockAuthLogin } from './mockAuth';

// Base API URL configuration
// When running in development with Docker:
// - Frontend runs in container on port 3000 (localhost:3001 from host)
// - Backend runs in container on port 3000 (localhost:3005 from host)
// - Frontend uses Vite proxy to reach backend in Docker
// When running locally:
// - Use http://localhost:3005/api/v1
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
// IMPORTANT: Mock mode should NEVER be enabled in development
// Mock tokens don't work with real backend - always use real API
const ENABLE_MOCK = false; // Disabled by default - use real API

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export const setApiAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete api.defaults.headers.common.Authorization;
};

let refreshPromise: Promise<string | null> | null = null;

const getStoredToken = (): string | null => {
  const stateToken = store.getState().auth.token;
  if (stateToken) {
    return stateToken;
  }

  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
};

const getStoredRefreshToken = (): string | null => {
  const authState = store.getState().auth as { refreshToken?: string | null };
  const stateRefreshToken = authState.refreshToken;
  if (stateRefreshToken) {
    return stateRefreshToken;
  }

  try {
    return localStorage.getItem('refresh_token');
  } catch {
    return null;
  }
};

setApiAuthToken(getStoredToken());

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = authAPI
      .refreshToken(refreshToken)
      .then((response) => {
        const newToken = response.data?.access_token;
        const newRefreshToken = response.data?.refresh_token;
        if (!newToken) {
          return null;
        }

        try {
          localStorage.setItem('token', newToken);
        } catch {
          // noop
        }
        setApiAuthToken(newToken);
        store.dispatch(setToken(newToken));

        if (typeof newRefreshToken === 'string' && newRefreshToken.length > 0) {
          try {
            localStorage.setItem('refresh_token', newRefreshToken);
          } catch {
            // noop
          }
          store.dispatch(setRefreshToken(newRefreshToken));
        }

        return newToken;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

// Request interceptor - Mock or Add auth token
api.interceptors.request.use(
  async (config) => {
    // Mock mode is DISABLED by default - never enable in production
    if (ENABLE_MOCK && config.url?.includes('/auth/login')) {
      const data = config.data;
      const mockData = await mockAuthLogin(data.email, data.password);
      // Return a resolved promise-like response
      return Promise.reject({
        response: {
          status: 200,
          data: mockData,
        },
        __mock: true,
      });
    }

    const token = getStoredToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError | any) => {
    // Handle mock responses
    if (error.__mock && error.response?.status === 200) {
      return Promise.resolve({ data: error.response.data });
    }

    const originalRequest = error.config as any;

    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401) {
      const isAuthEndpoint =
        originalRequest?.url?.includes('/auth/login') ||
        originalRequest?.url?.includes('/auth/refresh') ||
        originalRequest?.url?.includes('/auth/me');

      if (!isAuthEndpoint && !originalRequest?._retry) {
        originalRequest._retry = true;
        const newToken = await refreshAccessToken();

        if (newToken) {
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${newToken}`,
          };
          return api(originalRequest);
        }
      }

      // Para endpoints não-auth, evita derrubar a sessão inteira em 401 pontual
      // (alguns módulos podem responder 401 mesmo com token válido).
      if (!isAuthEndpoint) {
        return Promise.reject(error);
      }

      // Endpoints de autenticação 401 => sessão realmente inválida.
      setApiAuthToken(null);
      store.dispatch(logout());

      return Promise.reject(error);
    }

    // Handle network errors
    if (!error.response) {
      const errorObj = {
        message: error.message || 'Erro de conexão com o servidor',
        status: 0,
        code: error.code,
        data: null
      };
      return Promise.reject(errorObj);
    }

    // Return standardized error
    const errorObj = {
      message: (error.response?.data as any)?.message || error.message || 'Erro desconhecido',
      status: error.response?.status,
      data: error.response?.data,
      response: error.response
    };
    return Promise.reject(errorObj);
  }
);

// API Methods
export const authAPI = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),

  register: (data: {
    nome_completo: string;
    email: string;
    password: string;
    id_perfil: number;
  }) => api.post('/auth/register', data),

  getProfile: () => api.get('/auth/me'),

  logout: () => api.post('/auth/logout'),

  listSessions: () => api.get('/auth/sessions'),

  revokeSession: (sessionId: string) => api.delete(`/auth/sessions/${sessionId}`),

  revokeOtherSessions: () => api.delete('/auth/sessions/others'),

  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refresh_token: refreshToken }),
};

export const relatoriosAPI = {
  getDashboardFinanceiro: (params?: {
    periodo?: 'dia' | 'semana' | 'mes' | 'ano';
    data_inicio?: string;
    data_fim?: string;
    id_obra?: string;
  }) => api.get('/relatorios/dashboard-financeiro', { params }),

  getMedicoes: (params?: {
    periodo?: 'dia' | 'semana' | 'mes' | 'ano';
    data_inicio?: string;
    data_fim?: string;
    id_obra?: string;
    status_pagamento?: string;
    page?: number;
    limit?: number;
  }) => api.get('/relatorios/medicoes', { params }),

  getProdutividade: (params?: {
    periodo?: 'dia' | 'semana' | 'mes' | 'ano';
    data_inicio?: string;
    data_fim?: string;
    id_obra?: string;
  }) => api.get('/relatorios/produtividade', { params }),

  getMargemLucro: (params?: {
    periodo?: 'dia' | 'semana' | 'mes' | 'ano';
    data_inicio?: string;
    data_fim?: string;
    id_obra?: string;
    page?: number;
    limit?: number;
  }) => api.get('/relatorios/margem-lucro', { params }),

  exportDashboardFinanceiro: (params: {
    formato: 'csv' | 'excel' | 'pdf';
    periodo?: 'dia' | 'semana' | 'mes' | 'ano';
    id_obra?: string;
  }) =>
    api.get('/relatorios/dashboard-financeiro/export', {
      params,
      responseType: 'blob',
    }),
};

export const obrasAPI = {
  getAll: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/obras', { params }),

  getById: (id: string) => api.get(`/obras/${id}`),

  create: (data: any) => api.post('/obras', data),

  update: (id: string, data: any) => api.patch(`/obras/${id}`, data),

  delete: (id: string) => api.delete(`/obras/${id}`),
};

export const clientesAPI = {
  getAll: (params?: { page?: number; limit?: number }) =>
    api.get('/clientes', { params }),

  getById: (id: string) => api.get(`/clientes/${id}`),

  create: (data: any) => api.post('/clientes', data),

  update: (id: string, data: any) => api.patch(`/clientes/${id}`, data),

  delete: (id: string) => api.delete(`/clientes/${id}`),
};

export const colaboradoresAPI = {
  getAll: (params?: { page?: number; limit?: number }) =>
    api.get('/colaboradores', { params }),

  getById: (id: string) => api.get(`/colaboradores/${id}`),

  create: (data: any) => api.post('/colaboradores', data),

  update: (id: string, data: any) => api.patch(`/colaboradores/${id}`, data),

  delete: (id: string) => api.delete(`/colaboradores/${id}`),
};

export const notificacoesAPI = {
  minhasPaginado: (params?: {
    lida?: boolean;
    tipo?: string;
    data_inicio?: string;
    data_fim?: string;
    page?: number;
    limit?: number;
  }) => api.get('/notificacoes/minhas/paginado', { params }),

  minhas: (params?: { lida?: boolean; tipo?: string; prioridade?: string }) =>
    api.get('/notificacoes/minhas', { params }),

  marcarComoLida: (id: string) => api.post(`/notificacoes/${id}/marcar-lida`),

  marcarComoClicada: (id: string) => api.post(`/notificacoes/${id}/clicar`),

  marcarTodasComoLidas: () => api.post('/notificacoes/minhas/marcar-todas-lidas'),

  minhasPreferencias: () => api.get('/notificacoes/minhas/preferencias'),

  salvarPreferencia: (data: {
    canal: 'IN_APP' | 'PUSH' | 'EMAIL';
    event_type?: string;
    habilitado: boolean;
    quiet_hours_inicio?: string;
    quiet_hours_fim?: string;
  }) => api.post('/notificacoes/minhas/preferencias', data),

  metricasResumo: () => api.get('/notificacoes/metricas/resumo'),

  listarRegrasAdmin: () => api.get('/notificacoes/admin/rules'),
  criarRegraAdmin: (data: any) => api.post('/notificacoes/admin/rules', data),
  atualizarRegraAdmin: (id: string, data: any) => api.patch(`/notificacoes/admin/rules/${id}`, data),
  removerRegraAdmin: (id: string) => api.delete(`/notificacoes/admin/rules/${id}`),

  listarTemplatesAdmin: () => api.get('/notificacoes/admin/templates'),
  criarTemplateAdmin: (data: any) => api.post('/notificacoes/admin/templates', data),
  atualizarTemplateAdmin: (id: string, data: any) =>
    api.patch(`/notificacoes/admin/templates/${id}`, data),
  removerTemplateAdmin: (id: string) => api.delete(`/notificacoes/admin/templates/${id}`),
};

export default api;
