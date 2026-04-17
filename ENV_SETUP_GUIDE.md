# 🔐 Variáveis de Ambiente Necessárias - ERS 4.0

Este arquivo documenta **TODAS** as variáveis de ambiente que precisam ser configuradas para implementar as features do Plano de Ação ERS 4.0.

---

## 📋 CHECKLIST DE CONFIGURAÇÃO

### ✅ Já Configuradas (Existentes)

Estas variáveis já devem estar no arquivo `.env`:

```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=jb_pinturas

# JWT
JWT_SECRET=sua-chave-secreta-aqui-minimo-32-caracteres
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# API
PORT=3000
NODE_ENV=development
```

---

## 🆕 NOVAS VARIÁVEIS NECESSÁRIAS

### Sprint 1: Workflows Financeiros

#### 1. Criptografia AES-256 (RN04 - CRÍTICO ⚠️)

```bash
# Chave de criptografia para dados sensíveis (dados bancários)
# DEVE ter exatamente 64 caracteres hexadecimais (32 bytes)
# Gerar com: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
CRYPTO_KEY=a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2

# ⚠️ ATENÇÃO: 
# - NUNCA commite essa chave no Git
# - Use chaves diferentes para dev, staging e produção
# - Guarde backup da chave de produção em cofre seguro
# - Se perder a chave, dados criptografados são IRRECUPERÁVEIS
```

**Como Gerar:**
```bash
# No terminal (Node.js):
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Ou no terminal (OpenSSL):
openssl rand -hex 32
```

---

#### 2. Redis (Jobs e Cache)

```bash
# Redis para BullMQ (jobs) e cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=             # Deixe vazio se Redis local sem senha
REDIS_DB=0

# Redis Cloud (produção - opcional)
# REDIS_HOST=redis-12345.c123.us-east-1-3.ec2.cloud.redislabs.com
# REDIS_PORT=12345
# REDIS_PASSWORD=sua-senha-redis-cloud
```

**Setup Local (Docker):**
```bash
docker run -d \
  --name jb-pinturas-redis \
  -p 6379:6379 \
  redis:7-alpine

# Testar conexão:
redis-cli ping  # Deve retornar "PONG"
```

---

### Sprint 3: Push Notifications (Firebase)

#### 3. Firebase Cloud Messaging (CRÍTICO para RF09)

```bash
# Firebase Project ID
FIREBASE_PROJECT_ID=jb-pinturas-12345

# Firebase Private Key (base64 encoded)
# Baixar de: Firebase Console > Project Settings > Service Accounts > Generate New Private Key
# Converter para base64: cat firebase-adminsdk.json | base64 -w 0
FIREBASE_PRIVATE_KEY_BASE64=eyJ0eXBlIjoic2VydmljZV9hY2NvdW50IiwicHJvamVjdF9pZCI6ImpiLXBpbnR1cmFzLTEyMzQ1IiwicHJpdm...

# OU (alternativa): path para o arquivo JSON
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-adminsdk.json

# Firebase Database URL (opcional, se usar Realtime DB)
FIREBASE_DATABASE_URL=https://jb-pinturas-12345.firebaseio.com
```

**Passos para Configurar Firebase:**

1. **Criar Projeto:** https://console.firebase.google.com
2. **Habilitar Cloud Messaging:**
   - Firebase Console > Build > Cloud Messaging
   - Copiar Server Key (legacy) se necessário
3. **Gerar Service Account:**
   - Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Salvar `firebase-adminsdk.json`
4. **Converter para Base64:**
   ```bash
   cat firebase-adminsdk.json | base64 -w 0 > firebase-key.txt
   # Copiar conteúdo de firebase-key.txt para FIREBASE_PRIVATE_KEY_BASE64
   ```

---

### Sprint 4: Storage de Files (S3 ou MinIO)

#### 4. AWS S3 (para Fotos e Assinaturas)

```bash
# AWS Credentials
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
AWS_S3_BUCKET=jb-pinturas-uploads

# OU usar MinIO local (alternativa ao S3):
# MINIO_ENDPOINT=http://localhost:9000
# MINIO_ACCESS_KEY=minioadmin
# MINIO_SECRET_KEY=minioadmin
# MINIO_BUCKET=jb-pinturas
```

