# 🚀 Setup & Deploy - JB Pinturas ERP

Guias rápidos para setup local e deploy em diferentes ambientes.

---

## 🖥️ Setup Local (5 minutos)

### Opção 1: Script Automático (Recomendado)

```bash
# Linux/macOS
bash scripts/setup.sh

# Windows
powershell -ExecutionPolicy Bypass -File scripts/setup.ps1
```

### Opção 2: Manual

```bash
# 1. Subir Docker (PostgreSQL + Redis)
docker-compose up -d postgres redis

# 2. Backend
cd backend
cp .env.example .env
npm install
npm run migration:run
npm run seed
npm run start:dev

# 3. Frontend (novo terminal)
cd frontend
cp .env.example .env
npm install
npm start

# 4. Mobile (novo terminal, opcional)
cd mobile
cp .env.example .env
npm install
npm run android  # ou npm run ios
```

### ✅ Verificar Setup

```bash
# Health check
curl http://localhost:3000/health

# Swagger
open http://localhost:3000/api/docs

# Web
open http://localhost:3001
```

---

## 🌐 Ambientes

### Development (Local)
```
docker-compose up -d                    # PostgreSQL + Redis local
npm run start:dev                       # Backend com hot-reload
npm start                               # Frontend com hot-reload
URLs: http://localhost:3000/3001
```

### Staging (AWS)
```bash
# Ativar ambiente
.\scripts\activate-env.ps1 -env staging

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

### Production (AWS)
```bash
# Ativar ambiente
.\scripts\activate-env.ps1 -env production

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🔧 Scripts Úteis

### Backend

```bash
cd backend

# Setup
npm run setup:dev              # Install + Migrations + Seeds
npm run setup:clean            # Clean install

# Database
npm run migration:generate     # Criar nova migration
npm run migration:run          # Executar migrations
npm run migration:revert       # Reverter última migration
npm run seed                   # Executar seeds

# Build
npm run build                  # Build para development
npm run build:prod             # Build otimizado produção

# Dev
npm run start                  # Start servidor
npm run start:dev              # Start com watch
npm run start:debug            # Start com debugger

# Tests
npm run test                   # Testes unitários
npm run test:watch             # Testes com watch
npm run test:e2e               # Testes E2E
npm run test:cov               # Cobertura de testes

# Lint
npm run lint                   # Verificar lint
npm run lint:fix               # Corrigir lint
npm run format                 # Formatar código

# Docker
npm run docker:build:dev       # Build container dev
npm run docker:build:prod      # Build container prod
npm run docker:up              # Subir containers
npm run docker:down            # Descer containers
npm run docker:logs            # Ver logs
npm run health                 # Health check
npm run swagger                # Abrir Swagger
```

### Frontend

```bash
cd frontend

# Dev
npm start                      # Start dev server
npm run build                  # Build produção
npm test                       # Testes

# Docker
npm run docker:build           # Build container
npm run docker:up              # Subir container
```

### Mobile

```bash
cd mobile

# Dev
npm run android                # Start Android emulator
npm run ios                    # Start iOS simulator
npm run web                    # Start web preview

# Build
npm run android:release        # Build APK/AAB
npm run ios:release            # Build IPA
```

---

## 📊 Variáveis de Ambiente

### Development (.env)

```dotenv
NODE_ENV=development
DATABASE_HOST=localhost
REDIS_HOST=localhost
LOG_LEVEL=debug
```

### Staging (.env.staging)

```dotenv
NODE_ENV=staging
DATABASE_HOST=rds-staging-xxx.amazonaws.com
REDIS_HOST=redis-staging-xxx.cache.amazonaws.com
LOG_LEVEL=info
```

### Production (.env.production)

```dotenv
NODE_ENV=production
DATABASE_HOST=rds-prod-xxx.amazonaws.com
REDIS_HOST=redis-prod-xxx.cache.amazonaws.com
LOG_LEVEL=error
```

---

## 🚀 Deploy com GitHub Actions

### Automatic Deployment

| Branch | Evento | Ambiente | Status |
|--------|--------|----------|--------|
| develop | push | Staging | ✅ Auto |
| main | tag v*.*.* | Production | ✅ Auto |
| main | push | Production | ⏳ Manual |

### Deploy Staging

```bash
git checkout develop
# Fazer commits
git push origin develop
# Actions dispara automaticamente
# Acompanhar em: Actions -> Deploy Staging
```

### Deploy Production

```bash
# Opção 1: Via tag (recomendado)
git tag v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
# Actions dispara automaticamente

# Opção 2: Via main (com aprovação)
git checkout main
git merge develop
git push origin main
# Requer aprovação manual em Actions
```

---

## 🆘 Troubleshooting

### Database Connection Refused

```bash
# Verificar se postgres está rodando
docker ps | grep postgres

# Reiniciar
docker-compose restart postgres

# Ver logs
docker logs jb_pinturas_db
```

### Redis Connection Refused

```bash
# Verificar se redis está rodando
docker ps | grep redis

# Reiniciar
docker-compose restart redis

# Testar conexão
docker-compose exec redis redis-cli ping
```

### Port Already in Use

```bash
# Encontrar processo na porta
lsof -i :3000

# Matar processo
kill -9 <PID>

# Ou mudar a porta no .env
PORT=3001
```

### Build Fails

```bash
# Limpar e reinstalar
npm run setup:clean

# Verificar versão Node
node -v
npm -v

# Deve ser Node 18+
```

---

## 📝 Checklist Setup

- [ ] Node.js 18+ instalado
- [ ] Docker & Docker Compose instalados
- [ ] Repositório clonado
- [ ] Script setup executado com sucesso
- [ ] Backend compila sem erros
- [ ] Frontend inicia sem erros
- [ ] Health endpoint responde
- [ ] Swagger acessível
- [ ] Web app carrega
- [ ] Database conecta
- [ ] Redis conecta

---

## 📞 Suporte

- 📖 [Documentação Completa](../README.md)
- 🚀 [Guia de Deploy](./DEPLOY.md)
- 📊 [API Reference](./api/README.md)
- 🧪 [Testes E2E](../backend/test/README.md)

---

**Versão**: 1.0.0  
**Última Atualização**: 07/02/2026
