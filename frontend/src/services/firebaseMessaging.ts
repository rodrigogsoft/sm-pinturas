// Serviço para inicializar Firebase, obter token FCM e registrar no backend
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { firebaseConfig, hasCompleteFirebaseConfig } from '../firebaseConfig';
import api from './api';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

export function initFirebaseMessaging(onNotification: (payload: any) => void) {
  if (!hasCompleteFirebaseConfig) {
    return;
  }

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (!('serviceWorker' in navigator)) {
    return;
  }

  const app = initializeApp(firebaseConfig);
  const messaging = getMessaging(app);

  // Solicita permissão e obtém token
  Notification.requestPermission().then(async (permission) => {
    if (permission === 'granted') {
      try {
        const tokenOptions: {
          vapidKey?: string;
          serviceWorkerRegistration: ServiceWorkerRegistration;
        } = {
          serviceWorkerRegistration: await navigator.serviceWorker.ready,
        };

        if (VAPID_KEY) {
          tokenOptions.vapidKey = VAPID_KEY;
        }

        const currentToken = await getToken(messaging, tokenOptions);
        if (currentToken) {
          // Envia token para backend com fallback para rota legada.
          try {
            await api.post('/push/register-token', { fcm_token: currentToken });
          } catch {
            await api.post('/notificacoes/registrar-token', { fcm_token: currentToken });
          }
        }
      } catch (err) {
        // Falha de push não deve derrubar o app.
      }
    }
  });

  // Listener para notificações recebidas em foreground
  onMessage(messaging, (payload) => {
    onNotification(payload);
  });
}
