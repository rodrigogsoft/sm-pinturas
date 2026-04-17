// Firebase temporariamente desabilitado - usar versão mock
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './api';

const FCM_TOKEN_KEY = 'fcm_token';

export class PushNotificationService {
  /**
   * Solicitar permissao e registrar token FCM no backend
   */
  static async initialize(): Promise<void> {
    const permissionGranted = await this.requestPermission();
    if (!permissionGranted) {
      return;
    }

    const token = await this.getToken();
    if (!token) {
      return;
    }

    await this.registerToken(token);
    this.listenTokenRefresh();
  }

  /**
   * Solicitar permissao de notificacao (iOS/Android)
   */
  static async requestPermission(): Promise<boolean> {
    // Firebase desabilitado - retornar true por padrão
    console.log('Permissão de notificação solicitada (Firebase desabilitado)');
    return true;
  }

  /**
   * Obter token atual do dispositivo
   */
  static async getToken(): Promise<string | null> {
    // Firebase desabilitado - retornar token mock
    console.log('Token FCM solicitado (Firebase desabilitado)');
    return 'mock-fcm-token-' + Date.now();
  }

  /**
   * Registrar token no backend
   */
  static async registerToken(fcm_token: string): Promise<void> {
    const tokenAtual = await AsyncStorage.getItem(FCM_TOKEN_KEY);
    if (tokenAtual === fcm_token) {
      return;
    }

    try {
      await apiClient.getClient().post('/push/register-token', { fcm_token });
      await AsyncStorage.setItem(FCM_TOKEN_KEY, fcm_token);
    } catch (error: any) {
      const status = error?.response?.status;
      const deveTentarLegacy = status === 404 || status === 500;

      if (!deveTentarLegacy) {
        console.warn('Erro ao registrar token no backend:', error);
        return;
      }

      try {
        // Compatibilidade com backend legado que expõe rota em /notificacoes.
        await apiClient.getClient().post('/notificacoes/registrar-token', { token: fcm_token });
        await AsyncStorage.setItem(FCM_TOKEN_KEY, fcm_token);
      } catch (legacyError) {
        console.warn('Erro ao registrar token no backend (incluindo fallback legado):', legacyError);
      }
    }
  }

  /**
   * Remover token (logout)
   */
  static async unregisterToken(): Promise<void> {
    const tokenAtual = await AsyncStorage.getItem(FCM_TOKEN_KEY);
    if (!tokenAtual) {
      return;
    }

    try {
      await apiClient.getClient().post('/push/unregister-token');
    } catch (error: any) {
      const status = error?.response?.status;
      const deveTentarLegacy = status === 404 || status === 500;

      if (!deveTentarLegacy) {
        console.warn('Erro ao remover token no backend:', error);
      } else {
        try {
          await apiClient.getClient().post('/notificacoes/remover-token', { token: tokenAtual });
        } catch (legacyError) {
          console.warn('Erro ao remover token no backend (incluindo fallback legado):', legacyError);
        }
      }
    } finally {
      await AsyncStorage.removeItem(FCM_TOKEN_KEY);
    }
  }

  /**
   * Listener para atualizacao automatica do token
   */
  static listenTokenRefresh() {
    // Firebase desabilitado - não há listeners
    console.log('Token refresh listener desabilitado (Firebase)');
  }
}
