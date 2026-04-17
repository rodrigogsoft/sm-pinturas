export interface Cliente {
  id: string;
  razao_social: string;
  cnpj_nif: string;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
  dia_corte: number;
  deletado: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateClienteDto {
  razao_social: string;
  cnpj_nif: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  dia_corte: number;
}

export interface UpdateClienteDto extends Partial<CreateClienteDto> {}

export interface ClientesListResponse {
  clientes: Cliente[];
  total: number;
}
