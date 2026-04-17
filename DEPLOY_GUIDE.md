# 🚀 Guia de Deploy em Produção - JB Pinturas

## 📋 Índice
1. [Pré-requisitos](#pré-requisitos)
2. [Estratégia de Deploy](#estratégia-de-deploy)
3. [Setup Infraestrutura](#setup-infraestrutura)
4. [Pipeline CI/CD](#pipeline-cicd)
5. [Variáveis de Ambiente](#variáveis-de-ambiente)
6. [Monitoramento](#monitoramento)
7. [Rollback](#rollback)
8. [Troubleshooting](#troubleshooting)

---

## 🔧 Pré-requisitos

### Hardware Mínimo (Para 1 Deploy)
- **CPU**: 2 cores
- **RAM**: 2GB
- **Storage**: 20GB
- **Bandwidth**: 1 Mbps

### Recomendado (Para Produção)
- **CPU**: 4+ cores
- **RAM**: 4GB+
- **Storage**: 50GB+ (com backups)
- **Bandwidth**: 10+ Mbps

### Software Obrigatório
- Docker Engine 20.10+
- Docker Compose 2.0+
- Git
- Certbot (para SSL)

### Contas Necessárias
- GitHub (para CI/CD)
- Registry (GitHub Container Registry ou DockerHub)
- Email Service (para notificações)
- Monitoring (Datadog/New Relic/CloudWatch)

---

## 🏗️ Estratégia de Deploy

### Arquitetura Recomendada

```
┌─────────────────────────────────────┐
│     Nginx Reverse Proxy              │
│  (SSL, rate limiting, static files)  │
└────────────┬────────────────────────┘
             │
     ┌───────┴────────────────────┐
     │                            │
  ┌──▼──┐                      ┌──▼──┐
  │ App │  (Docker Container)  │ App │
  │Port │                      │Port │
  │3001 │                      │3002 │
  └──┬──┘                      └──┬──┘
     │                            │
     └───────────┬────────────────┘
                 │
         ┌───────┴────────────┐
         │                    │
      ┌──▼──┐             ┌──▼──┐
      │ DB  │             │Cache│
      │(PG) │             (Redis)
      └─────┘             └─────┘
```

### Estágios de Deploy

```
Development → Staging → Production
    ↓          ↓           ↓
localhost   test.jp    jbpinturas.com
auto        semi-auto    manual
rebuild     rebuild      release
```

---

## 🐳 Setup Infraestrutura

### 1. Opção A: VPS (Digital Ocean, Linode, AWS EC2)

#### Criar Droplet/Instance
```bash
# Digital Ocean
- OS: Ubuntu 22.04 LTS
- Size: 2GB RAM, 50GB SSD ($12/month)
- Region: São Paulo (sa-são paulo-1)
- SSH key: Importar chave pública
```

#### SSH para o servidor
```bash
ssh root@IP_DO_SERVIDOR
```

#### Instalar Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Adicionar usuário ao grupo docker
sudo groupadd docker
sudo usermod -aG docker $USER
```

#### Clonar repositório
```bash
git clone https://github.com/SEU_USERNAME/jb_pinturas.git /home/jb_pinturas
cd /home/jb_pinturas
```

### 2. Opção B: Docker Compose em Produção

#### Arquivo docker-compose.prod.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: jb_pinturas_db
      POSTGRES_USER: jb_admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}  # From .env
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - jb_network
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U jb_admin"]
      interval: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - jb_network
    restart: always
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      retries: 3

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: production  # Use production stage!
    environment:
      NODE_ENV: production
      DATABASE_URL: postgres://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379/0
      JWT_SECRET: ${JWT_SECRET}
      API_URL: https://jbpinturas.com/api/v1
    ports:
      - "3001:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - jb_network
    restart: always
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: production
    environment:
      VITE_API_URL: https://jbpinturas.com/api/v1
    ports:
      - "3002:80"
    depends_on:
      - backend
    networks:
      - jb_network
    restart: always

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./frontend/build:/usr/share/nginx/html:ro
    depends_on:
      - backend
      - frontend
    networks:
      - jb_network
    restart: always

volumes:
  postgres_data:
  redis_data:

networks:
  jb_network:
    driver: bridge
```

#### Criar arquivo .env.prod
```bash
cp .env.example .env.prod

# Editar .env.prod
NODE_ENV=production
DATABASE_URL=postgres://jb_admin:SENHA_FORTE@localhost:5432/jb_pinturas_db
REDIS_URL=redis://:SENHA_FORTE_REDIS@localhost:6379/0
JWT_SECRET=JWT_SECRET_ALEATORIO_MUITO_LONGO_E_SEGURO
JWT_EXPIRATION=7d
API_URL=https://jbpinturas.com/api/v1
FRONTEND_URL=https://jbpinturas.com
NODE_TLS_REJECT_UNAUTHORIZED=1

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_app

# Logging
LOG_LEVEL=warn
```

#### Iniciar stack
```bash
docker-compose -f docker-compose.prod.yml up -d

# Verificar status
docker-compose ps
docker-compose logs -f backend
```

### 3. Configurar Nginx com SSL

#### Arquivo nginx.conf
```nginx
upstream backend {
    server backend:3000;
}

upstream frontend {
    server frontend:80;
}

server {
    listen 80;
    server_name jbpinturas.com www.jbpinturas.com;
    
    # Redirect HTTP → HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name jbpinturas.com www.jbpinturas.com;

    # SSL Certificates
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=app:10m rate=100r/s;

    # Backend API
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }

    # Static Files (Frontend)
    location / {
        limit_req zone=app burst=50 nodelay;
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Cache static files
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
    }

    # Health Check
    location /health {
        access_log off;
        return 200 "OK";
    }
}
```

#### Gerar SSL Certificate (com Certbot)
```bash
# Instalar certbot
sudo apt-get install certbot python3-certbot-nginx

# Requisitar certificado
sudo certbot certonly --standalone -d jbpinturas.com -d www.jbpinturas.com

# Copiar para diretório Docker
sudo cp /etc/letsencrypt/live/jbpinturas.com/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/jbpinturas.com/privkey.pem ./ssl/key.pem

# Renovar automaticamente
sudo certbot renew --quiet --no-eff-email
```

---

## 🔄 Pipeline CI/CD

### GitHub Actions Workflow

#### Arquivo: `.github/workflows/deploy.yml`
```yaml
name: Deploy to Production

on:
  push:
    branches: [main, production]
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Dependencies
        run: npm ci
      
      - name: Run Linter
        run: npm run lint
      
      - name: Run Tests
        run: npm run test
      
      - name: Build Backend
        run: |
          cd backend
          npm run build
      
      - name: Build Frontend
        run: |
          cd frontend
          npm run build

  push-images:
    needs: build-and-test
    runs-on: ubuntu-latest
    
    permissions:
      contents: read
      packages: write
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Log in to Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Build and Push Backend
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/backend:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
      
      - name: Build and Push Frontend
        uses: docker/build-push-action@v4
        with:
          context: ./frontend
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/frontend:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: push-images
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd /home/jb_pinturas
            docker-compose -f docker-compose.prod.yml pull
            docker-compose -f docker-compose.prod.yml up -d
            docker-compose logs -f
      
      - name: Notify Slack
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "Deployment Complete",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*JB Pinturas Deploy*\nVersion: ${{ github.sha }}\nStatus: Success ✅"
                  }
                }
              ]
            }
```

### GitHub Secrets (Configurar no repositório)

```bash
DEPLOY_HOST = IP do servidor
DEPLOY_USER = usuario_ssh
DEPLOY_SSH_KEY = conteúdo da chave privada SSH
SLACK_WEBHOOK = webhook URL para notificações
DATABASE_PASSWORD = senha do banco
REDIS_PASSWORD = senha do redis
JWT_SECRET = secret JWT
```

---

## 🔐 Variáveis de Ambiente

### Backend (.env.prod)
```
NODE_ENV=production
DATABASE_URL=postgres://...
REDIS_URL=redis://...
JWT_SECRET=seu_secret_muito_seguro
JWT_EXPIRATION=7d
API_URL=https://jbpinturas.com/api/v1
LOG_LEVEL=warn
```

### Frontend (.env.production)
```
VITE_API_URL=https://jbpinturas.com/api/v1
```

### Mobile (.env)
```
API_BASE_URL=https://jbpinturas.com/api/v1
ENV=production
```

---

## 📊 Monitoramento

### Health Checks

```bash
# Backend
curl https://jbpinturas.com/api/v1/health

# Frontend
curl https://jbpinturas.com/health

# Database
docker exec jb_pinturas_db pg_isready -U jb_admin

# Redis
docker exec jb_pinturas_redis redis-cli ping
```

### Logs

```bash
# Ver logs em tempo real
docker-compose -f docker-compose.prod.yml logs -f

# Ver logs específicos
docker-compose logs backend
docker-compose logs nginx

# Exportar logs
docker-compose logs > logs.txt
```

### Monitoramento Recomendado

- **Uptime Monitoring**: Updown.io, StatusCake
- **Application Monitoring**: DataDog, New Relic
- **Error Tracking**: Sentry, Rollbar
- **Performance**: NewRelic APM, Cloudflare Workers Analytics

---

## 🔄 Rollback

### Rollback Automático
```bash
# Se deploy falha, reverter para versão anterior
docker-compose -f docker-compose.prod.yml down
git revert HEAD
docker-compose -f docker-compose.prod.yml up -d
```

### Rollback Manual
```bash
# Listar imagens
docker images | grep jb_pinturas

# Usar imagem anterior
docker tag jb_pinturas-backend:v1.0 jb_pinturas-backend:latest
docker-compose -f docker-compose.prod.yml restart backend
```

---

## 🐛 Troubleshooting

### Container não inicia
```bash
docker-compose logs backend
# Verificar variáveis de ambiente
docker-compose config | grep DATABASE_URL
```

### Porta já em uso
```bash
lsof -i :3000
kill -9 PID
```

### Conexão recusada ao banco
```bash
# Verificar se PostgreSQL está rodando
docker-compose exec postgres pg_isready

# Teste de conexão
psql -h localhost -U jb_admin -d jb_pinturas_db
```

### Certificado SSL inválido
```bash
# Renovar certificado
certbot renew --force-renewal
docker-compose restart nginx
```

### Out of memory
```bash
# Aumentar limites Docker
docker system prune -a
docker-compose down
# Editar docker-compose: adicionar memory limits
docker-compose up -d
```

---

## ✅ Checklist de Deploy

- [ ] GitHub Actions workflow criado e testado
- [ ] `.env.prod` configurado com senhas fortes
- [ ] SSL certificate gerado with Certbot
- [ ] Nginx configurado e testado
- [ ] Backup do banco de dados agendado
- [ ] Monitoramento configurado
- [ ] Health checks funcionando
- [ ] Logs centralizados
- [ ] Plano de rollback documentado
- [ ] Equipe notificada do deploy
- [ ] Testes de fumaça em produção OK

---

## 📞 Suporte

Para dúvidas ou problemas:

1. Verificar logs: `docker-compose logs`
2. Consultar TESTING_PLAN.md para testes
3. Rever E2E_TEST_REPORT.md para status
4. Abrir issue no GitHub com contexto completo
