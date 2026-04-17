# Firebase Cloud Messaging - Setup Guide

## 📋 Resumo

Este guia detalha a configuração completa do **Firebase Cloud Messaging (FCM)** para push notifications no app mobile JB Pinturas.

## 🎯 Funcionalidades Implementadas (RF09)

✅ **Notificações Automáticas**:
- Atrasos em prazos de obras (Daily 6am)
- Medições pendentes >3 dias (Daily 8am)
- Alertas de faturamento (Daily 9am)
- Aprovação/reprovação de preços

✅ **Navegação por Deep Links**:
- Toque na notificação → navega para tela específica
- Suporta foreground, background e killed states

✅ **Canais de Notificação (Android)**:
- `default`: Notificações gerais
- `urgent`: Alertas críticos (prioridade ALTA/CRITICA)
- `medicoes`: Lembretes de medições pendentes

---

## 🔧 Passo 1: Criar Projeto Firebase

### 1.1 Acessar Firebase Console

1. Acesse: https://console.firebase.google.com/
2. Clique em **"Adicionar projeto"**
3. Nome: `jb-pinturas` (ou outro de sua preferência)
4. Desabilite Google Analytics (opcional)
5. Clique em **"Criar projeto"**

### 1.2 Adicionar Apps Android e iOS

#### Android:

1. No console, clique no ícone **Android**
2. **Package name**: `com.jbpinturas` (deve bater com `android/app/build.gradle`)
3. **App nickname**: JB Pinturas Android
4. **SHA-1**: (opcional, para autenticação)
5. Baixe o arquivo `google-services.json`
6. Mova para: `mobile/android/app/google-services.json`

#### iOS:

1. No console, clique no ícone **iOS**
2. **Bundle ID**: `com.jbpinturas` (deve bater com Xcode)
3. **App nickname**: JB Pinturas iOS
4. Baixe o arquivo `GoogleService-Info.plist`
5. Mova para: `mobile/ios/JBPinturas/GoogleService-Info.plist`
6. Abra Xcode e arraste o arquivo para o projeto (marque "Copy items if needed")

---

## 🔑 Passo 2: Obter Credenciais do Servidor

### 2.1 Baixar Service Account Key (Backend)

1. No Firebase Console, clique no **ícone de engrenagem** → **Configurações do projeto**
2. Vá para a aba **"Contas de serviço"**
3. Clique em **"Gerar nova chave privada"**
4. Salve o arquivo JSON como: `backend/config/firebase-service-account.json`

**⚠️ IMPORTANTE**: Adicione ao `.gitignore`:

```gitignore
# Firebase
backend/config/firebase-service-account.json
mobile/android/app/google-services.json
mobile/ios/JBPinturas/GoogleService-Info.plist
```

### 2.2 Configurar Variáveis de Ambiente (Backend)

Adicione no `backend/.env`:

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=jb-pinturas
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@jb-pinturas.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nXXXXXX\n-----END PRIVATE KEY-----\n"
```

**Ou** configure o path do arquivo:

```env
GOOGLE_APPLICATION_CREDENTIALS=./config/firebase-service-account.json
```

---

## 📱 Passo 3: Configurar Apps Mobile

### 3.1 Android - Permissões e Configuração

#### `mobile/android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <!-- Permissões de Notificação (Android 13+) -->
  <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
  <uses-permission android:name="android.permission.INTERNET" />
  <uses-permission android:name="android.permission.VIBRATE" />

  <application>
    <!-- Firebase Messaging Service -->
    <service
      android:name="com.jbpinturas.MyFirebaseMessagingService"
      android:exported="false">
      <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT" />
      </intent-filter>
    </service>

    <!-- Ícone de notificação padrão -->
    <meta-data
      android:name="com.google.firebase.messaging.default_notification_icon"
      android:resource="@drawable/ic_notification" />

    <!-- Cor de notificação padrão -->
    <meta-data
      android:name="com.google.firebase.messaging.default_notification_color"
      android:resource="@color/colorPrimary" />

    <!-- Canal de notificação padrão -->
    <meta-data
      android:name="com.google.firebase.messaging.default_notification_channel_id"
      android:value="default" />
  </application>
</manifest>
```

#### `mobile/android/app/build.gradle`:

```gradle
dependencies {
  // Firebase BOM (gerencia versões)
  implementation platform('com.google.firebase:firebase-bom:32.7.0')
  
  // Firebase Messaging
  implementation 'com.google.firebase:firebase-messaging'
  
  // React Native Firebase
  implementation project(':@react-native-firebase/app')
  implementation project(':@react-native-firebase/messaging')
}

// No final do arquivo
apply plugin: 'com.google.gms.google-services'
```

#### `mobile/android/build.gradle` (projeto):

```gradle
buildscript {
  dependencies {
    classpath 'com.google.gms:google-services:4.4.0'
  }
}
```

### 3.2 iOS - Configuração

#### `mobile/ios/Podfile`:

```ruby
platform :ios, '13.0'

target 'JBPinturas' do
  # Firebase
  pod 'Firebase/Messaging', '~> 10.20.0'
  pod 'FirebaseCore', '~> 10.20.0'
