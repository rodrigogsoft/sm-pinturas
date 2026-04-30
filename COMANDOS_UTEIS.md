# 🚀 Comandos Úteis - JB Pinturas

## 📋 Índice

1. [Backend (NestJS)](#backend-nestjs)
2. [Frontend (React)](#frontend-react)
3. [Mobile (React Native)](#mobile-react-native)
4. [Docker](#docker)
5. [Database](#database)
6. [Testes](#testes)
7. [Deploy](#deploy)
8. [Versionamento](#versionamento)

---

## Backend (NestJS)

### Desenvolvimento

```bash
# Navegar para backend
cd backend

# Instalar dependências
npm install

# Copiar .env de exemplo
cp .env.example .env

# Rodar em desenvolvimento
npm run start:dev

# Build de produção
npm run build

# Rodar em produção
npm run start:prod
```

### Migrações de Banco

```bash
# Criar nova migração
npm run migration:create -- src/database/migrations/NomeDaMigracao

# Executar migrações pendentes
npm run migration:run

# Reverter última migração
npm run migration:revert

# Gerar migração automática (baseado em entities)
npm run migration:generate -- src/database/migrations/NomeDaMigracao
```

### Seeds (Dados Iniciais)

```bash
# Popular banco com dados de teste
npm run seed

# Popular usuários padrão
npm run seed:usuarios

# Popular obras de exemplo
npm run seed:obras
```

### Jobs BullMQ

```bash
# Visualizar jobs agendados
npx bull-board

# Testar job manualmente
npm run job:test verificacao-prazos
npm run job:test medicoes-pendentes
npm run job:test alertas-faturamento
```

---

## Frontend (React)

### Desenvolvimento

```bash
# Navegar para frontend
cd frontend

# Instalar dependências
npm install

# Rodar em desenvolvimento (porta 5173)
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview

# Lint
npm run lint
```

### Variáveis de Ambiente

```bash
# Criar .env.local
echo "VITE_API_URL=http://localhost:3000/api" > .env.local

# Desenvolvimento
VITE_API_URL=http://localhost:3000/api

# Produção
VITE_API_URL=https://api.jbpinturas.com.br/api
```

---

## Mobile (React Native)

### Setup Inicial

```bash
# Navegar para mobile
cd mobile

# Instalar dependências
npm install

# iOS: Instalar pods
cd ios && pod install && cd ..

# Android: Limpar build
cd android && ./gradlew clean && cd ..
```

### Desenvolvimento Android

```bash
# Iniciar Metro Bundler
npm start

# Rodar no emulador/dispositivo Android
npm run android

# Build release
cd android
./gradlew assembleRelease

# APK gerado em:
# android/app/build/outputs/apk/release/app-release.apk
```

### Desenvolvimento iOS

```bash
# Rodar no simulador iOS
npm run ios

# Rodar em dispositivo específico
npm run ios -- --device "iPhone de [Seu Nome]"

# Abrir no Xcode
open ios/JBPinturas.xcworkspace

# Build release (Xcode)
# Product → Archive → Distribute App
```

### Configuração Firebase

```bash
# Android: Adicionar google-services.json
# Baixar do Firebase Console e copiar para:
cp ~/Downloads/google-services.json android/app/

# iOS: Adicionar GoogleService-Info.plist
# Baixar do Firebase Console e arrastar para Xcode:
# ios/JBPinturas/ (marcar "Copy items if needed")

# Verificar configuração
cat android/app/google-services.json
cat ios/JBPinturas/GoogleService-Info.plist
```

### Debug e Logs

```bash
# Android: Logs do app
npx react-native log-android

# iOS: Logs do app
npx react-native log-ios

# Flipper (debugging visual)
npx react-native doctor
# Abrir Flipper → Devices → Conectar app
```

### WatermelonDB

```bash
# Resetar banco local (limpar dados)
# Android:
adb shell run-as com.jbpinturas rm -rf /data/data/com.jbpinturas/databases/

# iOS (Simulator):
xcrun simctl get_app_container booted com.jbpinturas data
# Deletar pasta manualmente
```

---

## Docker

### Desenvolvimento (docker-compose)

```bash
# Subir todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f backend
docker-compose logs -f postgres

# Parar serviços
docker-compose down

# Rebuild após mudanças
docker-compose up -d --build

# Limpar volumes (CUIDADO: apaga dados)
docker-compose down -v
```

### Produção (docker-compose.prod.yml)

```bash
# Build de produção
docker-compose -f docker-compose.prod.yml build

# Subir em produção
docker-compose -f docker-compose.prod.yml up -d

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Parar
docker-compose -f docker-compose.prod.yml down
```

### Comandos Úteis

```bash
# Listar containers
docker ps

# Entrar em container
docker exec -it jb_pinturas_backend sh
docker exec -it jb_pinturas_postgres psql -U postgres -d jb_pinturas

# Ver uso de recursos
docker stats

# Limpar containers parados
docker container prune

# Limpar imagens não usadas
docker image prune -a
```

---

## Database

### PostgreSQL

```bash
# Conectar via psql
psql -h localhost -U postgres -d jb_pinturas

# Conectar em container Docker
docker exec -it jb_pinturas_postgres psql -U postgres -d jb_pinturas

# Backup
pg_dump -h localhost -U postgres jb_pinturas > backup_$(date +%Y%m%d).sql

# Restore
psql -h localhost -U postgres jb_pinturas < backup_20240101.sql
```

### Queries Úteis

```sql
-- Ver todas as tabelas
\dt

-- Descrever tabela
\d obras

-- Contar registros
SELECT COUNT(*) FROM obras;
SELECT COUNT(*) FROM usuarios;

-- Ver notificações recentes
SELECT * FROM notificacoes ORDER BY created_at DESC LIMIT 10;

-- Ver alocações sem medição
SELECT a.* 
FROM alocacoes_tarefas a
LEFT JOIN medicoes m ON m.id_alocacao = a.id
WHERE a.status = 'CONCLUIDO' AND m.id IS NULL;

-- Ver jobs BullMQ
SELECT * FROM bull_jobs WHERE queue = 'verificacao-prazos' ORDER BY id DESC LIMIT 5;
```

---

## Testes

### Backend - Jest

```bash
cd backend

# Rodar todos os testes
npm test

# Testes unitários
npm run test:unit

# Testes E2E
npm run test:e2e

# Coverage
npm run test:cov

# Rodar teste específico
npm test -- auth.e2e-spec.ts

# Watch mode
npm run test:watch
```

### Frontend - Vitest

```bash
cd frontend

# Rodar testes
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# UI de testes
npm run test:ui
```

### Mobile - Jest

```bash
cd mobile

# Rodar testes
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

---

## Deploy

### Backend - PM2

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar com PM2
cd backend
pm2 start npm --name "jb-pinturas-backend" -- run start:prod

# Ver logs
pm2 logs jb-pinturas-backend

# Restart
pm2 restart jb-pinturas-backend

# Parar
pm2 stop jb-pinturas-backend

# Status
pm2 status

# Salvar configuração para auto-start
pm2 save
pm2 startup
```

### Frontend - Nginx

```bash
# Build
cd frontend
npm run build

# Copiar para Nginx
sudo cp -r dist/* /var/www/jb-pinturas/

# Recarregar Nginx
sudo nginx -t
sudo systemctl reload nginx

# Ver logs Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Mobile - Release

#### Android (Play Store):

```bash
cd mobile/android

# Gerar keystore (primeira vez)
keytool -genkeypair -v -storetype PKCS12 -keystore jb-pinturas.keystore \
  -alias jb-pinturas -keyalg RSA -keysize 2048 -validity 10000

# Build release
./gradlew bundleRelease

# AAB gerado em:
# app/build/outputs/bundle/release/app-release.aab

# Upload para Play Console
# https://play.google.com/console
```

#### iOS (App Store):

```bash
# Abrir Xcode
cd mobile
open ios/JBPinturas.xcworkspace

# Product → Archive
# Window → Organizer
# Distribute App → App Store Connect
# Upload
```

---

## 🔧 Troubleshooting

### Backend não conecta no PostgreSQL

```bash
# Verificar se PostgreSQL está rodando
docker ps | grep postgres

# Verificar logs
docker logs jb_pinturas_postgres

# Testar conexão
psql -h localhost -U postgres -d jb_pinturas
```

### Frontend não conecta na API

```bash
# Verificar .env.local
cat frontend/.env.local

# Backend deve estar rodando
curl http://localhost:3000/api/health

# Verificar CORS no backend
# backend/src/main.ts deve ter:
# app.enableCors()
```

### Mobile - Metro Bundler error

```bash
# Limpar cache
npx react-native start --reset-cache

# Limpar build Android
cd android && ./gradlew clean && cd ..

# Limpar build iOS
cd ios && xcodebuild clean && cd ..
```

### BullMQ jobs não executam

```bash
# Verificar Redis
docker ps | grep redis
docker logs jb_pinturas_redis

# Verificar logs do backend
docker logs jb_pinturas_backend | grep BullMQ

# Testar conexão Redis
redis-cli -h localhost -p 6379 ping
```

---

## Versionamento

### Rotina padrão após commit

Sempre que finalizar um commit e for publicar no remoto, use um dos comandos abaixo na raiz do repositório.

```bash
# Release de correção (patch): v1.0.1 -> v1.0.2
npm run release:patch

# Release de funcionalidade (minor): v1.0.1 -> v1.1.0
npm run release:minor

# Release de mudança grande/compatibilidade (major): v1.0.1 -> v2.0.0
npm run release:major
```

### O que o script faz

- Valida se o working tree está limpo (sem alterações pendentes)
- Faz push da branch atual para origin
- Cria tag anotada no formato semântico vMAJOR.MINOR.PATCH
- Faz push da nova tag para origin

### Fluxo recomendado

```bash
git add .
git commit -m "fix(modulo): descricao"
npm run release:patch
```

---

## 📚 Links Úteis

- **Backend API Docs**: http://localhost:3000/api/docs (Swagger)
- **BullMQ Board**: http://localhost:3000/admin/queues
- **Frontend Dev**: http://localhost:5173
- **Postgres Admin**: http://localhost:5050 (pgAdmin)

---

## 🔐 Credenciais Padrão (Desenvolvimento)

### Admin:
- **Email**: admin@jbpinturas.com.br
- **Senha**: Admin@123

### Gestor:
- **Email**: gestor@jbpinturas.com.br
- **Senha**: Gestor@123

### Encarregado:
- **Email**: encarregado@jbpinturas.com.br
- **Senha**: Encarregado@123

### Banco de Dados:
- **Host**: localhost
- **Port**: 5432
- **Database**: jb_pinturas
- **User**: postgres
- **Password**: postgres123

---

**⚠️ IMPORTANTE**: Trocar todas as credenciais em produção!

**Última Atualização**: <%= new Date().toISOString().split('T')[0] %>