**Setup MinIO Local (alternativa ao S3):**
```bash
docker run -d \
  --name jb-pinturas-minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  minio/minio server /data --console-address ":9001"

# Acessar console: http://localhost:9001
# Criar bucket: "jb-pinturas"
```

---

### Desenvolvimento: Email (Opcional)

#### 5. SMTP para Emails de Notificação (Opcional)

```bash
# Configuração SMTP (ex: Gmail, SendGrid, Mailtrap)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false  # true para 465, false para 587
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=sua-senha-de-app  # Não é a senha normal, é App Password

# Gmail App Password: https://myaccount.google.com/apppasswords

# Alternativa - Mailtrap (desenvolvimento):
# SMTP_HOST=smtp.mailtrap.io
# SMTP_PORT=2525
# SMTP_USER=seu-username-mailtrap
# SMTP_PASSWORD=sua-senha-mailtrap
```

---

### Produção: Segurança e Monitoramento

#### 6. Sentry (Error Tracking)

```bash
# Sentry DSN (opcional mas recomendado)
SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
SENTRY_ENVIRONMENT=production  # ou staging, development
```

---

#### 7. CORS e URLs

```bash
# URLs permitidas (separadas por vírgula)
CORS_ORIGINS=http://localhost:5173,https://jbpinturas.com.br,https://app.jbpinturas.com.br

# URL base da API (para links em emails/notificações)
API_BASE_URL=https://api.jbpinturas.com.br

# URL do frontend
FRONTEND_URL=https://app.jbpinturas.com.br
```

---

## 📁 ESTRUTURA DE ARQUIVOS

### Backend

Crie o arquivo `.env` na raiz do backend:

```
backend/
├── .env                           ← SEU ARQUIVO AQUI
├── .env.example                   ← Template versionado no Git
├── .env.staging                   ← Variáveis de staging (opcional)
├── .env.production                ← Variáveis de produção (NÃO commitar!)
└── src/
```

**Conteúdo do `.env.example` (commitar no Git):**
```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=change-me
DATABASE_NAME=jb_pinturas

# JWT
JWT_SECRET=change-me-minimum-32-characters
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Crypto (AES-256)
CRYPTO_KEY=change-me-64-hex-chars

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_BASE64=your-base64-encoded-key

# AWS S3 / MinIO
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# API
PORT=3000
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173
API_BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
```

---

### Mobile

Crie o arquivo `.env` na raiz do mobile:

```
mobile/
├── .env                           ← SEU ARQUIVO AQUI
├── .env.example                   ← Template versionado no Git
└── src/
```

**Conteúdo do `.env` (mobile):**
```bash
# API Backend
API_URL=http://localhost:3000  # ou https://api.jbpinturas.com.br

# Firebase (Push Notifications)
FIREBASE_API_KEY=AIzaSyAbcDefGhiJklMnopQrsTuvWxyz123456
FIREBASE_AUTH_DOMAIN=jb-pinturas-12345.firebaseapp.com
FIREBASE_PROJECT_ID=jb-pinturas-12345
FIREBASE_STORAGE_BUCKET=jb-pinturas-12345.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789012
FIREBASE_APP_ID=1:123456789012:android:abcdef1234567890

# Google Maps (para geolocalização)
GOOGLE_MAPS_API_KEY=AIzaSyAbcDefGhiJklMnopQrsTuvWxyz123456
```

---

## 🔒 SEGURANÇA

### ⚠️ NUNCA COMITAR NO GIT

Adicione ao `.gitignore`:

```gitignore
# Environment variables
.env
.env.local
.env.production
.env.staging

# Firebase credentials
firebase-adminsdk.json
google-services.json
GoogleService-Info.plist

# AWS credentials
.aws/

# Sensitive keys
*.pem
*.key
*.p12
```

---

### ✅ BOAS PRÁTICAS

1. **Chaves Diferentes por Ambiente:**
   - Dev: chaves fracas OK (ex: `dev-secret-123`)
   - Staging: chaves fortes
   - Produção: chaves geradas com `crypto.randomBytes(32)`

2. **Backup de Chaves de Produção:**
   - Guardar em cofre seguro (ex: 1Password, Vault)
   - Documentar quem tem acesso

3. **Rotação de Chaves:**
   - JWT_SECRET: rotacionar a cada 6 meses
   - CRYPTO_KEY: NUNCA rotacionar (dados criptografados ficam inacessíveis)
   - Firebase: renovar tokens anualmente

