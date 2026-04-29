# Backend - JB Pinturas ERP

## 🏗️ Arquitetura

API RESTful construída com **NestJS** + **TypeScript** + **PostgreSQL**.

### Stack Técnica

- **Framework**: NestJS 10.x
- **Linguagem**: TypeScript 5.x
- **ORM**: TypeORM 0.3.x
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7.x
- **Autenticação**: JWT + MFA (TOTP)
- **Validação**: class-validator + class-transformer
- **Documentação**: Swagger/OpenAPI 3.0

## 📁 Estrutura do Projeto

```
backend/
├── src/
│   ├── main.ts                    # Bootstrap da aplicação
│   ├── app.module.ts              # Módulo raiz
│   │
│   ├── config/                    # Configurações
│   │   ├── typeorm.config.ts      # TypeORM + PostgreSQL
│   │   └── redis.config.ts        # Redis para cache
│   │
│   ├── common/                    # Código compartilhado
│   │   ├── decorators/            # Custom decorators
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── public.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   ├── guards/                # Guards de segurança
│   │   │   ├── jwt-auth.guard.ts  # Autenticação JWT
│   │   │   └── roles.guard.ts     # RBAC por perfil
│   │   ├── interceptors/          # Interceptors globais
│   │   │   └── audit.interceptor.ts # Auditoria automática
│   │   └── enums/                 # Enums globais
│   │       └── index.ts           # PerfilEnum, etc.
│   │
│   └── modules/                   # Módulos de negócio
│       ├── auth/                  # Autenticação e sessões
│       ├── usuarios/              # Gestão de usuários
│       ├── clientes/              # Cadastro de clientes
│       ├── colaboradores/         # Cadastro de colaboradores
│       ├── obras/                 # Hierarquia de obras
│       ├── servicos/              # Catálogo de serviços
│       ├── precos/                # Tabela de preços (dual)
│       ├── sessoes/               # RDO Digital (RF06)
│       ├── alocacoes/             # Controle 1:1 (RF07)
│       ├── medicoes/              # Medições + Excedentes (RF08)
│       ├── financeiro/            # Lotes de pagamento (RF04)
│       ├── notificacoes/          # Alertas (RF09/RF10)
│       └── auditoria/             # Logs imutáveis
│
├── database/
│   ├── migrations/                # SQL migrations
│   │   └── 001_create_tables.sql
│   └── seeds/                     # Dados iniciais
│       └── 001_initial_data.sql
│
├── package.json                   # Dependências
├── tsconfig.json                  # Config TypeScript
└── Dockerfile                     # Container Docker
```

## 🔐 Segurança (RBAC)

### Perfis de Acesso

| ID | Perfil       | Descrição                                    | Nível |
|----|--------------|----------------------------------------------|-------|
| 1  | ADMIN        | Acesso total ao sistema                      | 5     |
| 2  | GESTOR       | Aprovação de preços e lotes                  | 4     |
| 3  | FINANCEIRO   | Gestão financeira e lotes de pagamento       | 3     |
| 4  | ENCARREGADO  | Operação de campo (cego financeiramente)     | 2     |

### Guards

**JwtAuthGuard** - Validação de token JWT em todas as rotas (exceto públicas)
- Anexa `user` no request: `{ id, email, id_perfil }`

**RolesGuard** - Controle de acesso baseado em perfil
- Uso: `@Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR)`
- Valida se `user.id_perfil` está na lista permitida

**Exemplo de uso:**

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR)
@Get()
findAll() {
  return this.service.findAll();
}
```

## 🗄️ Banco de Dados

### Padrões Aplicados

1. **UUID como Primary Key** - Suporte para sincronização offline
2. **Soft Delete** - Campo `deletado: BOOLEAN` ao invés de DELETE físico
3. **Timestamps** - `created_at`, `updated_at` automáticos
4. **Audit Trail** - Tabela `tb_audit_logs` imutável (bigint PK)
5. **Índices Estratégicos** - Performance em queries críticas

### Schema Principal

```sql
-- Hierarquia de Obras
tb_obras → tb_pavimentos → tb_ambientes

