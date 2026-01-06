# Checklist de Deployment - JB Pinturas

## 🚀 Pré-Deploy

### 1. Verificação de Código
- [ ] Todos os testes passando (`npm run test`)
- [ ] Coverage > 80% (`npm run test:cov`)
- [ ] Linting sem erros (`npm run lint`)
- [ ] Formatação correta (`npm run format`)
- [ ] Sem warnings no build (`npm run build`)
- [ ] TypeScript sem erros
- [ ] Nenhuma dependência vulnerável (`npm audit`)

### 2. Verificação de Documentação
- [ ] README.md atualizado
- [ ] CHANGELOG.md com mudanças
- [ ] API documentation atualizada
- [ ] Comentários no código para lógica complexa
- [ ] Guia de instalação valido
- [ ] Exemplos de uso fornecidos

### 3. Verificação de Configuração
- [ ] .env.example com todas as variáveis
- [ ] Variáveis de produção definidas
- [ ] Secrets armazenados no sistema seguro
- [ ] Certificados SSL válidos
- [ ] CORS configurado corretamente
- [ ] Rate limiting ativo

### 4. Verificação de Segurança
- [ ] Nenhuma credential no repositório
- [ ] Senhas usando bcrypt com salt ≥ 10
- [ ] JWT com expiração apropriada
- [ ] Validação de entrada em todos endpoints
- [ ] SQL injection protection (ORM)
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Headers de segurança (helmet)
- [ ] HTTPS obrigatório
- [ ] Auditoria funcionando

### 5. Verificação de Performance
- [ ] Load tests passando
- [ ] Tempo de resposta < 200ms
- [ ] Database queries otimizadas
- [ ] Cache estratégico implementado
- [ ] CDN configurado para assets
- [ ] Code splitting implementado
- [ ] Imagens otimizadas

### 6. Verificação de Infraestrutura
- [ ] Docker images building sem erros
- [ ] docker-compose.yml válido
- [ ] Kubernetes manifests válidos
- [ ] Volumes persistentes configurados
- [ ] Backups automatizados
- [ ] Logs centralizados
- [ ] Monitoring ativo
- [ ] Alertas configurados

## 📦 Build e Preparação

### Backend
```bash
cd backend

# Limpar
npm run prebuild

# Testes
npm run test:cov

# Lint
npm run lint -- --fix

# Build
npm run build

# Verificar dist
ls -la dist/
```

### Frontend
```bash
cd frontend

# Testes
npm test

# Build
npm run build

# Verificar build
ls -la build/
```

### Mobile
```bash
cd mobile

# Testes
npm test

# Build APK/AAB
npm run build:release
```

## 🐳 Docker Preparation

```bash
# Build images
docker-compose build

# Test images
docker-compose up

# Verificar health checks
docker-compose ps

# Parar
docker-compose down
```

## 🔄 Database Migration

```bash
# Backup actual database
pg_dump -U postgres -h localhost db_jb_pinturas > backup_pre_deploy.sql

# Execute migrations
npm run migration:run

# Verify migrations
npm run migration:list

# Rollback test (optional)
npm run migration:revert
npm run migration:run
```

## ✅ Staging Deployment

### 1. Deploy no Staging
```bash
# SSH no servidor de staging
ssh user@staging-server

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Run migrations
npm run migration:run

# Build application
npm run build

# Start application
npm run start:prod
```

### 2. Testes em Staging
- [ ] Todos endpoints acessíveis
- [ ] Login funciona
- [ ] Operações CRUD funcionam
- [ ] Notificações enviadas
- [ ] Reports geram corretamente
- [ ] Offline sync funciona (mobile)
- [ ] Performance aceitável
- [ ] Logs registrando corretamente
- [ ] Monitoring capturando metrics
- [ ] Backups rodando

### 3. User Acceptance Testing (UAT)
- [ ] Usuários conseguem fazer login
- [ ] Workflows principais funcionam
- [ ] Interface é intuitiva
- [ ] Performance é aceitável
- [ ] Sem bugs críticos
- [ ] Feedback capturado

## 🚀 Production Deployment