4. **Validação no Startup:**
   - Backend deve validar que todas as variáveis obrigatórias estão presentes
   - Falhar rapidamente se faltando

**Código de Validação (adicionar em `main.ts`):**

```typescript
function validateEnv() {
  const required = [
    'DATABASE_HOST',
    'JWT_SECRET',
    'CRYPTO_KEY',
    'REDIS_HOST',
    'FIREBASE_PROJECT_ID',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Variáveis de ambiente faltando:');
    missing.forEach(key => console.error(`  - ${key}`));
    console.error('\n📖 Veja: .env.example');
    process.exit(1);
  }

  // Validar formato de CRYPTO_KEY
  if (process.env.CRYPTO_KEY.length !== 64) {
    console.error('❌ CRYPTO_KEY deve ter exatamente 64 caracteres hex');
    console.error('   Gerar com: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    process.exit(1);
  }

  console.log('✅ Variáveis de ambiente validadas');
}

// Chamar no início de bootstrap()
async function bootstrap() {
  validateEnv();
  // ... resto do código ...
}
```

---

## 🧪 TESTE DE CONFIGURAÇÃO

### Script de Validação

Crie `backend/scripts/test-env.ts`:

```typescript
import * as dotenv from 'dotenv';
import * as crypto from 'crypto';

dotenv.config();

console.log('🧪 Testando configurações...\n');

// 1. Crypto
try {
  const key = Buffer.from(process.env.CRYPTO_KEY, 'hex');
  const cipher = crypto.createCipheriv('aes-256-gcm', key, crypto.randomBytes(12));
  cipher.update('teste');
  cipher.final();
  console.log('✅ CRYPTO_KEY válida');
} catch (error) {
  console.error('❌ CRYPTO_KEY inválida:', error.message);
}

// 2. Redis
import { Redis } from 'ioredis';
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
});

redis.ping()
  .then(() => console.log('✅ Redis conectado'))
  .catch(err => console.error('❌ Redis falhou:', err.message))
  .finally(() => redis.disconnect());

// 3. Firebase (se configurado)
if (process.env.FIREBASE_PROJECT_ID) {
  console.log('✅ Firebase configurado (project:', process.env.FIREBASE_PROJECT_ID, ')');
} else {
  console.log('⚠️  Firebase não configurado (necessário para Sprint 3)');
}

console.log('\n✅ Configuração validada!');
```

**Executar:**
```bash
cd backend
npm run test:env
```

---

## 📝 CHECKLIST DE DEPLOY

### Antes de Deploy em Staging/Produção

- [ ] Todas as variáveis do `.env.example` estão preenchidas
- [ ] `CRYPTO_KEY` foi gerado com `crypto.randomBytes(32)` (não usar valor de dev)
- [ ] `JWT_SECRET` tem no mínimo 32 caracteres aleatórios
- [ ] Firebase project criado e credentials baixadas
- [ ] S3 bucket criado ou MinIO rodando
- [ ] Redis acessível e testado
- [ ] Variáveis de ambiente carregadas no servidor (ex: PM2 ecosystem.config.js, Docker secrets)
- [ ] `.env` NÃO está commitado no Git
- [ ] Backup das chaves de produção foi feito em cofre seguro
- [ ] Script de validação (`test-env.ts`) passou sem erros

---

## 🆘 TROUBLESHOOTING

### Erro: "CRYPTO_KEY is not defined"
**Solução:** Adicione `CRYPTO_KEY` no `.env` com 64 caracteres hex

### Erro: "Firebase app not initialized"
**Solução:** 
1. Verifique se `FIREBASE_PROJECT_ID` e `FIREBASE_PRIVATE_KEY_BASE64` estão definidos
2. Teste com `firebase-admin` diretamente

### Erro: "Redis connection refused"
**Solução:**
1. Verifique se Redis está rodando: `redis-cli ping`
2. Confirme porta: padrão é 6379
3. Se usar Redis Cloud, verifique firewall/whitelist

### Erro: "S3 Access Denied"
**Solução:**
1. Verifique IAM permissions da AWS access key
2. Permissões mínimas: `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`
3. Bucket policy deve permitir acesso

---

**Última Atualização:** 10/02/2026  
**Responsável:** DevOps Team  
**Status:** ✅ Pronto para configuração