-- Operação de Campo
tb_sessoes_diarias → tb_alocacoes_tarefa → tb_medicoes

-- Financeiro
tb_medicoes → tb_lotes_pagamento (agrupamento)

-- Precificação
tb_obras + tb_catalogo_servicos → tb_tabela_precos
```

### Constraints Importantes

**Unique Index - Alocações (RF07)**
```sql
CREATE UNIQUE INDEX unique_ambiente_ativo 
ON tb_alocacoes_tarefa (id_ambiente, status)
WHERE status = 'EM_ANDAMENTO' AND deletado = FALSE;
```
Garante: **Apenas 1 colaborador ativo por ambiente**

## 📦 Módulos de Negócio

### 1. Auth (Autenticação)
- **Login**: JWT + Refresh Token
- **MFA**: TOTP via Google Authenticator
- **Logout**: Invalidação de token no Redis

### 2. Usuários
- CRUD completo
- Filtros: ativo, perfil
- Soft delete
- RBAC: Admin pode criar/deletar

### 3. Clientes
- CNPJ único
- Campo `dia_corte` para ciclo de faturamento (RF10)
- Dados bancários criptografados

### 4. Colaboradores
- CPF único
- Usado em `tb_alocacoes_tarefa`
- Relatórios de produtividade

### 5. Obras
- Hierarquia: Obra → Pavimento → Ambiente
- Status: PLANEJAMENTO | ATIVA | SUSPENSA | CONCLUIDA
- Criação em lote (pavimentos + ambientes em uma chamada)

### 6. Serviços
- Catálogo global: `tb_catalogo_servicos`
- Unidades: M2 | ML | UN | VB
- Permite decimal: configurável

### 7. Preços (RF04 - Dual)
- **preco_custo**: Visível ao encarregado
- **preco_venda**: Oculto (só Gestor/Admin/Financeiro)
- **Workflow**:
  1. Financeiro cria preço → status = PENDENTE
  2. Gestor aprova → status = APROVADO
  3. Gestor rejeita → status = REJEITADO
- Campo calculado: `margem_percentual`

### 8. Sessões (RF06 - RDO Digital)
- Abertura: Geolocalização + Data/Hora
- Validação: 1 sessão aberta por encarregado/dia
- Encerramento: Assinatura digital + Observações
- Método: `calcularDuracao()` - horas trabalhadas

### 9. Alocações (RF07 - Controle 1:1)
- **Regra de Negócio**: 1 colaborador/ambiente por vez
- Validação no `create()`: lança `ConflictException` se ocupado
- Status: EM_ANDAMENTO | CONCLUIDO | PAUSADO
- Helpers: `pausar()`, `retomar()`, `verificarAmbienteOcupado()`

### 10. Medições (RF08 - Excedentes)
- **Validação de Excedente**:
  ```typescript
  if (qtd_executada > area_planejada) {
    // Obrigatórios:
    // - justificativa (string)
    // - foto_evidencia_url (string)
    flag_excedente = true;
  }
  ```
- Relacionamento: N medições → 1 alocação
- Status Pagamento: ABERTO | LOTE_CRIADO | PAGO
- Relatórios: produtividade por colaborador

### 11. Financeiro (RF04 - Lotes)
- **Workflow de Pagamento**:
  1. RASCUNHO → Financeiro cria lote com medições abertas
  2. AGUARDANDO_APROVACAO → Envia para Gestor
  3. APROVADO → Gestor aprova
  4. PAGO → Financeiro processa pagamento

- **Validações**:
  - Só medições com status = ABERTO podem entrar no lote
  - Após criar lote, medições ficam = LOTE_CRIADO
  - Após processar, medições ficam = PAGO

- **Dashboard**:
  - total_pago, total_pendente
  - Breakdown por status

### 12. Notificações (RF09/RF10)
- **Tipos**:
  - MEDICAO_PENDENTE (RF09)
  - CICLO_FATURAMENTO (RF10)
  - LOTE_APROVACAO
  - PRECO_PENDENTE
  - OBRA_ATRASO

- **Prioridades**: BAIXA | MEDIA | ALTA | CRITICA
- **Helpers**:
  ```typescript
  notificarMedicaoPendente(id_encarregado)
  notificarCicloFaturamento(id_cliente, data_corte)
  notificarLoteAprovacao(id_gestor, id_lote)
  ```

### 13. Auditoria
- **Logs Imutáveis**: Rules previnem UPDATE/DELETE
- **Ações**: INSERT | UPDATE | DELETE | APPROVE | REJECT | LOGIN | LOGOUT | EXPORT
- **Indexação**: tabela_afetada, id_usuario, momento
- **Helpers**:
  - `logAprovacao()` - RF04 aprovações
  - `historicoRegistro()` - timeline de um registro
  - `estatisticas()` - análise de ações

## 🛡️ Interceptor de Auditoria

**AuditInterceptor** - Auditoria automática de requisições

```typescript
// src/common/interceptors/audit.interceptor.ts
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    // Captura: método HTTP, endpoint, user, IP
    // Registra automaticamente em tb_audit_logs
  }
}
```

**Endpoints Monitorados**:
- POST /precos/:id/aprovar → APPROVE
- DELETE /usuarios/:id → DELETE
- PUT/PATCH → UPDATE

## 🚀 Instalação

### 1. Instalar Dependências

```bash
cd backend
npm install
```

### 2. Configurar Banco de Dados

```bash
# Com Docker
docker-compose up -d postgres

