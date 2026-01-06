# Staging Deploy Setup Guide

Configuração de deploy automático para staging após testes E2E passarem.

## Visão Geral

Três workflows complementares:
- **deploy-staging.yml** — Pipeline completo (backend → frontend → smoke tests)
- **deploy-backend.yml** — Deploy backend isolado (Heroku)
- **deploy-frontend.yml** — Deploy frontend isolado (Vercel)

## Pré-requisitos

### Heroku (Backend)
1. Criar conta em https://heroku.com
2. Criar app: `heroku create <app-name>`
3. Obter API key: `heroku authorizations:create`
4. Adicionar PostgreSQL: `heroku addons:create heroku-postgresql:standard-0`
5. Configurar variáveis de ambiente no Heroku Dashboard

### Vercel (Frontend)
1. Criar conta em https://vercel.com
2. Conectar repositório GitHub
3. Obter token: https://vercel.com/account/tokens

## GitHub Secrets Setup

Adicionar os seguintes secrets no repositório:

```bash
HEROKU_API_KEY          # API key do Heroku
HEROKU_APP_NAME         # Nome da app (ex: jb-pinturas-staging)
HEROKU_EMAIL            # Email da conta Heroku
HEROKU_APP_URL          # URL da app (ex: https://jb-pinturas-staging.herokuapp.com)

VERCEL_TOKEN            # Token de acesso do Vercel
VERCEL_ORG_ID           # ID da organização Vercel
VERCEL_PROJECT_ID       # ID do projeto Vercel

REACT_APP_API_URL       # URL do backend (ex: https://jb-pinturas-staging.herokuapp.com)
```

### Como adicionar secrets (via GitHub CLI)
```bash
gh secret set HEROKU_API_KEY --body "sua-chave-api"
gh secret set HEROKU_APP_NAME --body "jb-pinturas-staging"
gh secret set HEROKU_EMAIL --body "seu-email@example.com"
gh secret set HEROKU_APP_URL --body "https://jb-pinturas-staging.herokuapp.com"
gh secret set VERCEL_TOKEN --body "seu-token-vercel"
gh secret set REACT_APP_API_URL --body "https://jb-pinturas-staging.herokuapp.com"
```

### Ou via GitHub Web UI
1. Repository → Settings → Secrets and variables → Actions
2. Clique "New repository secret"
3. Adicione cada secret acima

## Deployment Flow

### 1. Automático (recomendado)
```
git push origin main
        ↓
E2E CI (tests)
        ↓
Deploy Staging (triggered by E2E CI success)
  ├── Backend (Heroku)
  ├── Frontend (Vercel)
  └── Smoke Tests
```

### 2. Manual (via workflow_dispatch)
```bash
gh workflow run deploy-staging.yml -f branch=main
# ou via GitHub UI: Actions → Deploy Full Stack to Staging → Run workflow
```

## Configuração do Heroku

### Criar app e adicionar variáveis de ambiente
```bash
heroku create jb-pinturas-staging

heroku config:set -a jb-pinturas-staging \
  NODE_ENV=production \
  API_PORT=3001 \
  DATABASE_URL=postgresql://... \
  JWT_SECRET=seu-jwt-secret-aleatorio \
  JWT_EXPIRATION=24h \
  CORS_ORIGIN=https://seu-vercel-domain.vercel.app
```

### Conectar banco de dados
```bash
heroku addons:create heroku-postgresql:standard-0 -a jb-pinturas-staging

# Correr migrations na primeira vez
heroku run npm run migration:run -a jb-pinturas-staging

# Seed admin (opcional)
heroku run npm run seed:admin -a jb-pinturas-staging
```

## Configuração do Vercel

### Via CLI
```bash
cd frontend
vercel link
# Selecionar projeto existente ou criar novo
vercel env add REACT_APP_API_URL
# Adicionar URL do backend staging
```

### Via Web UI
1. https://vercel.com/dashboard
2. Selecionar projeto → Settings → Environment Variables
3. Adicionar `REACT_APP_API_URL=https://jb-pinturas-staging.herokuapp.com`

## Monitoramento

### Logs do Heroku
```bash
heroku logs -a jb-pinturas-staging -t
# ou via web: https://dashboard.heroku.com → app → Resources → Logs
```

### Logs do Vercel
https://vercel.com/dashboard → projeto → Deployments

### GitHub Actions
https://github.com/seu-usuario/jb-pinturas/actions

## Troubleshooting

### Deploy falha com erro de autenticação
- Verificar se secrets estão corretamente setados
- Verificar validade de tokens (Heroku API key, Vercel token)
- Regenerar tokens se necessário

### Smoke tests falham após deploy
- Verificar se CORS está habilitado no backend para frontend URL
- Verificar se migrations rodaram no banco
- Verificar se variáveis de ambiente estão setadas

### Health check falha
```bash
# Verificar logs do Heroku
heroku logs -a jb-pinturas-staging -t

# Verificar se app está rodando
heroku ps -a jb-pinturas-staging
```

## Próximos Passos

1. **Monitoramento em Tempo Real**
   - Integrar Sentry para error tracking
   - Adicionar Prometheus/Grafana para métricas

2. **Automated Rollback**
   - Configurar automated rollback se smoke tests falharem
   - Slack notifications para deploy failures

3. **Performance Monitoring**
   - Integrar k6 cloud para rodar load tests continuamente
   - Alertas se performance degradar

4. **Blue-Green Deployment**
   - Setup multiple Heroku apps para zero-downtime deploys
   - Traffic switching automático

## Referências

- [Heroku Deploy Action](https://github.com/akhileshns/heroku-deploy)
- [Vercel CLI](https://vercel.com/docs/cli)
- [GitHub Actions](https://docs.github.com/en/actions)
