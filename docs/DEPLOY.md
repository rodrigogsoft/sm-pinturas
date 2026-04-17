# Guia de Deploy - JB Pinturas ERP

## 🚀 Visão Geral

Este documento descreve os processos de deploy para todos os componentes do sistema ERP JB Pinturas.

## 📦 Componentes

1. **Backend API** (NestJS + PostgreSQL)
2. **Frontend Web** (React + Nginx)
3. **Mobile App** (React Native)

---

## 🐳 Deploy com Docker Compose (Recomendado)

### Pré-requisitos

- Docker 20.10+
- Docker Compose 2.0+
- Domínio configurado (para produção)
- Certificado SSL (Let's Encrypt recomendado)

### 1. Preparar Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Criar usuário deploy
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG docker deploy
```

### 2. Clonar Repositório

```bash
su - deploy
git clone https://github.com/jb-pinturas/erp-obras.git /opt/jb-pinturas
cd /opt/jb-pinturas
```

### 3. Configurar Variáveis de Ambiente

```bash
# Backend
cp backend/.env.example backend/.env
nano backend/.env
# Editar: DATABASE_PASSWORD, JWT_SECRET, AWS_*, etc.

# Frontend
cp frontend/.env.example frontend/.env
nano frontend/.env
# Editar: VITE_API_URL

# Mobile (para build)
cp mobile/.env.example mobile/.env
nano mobile/.env
```

### 4. Deploy

```bash
# Produção
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Verificar logs
docker-compose logs -f

# Verificar status
docker-compose ps
```

### 5. Migrations do Banco de Dados

```bash
# Executar migrations
docker-compose exec backend npm run migration:run

# Seed inicial (opcional)
docker-compose exec backend npm run seed
```

---

## ☁️ Deploy em Cloud (AWS)

### Arquitetura

```
┌─────────────────┐
│   CloudFront    │ (CDN para frontend)
└────────┬────────┘
         │
┌────────▼────────┐
│   ALB (Load     │ (Balanceador)
│   Balancer)     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼───┐
│ ECS  │  │ ECS  │ (Backend containers)
│Task1 │  │Task2 │
└──────┘  └──────┘
    │         │
    └────┬────┘
         │
┌────────▼────────┐
│   RDS Postgres  │ (Banco de dados)
└─────────────────┘
```

### 1. Configurar AWS CLI

```bash
aws configure
# AWS Access Key ID: [sua_key]
# AWS Secret Access Key: [seu_secret]
# Default region: us-east-1
```

### 2. Criar VPC e Subnets

```bash
# Via Terraform (recomendado)
cd infra/terraform
terraform init
terraform plan
terraform apply
```

### 3. Deploy Backend (ECS)

```bash
# Build e push da imagem
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin [account-id].dkr.ecr.us-east-1.amazonaws.com

docker build -t jb-pinturas-backend:latest ./backend
docker tag jb-pinturas-backend:latest [account-id].dkr.ecr.us-east-1.amazonaws.com/jb-pinturas-backend:latest
docker push [account-id].dkr.ecr.us-east-1.amazonaws.com/jb-pinturas-backend:latest

# Atualizar serviço ECS
aws ecs update-service --cluster jb-pinturas-cluster --service backend-service --force-new-deployment
```

### 4. Deploy Frontend (S3 + CloudFront)

```bash
cd frontend

# Build
npm run build

# Sync com S3
aws s3 sync build/ s3://jb-pinturas-frontend-bucket/ --delete

# Invalidar cache do CloudFront
aws cloudfront create-invalidation --distribution-id [distribution-id] --paths "/*"
```

---

## 📱 Deploy Mobile

### Android (Google Play)

#### 1. Preparar Build

```bash
cd mobile/android

# Gerar keystore (primeira vez)
keytool -genkeypair -v -storetype PKCS12 -keystore jb-pinturas.keystore -alias jb-pinturas -keyalg RSA -keysize 2048 -validity 10000

# Configurar gradle.properties
echo "MYAPP_UPLOAD_STORE_FILE=jb-pinturas.keystore" >> gradle.properties
echo "MYAPP_UPLOAD_KEY_ALIAS=jb-pinturas" >> gradle.properties
echo "MYAPP_UPLOAD_STORE_PASSWORD=***" >> gradle.properties
echo "MYAPP_UPLOAD_KEY_PASSWORD=***" >> gradle.properties
```

#### 2. Build AAB

```bash
cd android
./gradlew bundleRelease

# AAB gerado em:
# android/app/build/outputs/bundle/release/app-release.aab
```

#### 3. Upload para Google Play Console

1. Acesse https://play.google.com/console
2. Selecione o app
3. **Produção > Criar nova versão**
4. Upload do AAB
5. Preencher notas de versão
6. **Revisar versão > Iniciar lançamento**

### iOS (App Store)

#### 1. Preparar Certificados (Xcode)

1. Abrir `ios/JBPinturas.xcworkspace` no Xcode
2. **Signing & Capabilities**
3. Selecionar equipe Apple Developer
4. Verificar Bundle Identifier

#### 2. Archive

1. **Product > Scheme > Edit Scheme**
2. Selecionar **Release**
3. **Product > Archive**
4. Aguardar build

#### 3. Upload para App Store Connect

1. **Window > Organizer**
2. Selecionar archive
3. **Distribute App**
4. Selecionar **App Store Connect**
5. **Upload**

#### 4. Submeter para Revisão

1. Acesse https://appstoreconnect.apple.com
2. Selecione o app
3. **TestFlight** (para teste) ou **App Store** (produção)
4. Preencher metadados
5. **Enviar para revisão**

---

## 🔐 Configuração de Secrets (GitHub Actions)

### Repository Settings > Secrets

```yaml
# Docker Hub
DOCKER_USERNAME: seu_usuario
DOCKER_PASSWORD: senha_ou_token

# Servidor de Produção
PROD_HOST: seu-servidor.com
PROD_USER: deploy
PROD_SSH_KEY: |
  -----BEGIN OPENSSH PRIVATE KEY-----
  ...
  -----END OPENSSH PRIVATE KEY-----

# Frontend
VITE_API_URL: https://api.jbpinturas.com/api

# Mobile (Android)
GOOGLE_PLAY_SERVICE_ACCOUNT: |
  {
    "type": "service_account",
    ...
  }

# Mobile (iOS)
APPSTORE_ISSUER_ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
APPSTORE_API_KEY_ID: XXXXXXXXXX
APPSTORE_API_PRIVATE_KEY: |
  -----BEGIN PRIVATE KEY-----
  ...
  -----END PRIVATE KEY-----
```

---

## 🔄 Estratégia de Rollback

### Backend

```bash
# Docker Compose
docker-compose down
docker-compose up -d --build backend

# ECS
aws ecs update-service --cluster jb-pinturas-cluster --service backend-service --task-definition backend-task:PREVIOUS_VERSION
```

### Frontend

```bash
# S3 - Reverter para versão anterior
aws s3 sync s3://jb-pinturas-frontend-backup/v1.0.0/ s3://jb-pinturas-frontend-bucket/ --delete
aws cloudfront create-invalidation --distribution-id [id] --paths "/*"
```

### Mobile

**Android**: Upload de AAB anterior via Google Play Console

**iOS**: Submeter build anterior do App Store Connect

---

## 📊 Monitoramento

### Health Checks

```bash
# Backend
curl https://api.jbpinturas.com/health

# Frontend
curl https://www.jbpinturas.com/health
```

### Logs

```bash
# Docker
docker-compose logs -f backend
docker-compose logs -f frontend

# AWS CloudWatch
aws logs tail /ecs/jb-pinturas-backend --follow
```

---

## 🆘 Troubleshooting

### Backend não inicia

```bash
# Verificar logs
docker-compose logs backend

# Verificar conexão com banco
docker-compose exec backend npm run migration:run

# Reconstruir imagem
docker-compose build --no-cache backend
docker-compose up -d backend
```

### Frontend com erro 404

```bash
# Verificar nginx
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf

# Verificar build
docker-compose exec frontend ls -la /usr/share/nginx/html
```

### Mobile não sincroniza

1. Verificar conectividade de rede
2. Verificar URL da API no `.env`
3. Verificar certificado SSL do servidor
4. Limpar cache do app

---

## 🌐 Deploy em Staging

### Configuração de Ambiente

```bash
# Copiar e configurar arquivo .env
cp backend/.env.staging backend/.env

# Preencher variáveis
export DB_HOST=jb-pinturas-staging-db.xxx.rds.amazonaws.com
export DB_PASSWORD=senha-forte-staging
export REDIS_HOST=jb-pinturas-staging-redis.xxx.cache.amazonaws.com
export JWT_SECRET=$(openssl rand -hex 32)
export JWT_REFRESH_SECRET=$(openssl rand -hex 32)
```

### Deploy com Docker Compose

```bash
# Usar arquivo de staging
docker-compose -f docker-compose.prod.yml up -d

# Verificar status
docker-compose -f docker-compose.prod.yml ps

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Validações

```bash
# Health check
curl https://staging-api.jbpinturas.com.br/health

# Swagger
https://staging-api.jbpinturas.com.br/api/docs

# Test login
curl -X POST https://staging-api.jbpinturas.com.br/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"senha123"}'
```

---

## 🏢 Deploy em Produção

### Checklist Pré-Deploy

- [ ] Testes E2E passando
- [ ] Code review aprovado
- [ ] Migrations testadas
- [ ] Seeds atualizadas
- [ ] Secrets configurados
- [ ] Certificados SSL renovados
- [ ] Logs configurados
- [ ] Backups do BD agendados

### Usando GitHub Actions

```bash
# Criar tag de versão
git tag v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Actions dispara automaticamente:
# 1. Build de containers
# 2. Testes automáticos
# 3. Push para registry
# 4. Deploy em staging
# 5. Deploy em produção (com aprovação)
```

### Deploy Manual

```bash
# Se necessário fazer deploy manual
ssh deploy@prod-server

cd /opt/jb-pinturas
git pull origin main

# Caregar secrets
source /opt/jb-pinturas/.env.production

# Build e deploy
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# Rodar migrations
docker-compose -f docker-compose.prod.yml exec backend npm run migration:run

# Verificar
docker-compose -f docker-compose.prod.yml ps
```

### Monitoramento Pós-Deploy

```bash
# Verificar APIs
curl https://api.jbpinturas.com.br/health
curl https://api.jbpinturas.com.br/api/v1/me

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Monitorar recursos
docker stats

# Verificar database
psql -h <rds-endpoint> -U jb_admin -d jb_pinturas_db -c "SELECT version();"
```

### Rollback

```bash
# Se algo der errado, fazer rollback
git revert <commit-hash>
git push origin main

# GitHub Actions dispara automaticamente
# Ou deploy da versão anterior manualmente

docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🔄 CI/CD Pipeline

### Branches

```
main (produção)
  ↑
  └── Tag v1.0.0 dispara deploy automático
  
develop (staging)
  ↑
  └── Pull requests de features
```

### Eventos que Disparam Deploy

| Evento | Ambiente | Status |
|--------|----------|--------|
| Push para develop | Staging | Automático |
| Tag v*.*.* | Produção | Automático |
| Push para main | Produção | Manual (requer aproval) |

---

## 📞 Suporte

**Equipe DevOps**: devops@jbpinturas.com.br  
**Documentação**: https://docs.jbpinturas.com.br  
**Status Page**: https://status.jbpinturas.com.br

---

**Última Atualização:** 07/02/2026  
**Versão:** 1.1
