// Auth types
export interface Usuario {
  id_usuario: string;
  nome: string;
  email: string;
  telefone?: string;
  papel: 'admin' | 'gerente' | 'encarregado' | 'pintor';
  ativo: boolean;
}

export interface AuthState {
  usuario: Usuario | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

// Obras
export interface Obra {
  id_obra: string;
  id?: string;
  nome: string;
  endereco: string;
  data_inicio: string;
  data_previsao_termino: string;
  status: 'planejada' | 'em_progresso' | 'pausada' | 'finalizada';
  valor_contrato: number;
  area_total: number;
  geo_lat?: number;
  geo_long?: number;
}

// Colaboradores
export interface Colaborador {
  id_colaborador: string;
  nome: string;
  funcao: string;
  telefone?: string;
  ativo: boolean;
}

// RDO - Relatório de Obra (Daily Report)
export interface RDO {
  id_rdo?: string;
  id_alocacao?: string;
  id_alocacao_item?: string;
  id_obra: string;
  id_colaborador: string;
  id_item_ambiente?: string;
  data: string;
  data_medicao?: string;
  horas_trabalhadas: number;
  area_pintada: number;
  area_planejada?: number;
  percentual_conclusao_item?: number;
  materiais_utilizados: string;
  observacoes: string;
  assinatura: string; // base64
  foto_antes?: string; // base64
  foto_depois?: string; // base64
  localizacao_latitude?: number;
  localizacao_longitude?: number;
  status: 'rascunho' | 'enviado' | 'sincronizado';
  data_criacao: string;
  data_ultima_atualizacao: string;
  enviado_em?: string;
}

// Sincronização
export interface SyncStatus {
  isOnline: boolean;
  lastSync: string | null;
  pendingRDOs: number;
  isSyncing: boolean;
  syncError: string | null;
}

// Resposta API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
