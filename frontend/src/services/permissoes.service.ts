import { api } from './api';

export interface PermissoesAcoes {
  visualizar?: boolean;
  criar?: boolean;
  editar?: boolean;
  apagar?: boolean;
  aprovar?: boolean;
}

export interface PermissoesModulo {
  ativo: boolean;
  acoes: PermissoesAcoes;
  submodulos?: Record<string, { ativo: boolean; acoes: PermissoesAcoes }>;
}

export type PermissoesModulos = Record<string, PermissoesModulo>;

export interface PerfilComPermissoes {
  id: number;
  nome: string;
  descricao: string | null;
  permissoes_modulos: PermissoesModulos | null;
}

const permissoesService = {
  listarPerfis: async (): Promise<PerfilComPermissoes[]> => {
    const resp = await api.get('/permissoes/perfis');
    return resp.data;
  },

  buscarPerfil: async (id: number): Promise<PerfilComPermissoes> => {
    const resp = await api.get(`/permissoes/perfis/${id}`);
    return resp.data;
  },

  atualizar: async (id: number, permissoes_modulos: PermissoesModulos): Promise<PerfilComPermissoes> => {
    const resp = await api.patch(`/permissoes/perfis/${id}`, { permissoes_modulos });
    return resp.data;
  },

  meuPerfil: async (): Promise<PerfilComPermissoes> => {
    const resp = await api.get('/permissoes/meu-perfil');
    return resp.data;
  },
};

export default permissoesService;
