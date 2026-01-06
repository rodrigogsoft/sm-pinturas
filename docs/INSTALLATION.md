# Guia de Instalação - JB Pinturas

## Pré-requisitos

### Ferramentas Obrigatórias
- **Node.js 18+**: [Download](https://nodejs.org/)
- **PostgreSQL 14+**: [Download](https://www.postgresql.org/download/)
- **Docker Desktop**: [Download](https://www.docker.com/products/docker-desktop)
- **Git**: [Download](https://git-scm.com/)

### Ferramentas Opcionais
- **VS Code**: [Download](https://code.visualstudio.com/)
- **Postman**: [Download](https://www.postman.com/downloads/)
- **DBeaver**: [Download](https://dbeaver.io/download/)

## 1. Instalação com Docker (Recomendado)

### 1.1 Clonar o Repositório
```bash
git clone <seu-repo>
cd jb_pinturas
```

### 1.2 Criar arquivo .env
```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env

# Mobile
cp mobile/.env.example mobile/.env
```

### 1.3 Editar .env files

**backend/.env:**
```env
# Database
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_secure_password
DATABASE_NAME=jb_pinturas
DATABASE_URL=postgresql://postgres:your_secure_password@postgres:5432/jb_pinturas

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRATION=24h

# API
API_PORT=3000
API_URL=http://localhost:3000
NODE_ENV=development

# Email (opcional para notificações)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASSWORD=sua_senha_app
SMTP_FROM=noreply@jbpinturas.com

# AWS S3 (opcional para uploads)
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=jb-pinturas-bucket
AWS_REGION=us-east-1
```

**frontend/.env:**
```env
REACT_APP_API_URL=http://localhost:3000
REACT_APP_ENV=development
```

**mobile/.env:**
```env
API_URL=http://your_backend_ip:3000
ENV=development
```

### 1.4 Iniciar com Docker Compose

```bash
# Iniciar todos os serviços
docker-compose up -d

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down
```

### 1.5 Acessar a Aplicação
- **Frontend Web**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **PostgreSQL**: localhost:5432
- **Docs API**: http://localhost:3001/api/docs (Swagger)

## 2. Instalação Manual (Ambiente Local)

### 2.1 Backend Setup

```bash
cd backend

# Instalar dependências
npm install

# Criar banco de dados
createdb jb_pinturas -U postgres

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais

# Executar migrations
npm run typeorm migration:run

# Criar usuário administrador inicial (seed)
npm run seed

# Iniciar servidor
npm run start:dev
```

### 2.2 Frontend Setup

```bash
cd frontend

# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.example .env

# Iniciar aplicação
npm start

# Abrirá automaticamente em http://localhost:3000
```

### 2.3 Mobile Setup

```bash
cd mobile

# Instalar dependências
npm install

# Iniciar Metro bundler
npm start

# Em outro terminal, build e run no Android
npm run android

# Para iOS (Mac apenas)
npm run ios
```

## 3. Configuração do Banco de Dados

### 3.1 Conexão PostgreSQL

```bash
# Conectar ao banco
psql -U postgres -h localhost

# Criar banco de dados
CREATE DATABASE jb_pinturas;
CREATE USER jb_pinturas WITH PASSWORD 'secure_password';
ALTER ROLE jb_pinturas SET client_encoding TO 'utf8';
ALTER ROLE jb_pinturas SET default_transaction_isolation TO 'read committed';
ALTER ROLE jb_pinturas SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE jb_pinturas TO jb_pinturas;
```

### 3.2 Restaurar Backup (se existente)

```bash
pg_restore -U postgres -d jb_pinturas backup.sql
```

### 3.3 Executar Migrations

```bash
cd backend
npm run typeorm migration:run
```

## 4. Variáveis de Ambiente

### Backend (.env)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `NODE_ENV` | Ambiente | development, production |
| `API_PORT` | Porta da API | 3000 |
| `API_URL` | URL da API | http://localhost:3000 |
| `DATABASE_URL` | String de conexão | postgresql://... |
| `JWT_SECRET` | Chave JWT | sua_chave_super_secreta |
| `JWT_EXPIRATION` | Expiração JWT | 24h |
| `CORS_ORIGIN` | Origem CORS | http://localhost:3000 |

## 5. Inicialização de Dados (Seed)

```bash
cd backend

# Criar usuário admin inicial
npm run seed:admin

# Inserir tipos de serviço padrão
npm run seed:services

# Inserir dados de exemplo (desenvolvimento)
npm run seed:dev
```

## 6. Testes

### Backend
```bash
cd backend

# Testes unitários
npm run test

# Testes de integração
npm run test:e2e

# Cobertura de testes
npm run test:cov
```

### Frontend
```bash
cd frontend

# Rodar testes
npm test

# Cobertura
npm test -- --coverage
```

## 7. Build para Produção

### Backend
```bash
cd backend

# Build
npm run build

# Start em produção
npm run start:prod
```

### Frontend
```bash
cd frontend

# Build
npm run build

# Servir arquivos estáticos
npm install -g serve
serve -s build -l 3000
```

### Mobile
```bash
cd mobile

# Build APK
npm run build:apk

# Build para Google Play
npm run build:release
```

## 8. Troubleshooting

### Problema: Conexão recusada ao PostgreSQL

**Solução:**
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Iniciar PostgreSQL (se parado)
sudo systemctl start postgresql

# Em Windows
net start postgresql-x64-14
```

### Problema: Porta 3000 já em uso

**Solução:**
```bash
# Encontrar processo usando porta 3000
lsof -i :3000

# Matar processo
kill -9 <PID>

# Ou usar porta diferente
API_PORT=3001 npm run start:dev
```

### Problema: Migrations falhando

**Solução:**
```bash
# Resetar banco de dados (CUIDADO!)
npm run typeorm schema:drop

# Reexecutar migrations
npm run typeorm migration:run
```

### Problema: Dependências com conflito

**Solução:**
```bash
# Limpar cache npm
npm cache clean --force

# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

## 9. Ambiente Docker

### 9.1 docker-compose.yml

O arquivo `docker-compose.yml` na raiz inclui:
- PostgreSQL
- Backend (NestJS)
- Frontend (React)
- Redis (opcional para cache)
- Adminer (ferramenta web para BD)

### 9.2 Build da imagem

```bash
# Build específico
docker build -f backend/Dockerfile -t jb-pinturas-backend:latest backend/

# Com docker-compose
docker-compose build
```

### 9.3 Executar container específico

```bash
# Apenas banco de dados
docker-compose up -d postgres

# Apenas backend
docker-compose up -d api

# Com logs
docker-compose up api --build
```

## 10. CI/CD Setup (GitHub Actions)

Crie arquivo `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
        working-directory: backend
      
      - name: Run tests
        run: npm test
        working-directory: backend
```

## 11. Verificação Final

Após a instalação, verificar:

- [ ] Backend rodando em http://localhost:3000
- [ ] Frontend acessível em http://localhost:3000
- [ ] Banco de dados criado e migrado
- [ ] Usuário admin criado
- [ ] APIs respondendo corretamente
- [ ] Autenticação funcionando
- [ ] Notificações configuradas

## 12. Próximos Passos

1. Configurar email para notificações
2. Configurar AWS S3 para uploads
3. Configurar monitoring e logging
4. Implementar backups automáticos
5. Configurar domínio e SSL
6. Deploy em produção

## Suporte

Para dúvidas ou problemas:
- Consulte a documentação em `/docs`
- Verifique logs: `docker-compose logs -f <serviço>`
- Abra issue no GitHub

