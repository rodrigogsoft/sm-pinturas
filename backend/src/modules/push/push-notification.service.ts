import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Usuario } from '../auth/entities/usuario.entity';
import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';

export interface PushNotificationData {
  titulo: string;
  mensagem: string;
  tipo?: string;
  id_entidade?: string;
  prioridade?: 'baixa' | 'normal' | 'alta';
  dados_extras?: Record<string, any>;
}

export interface SendPushResult {
  sucesso: boolean;
  message_id?: string;
  erro?: string;
}

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private firebaseInitialized = false;

  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
  ) {
    this.initializeFirebase();
  }

  /**
   * Inicializar Firebase Admin SDK
   * Requer configuração de credenciais (service account JSON)
   */
  private initializeFirebase() {
    try {
      if (admin.apps.length > 0) {
        this.firebaseInitialized = true;
        return;
      }

      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

      let serviceAccount: admin.ServiceAccount | null = null;

      if (serviceAccountJson) {
        serviceAccount = JSON.parse(serviceAccountJson) as admin.ServiceAccount;
      } else if (serviceAccountPath) {
        const raw = readFileSync(serviceAccountPath, 'utf-8');
        serviceAccount = JSON.parse(raw) as admin.ServiceAccount;
      }

      if (!serviceAccount) {
        this.logger.warn('Firebase Admin SDK sem credenciais. Push notifications desabilitadas.');
        this.firebaseInitialized = false;
        return;
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      this.firebaseInitialized = true;
      this.logger.log('Firebase Admin SDK inicializado com sucesso');
    } catch (error) {
      this.logger.error('Erro ao inicializar Firebase Admin SDK:', error);
      this.firebaseInitialized = false;
    }
  }

  /**
   * Enviar push notification para um usuário específico
   */
  async enviarParaUsuario(
    id_usuario: string,
    data: PushNotificationData,
  ): Promise<SendPushResult> {
    try {
      // Buscar token FCM do usuário
      const usuario = await this.usuarioRepository.findOne({
        where: { id: id_usuario, deletado: false },
        select: ['id', 'fcm_token', 'nome_completo'],
      });

      if (!usuario || !usuario.fcm_token) {
        this.logger.warn(
          `Usuário ${id_usuario} não possui token FCM registrado`
        );
        return {
          sucesso: false,
          erro: 'Token FCM não encontrado',
        };
      }

      return await this.enviarPush(usuario.fcm_token, data);
    } catch (error) {
      this.logger.error('Erro ao enviar push para usuário:', error);
      return {
        sucesso: false,
        erro: error.message,
      };
    }
  }

  /**
   * Enviar push notification para múltiplos usuários
   */
  async enviarParaUsuarios(
    ids_usuarios: string[],
    data: PushNotificationData,
  ): Promise<SendPushResult[]> {
    const resultados = await Promise.all(
      ids_usuarios.map(id => this.enviarParaUsuario(id, data))
    );

    const sucessos = resultados.filter(r => r.sucesso).length;
    this.logger.log(
      `Push em lote: ${sucessos}/${ids_usuarios.length} enviados com sucesso`
    );

    return resultados;
  }

  /**
   * Enviar push para um token FCM específico
   */
  async enviarPush(
    fcm_token: string,
    data: PushNotificationData,
  ): Promise<SendPushResult> {
    if (!this.firebaseInitialized) {
      this.logger.warn('Firebase não inicializado - Push não enviado');
      return {
        sucesso: false,
        erro: 'Firebase não configurado',
      };
    }

    try {
      // Construir payload da notificação
      const message = {
        token: fcm_token,
        notification: {
          title: data.titulo,
          body: data.mensagem,
        },
        data: {
          tipo: data.tipo || 'geral',
          id_entidade: data.id_entidade || '',
          prioridade: data.prioridade || 'normal',
          ...data.dados_extras,
        },
        android: {
          priority: this.getAndroidPriority(data.prioridade),
          notification: {
            channelId: this.getChannelId(data.tipo),
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
        apns: {
          headers: {
            'apns-priority': data.prioridade === 'alta' ? '10' : '5',
          },
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);

      return {
        sucesso: true,
        message_id: response,
      };
    } catch (error) {
      this.logger.error('Erro ao enviar push notification:', error);
      return {
        sucesso: false,
        erro: error.message,
      };
    }
  }

  /**
   * Registrar/atualizar token FCM de um usuário
   */
  async registrarToken(id_usuario: string, fcm_token: string): Promise<void> {
    try {
      await this.usuarioRepository.update(id_usuario, { fcm_token });
      this.logger.log(`Token FCM registrado para usuário ${id_usuario}`);
    } catch (error) {
      this.logger.error('Erro ao registrar token FCM:', error);
      throw error;
    }
  }

  /**
   * Remover token FCM (logout/desinstalação)
   */
  async removerToken(id_usuario: string): Promise<void> {
    try {
      await this.usuarioRepository.update(id_usuario, { fcm_token: null });
      this.logger.log(`Token FCM removido para usuário ${id_usuario}`);
    } catch (error) {
      this.logger.error('Erro ao remover token FCM:', error);
      throw error;
    }
  }

  /**
   * Enviar notificação silenciosa (data-only message)
   * Usada para sincronização em background
   */
  async enviarNotificacaoSilenciosa(
    fcm_token: string,
    data: Record<string, string>,
  ): Promise<SendPushResult> {
    if (!this.firebaseInitialized) {
      return { sucesso: false, erro: 'Firebase não configurado' };
    }

    try {
      const message = {
        token: fcm_token,
        data: {
          tipo: 'silent',
          ...data,
        },
        android: {
          priority: 'high' as const,
        },
        apns: {
          headers: {
            'apns-push-type': 'background',
            'apns-priority': '5',
          },
          payload: {
            aps: {
              'content-available': 1,
            },
          },
        },
      };

      // const response = await admin.messaging().send(message);
      // return { sucesso: true, message_id: response };

      // Mock
      this.logger.log('[MOCK] Notificação silenciosa enviada');
      return { sucesso: true, message_id: 'silent_mock_' + Date.now() };
    } catch (error) {
      this.logger.error('Erro ao enviar notificação silenciosa:', error);
      return { sucesso: false, erro: error.message };
    }
  }

  /**
   * Helpers privados
   */

  private getAndroidPriority(prioridade?: string): 'high' | 'normal' {
    return prioridade === 'alta' ? 'high' : 'normal';
  }

  private getChannelId(tipo?: string): string {
    switch (tipo) {
      case 'medicao_pendente':
        return 'medicoes';
      case 'ciclo_faturamento':
        return 'faturamento';
      case 'lote_aprovacao':
        return 'aprovacoes';
      case 'preco_pendente':
        return 'precos';
      default:
        return 'geral';
    }
  }

  /**
   * Obter estatísticas de tokens registrados
   */
  async obterEstatisticas(): Promise<{
    total_usuarios: number;
    usuarios_com_token: number;
    percentual: number;
  }> {
    const total = await this.usuarioRepository.count({
      where: { deletado: false, ativo: true },
    });

    const comToken = await this.usuarioRepository.count({
      where: { deletado: false, ativo: true, fcm_token: Not(IsNull()) },
    });

    return {
      total_usuarios: total,
      usuarios_com_token: comToken,
      percentual: total > 0 ? (comToken / total) * 100 : 0,
    };
  }
}
