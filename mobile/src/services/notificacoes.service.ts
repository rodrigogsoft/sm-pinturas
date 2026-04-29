import { apiClient } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export enum TipoNotificacaoEnum {
  MEDICAO_PENDENTE = 'MEDICAO_PENDENTE',
  CICLO_FATURAMENTO = 'CICLO_FATURAMENTO',
  LOTE_APROVACAO = 'LOTE_APROVACAO',
  PRECO_PENDENTE = 'PRECO_PENDENTE',
  OBRA_ATRASO = 'OBRA_ATRASO',
  SISTEMA = 'SISTEMA',
}

export enum PrioridadeEnum {
  BAIXA = 'BAIXA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
  CRITICA = 'CRITICA',
}

export interface Notificacao {
  id: string;
  id_usuario_destinatario: string;
  titulo: string;
  mensagem: string;
  tipo: TipoNotificacaoEnum;
  prioridade: PrioridadeEnum;
  lida: boolean;
  created_at: string;
  data_envio?: string;
  dados_extras?: any;
}

class NotificacoesService {
  private async getUsuarioIdLogado(): Promise<string | null> {
    const usuarioRaw = await AsyncStorage.getItem('usuario');
    if (!usuarioRaw) {
      return null;
    }

    try {
      const usuario = JSON.parse(usuarioRaw);
      return String(usuario?.id || usuario?.id_usuario || usuario?.usuario_id || '');
    } catch {
      return null;
    }
  }

  /**
   * Busca notificações do usuário logado
   */
  async getMinhasNotificacoes(
    filtros?: {
      lida?: boolean;
      tipo?: TipoNotificacaoEnum;
      prioridade?: PrioridadeEnum;
      limit?: number;
    }
  ): Promise<Notificacao[]> {
    try {
      const response = await apiClient.getClient().get<Notificacao[]>(
        '/notificacoes/minhas',
        {
          params: {
            lida: filtros?.lida,
            tipo: filtros?.tipo,
            prioridade: filtros?.prioridade,
          },
        }
      );

      const notificacoes = response.data || [];

      // Limitar quantidade se solicitado
      if (filtros?.limit) {
        return notificacoes.slice(0, filtros.limit);
      }

      return notificacoes;
    } catch (error: any) {
      const status = error?.response?.status;
      const deveTentarLegacy = status === 404 || status === 500;

      if (!deveTentarLegacy) {
        console.error('Erro ao buscar notificações:', error);
        return [];
      }

      try {
        const idUsuario = await this.getUsuarioIdLogado();
        if (!idUsuario) {
          console.error('Erro ao buscar notificações: id do usuário não encontrado para fallback legado.');
          return [];
        }

        const responseLegacy = await apiClient.getClient().get<Notificacao[]>(
          `/notificacoes/usuario/${idUsuario}`,
          {
            params: {
              lida: filtros?.lida,
              tipo: filtros?.tipo,
              prioridade: filtros?.prioridade,
            },
          }
        );

        const notificacoes = responseLegacy.data || [];
        if (filtros?.limit) {
          return notificacoes.slice(0, filtros.limit);
        }

        return notificacoes;
      } catch (legacyError) {
        console.error('Erro ao buscar notificações (incluindo fallback legado):', legacyError);
        return [];
      }
    }
  }

  /**
   * Busca contagem de notificações não lidas
   */
  async getCountNaoLidas(): Promise<number> {
    try {
      const response = await apiClient.getClient().get<{ count: number }>(
        '/notificacoes/minhas/nao-lidas/count'
      );

      return response.data?.count || 0;
    } catch (error: any) {
      const status = error?.response?.status;
      const deveTentarLegacy = status === 404 || status === 500;

      if (!deveTentarLegacy) {
        console.error('Erro ao buscar contagem de notificações não lidas:', error);
        return 0;
      }

      try {
        const idUsuario = await this.getUsuarioIdLogado();
        if (!idUsuario) {
          console.error('Erro ao buscar contagem de notificações: id do usuário não encontrado para fallback legado.');
          return 0;
        }

        const responseLegacy = await apiClient
          .getClient()
          .get<{ count: number }>(`/notificacoes/usuario/${idUsuario}/nao-lidas/count`);

        return responseLegacy.data?.count || 0;
      } catch (legacyError) {
        console.error('Erro ao buscar contagem de notificações não lidas (incluindo fallback legado):', legacyError);
        return 0;
      }
    }
  }

  /**
   * Marca uma notificação como lida
   */
  async marcarComoLida(idNotificacao: string): Promise<boolean> {
    try {
      await apiClient.getClient().post(`/notificacoes/${idNotificacao}/marcar-lida`);
      return true;
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      return false;
    }
  }

  /**
   * Marca todas as notificações do usuário como lidas
   */
  async marcarTodasComoLidas(): Promise<boolean> {
    try {
      await apiClient.getClient().post('/notificacoes/minhas/marcar-todas-lidas');
      return true;
    } catch (error: any) {
      const status = error?.response?.status;
      const deveTentarLegacy = status === 404 || status === 500;

      if (!deveTentarLegacy) {
        console.error('Erro ao marcar todas as notificações como lidas:', error);
        return false;
      }

      try {
        const idUsuario = await this.getUsuarioIdLogado();
        if (!idUsuario) {
          console.error('Erro ao marcar notificações: id do usuário não encontrado para fallback legado.');
          return false;
        }

        await apiClient.getClient().post(`/notificacoes/usuario/${idUsuario}/marcar-todas-lidas`);
        return true;
      } catch (legacyError) {
        console.error('Erro ao marcar todas as notificações como lidas (incluindo fallback legado):', legacyError);
        return false;
      }
    }
  }
}

export const notificacoesService = new NotificacoesService();
