export interface Colaborador {
  id: string;
  nome_completo: string;
  cpf_nif: string;
  email: string | null;
  telefone: string | null;
  data_nascimento: string | null;
  endereco: string | null;
  ativo: boolean;
  deletado: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateColaboradorDto {
  nome_completo: string;
  cpf_nif: string;
  email?: string;
  telefone?: string;
  data_nascimento?: string;
  endereco?: string;
  ativo?: boolean;
}

export interface UpdateColaboradorDto extends Partial<CreateColaboradorDto> {}

export interface ColaboradoresListResponse {
  colaboradores: Colaborador[];
  total: number;
}
