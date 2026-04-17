# RF09 - Push Notifications

**Status**: ✅ Implementado  
**Data**: 10 de fevereiro de 2026  
**Sprint**: 3  

---

## 📋 Resumo

Implementação de sistema de push notifications usando Firebase Cloud Messaging (FCM) para envio de notificações em tempo real aos dispositivos móveis dos usuários, integrado automaticamente com o sistema de notificações existente.

---

## 🎯 Objetivos

- [x] Integrar Firebase Admin SDK no backend
- [x] Implementar serviço de envio de push notifications
- [x] Armazenar tokens FCM dos usuários
- [x] Integrar push com sistema de notificações existente
- [x] Implementar registro/remoção de tokens no login/logout
- [x] Criar endpoints de gerenciamento de push
- [x] Configurar background message handler no mobile
- [x] Implementar listener de token refresh

---

## 🏗️ Arquitetura

### Backend (NestJS)

#### 1. **PushNotificationService** (`backend/src/modules/push/push-notification.service.ts`)

**Responsabilidades:**
- Inicializar Firebase Admin SDK
- Enviar push notifications para usuários
- Gerenciar tokens FCM (registro/remoção)
- Suportar envio em lote
- Enviar notificações silenciosas (background sync)

**Principais Métodos:**

```typescript
class PushNotificationService {
  // Inicialização do Firebase
  private initializeFirebase(): void {
    // Lê credenciais de:
    // - process.env.FIREBASE_SERVICE_ACCOUNT_JSON (string JSON)
    // - process.env.FIREBASE_SERVICE_ACCOUNT_PATH (caminho do arquivo)
    // Se não houver credenciais, push fica desabilitado (não quebra app)
  }

  // Enviar push para um usuário específico
  async enviarParaUsuario(
    id_usuario: string,
    data: PushNotificationData
  ): Promise<SendPushResult> {
    // 1. Buscar fcm_token do usuário no banco
    // 2. Se não tiver token, retorna { sucesso: false, erro: 'sem_token' }
    // 3. Chama enviarPush()
  }

  // Enviar push para múltiplos usuários
  async enviarParaUsuarios(
    ids_usuarios: string[],
    data: PushNotificationData
  ): Promise<SendPushResult[]> {
    // Envia em paralelo para todos os usuários
    // Retorna array de resultados individuais
  }

  // Enviar push (método principal)
  async enviarPush(
    fcm_token: string,
    data: PushNotificationData
  ): Promise<SendPushResult> {
    if (!this.firebaseInitialized) {
      throw new Error('Firebase não configurado');
    }

    const message: admin.messaging.Message = {
      token: fcm_token,
      notification: {
        title: data.titulo,
        body: data.mensagem,
      },
      data: {
        tipo: data.tipo || 'GERAL',
        id_entidade: data.id_entidade || '',
        prioridade: data.prioridade || 'normal',
        ...data.dados_extras
      },
      android: {
        priority: this.getAndroidPriority(data.prioridade),
        notification: {
          channelId: this.getChannelId(data.tipo),
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK'
        }
      },
      apns: {
        headers: {
          'apns-priority': data.prioridade === 'alta' ? '10' : '5',
        },
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    const response = await admin.messaging().send(message);
    return { sucesso: true, message_id: response };
  }

  // Registrar token FCM do dispositivo
  async registrarToken(id_usuario: string, fcm_token: string): Promise<void> {
    await this.usuarioRepository.update(
      { id: id_usuario },
      { fcm_token }
    );
  }

  // Remover token (logout)
  async removerToken(id_usuario: string): Promise<void> {
    await this.usuarioRepository.update(
      { id: id_usuario },
      { fcm_token: null }
    );
  }

  // Enviar notificação silenciosa (apenas data, sem notification)
  async enviarNotificacaoSilenciosa(
    fcm_token: string,
    data: Record<string, string>
  ): Promise<SendPushResult> {
    // Usado para sincronização em background
    // iOS: content-available: 1
    // Android: priority: high
  }

  // Obter estatísticas de tokens
  async obterEstatisticas(): Promise<{
    total_usuarios: number;
    usuarios_com_token: number;
    percentual: number;
  }> {
    const total = await this.usuarioRepository.count();
    const comToken = await this.usuarioRepository.count({
      where: { fcm_token: Not(IsNull()) }
    });
    return {
      total_usuarios: total,
      usuarios_com_token: comToken,
      percentual: total > 0 ? (comToken / total) * 100 : 0
    };
  }

  // Helpers
  private getAndroidPriority(prioridade?: string): 'high' | 'normal' {
    return prioridade === 'alta' ? 'high' : 'normal';
  }

  private getChannelId(tipo?: string): string {
    // Mapeia tipo de notificação para canal do Android
    switch (tipo) {
      case 'MEDICAO': return 'medicoes';
      case 'FATURAMENTO': return 'faturamento';
      case 'APROVACAO': return 'aprovacoes';
      case 'PRECO': return 'precos';
      default: return 'geral';
    }
  }
}
```