### 1. Pre-deployment Checklist
- [ ] Stakeholders aprovaram deploy
- [ ] Rollback plan documentado
- [ ] Maintenance window agendado
- [ ] Suporte notificado
- [ ] Backup completo realizado
- [ ] Database snapshot criado
- [ ] Load balancer pronto
- [ ] DNS registros preparados

### 2. Deployment Steps

```bash
# 1. Database
pg_dump -U postgres db_jb_pinturas > backup_prod_$(date +%Y%m%d).sql
npm run migration:run

# 2. Backend
docker build -f backend/Dockerfile -t jb-pinturas-api:latest backend/
docker push jb-pinturas-api:latest
kubectl set image deployment/api api=jb-pinturas-api:latest
kubectl rollout status deployment/api

# 3. Frontend
docker build -f frontend/Dockerfile -t jb-pinturas-web:latest frontend/
docker push jb-pinturas-web:latest
kubectl set image deployment/web web=jb-pinturas-web:latest
kubectl rollout status deployment/web

# 4. Verificar deployment
kubectl get pods
kubectl logs deployment/api --tail=100
curl https://api.jbpinturas.com/health
```

### 3. Post-deployment Verification
- [ ] Todos pods estão rodando
- [ ] Health checks passando
- [ ] Logs sem erros
- [ ] Metrics no monitoring
- [ ] Alertas não acionados
- [ ] Database conecta corretamente
- [ ] Cache está preenchido
- [ ] Backup completado

### 4. Smoke Tests (Produção)
```bash
# Health check
curl https://api.jbpinturas.com/health

# Login
curl -X POST https://api.jbpinturas.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}'

# List users
curl -H "Authorization: Bearer TOKEN" \
  https://api.jbpinturas.com/users

# Check frontend
curl https://jbpinturas.com
```

### 5. Notificar Usuários
- [ ] Email com notificação de deploy
- [ ] Mensagem in-app
- [ ] Changelogs publicados
- [ ] Documentação atualizada
- [ ] Suporte preparado para dúvidas

## 🔙 Rollback Plan

Se algo der errado:

```bash
# 1. Parar novo deployment
kubectl rollout undo deployment/api
kubectl rollout undo deployment/web

# 2. Verificar
kubectl get pods
kubectl logs deployment/api

# 3. Restaurar database (se necessário)
psql -U postgres < backup_prod_$(date +%Y%m%d).sql

# 4. Comunicar
# - Notificar stakeholders
# - Documentar problema
# - Análise post-mortem
```

## 📊 Post-Deploy Monitoring

### Primeiras 24 horas
- [ ] Monitor error rates
- [ ] Check response times
- [ ] Verify database performance
- [ ] Monitor memory usage
- [ ] Check disk space
- [ ] Verify backups ran
- [ ] Check logs for issues
- [ ] Monitor user reports

### Primeira semana
- [ ] Performance stability
- [ ] No memory leaks
- [ ] No database locks
- [ ] Backup integrity tested
- [ ] User feedback positive
- [ ] No security issues
- [ ] Metrics normal

## 📝 Documentation

### Update Documentation
- [ ] Release notes
- [ ] Changelog
- [ ] API documentation
- [ ] User guide
- [ ] Admin guide
- [ ] Troubleshooting guide
- [ ] Known issues

### Celebrate! 🎉
- [ ] Team meeting
- [ ] Announcement to stakeholders
- [ ] Share success metrics
- [ ] Thank the team

## 🔗 Links Úteis

- [Staging Environment](https://staging.jbpinturas.com)
- [Production Environment](https://jbpinturas.com)
- [API Docs](https://api.jbpinturas.com/api/docs)
- [Monitoring Dashboard](https://monitoring.jbpinturas.com)
- [Logs](https://logs.jbpinturas.com)
- [Database Admin](https://pgadmin.jbpinturas.com)

## 📞 Escalation

**Em caso de problema:**
1. Slack channel: #deployment-alerts
2. On-call engineer: [contact info]
3. Incident commander: [contact info]
4. Team lead: [contact info]

---

**Versão**: 1.0
**Data**: 5 de Janeiro de 2026
**Próxima revisão**: A ser agendada
