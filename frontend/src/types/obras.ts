export enum StatusObraEnum {
  PLANEJAMENTO = 'PLANEJAMENTO',
  AGUARDANDO = 'AGUARDANDO',
  ATIVA = 'ATIVA',
  SUSPENSA = 'SUSPENSA',
  CONCLUIDA = 'CONCLUIDA',
}

export const StatusObraLabels: Record<StatusObraEnum, string> = {
  [StatusObraEnum.PLANEJAMENTO]: 'Planejamento',
  [StatusObraEnum.AGUARDANDO]: 'Aguardando',
  [StatusObraEnum.ATIVA]: 'Ativa',
  [StatusObraEnum.SUSPENSA]: 'Suspensa',
  [StatusObraEnum.CONCLUIDA]: 'Concluída',
};

export const StatusObraColors: Record<StatusObraEnum, 'default' | 'primary' | 'warning' | 'success'> = {
  [StatusObraEnum.PLANEJAMENTO]: 'default',
  [StatusObraEnum.AGUARDANDO]: 'warning',
  [StatusObraEnum.ATIVA]: 'primary',
  [StatusObraEnum.SUSPENSA]: 'warning',
  [StatusObraEnum.CONCLUIDA]: 'success',
};

export interface Obra {
  id: string;
  nome: string;
  endereco_completo: string;
  status: StatusObraEnum;
  data_inicio: string;
  data_previsao_fim: string | null;
  data_conclusao: string | null;
  observacoes: string | null;
  id_cliente: string;
  deletado: boolean;
  created_at: string;
  updated_at: string;
  cliente?: {
    id: string;
    razao_social: string;
    cnpj_nif: string;
  };
}

export interface CreateObraDto {
  nome: string;
  endereco_completo: string;
  data_inicio: string;
  data_previsao_fim?: string;
  id_cliente: string;
  observacoes?: string;
  status?: StatusObraEnum;
}

export interface UpdateObraDto extends Partial<CreateObraDto> {}

export interface ObrasListResponse {
  obras: Obra[];
  total: number;
}