**Interfaces:**

```typescript
interface PushNotificationData {
  titulo: string;
  mensagem: string;
  tipo?: string; // MEDICAO, FATURAMENTO, APROVACAO, PRECO, GERAL
  id_entidade?: string; // ID da medição, RDO, etc
  prioridade?: 'baixa' | 'normal' | 'alta';
  dados_extras?: Record<string, any>; // Dados customizados
}

interface SendPushResult {
  sucesso: boolean;
  message_id?: string; // ID do FCM
  erro?: string; // Descrição do erro
}
```

#### 2. **PushController** (`backend/src/modules/push/push.controller.ts`)

**Endpoints:**

```typescript
@Controller('push')
@UseGuards(JwtAuthGuard)
export class PushController {
  
  // Registrar token FCM (login)
  @Post('register-token')
  async registrarToken(
    @Req() req: RequestWithUser,
    @Body('fcm_token') fcm_token: string
  ): Promise<{ message: string; sucesso: boolean }> {
    const user_id = req.user.id.toString();
    await this.pushService.registrarToken(user_id, fcm_token);
    return {
      message: 'Token FCM registrado com sucesso',
      sucesso: true
    };
  }

  // Remover token (logout)
  @Post('unregister-token')
  async removerToken(
    @Req() req: RequestWithUser
  ): Promise<{ message: string; sucesso: boolean }> {
    const user_id = req.user.id.toString();
    await this.pushService.removerToken(user_id);
    return {
      message: 'Token FCM removido com sucesso',
      sucesso: true
    };
  }

  // Testar envio de push (desenvolvimento)
  @Post('test')
  async testarPush(
    @Req() req: RequestWithUser,
    @Body() data: { titulo: string; mensagem: string }
  ): Promise<{ message: string; resultado: SendPushResult }> {
    const user_id = req.user.id.toString();
    const resultado = await this.pushService.enviarParaUsuario(user_id, {
      titulo: data.titulo,
      mensagem: data.mensagem,
      tipo: 'GERAL',
      prioridade: 'normal'
    });
    return {
      message: 'Push de teste enviado',
      resultado
    };
  }

  // Obter estatísticas de tokens
  @Get('stats')
  async obterEstatisticas() {
    return await this.pushService.obterEstatisticas();
  }
}
```

#### 3. **NotificacoesService** (Modificado - Integração Automática)

**Modificação:**
```typescript
// ANTES
async create(createDto: CreateNotificacaoDto): Promise<Notificacao> {
  const notificacao = this.notificacaoRepository.create(createDto);
  return await this.notificacaoRepository.save(notificacao);
}

// DEPOIS
async create(createDto: CreateNotificacaoDto): Promise<Notificacao> {
  const notificacao = this.notificacaoRepository.create(createDto);
  const saved = await this.notificacaoRepository.save(notificacao);
  
  // 🚀 PUSH AUTOMÁTICO (não bloqueia)
  this.enviarPushAsync(saved);
  
  return saved;
}

// Método privado para envio de push
private async enviarPushAsync(notificacao: Notificacao): Promise<void> {
  try {
    await this.pushService.enviarParaUsuario(
      notificacao.id_usuario_destinatario,
      {
        titulo: notificacao.titulo,
        mensagem: notificacao.mensagem,
        tipo: notificacao.tipo,
        id_entidade: notificacao.id_entidade_relacionada ?? undefined,
        prioridade: this.mapPrioridade(notificacao.prioridade),
        dados_extras: notificacao.dados_extras
      }
    );
  } catch (error) {
    // Log do erro mas não falha a criação da notificação
    console.error('Erro ao enviar push notification:', error);
  }
}

private mapPrioridade(prioridade?: PrioridadeEnum): 'baixa' | 'normal' | 'alta' {
  if (!prioridade) return 'normal';
  
  switch (prioridade) {
    case PrioridadeEnum.BAIXA:
      return 'baixa';
    case PrioridadeEnum.ALTA:
      return 'alta';
    default:
      return 'normal';
  }
}
```

