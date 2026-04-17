# Guia de Setup para Desenvolvimento - JB Pinturas ERP

## Status Atual

✅ **Frontend**: Totalmente funcional e rodando em `http://localhost:3000`
- React 19 + TypeScript
- Todos os erros de compilação corrigidos
- Login page pronta para autenticação

⚠️ **Backend**: Requer PostgreSQL para inicializar completamente
- NestJS compilado e pronto
- Redis/BullMQ desabilitado para desenvolvimento
- AuthMockService disponível para testes rápidos

## Opção 1: Usar PostgreSQL (Recomendado para Desenvolvimento)

### Windows - usando WSL2 + PostgreSQL

```powershell
# 1. Instalar PostgreSQL no WSL2
wsl -e bash -c "LANG=C.UTF-8 sudo -u postgres /usr/bin/initdb -D /var/lib/pgsql/data"

# 2. Iniciar PostgreSQL
wsl -e bash -c "sudo -u postgres /usr/bin/pg_ctl -D /var/lib/pgsql/data -l /tmp/postgres.log start"

# 3. Criar database
wsl -e bash -c "sudo -u postgres psql -c 'CREATE DATABASE jb_pinturas_db;'"

# 4. Configurar PostgreSQL (em /var/lib/pgsql/data/pg_hba.conf):
#    Alterar "peer" para "md5" para autenticação por senha
#    Reiniciar PostgreSQL
```

### Windows - usando Docker Desktop (Mais Fácil)

```powershell
cd c:\Users\kbca_\develop\jb_pinturas

# Iniciar containers principais
docker-compose up -d postgres redis

# Verificar status
docker-compose ps

# Logs do PostgreSQL
docker-compose logs postgres
```

### macOS / Linux

```bash
# Instalar PostgreSQL
brew install postgresql  # macOS
# ou
sudo apt-get install postgresql postgresql-contrib  # Linux

# Iniciar serviço
brew services start postgresql  #macOS
# ou
sudo systemctl start postgresql  # Linux

# Criar database
createdb -U postgres jb_pinturas_db
```

## Opção 2: Testes Rápidos sem Database (Apenas Auth)

O projeto agora inclui `AuthMockService` para permitir testes rápidos sem banco de dados.

### Para ativar modo mock:

1. Editar `.env`:
```env
NODE_ENV=development-mock
# Outras configurações
```

2. Comentar TypeOrmModule em `src/app.module.ts`
3. Rodar backend: `npm run start:dev`

<strong  style="color: orange">Credenciais de teste:</strong>
- Email: `admin@jbpinturas.com.br`
- Senha: `Admin@2026`

## Rodar o Projeto Completo

### Terminal 1 - Frontend

```powershell
cd frontend
npm install
npm run dev

# Acesso: http://localhost:3000
```

### Terminal 2 - Backend

```powershell
cd backend

# Compilar
npm run build

# Rodar
npm run start:dev

# URL: http://localhost:3006
# Docs: http://localhost:3006/api/docs
```

## Arquivo .env Principal

Localização: `backend/.env`

Variáveis críticas:

```dotenv
NODE_ENV=development

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=jb_admin
DATABASE_PASSWORD=jb_secure_pass_2026
DATABASE_NAME=jb_pinturas_db

# JWT
JWT_SECRET=jwt_secret_key_change_in_production
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Sem Redis/BullMQ (desabilitado em dev)
# REDIS_HOST, REDIS_PORT, etc - não necessários
```

## Troubleshooting

### Erro: "connect ECONNREFUSED localhost:5432"
- PostgreSQL não está rodando
- Solução: Iniciar banco de dados usando uma das opções acima

### Erro: "connect ECONNREFUSED localhost:6379"
- Redis não está rodando (esperado em desenvolvimento)
- Solução: Redis foi desabilitado, sem efeitos colaterais

### Frontend conecta em backend com HTTP 500
- Backend não conseguiu inicializar
- Verificar logs do backend para erros de database connection
- Ou usar AuthMockService para testes rápidos

## Status de Implementação

| Feature | Status | Notas |
|---------|--------|-------|
| Frontend compilação | ✅ | Sem erros |
| Frontend servidor | ✅ | Rodando em porta 3000 |
| Login page | ✅ | Interface completa |
| Backend compilação | ✅ | Sem erros |
| Backend servidor | ⚠️ | Requer PostgreSQL |
| API endpoints | ✅ | Disponíveis (com DB) |
| AuthMockService | ✅ | Pronto para testes rápidos |
| Redis/BullMQ | ❌ | Desabilitado em dev |
| MFA/2FA | ✅ | Código pronto |

## Próximos Passos

1. **Setup PostgreSQL** (recomendado)
   - Instalar via Docker (mais fácil)
   - Ou instalação local no WSL

2. **Rodar aplicação completa**
   - `npm run start:dev` em frontend
   - `npm run start:dev` em backend
   - Acessar `http://localhost:3000/login`

3. **Debug com Mock Service** (opcional)
   - Ativar NODE_ENV=development-mock
   - Testar fluxo de auth sem BD

## Contato & Suporte

Para dúvidas sobre setup, consulte:
- `QUICK_START.md` - Guia rápido geral
- `ENV_SETUP_GUIDE.md` - Configuração de variáveis
- Logs do NestJS/React DevTools

---

**Última atualização**: 26/02/2026
**Status**: Em desenvolvimento ativa
