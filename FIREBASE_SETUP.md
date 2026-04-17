# Configuração Firebase - Push Notifications

## Visão Geral

Este guia detalha a configuração do Firebase Cloud Messaging (FCM) para habilitar push notifications no sistema JB Pinturas.

**Status do código**: ✅ Implementado (RF09)
**Status da configuração**: ⏳ Pendente

## Pré-requisitos

- Conta Google
- Acesso ao [Firebase Console](https://console.firebase.google.com/)
- Node.js e npm instalados
- Projeto mobile compilável (Android Studio ou Xcode)

---

## PARTE 1: Criar Projeto Firebase

### 1.1. Acessar Firebase Console

1. Acesse [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Faça login com sua conta Google
3. Clique em **"Adicionar projeto"** ou **"Add project"**

### 1.2. Configurar Projeto

1. **Nome do projeto**: `jb-pinturas` (ou nome de sua preferência)
2. **Google Analytics**: Pode desabilitar (opcional para push notifications)
3. Aguarde a criação do projeto (30-60 segundos)
4. Clique em **"Continuar"**

---

## PARTE 2: Configurar Backend (Node.js/NestJS)

### 2.1. Criar Service Account

1. No Firebase Console, clique no ícone de **engrenagem** (⚙️) → **Configurações do projeto**
2. Vá para a aba **"Contas de serviço"** ou **"Service accounts"**
3. Na seção **"SDK Admin do Firebase"**, clique em **"Gerar nova chave privada"**
4. Confirme clicando em **"Gerar chave"**
5. Um arquivo JSON será baixado (ex: `jb-pinturas-firebase-adminsdk-xxxxx.json`)

⚠️ **IMPORTANTE**: Este arquivo contém credenciais sensíveis. **NÃO comite no Git!**

### 2.2. Configurar Backend

**Opção A: Variável de ambiente com JSON completo (Recomendado para produção)**

1. Copie o conteúdo do arquivo JSON baixado
2. Crie/edite o arquivo `backend/.env`:

```env
# Firebase Cloud Messaging
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"jb-pinturas",...}
```

**Opção B: Variável de ambiente com caminho do arquivo (Recomendado para desenvolvimento)**

1. Mova o arquivo JSON para um local seguro:
   ```powershell
   # Exemplo:
   New-Item -ItemType Directory -Force -Path backend/config
   Move-Item jb-pinturas-firebase-adminsdk-xxxxx.json backend/config/firebase-service-account.json
   ```

2. Adicione ao `backend/.env`:
   ```env
   # Firebase Cloud Messaging
   FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json
   ```

3. Adicione ao `.gitignore`:
   ```
   backend/config/firebase-service-account.json
   ```

### 2.3. Verificar Backend

Inicie o backend e verifique os logs:

```powershell
cd backend
npm run start:dev
```

Saída esperada:
```
[PushNotificationService] Firebase Admin SDK inicializado com sucesso
```

Se ver erro:
```
[PushNotificationService] Firebase não configurado. Push notifications desabilitados.
```
→ Verifique as variáveis de ambiente.

---

## PARTE 3: Configurar Mobile (React Native)

### 3.1. Registrar App Android

1. No Firebase Console, na página inicial do projeto
2. Clique no ícone **Android** para adicionar um app Android
3. Preencha os campos:
   - **Nome do pacote Android**: `com.jbpinturas` (deve ser o mesmo do `android/app/build.gradle`)
   - **Apelido do app**: `JB Pinturas Android` (opcional)
   - **Certificado SHA-1**: Deixe em branco por enquanto (necessário apenas para Auth)
4. Clique em **"Registrar app"**

### 3.2. Baixar e Configurar google-services.json

1. Na próxima tela, clique em **"Fazer download do google-services.json"**
2. Copie o arquivo para a pasta Android do projeto:

```powershell
# De onde você baixou o arquivo:
Copy-Item google-services.json mobile/android/app/google-services.json
```

3. Verifique se o arquivo está no local correto:
   ```
   mobile/
   └── android/
       └── app/
           └── google-services.json  ← Aqui
   ```

### 3.3. Verificar Configuração Android

Abra `mobile/android/app/build.gradle` e verifique se tem:

```gradle
apply plugin: 'com.google.gms.google-services'  // No final do arquivo
```

Abra `mobile/android/build.gradle` e verifique:

```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.3.15'  // ou versão similar
    }
}
```

### 3.4. Registrar App iOS (Opcional)

1. No Firebase Console, clique no ícone **iOS** (⊕ ao lado de Android)
2. Preencha:
   - **ID do pacote iOS**: `com.jbpinturas` (deve ser o mesmo do Xcode)
   - **Apelido do app**: `JB Pinturas iOS`
3. Baixe o arquivo `GoogleService-Info.plist`
4. No Xcode:
   - Abra `mobile/ios/JBPinturas.xcworkspace`
   - Arraste `GoogleService-Info.plist` para a raiz do projeto no Xcode
   - Certifique-se de marcar **"Copy items if needed"**

---

## PARTE 4: Testar Configuração

### 4.1. Testar Backend

#### Opção 1: Endpoint de teste (dev)

```powershell
# Fazer login e obter token
$token = "seu_token_jwt_aqui"

# Enviar push de teste
Invoke-RestMethod -Uri "http://localhost:3000/api/push/test" `
  -Method POST `
  -Headers @{ "Authorization" = "Bearer $token" }
```

#### Opção 2: Criar notificação via API

```powershell
# Criar uma notificação (envia push automaticamente)
Invoke-RestMethod -Uri "http://localhost:3000/api/notificacoes" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
  } `
  -Body '{"titulo":"Teste","mensagem":"Testando push","tipo":"GERAL","prioridade":"ALTA","id_destinatario":1}'
```

### 4.2. Testar Mobile

1. **Compilar e instalar no dispositivo físico** (push não funciona em emulador iOS):

   ```powershell
   # Android (pode testar em emulador)
   cd mobile
   npm run android
   
   # iOS (requer dispositivo físico)
   npm run ios
   ```

2. **Fazer login no app**
   - O token FCM será registrado automaticamente
   - Verifique os logs: `FCM Token registrado: <token>`

3. **Verificar registro no backend**:
   ```powershell
   # Ver estatísticas
   Invoke-RestMethod -Uri "http://localhost:3000/api/push/stats" `
     -Headers @{ "Authorization" = "Bearer $token" }
   
   # Resposta esperada:
   # {"total_usuarios": 5, "usuarios_com_token": 1, "percentual": 20}
   ```

4. **Enviar push de teste** (use os comandos da seção 4.1)

5. **Verificar recebimento**:
   - **App em foreground**: Verifica notificação local
   - **App em background**: Notificação na bandeja do sistema
   - **App fechado**: Notificação na bandeja do sistema

### 4.3. Logs de Depuração

**Backend**:
```powershell
cd backend
npm run start:dev
# Observe logs: [PushNotificationService] ...
```

**Mobile (Android)**:
```powershell
cd mobile
npx react-native log-android
# Observe logs: FCM Token, Mensagem em background, etc.
```

**Mobile (iOS)**:
```powershell
cd mobile
npx react-native log-ios
```

---

## PARTE 5: Troubleshooting

### Problema: "Firebase não configurado"

**Causa**: Variáveis de ambiente não encontradas

**Solução**:
1. Verifique `backend/.env` tem `FIREBASE_SERVICE_ACCOUNT_JSON` ou `FIREBASE_SERVICE_ACCOUNT_PATH`
2. Se usando PATH, verifique se o arquivo existe
3. Reinicie o backend

### Problema: "App não recebe notificações"

**Checklist**:
- [ ] Token FCM foi registrado? (Verifique `/api/push/stats`)
- [ ] Backend está rodando?
- [ ] `google-services.json` está em `mobile/android/app/`?
- [ ] App tem permissão de notificações? (Android: Configurações → Apps → JB Pinturas → Notificações)
- [ ] Testando em dispositivo físico? (iOS não funciona em simulador)

### Problema: Token não é registrado no login

**Solução**:
1. Verifique logs do mobile: `await PushNotificationService.initialize()`
2. Verifique permissões (Android Auto-grant, iOS requer autorização)
3. Verifique conexão de rede (API backend acessível?)

### Problema: Erro 400/401 ao registrar token

**Causa**: Token JWT inválido ou expirado

**Solução**:
1. Faça logout e login novamente
2. Verifique se `authSlice` chama `PushNotificationService.initialize()` após login

---

## PARTE 6: Configuração de Produção

### 6.1. Backend (Servidor)

**Opção A: Variável de ambiente (Recomendado)**

No servidor (Railway, AWS, etc):

```bash
export FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
```

**Opção B: Secrets Management**

Use serviços como:
- AWS Secrets Manager
- Google Cloud Secret Manager
- Azure Key Vault
- Doppler

### 6.2. Mobile (Release)

**Android**:
1. `google-services.json` é empacotado automaticamente no APK/AAB
2. Para diferentes ambientes (dev/prod), use [múltiplas variantes](https://rnfirebase.io/#2-android-setup)

**iOS**:
1. `GoogleService-Info.plist` é empacotado no IPA
2. Para diferentes ambientes, use [múltiplos targets](https://rnfirebase.io/#2-ios-setup)

### 6.3. Segurança

⚠️ **Checklist de Segurança**:
- [ ] `firebase-service-account.json` está no `.gitignore`
- [ ] Credenciais não estão commitadas no Git
- [ ] Service account tem apenas permissões necessárias (Firebase Cloud Messaging)
- [ ] Rotação de chaves configurada (recomendado a cada 90 dias)

---

## Referências

- [React Native Firebase - Messaging](https://rnfirebase.io/messaging/usage)
- [Firebase Admin SDK - Setup](https://firebase.google.com/docs/admin/setup)
- [FCM - Server Setup](https://firebase.google.com/docs/cloud-messaging/server)

---

## Status do Projeto

### Implementado ✅

- Backend: `PushNotificationService` com Firebase Admin SDK
- Backend: `PushController` com endpoints `/register-token`, `/unregister-token`, `/test`, `/stats`
- Backend: Integração com `NotificacoesService` (auto-send on create)
- Backend: Migração 005 (campo `fcm_token` na tabela `tb_usuarios`)
- Mobile: `PushService` com token lifecycle
- Mobile: Integração com `authSlice` (register on login, unregister on logout)
- Mobile: Background message handler
- Mobile: Dependências instaladas (`@react-native-firebase/app`, `@react-native-firebase/messaging`)

### Pendente ⏳

- [ ] Criar projeto Firebase
- [ ] Configurar Service Account (backend)
- [ ] Configurar `google-services.json` (Android)
- [ ] Configurar `GoogleService-Info.plist` (iOS - opcional)
- [ ] Testar fluxo completo
- [ ] Deploy em produção

---

**Última atualização**: 10 de fevereiro de 2026