**Resultado:**
- ✅ Toda notificação criada via `NotificacoesService.create()` envia push automaticamente
- ✅ Envio não bloqueia (async/await)
- ✅ Erros de push não quebram criação de notificação
- ✅ Suporta envio em lote (`createEmLote()`)

#### 4. **Usuario Entity** (Modificado)

**Campo adicional:**
```typescript
@Entity('tb_usuarios')
export class Usuario {
  // ... campos existentes

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Exclude() // Não expor token em respostas da API
  fcm_token: string | null;
}
```

**Migração 005:**
```sql
-- Adicionar campo fcm_token
ALTER TABLE tb_usuarios
ADD COLUMN fcm_token VARCHAR(255) NULL;

-- Comentário descrevendo o campo
COMMENT ON COLUMN tb_usuarios.fcm_token IS 
  'Token FCM (Firebase Cloud Messaging) para envio de push notifications ao dispositivo móvel do usuário';

-- Índice para melhorar performance de queries por token
CREATE INDEX idx_usuarios_fcm_token ON tb_usuarios(fcm_token) 
WHERE fcm_token IS NOT NULL;

COMMENT ON INDEX idx_usuarios_fcm_token IS 
  'Índice para otimizar queries de envio de push notifications';
```

---

### Mobile (React Native)

#### 1. **PushService** (`mobile/src/services/push.service.ts`)

**Responsabilidades:**
- Solicitar permissão de notificações
- Obter token FCM do dispositivo
- Registrar token no backend
- Remover token no logout
- Listener para refresh de token

**Principais Métodos:**

```typescript
class PushNotificationService {
  // Inicializar serviço (chamado no login)
  static async initialize(): Promise<void> {
    try {
      // 1. Solicitar permissão
      await this.requestPermission();
      
      // 2. Obter token FCM
      const token = await this.getToken();
      
      if (!token) {
        console.warn('Não foi possível obter token FCM');
        return;
      }
      
      // 3. Registrar no backend
      await this.registerToken(token);
      
      // 4. Listener para refresh
      this.listenTokenRefresh();
      
    } catch (error) {
      console.error('Erro ao inicializar push notifications:', error);
    }
  }

  // Solicitar permissão (iOS exige autorização)
  static async requestPermission(): Promise<void> {
    const authStatus = await messaging().requestPermission();
    
    const enabled = 
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    
    if (!enabled) {
      console.warn('Permissão de notificações negada');
    }
  }

  // Obter token FCM
  static async getToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      return token;
    } catch (error) {
      console.error('Erro ao obter token FCM:', error);
      return null;
    }
  }

  // Registrar token no backend
  static async registerToken(fcm_token: string): Promise<void> {
    try {
      // Evitar registro duplicado
      const tokenAnterior = await AsyncStorage.getItem('fcm_token');
      
      if (tokenAnterior === fcm_token) {
        console.log('Token FCM já registrado');
        return;
      }
      
      // POST /push/register-token
      await apiClient.post('/push/register-token', { fcm_token });
      
      // Salvar localmente
      await AsyncStorage.setItem('fcm_token', fcm_token);
      
      console.log('Token FCM registrado no backend');
    } catch (error) {
      console.error('Erro ao registrar token:', error);
    }
  }

  // Remover token (logout)
  static async unregisterToken(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('fcm_token');
      
      if (!token) {
        return;
      }
      
      // POST /push/unregister-token
      await apiClient.post('/push/unregister-token');
      
      // Remover localmente
      await AsyncStorage.removeItem('fcm_token');
      
      console.log('Token FCM removido');
    } catch (error) {
      console.error('Erro ao remover token:', error);
    }
  }

  // Listener para refresh de token
  static listenTokenRefresh(): void {
    messaging().onTokenRefresh(async (newToken) => {
      console.log('Token FCM atualizado:', newToken);
      await this.registerToken(newToken);
    });
  }
}

export default PushNotificationService;
```

