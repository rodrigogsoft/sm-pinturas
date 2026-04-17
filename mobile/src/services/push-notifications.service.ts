// Firebase temporariamente desabilitado
// import messaging from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { api } from './api';
// import PushNotification from 'react-native-push-notification';  // Not installed
// import PushNotificationIOS from '@react-native-community/push-notification-ios';  // Not installed

export interface NotificacaoPayload {
  title: string;
  body: string;
  data?: {
    tipo?: 'MEDICAO_PENDENTE' | 'PRAZO_OBRA' | 'ALERTA_FATURAMENTO' | 'PRECO_APROVADO' | 'PRECO_REJEITADO';
    id_obra?: string;
    id_alocacao?: string;
    prioridade?: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  };
}

/**
 * PushNotificationService
 * 
 * RF09 - Sistema de Push Notifications
 * 
 * Funcionalidades:
 * - Solicita permissões (Android/iOS)
 * - Registra token FCM no backend
 * - Processa notificações em foreground/background
 * - Navega para telas específicas ao tocar
 * - Exibe notificações locais
 */
export class PushNotificationService {
  private static isInitialized = false;

  /**
   * Inicializar serviço de push notifications
   * Deve ser chamado no App.tsx ao iniciar
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('PushNotificationService já inicializado');
      return;
    }

    console.log('🔔 Inicializando PushNotificationService...');

    // Configurar canal de notificação (Android)
    this.createNotificationChannels();

    // Solicitar permissões
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      console.warn('Permissão de notificação negada');
      return;
    }

    // Obter e registrar token FCM
    await this.registerFCMToken();

    // Configurar listeners
    this.setupListeners();

    this.isInitialized = true;
    console.log('✅ PushNotificationService inicializado com sucesso');
  }

  /**
   * Solicitar permissões de notificação
   */
  private static async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        // Firebase desabilitado
        // const authStatus = await messaging().requestPermission();
        console.log('iOS: Permissão de notificação simulada (Firebase desabilitado)');
        return true;
      } else {
        // Android 13+ requer permissão explícita
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true; // Android < 13 não precisa de permissão runtime
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão de notificação:', error);
      return false;
    }
  }

  /**
   * Criar canais de notificação (Android)
   * DESABILITADO: react-native-push-notification não instalado
   */
  private static createNotificationChannels(): void {
    if (Platform.OS !== 'android') return;

    console.log('Push notification channels: desabilitado (biblioteca não instalada)');

    // PushNotification.createChannel(
    //   {
    //     channelId: 'default',
    //     channelName: 'Notificações Gerais',
    //     ...
    //   },
    //   (created) => console.log(`Canal 'default' criado: ${created}`),
    // );
  }

  /**
   * Obter token FCM e registrar no backend
   */
  private static async registerFCMToken(): Promise<void> {
    try {
      // Firebase desabilitado
      const fcmToken = 'mock-token-' + Date.now();
      if (!fcmToken) {
        console.warn('Não foi possível obter token FCM');
        return;
      }

      console.log('FCM Token (mock):', fcmToken.substring(0, 20) + '...');

      // Registrar token no backend
      await this.sendTokenToBackend(fcmToken);

      // Listener desabilitado (Firebase)
      console.log('Token refresh listener desabilitado (Firebase)');
    } catch (error) {
      console.error('Erro ao registrar FCM token:', error);
    }
  }

  /**
   * Enviar token para o backend
   */
  private static async sendTokenToBackend(token: string): Promise<void> {
    try {
      await api.post('/notificacoes/registrar-token', {
        token,
        device: Platform.OS,
        device_version: Platform.Version.toString(),
      });
      console.log('Token FCM registrado no backend');
    } catch (error) {
      console.error('Erro ao enviar token para backend:', error);
    }
  }

  /**
   * Configurar listeners de notificações
   */
  private static setupListeners(): void {
    // Firebase desabilitado - listeners comentados
    // Notificação recebida em FOREGROUND
    // messaging().onMessage(async (remoteMessage) => {
    //   console.log('Notificação recebida em foreground:', remoteMessage);
    //   if (remoteMessage.notification) {
    //     this.showLocalNotification({
    //       title: remoteMessage.notification.title || 'JB Pinturas',
    //       body: remoteMessage.notification.body || '',
    //       data: remoteMessage.data,
    //     });
    //   }
    // });

    // Notificação tocada (app aberto a partir da notificação)
    // messaging().onNotificationOpenedApp((remoteMessage) => {
    //   console.log('App aberto via notificação:', remoteMessage);
    //   this.handleNotificationNavigation(remoteMessage.data);
    // });

    // App aberto a partir de notificação quando estava fechado
    // messaging()
    //   .getInitialNotification()
    //   .then((remoteMessage) => {
    //     if (remoteMessage) {
    //       console.log('App aberto via notificação (estava fechado):', remoteMessage);
    //       this.handleNotificationNavigation(remoteMessage.data);
    //     }
    //   });

    console.log('setupListeners com Firebase desabilitado');

    // Configurar listener desabilitado (react-native-push-notification não instalado)
    // PushNotification.configure({
    //   onNotification: function (notification) { ... },
    // });
  }

  /**
   * Exibir notificação local
   * DESABILITADO: react-native-push-notification não instalado
   */
  private static showLocalNotification(payload: NotificacaoPayload): void {
    console.log('Local notification desabilitado:', payload.title);
    // const prioridade = payload.data?.prioridade || 'MEDIA';
    // const channelId = prioridade === 'CRITICA' || prioridade === 'ALTA' ? 'urgent' : 'default';
    // PushNotification.localNotification({ ... });
  }

  /**
   * Navegar para tela específica baseado no tipo de notificação
   */
  private static handleNotificationNavigation(data: any): void {
    if (!data || !data.tipo) return;

    // TODO: Implementar navegação usando React Navigation
    // Exemplo:
    // import { navigationRef } from './navigation/RootNavigation';
    
    switch (data.tipo) {
      case 'MEDICAO_PENDENTE':
        console.log('Navegar para MedicoesScreen');
        // navigationRef.navigate('Medicoes');
        break;

      case 'PRAZO_OBRA':
        if (data.id_obra) {
          console.log('Navegar para detalhes da obra:', data.id_obra);
          // navigationRef.navigate('ObraDetalhes', { id: data.id_obra });
        }
        break;

      case 'ALERTA_FATURAMENTO':
        console.log('Navegar para Faturamento');
        // navigationRef.navigate('Faturamento');
        break;

      case 'PRECO_APROVADO':
      case 'PRECO_REJEITADO':
        console.log('Navegar para Preços');
        // navigationRef.navigate('Precos');
        break;

      default:
        console.log('Tipo de notificação não tratado:', data.tipo);
    }
  }

  /**
   * Enviar notificação de teste
   */
  static sendTestNotification(): void {
    this.showLocalNotification({
      title: '🎯 Teste de Notificação',
      body: 'Sistema de push notifications funcionando!',
      data: {
        tipo: 'MEDICAO_PENDENTE',
        prioridade: 'MEDIA',
      },
    });
  }

  /**
   * Limpar todas as notificações
   * DESABILITADO: react-native-push-notification não instalado
   */
  static clearAllNotifications(): void {
    console.log('Clear notifications: desabilitado (biblioteca não instalada)');
    // PushNotification.cancelAllLocalNotifications();
    // if (Platform.OS === 'ios') {
    //   PushNotificationIOS.removeAllDeliveredNotifications();
    // }
  }

  /**
   * Obter token FCM atual
   */
  static async getFCMToken(): Promise<string | null> {
    try {
      return await messaging().getToken();
    } catch (error) {
      console.error('Erro ao obter FCM token:', error);
      return null;
    }
  }

  /**
   * Desregistrar token FCM (logout)
   */
  static async unregisterFCMToken(): Promise<void> {
    try {
      const token = await messaging().getToken();
      if (token) {
        await axios.post(`${API_URL}/notificacoes/remover-token`, { token });
        await messaging().deleteToken();
        console.log('Token FCM removido');
      }
    } catch (error) {
      console.error('Erro ao remover token FCM:', error);
    }
  }
}
