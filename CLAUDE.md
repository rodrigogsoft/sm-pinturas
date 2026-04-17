# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Idioma

Sempre responder em **português brasileiro**, inclusive comentários no código.

---

## Comandos

### Backend (`cd backend`)
```bash
npm run start:dev        # Desenvolvimento com watch (porta 3006 — ver .env)
npm run build            # Compila TypeScript → dist/
npm run test             # Jest unitários
npm run test:e2e         # 58 testes E2E de integração
npm run test:cov         # Cobertura
npm run lint             # ESLint --fix
npm run format           # Prettier --write
npm run migration:run    # Executa migrations pendentes
npm run migration:revert # Reverte última migration
npm run migration:generate # Gera nova migration a partir das entidades
```

### Frontend (`cd frontend`)
```bash
npm run dev              # Vite dev server (porta 3001)
npm run build            # Build de produção
npm run lint             # ESLint
npm test                 # Vitest
```

### Mobile (`cd mobile`)
```bash
npm run start            # Metro bundler
npm run android          # Build + emulador Android
npm run ios              # Build + simulador iOS
npm test                 # Jest
```

---

## Arquitetura

Monorepo com três aplicações:

```
jb_pinturas/
├── backend/    # API REST — NestJS 10, TypeORM 0.3, PostgreSQL, Redis, BullMQ
├── frontend/   # Painel web — React 18, Vite, Material UI 5, Redux Toolkit, Axios
└── mobile/     # App campo — React Native 0.74, Expo
```

### Backend

Organizado em módulos verticais em `backend/src/modules/{modulo}/`:
```
{modulo}/
├── {modulo}.controller.ts   # Endpoints HTTP
├── {modulo}.service.ts      # Lógica de negócio
├── entities/{modulo}.entity.ts
├── dto/create-{modulo}.dto.ts
└── {modulo}.module.ts
```

Os módulos principais e seus domínios:
- **auth** — JWT + refresh token + MFA (TOTP via otplib)
- **obras / pavimentos / ambientes** — Hierarquia `Obra → Pavimento → Ambiente`
- **alocacoes / alocacoes-itens** — Alocação de colaborador por ambiente
- **medicoes / medicoes-colaborador** — Produção medida com flag de excedente
- **precos** — Tabela de preço dual (custo/venda) com workflow de aprovação
- **financeiro** — Lotes de pagamento agrupados
- **relatorios** — Dashboard financeiro e relatórios agregados
- **sessoes** — RDO Digital com geolocalização
- **notificacoes / push** — Firebase Cloud Messaging
- **auditoria** — Logs imutáveis (APPEND-ONLY via SQL constraint)

**Autenticação**: `JwtAuthGuard` + `RolesGuard` com `@Roles(PerfilEnum.X)` em todos os endpoints protegidos.

**Perfis (RBAC)**:
| Enum | Acesso |
|------|--------|
| `ADMIN` | Tudo |
| `GESTOR` | Aprova preços, valida medições |
| `FINANCEIRO` | Clientes, preços, pagamentos |
| `ENCARREGADO` | Operação de campo — **não vê `preco_venda`** (cegueira financeira) |

**ValidationPipe global** configurado com `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.

### Frontend

- **Axios** centralizado em `frontend/src/services/api.ts` — interceptors já adicionam o JWT e tratam 401.
- **Redux Toolkit** para estado global: `authSlice`, `obrasSlice`, `clientesSlice`, `colaboradoresSlice`, `uiSlice`.
- **Material UI** com tema customizado em `frontend/src/theme.ts`.
- **Alto contraste** via `useHighContrastTheme()` (hook em `frontend/src/hooks/useHighContrast.ts`) — o `Layout` aplica o tema via `ThemeProvider` local.
- Todas as rotas autenticadas passam pelo `ProtectedRoute`.
- Proxy Vite aponta `/api` → `http://backend:3000`.

### Banco de Dados

- `DATABASE_SYNCHRONIZE=false` — **sempre usar migrations** (nunca habilitar synchronize em produção).
- Migrations em `backend/database/migrations/` são arquivos `.sql` executados manualmente.
- **Soft delete** universal: coluna `deletado: boolean` em vez de `DELETE` físico.
- **UUID** como PK em todas as tabelas (exceto `tb_servicos_catalogo` que usa serial `int`).

**Constraint crítica — alocação 1:1 por ambiente** (garante bloqueio no banco):
```sql
CREATE UNIQUE INDEX unique_ambiente_ativo
ON tb_alocacoes_tarefa (id_ambiente, status)
WHERE status = 'EM_ANDAMENTO' AND deletado = FALSE;
```

### Comunicação Frontend ↔ Backend

- Backend roda na porta definida em `backend/.env` (`PORT=3006` por padrão local).
- Frontend roda na porta `3001` (Vite).
- Em desenvolvimento direto (sem Docker), a `VITE_API_URL` deve apontar para `http://localhost:3006/api/v1`.

---

## Convenções importantes

- **Datas de período** no `PeriodoEnum` usam valores minúsculos: `dia`, `semana`, `mes`, `ano`.
- **Parâmetros no QueryBuilder** devem sempre usar parametrização: `.andWhere('tabela.campo = :val', { val })` — nunca interpolar direto na string.
- **Colunas geradas** (`generatedType: 'STORED'`) não devem ser usadas nas entidades enquanto o banco não tiver a coluna criada como `GENERATED ALWAYS AS ... STORED`. A coluna `margem_percentual` em `TabelaPreco` é uma coluna regular no banco.
- **Enum `PerfilEnum`** vive em `backend/src/common/enums/index.ts` e é compartilhado entre guards, decorators e DTOs.

---

## Swagger / Documentação da API

Disponível em desenvolvimento em `http://localhost:{PORT}/api/docs`.