#### 2. **App.tsx** (Modificado - Background Handler)

**Background Message Handler:**
```typescript
import messaging from '@react-native-firebase/messaging';

// Registrar handler ANTES do componente App
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('Mensagem em background:', remoteMessage?.messageId);
  console.log('Dados:', remoteMessage?.data);
  
  // Aqui você pode:
  // - Salvar notificação localmente (WatermelonDB)
  // - Atualizar badge do app
  // - Sincronizar dados
  // - Exibir notificação local customizada
});

function App() {
  // ... resto do componente
}
```

#### 3. **AuthSlice** (Modificado - Lifecycle)

**Integração com Login/Logout:**
```typescript
// Login - Registrar token após autenticação
const loginAsync = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      
      // Salvar token e usuário
      await AsyncStorage.setItem('authToken', response.data.access_token);
      await AsyncStorage.setItem('usuario', JSON.stringify(response.data.usuario));
      
      // 🚀 REGISTRAR FCM TOKEN
      try {
        await PushNotificationService.initialize();
      } catch (error) {
        console.warn('Erro ao registrar FCM no login:', error);
      }
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

// Restaurar Sessão - Registrar token ao iniciar o app
const restaurarSessaoAsync = createAsyncThunk(
  'auth/restaurarSessao',
  async (_, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const usuario = await AsyncStorage.getItem('usuario');
      
      if (!token || !usuario) {
        return null;
      }
      
      // 🚀 REGISTRAR FCM TOKEN
      try {
        await PushNotificationService.initialize();
      } catch (error) {
        console.warn('Erro ao registrar FCM na restauracao:', error);
      }
      
      return {
        access_token: token,
        usuario: JSON.parse(usuario)
      };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Logout - Remover token antes de sair
const logoutAsync = createAsyncThunk(
  'auth/logout',
  async () => {
    // 🚀 REMOVER FCM TOKEN
    await PushNotificationService.unregisterToken();
    
    await apiClient.post('/auth/logout');
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('usuario');
  }
);
```

---

## 📊 Fluxos de Dados

### 1. Fluxo de Registro de Token (Login)

```
┌─────────────┐
│   Mobile    │
│   (Login)   │
└──────┬──────┘
       │
       │ 1. Login bem-sucedido
       ▼
┌──────────────────────────┐
│ PushService.initialize() │
└──────┬───────────────────┘
       │
       │ 2. messaging().requestPermission()
       ▼
┌──────────────────┐
│ Solicitar        │ ◄─── iOS: Requer autorização do usuário
│ Permissão        │      Android: Auto-granted
└──────┬───────────┘
       │
       │ 3. messaging().getToken()
       ▼
┌──────────────────┐
│ Obter Token FCM  │
└──────┬───────────┘
       │
       │ 4. POST /push/register-token
       ▼
┌──────────────────────────────┐
│   Backend                     │
│   PushController              │
│   .registrarToken()           │
└──────┬────────────────────────┘
       │
       │ 5. UPDATE tb_usuarios SET fcm_token = '...'
       ▼
┌──────────────────┐
│  Banco de Dados  │
│  (fcm_token      │
│   armazenado)    │
└──────────────────┘
```

### 2. Fluxo de Envio de Push (Automático)