# Executar migrations
psql -U postgres -d jb_pinturas_erp -f database/migrations/001_create_tables.sql

# Executar seeds
psql -U postgres -d jb_pinturas_erp -f database/seeds/001_initial_data.sql
```

### 3. Configurar .env

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=sua_senha
DB_DATABASE=jb_pinturas_erp

# JWT
JWT_SECRET=seu_secret_aqui_min_32_chars
JWT_EXPIRATION=12h

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 4. Iniciar Aplicação

```bash
# Desenvolvimento
npm run start:dev

# Swagger disponível em: http://localhost:3000/api/docs
```

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Cobertura
npm run test:cov

# E2E
npm run test:e2e
```

## 📚 Documentação

- **Swagger UI**: http://localhost:3000/api/docs
- **API Reference**: [docs/api/API_REFERENCE.md](../docs/api/API_REFERENCE.md)
- **ERS v4.0**: [docs/ERS-v4.0.md](../docs/ERS-v4.0.md)

## 🔗 Endpoints Principais

| Módulo       | Endpoint Base      | Descrição                     |
|--------------|--------------------|-------------------------------|
| Auth         | `/auth`            | Login, refresh, logout        |
| Usuários     | `/usuarios`        | Gestão de usuários            |
| Obras        | `/obras`           | Hierarquia de obras           |
| Preços       | `/precos`          | Tabela de preços (dual)       |
| Sessões      | `/sessoes`         | RDO Digital                   |
| Alocações    | `/alocacoes`       | Controle 1:1                  |
| Medições     | `/medicoes`        | Medições + excedentes         |
| Financeiro   | `/financeiro`      | Lotes de pagamento            |
| Notificações | `/notificacoes`    | Alertas do sistema            |
| Auditoria    | `/auditoria`       | Logs e compliance             |

## 📊 Monitoramento

### Logs

```bash
# Logs da aplicação
tail -f logs/application.log

# Logs de erro
tail -f logs/error.log
```

### Health Check

```bash
GET /health
```

### Métricas

- **PM2**: Gestão de processos
- **Prometheus**: Coleta de métricas
- **Grafana**: Visualização

## 🐳 Docker

```bash
# Build
docker build -t jb-pinturas-backend .

# Run
docker run -p 3000:3000 --env-file .env jb-pinturas-backend
```

## 🤝 Contribuindo

Ver [CONTRIBUTING.md](../docs/CONTRIBUTING.md)

## 📄 Licença

Ver [LICENSE](../LICENSE)