end
```

Executar:

```bash
cd mobile/ios && pod install
```

#### Capacidades no Xcode:

1. Abra `mobile/ios/JBPinturas.xcworkspace` no Xcode
2. Selecione o target **JBPinturas**
3. Vá para **Signing & Capabilities**
4. Clique em **+ Capability**
5. Adicione:
   - **Push Notifications**
   - **Background Modes** → Marque **Remote notifications**

#### `mobile/ios/JBPinturas/AppDelegate.mm`:

```objc
#import <Firebase.h>
#import <UserNotifications/UserNotifications.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  // Firebase
  [FIRApp configure];
  
  // UNUserNotificationCenter
  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  center.delegate = self;
  
  return YES;
}

// iOS: Registrar token APNS
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {
  [FIRMessaging messaging].APNSToken = deviceToken;
}

// Notificação recebida em foreground
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
       willPresentNotification:(UNNotification *)notification
         withCompletionHandler:(void (^)(UNNotificationPresentationOptions options))completionHandler {
  completionHandler(UNNotificationPresentationOptionSound | UNNotificationPresentationOptionAlert | UNNotificationPresentationOptionBadge);
}

@end
```

---

## 🚀 Passo 4: Inicializar no App

### `mobile/App.tsx`:

```tsx
import React, { useEffect } from 'react';
import { PushNotificationService } from './src/services/push-notifications.service';

const App = () => {
  useEffect(() => {
    // Inicializar Push Notifications
    PushNotificationService.initialize();
  }, []);

  return (
    // ... resto do app
  );
};

export default App;
```

---

## 🧪 Passo 5: Testar Notificações

### 5.1 Teste Local (App em Foreground)

```tsx
import { PushNotificationService } from './src/services/push-notifications.service';

// Em qualquer componente ou tela de debug
<Button onPress={() => PushNotificationService.sendTestNotification()}>
  Testar Notificação Local
</Button>
```

### 5.2 Teste via Firebase Console

1. Acesse: Firebase Console → **Cloud Messaging**
2. Clique em **"Enviar primeira mensagem"**
3. Preencha:
   - **Título**: "Teste de Notificação"
   - **Texto**: "Sistema funcionando!"
4. **Segmentação**: Selecione o app (Android ou iOS)
5. **Opções adicionais**:
   - **Dados personalizados**:
     ```json
     {
       "tipo": "MEDICAO_PENDENTE",
       "prioridade": "ALTA"
     }
     ```
6. Clique em **"Revisar"** → **"Publicar"**

### 5.3 Teste via Backend (API)

```bash
# POST /api/notificacoes/enviar
curl -X POST http://localhost:3000/api/notificacoes/enviar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "id_usuario": 5,
    "titulo": "Medição Pendente",
    "mensagem": "Você tem 3 tarefas concluídas sem medição",
    "tipo": "MEDICAO_PENDENTE",
    "prioridade": "ALTA",
    "enviar_push": true
  }'
```

---

## 🔍 Troubleshooting

### Android: Token FCM não gerado

```bash
# Verificar google-services.json
cat mobile/android/app/google-services.json

# Limpar build
cd mobile/android
./gradlew clean

# Rebuild
cd ..
npx react-native run-android
```

### iOS: Notificação não chega

1. Verifique se o certificado APNS está configurado no Firebase:
   - Firebase Console → **Configurações do projeto** → **Cloud Messaging**
   - Faça upload do arquivo `.p8` (APNs Auth Key)

2. No Xcode, verifique:
   - **Signing & Capabilities** → Push Notifications habilitado
   - **Background Modes** → Remote notifications habilitado

### Logs de Depuração

```tsx
// No App.tsx após inicialização
PushNotificationService.getFCMToken().then(token => {
  console.log('FCM Token:', token);
});
```

---

## 📊 Monitoramento

### Firebase Console - Cloud Messaging

- **Estatísticas de envio**: Taxa de entrega, aberturas, conversões
- **Logs de erros**: Tokens inválidos, falhas de entrega

### Backend - Logs de jobs

```bash
# Verificar logs de jobs
docker-compose logs backend | grep "BullMQ"
```

---

## 🔐 Segurança

### Boas Práticas:

1. **Nunca commite credenciais**:
   - `firebase-service-account.json`
   - `google-services.json`
   - `GoogleService-Info.plist`

2. **Valide tokens no backend**:
   - Apenas usuários autenticados podem registrar tokens
   - Remova tokens ao fazer logout

3. **Limite de envio**:
   - FCM Free: 1 milhão de mensagens/mês
   - Rate limit: ~500 mensagens/segundo

---

## ✅ Checklist de Implementação

- [ ] Firebase project criado
- [ ] `google-services.json` adicionado (Android)
- [ ] `GoogleService-Info.plist` adicionado (iOS)
- [ ] `firebase-service-account.json` configurado (Backend)
- [ ] Variáveis de ambiente configuradas
- [ ] Dependências instaladas (`npm install`)
- [ ] Push Notifications habilitadas no Xcode (iOS)
- [ ] `PushNotificationService.initialize()` chamado no App.tsx
- [ ] Teste local funcionando
- [ ] Teste via Firebase Console funcionando
- [ ] Endpoint `/notificacoes/registrar-token` funcionando
- [ ] Jobs BullMQ enviando notificações
- [ ] Deep linking funcionando (navegação ao tocar)

---

## 📚 Referências

- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [@react-native-firebase/messaging](https://rnfirebase.io/messaging/usage)
- [react-native-push-notification](https://github.com/zo0r/react-native-push-notification)
- [ERS 4.0 - RF09](../docs/ERS-v4.0.md#rf09---push-notifications)

---

**Última atualização**: <%= new Date().toISOString().split('T')[0] %>