```
┌─────────────────────────────┐
│ Evento do Sistema           │
│ (criar medição, aprovar     │
│  preço, faturar, etc)       │
└──────┬──────────────────────┘
       │
       │ 1. NotificacoesService.create()
       ▼
┌──────────────────────────────┐
│  Criar Notificação no Banco  │
└──────┬───────────────────────┘
       │
       │ 2. enviarPushAsync() (não bloqueia)
       ▼
┌──────────────────────────────┐
│ PushService                  │
│ .enviarParaUsuario()         │
└──────┬───────────────────────┘
       │
       │ 3. SELECT fcm_token FROM tb_usuarios WHERE id = '...'
       ▼
┌──────────────────┐
│  fcm_token       │  ◄─── Se NULL, retorna { sucesso: false, erro: 'sem_token' }
│  encontrado?     │
└──────┬───────────┘
       │ SIM
       │ 4. admin.messaging().send(message)
       ▼
┌──────────────────────────────┐
│   Firebase Cloud Messaging   │
└──────┬───────────────────────┘
       │
       │ 5. Entregar notificação
       ▼
┌──────────────────┐
│   Dispositivo    │
│   Móvel          │
│   (App recebe    │
│    push)         │
└──────────────────┘
```

### 3. Fluxo de Recebimento (Mobile)

```
┌──────────────────────────────┐
│  Firebase Cloud Messaging     │
│  (Servidor)                   │
└──────┬───────────────────────┘
       │
       │ Push enviado
       ▼
┌──────────────────────────────┐
│   Dispositivo Móvel          │
└──────┬───────────────────────┘
       │
       ├─── App em FOREGROUND ───────┐
       │                              │
       │                              ▼
       │                    ┌──────────────────────┐
       │                    │ messaging()          │
       │                    │ .onMessage()         │
       │                    │ listener             │
       │                    └──────┬───────────────┘
       │                           │
       │                           │ Exibir notificação local
       │                           ▼
       │
       └─── App em BACKGROUND ──────┐
                                     │
                                     ▼
                           ┌──────────────────────┐
                           │ setBackground        │
                           │ MessageHandler()     │
                           └──────┬───────────────┘
                                  │
                                  │ - Salvar no banco local
                                  │ - Atualizar badge
                                  │ - Sincronizar
                                  ▼
                           ┌──────────────────────┐
                           │ Notificação exibida  │
                           │ pelo sistema         │
                           └──────────────────────┘
```

---

## ✅ Testes Realizados

### Compilação TypeScript
- ✅ Backend: PushModule, PushController, PushService sem erros
- ✅ Mobile: PushService integrado corretamente
- ✅ Migração 005 executada com sucesso

### Validação de Código
- ✅ Firebase Admin SDK configurado corretamente
- ✅ Tokens FCM armazenados no banco
- ✅ Integração automática com NotificacoesService
- ✅ Lifecycle de token (login → register, logout → unregister)

### Testes Manuais (Planejados)

**Pré-requisito**: Configurar Firebase (ver [FIREBASE_SETUP.md](FIREBASE_SETUP.md))

1. **Registro de Token**
   - [ ] Login → Verificar log "Token FCM registrado"
   - [ ] Verificar token no banco: `SELECT fcm_token FROM tb_usuarios WHERE id = '...'`
   - [ ] Verificar estatísticas: `GET /api/push/stats`

2. **Envio de Push Manual**
   - [ ] POST /api/push/test com token JWT
   - [ ] Verificar notificação recebida no dispositivo
   - [ ] Verificar dados extras no payload

3. **Envio de Push Automático**
   - [ ] Criar medição → Verificar push automático
   - [ ] Aprovar preço → Verificar push automático
   - [ ] Gerar faturamento → Verificar push automático

4. **Logout e Remoção de Token**
   - [ ] Logout → Verificar log "Token FCM removido"
   - [ ] Verificar token NULL no banco
   - [ ] Tentar enviar push → Deve falhar com "sem_token"

5. **Refresh de Token**
   - [ ] Reinstalar app → Novo token gerado
   - [ ] Verificar auto-atualização no backend

6. **Background/Foreground**
   - [ ] App em foreground → Notificação local
   - [ ] App em background → Notificação do sistema
   - [ ] App fechado → Notificação do sistema

---

## 📦 Dependências Adicionadas

### Backend
```json
{
  "firebase-admin": "^12.0.0"
}
```

### Mobile
```json
{
  "@react-native-firebase/app": "^19.2.2",
  "@react-native-firebase/messaging": "^19.2.2"
}
```

