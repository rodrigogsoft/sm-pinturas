# ⚡ Quick Start - Inicie em 5 Minutos!

## 🚀 Opção 1: Docker (Recomendado)

### Pré-requisitos
- Docker Desktop instalado
- Git instalado

### Passos

```bash
# 1. Clone o repositório
git clone <seu-repo>
cd jb_pinturas

# 2. Copie arquivos de environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Inicie com Docker
docker-compose up -d

# 4. Aguarde ~30 segundos e acesse:
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
# Docs: http://localhost:3001/api/docs
# pgAdmin: http://localhost:5050
```

**Tempo total**: ~3 minutos ⏱️

---

## 🚀 Opção 2: Local (Sem Docker)

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### Passos

```bash
# 1. Clone
git clone <seu-repo>
cd jb_pinturas

# 2. Backend
cd backend
npm install
cp .env.example .env
# Edite .env com suas credenciais PostgreSQL
npm run migration:run
npm run start:dev

# Em outro terminal

# 3. Frontend
cd frontend
npm install
cp .env.example .env
npm start

# Acesso:
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

**Tempo total**: ~5 minutos ⏱️

---

## 🧪 Teste a API

```bash
# Health check
curl http://localhost:3001/health

# Login (substitua credenciais)
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@jbpinturas.com","password":"password123"}'

# Acessar Swagger UI
open http://localhost:3001/api/docs
```

---

## 📚 Documentação Essencial

| Documento | Para Quem | Tempo |
|-----------|-----------|-------|
| [README.md](README.md) | Todos | 5 min |
| [INSTALLATION.md](docs/INSTALLATION.md) | Devs | 10 min |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitetos | 20 min |
| [API.md](docs/API.md) | Devs/QA | 15 min |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | DevOps | 15 min |
| [EXECUTIVE_SUMMARY.md](docs/EXECUTIVE_SUMMARY.md) | Executivos | 5 min |

---

## 🔑 Credenciais Padrão (Desenvolvimento)

> ⚠️ **Importante**: Alterar em produção!

```
Email:    admin@jbpinturas.com
Senha:    changeme123
```

---

## 📱 Acessos Rápidos

### Desenvolvimento
| Serviço | URL | Usuário | Senha |
|---------|-----|---------|-------|
| Frontend | http://localhost:3000 | N/A | N/A |
| API | http://localhost:3001 | N/A | N/A |
| Swagger | http://localhost:3001/api/docs | N/A | N/A |
| pgAdmin | http://localhost:5050 | admin@pgadmin.org | admin |
| Adminer | http://localhost:8080 | postgres | postgres |

---

## 🐛 Problema? Soluções Rápidas

### Porta já em uso
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>
```

### Docker não funciona
```bash
docker-compose down -v
docker system prune -a
docker-compose up -d
```

### Banco de dados vazio
```bash
docker-compose exec api npm run migration:run
docker-compose exec api npm run seed:admin
```

### Mais soluções?
Veja [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

---

## 📖 Próximos Passos

### 1️⃣ Entender a Arquitetura
```bash
# Leia:
cat docs/ARCHITECTURE.md

# Tempo: 15 minutos
```

### 2️⃣ Explorar o Código
```bash
# Backend
cat backend/src/app.module.ts
cat backend/src/modules/auth/auth.module.ts

# Frontend
ls frontend/src/components/

# Tempo: 10 minutos
```

### 3️⃣ Testar um Endpoint
```bash
# Use Postman/Insomnia ou curl
curl -X GET http://localhost:3001/health

# Tempo: 2 minutos
```

### 4️⃣ Modificar Código
```bash
# Edite um arquivo e veja hot reload
code backend/src/app.service.ts

# Salve e veja no terminal
# Tempo: 5 minutos
```

### 5️⃣ Rodar Testes
```bash
cd backend
npm test

# Tempo: 3 minutos
```

---

## 🎓 Estrutura do Projeto em 30 Segundos

```
📁 jb_pinturas/
├── 📁 backend/        → API REST (NestJS)
├── 📁 frontend/       → Interface (React)
├── 📁 mobile/         → App (React Native)
├── 📁 docs/           → Documentação
├── docker-compose.yml → Infraestrutura
└── README.md          → Visão geral
```

---

## ✅ Checklist: Está Tudo Funcionando?

- [ ] `docker-compose up` sem erros
- [ ] Frontend abre em http://localhost:3000
- [ ] Backend responde em http://localhost:3001/health
- [ ] Swagger abre em http://localhost:3001/api/docs
- [ ] Login funciona
- [ ] Banco de dados conecta (pgAdmin)

Se todos estiverem OK: **Parabéns! Você está pronto! 🎉**

---

## 🤔 Dúvidas Frequentes

**P: Preciso de conhecimento específico?**
R: JavaScript/TypeScript, React (frontend), Node.js (backend)

**P: Quanto tempo para fazer uma feature?**
R: 2-5 dias dependendo da complexidade (veja ROADMAP.md)

**P: Posso fazer alterações?**
R: Sim! Veja CONTRIBUTING.md para padrões

**P: Como fazer deploy?**
R: Veja DEPLOYMENT.md para checklist completo

**P: Preciso de suporte?**
R: Consulte TROUBLESHOOTING.md ou abra uma issue

---

## 📞 Suporte Rápido

```bash
# Ver logs em tempo real
docker-compose logs -f

# Ver logs apenas do backend
docker-compose logs -f api

# Entrar em um container
docker-compose exec api sh

# Parar tudo
docker-compose down

# Resetar tudo
docker-compose down -v
rm -rf postgres_data/ redis_data/
docker-compose up -d
```

---

## 🚀 Agora Você Está Pronto!

### Próximo passo obrigatório:
1. Leia [ARCHITECTURE.md](docs/ARCHITECTURE.md) - 15 min
2. Explore o [API.md](docs/API.md) - 10 min
3. Inicie uma feature da [ROADMAP.md](docs/ROADMAP.md) - TODO

### Links Importantes:
- 📖 [Documentação Completa](docs/)
- 🐛 [Problemas Comuns](docs/TROUBLESHOOTING.md)
- 🚀 [Como Fazer Deploy](docs/DEPLOYMENT.md)
- 🎯 [Plano Futuro](docs/ROADMAP.md)

---

**Desenvolvido para JB Pinturas com ❤️**
**Status**: Pronto para Desenvolvimento
**Última atualização**: 5 de Janeiro de 2026