---

## 🔐 Configuração de Segurança

### Backend (Credenciais Firebase)

**Opção 1: Variável de Ambiente (JSON completo)**
```env
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"jb-pinturas",...}
```

**Opção 2: Caminho do Arquivo**
```env
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json
```

**⚠️ IMPORTANTE:**
- ✅ Adicionar arquivo ao `.gitignore`
- ✅ Usar secrets management em produção (AWS Secrets Manager, etc)
- ✅ Nunca committar credenciais no repositório

### Mobile (Arquivos de Configuração)

#### Android
```
mobile/android/app/google-services.json
```

**Baixar em**: Firebase Console → Settings → Add Android App

#### iOS
```
mobile/ios/GoogleService-Info.plist
```

**Baixar em**: Firebase Console → Settings → Add iOS App

---

## 📊 Canais de Notificação (Android)

Mapeamento de `tipo` para `channelId`:

| Tipo           | Channel ID    | Descrição                   |
|----------------|---------------|-----------------------------|
| MEDICAO        | medicoes      | Medições e RDOs             |
| FATURAMENTO    | faturamento   | Faturas e pagamentos        |
| APROVACAO      | aprovacoes    | Aprovações pendentes        |
| PRECO          | precos        | Tabelas de preços           |
| **GERAL**      | geral         | Notificações gerais (default) |

**Configuração no Android:**
```kotlin
// mobile/android/app/src/main/java/.../ NotificationChannels.kt
val medicoes = NotificationChannel(
    "medicoes",
    "Medições",
    NotificationManager.IMPORTANCE_HIGH
)
```

---

## 🐛 Troubleshooting

### "Firebase não configurado"

**Causa**: Variáveis de ambiente não definidas

**Solução**:
1. Verifique `backend/.env` tem `FIREBASE_SERVICE_ACCOUNT_JSON` ou `FIREBASE_SERVICE_ACCOUNT_PATH`
2. Se usando PATH, verifique se o arquivo existe
3. Reinicie o backend

### Token não é registrado no login

**Causa**: Permissão negada (iOS) ou erro de rede

**Solução**:
1. iOS: Verificar permissões em Configurações → JB Pinturas → Notificações
2. Android: Permissão é auto-granted
3. Verificar logs: `await PushNotificationService.initialize()`
4. Verificar conectividade com o backend

### Push não é recebido

**Checklist**:
- [ ] Token FCM está registrado? (`SELECT fcm_token FROM tb_usuarios`)
- [ ] Firebase configurado no backend?
- [ ] `google-services.json` está em `mobile/android/app/`?
- [ ] App tem permissão de notificações?
- [ ] Testando em dispositivo físico? (iOS simulador não recebe push)
- [ ] Background handler registrado em `App.tsx`?

### Erro "ENOTFOUND" ou "ECONNREFUSED" no envio

**Causa**: Firebase Admin SDK não consegue conectar ao FCM

**Solução**:
1. Verificar conectividade de rede do servidor
2. Verificar se credenciais do service account estão corretas
3. Verificar se service account tem permissão "Firebase Cloud Messaging Admin"

---

## 📋 Próximas Melhorias

- [ ] Rich notifications (imagens, botões de ação)
- [ ] Deep linking (abrir tela específica ao clicar)
- [ ] Agrupamento de notificações (inbox style)
- [ ] Notificações programadas (scheduled)
- [ ] Topics (grupos de usuários)
- [ ] A/B testing de mensagens
- [ ] Analytics de entrega e abertura
- [ ] Rate limiting (evitar spam)

---

## 📚 Referências

- [Firebase Admin SDK - Node.js](https://firebase.google.com/docs/admin/setup)
- [React Native Firebase - Messaging](https://rnfirebase.io/messaging/usage)
- [FCM - Server Setup](https://firebase.google.com/docs/cloud-messaging/server)
- [FIREBASE_SETUP.md](FIREBASE_SETUP.md) - Guia de configuração completo

---

**Última atualização**: 10 de fevereiro de 2026  
**Autor**: Sistema JB Pinturas - Equipe de Desenvolvimento
