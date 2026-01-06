# Arquitetura do Sistema - JB Pinturas

## 1. Visão Geral da Arquitetura

O sistema segue uma arquitetura em camadas com separação clara de responsabilidades:

```
┌─────────────────────────────────────────────────────────┐
│                  Camada de Apresentação                 │
│              (React Web + React Native Mobile)           │
└─────────────────────┬───────────────────────────────────┘
                      │
                      │ HTTP/REST + WebSocket
                      │
┌─────────────────────▼───────────────────────────────────┐
│              API REST (NestJS Backend)                   │
│  ┌──────────────┬──────────────┬──────────────────────┐ │
│  │   Controllers│    Services  │   Repositories       │ │
│  └──────────────┴──────────────┴──────────────────────┘ │
└─────────────────────┬───────────────────────────────────┘
                      │
                      │ SQL/ORM
                      │
┌─────────────────────▼───────────────────────────────────┐
│              Camada de Dados                            │
│  ┌──────────────────────────────────────────────────┐  │
│  │         PostgreSQL Database                      │  │
│  │  ┌──────┬───────┬──────┬────────────────────┐   │  │
│  │  │Users │Clients│Works │ Collaborators etc. │   │  │
│  │  └──────┴───────┴──────┴────────────────────┘   │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 2. Estrutura de Diretórios do Backend

```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/                    # Autenticação JWT
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   └── guards/
│   │   ├── users/                   # Gestão de usuários
│   │   │   ├── entities/
│   │   │   ├── dto/
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── users.module.ts
│   │   ├── clients/                 # Gestão de clientes
│   │   ├── works/                   # Gestão de obras
│   │   ├── collaborators/           # Gestão de colaboradores
│   │   ├── services/                # Tipos de serviço
│   │   ├── measurements/            # Medições
│   │   ├── payments/                # Pagamentos
│   │   ├── notifications/           # Notificações
│   │   ├── pending-items/           # Sistema de pendências
│   │   ├── reports/                 # Relatórios
│   │   └── ...
│   ├── common/
│   │   ├── decorators/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── pipes/
│   │   ├── filters/
│   │   └── exceptions/
│   ├── database/
│   │   ├── migrations/
│   │   ├── seeds/
│   │   └── typeorm.config.ts
│   ├── config/
│   │   ├── configuration.ts
│   │   ├── database.config.ts
│   │   └── jwt.config.ts
│   ├── app.module.ts
│   └── main.ts
├── test/
├── docker-compose.yml
├── Dockerfile
├── package.json
├── tsconfig.json
└── .env.example
```

## 3. Estrutura de Diretórios do Frontend

```
frontend/
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   ├── Layout/
│   │   ├── Dashboard/
│   │   ├── Works/
│   │   ├── Collaborators/
│   │   ├── Clients/
│   │   ├── Measurements/
│   │   ├── Payments/
│   │   ├── Reports/
│   │   ├── Notifications/
│   │   └── Common/
│   ├── pages/
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   └── storage.service.ts
│   ├── store/
│   │   ├── slices/
│   │   └── store.ts
│   ├── hooks/
│   ├── utils/
│   ├── styles/
│   └── App.tsx
├── public/
├── package.json
├── tsconfig.json
└── .env.example
```

## 4. Estrutura de Diretórios do Mobile

```
mobile/
├── src/
│   ├── screens/
│   │   ├── Auth/
│   │   ├── Home/
│   │   ├── Works/
│   │   ├── Measurements/
│   │   ├── Notifications/
│   │   └── Profile/
│   ├── components/
│   ├── services/
│   │   ├── api.ts
│   │   ├── storage.service.ts
│   │   └── sync.service.ts
│   ├── store/
│   ├── hooks/
│   ├── utils/
│   ├── navigation/
│   └── App.tsx
├── android/
├── ios/
├── package.json
└── app.json
```

## 5. Fluxo de Dados

### Autenticação
```
User Login → Backend JWT → Token Armazenado → Requests Autenticadas
```

### Operação de Serviço
```
1. Encarregado seleciona obra
2. Aloca colaboradores em ambientes
3. Registra serviço realizado
4. Faz upload de fotos
5. Insere medição
6. Se > valor teto: Alerta + Justificativa
7. Gestor aprova/rejeita
8. Financeiro processa pagamento
```

### Sistema de Pendências
```
Ação Desencadeadora → Pendência Criada → Notificação → 
Responsável Notificado → Ação Executada → Pendência Resolvida
```

## 6. Banco de Dados

### Entidades Principais

```sql
-- Usuários
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  full_name VARCHAR NOT NULL,
  phone VARCHAR,
  cpf VARCHAR UNIQUE,
  role ENUM('admin', 'manager', 'financial', 'foreman'),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Clientes
CREATE TABLE clients (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  cnpj_cpf VARCHAR UNIQUE NOT NULL,
  address TEXT,
  phone VARCHAR,
  email VARCHAR,
  created_at TIMESTAMP
);

-- Obras
CREATE TABLE works (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES clients,
  name VARCHAR NOT NULL,
  description TEXT,
  status ENUM('planning', 'in_progress', 'completed'),
  measurement_deadline DATE,
  payment_deadline DATE,
  created_at TIMESTAMP
);

-- Colaboradores
CREATE TABLE collaborators (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users,
  full_name VARCHAR NOT NULL,
  cpf VARCHAR UNIQUE NOT NULL,
  address TEXT,
  phone VARCHAR,
  bank_account VARCHAR,
  bank_name VARCHAR,
  created_at TIMESTAMP
);

-- Tipos de Serviço
CREATE TABLE service_types (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  unit ENUM('m2', 'ml', 'unit'),
  created_at TIMESTAMP
);

-- Medições
CREATE TABLE measurements (
  id UUID PRIMARY KEY,
  work_id UUID REFERENCES works,
  collaborator_id UUID REFERENCES collaborators,
  service_type_id UUID REFERENCES service_types,
  quantity DECIMAL,
  unit_value DECIMAL,
  total_value DECIMAL,
  status ENUM('pending', 'approved', 'rejected'),
  photos_url TEXT[],
  created_at TIMESTAMP
);

-- Pagamentos
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  collaborator_id UUID REFERENCES collaborators,
  measurement_id UUID REFERENCES measurements,
  amount DECIMAL NOT NULL,
  status ENUM('pending', 'paid', 'disputed'),
  payment_proof_url VARCHAR,
  paid_at TIMESTAMP,
  created_at TIMESTAMP
);

-- Pendências
CREATE TABLE pending_items (
  id UUID PRIMARY KEY,
  type ENUM('measurement', 'approval', 'payment', 'charging'),
  reference_id UUID,
  assigned_to UUID REFERENCES users,
  description TEXT,
  status ENUM('open', 'closed'),
  created_at TIMESTAMP,
  resolved_at TIMESTAMP
);

-- Notificações
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users,
  type VARCHAR NOT NULL,
  message TEXT,
  reference_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP
);

-- Auditoria
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users,
  entity_type VARCHAR,
  entity_id UUID,
  action VARCHAR,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP
);
```

## 7. API Endpoints Principais

### Autenticação
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout
- `POST /auth/refresh` - Refresh Token
- `POST /auth/register` - Registro (admin)

### Usuários
- `GET /users` - Listar usuários
- `POST /users` - Criar usuário
- `GET /users/:id` - Obter usuário
- `PATCH /users/:id` - Atualizar usuário
- `DELETE /users/:id` - Deletar usuário

### Obras
- `GET /works` - Listar obras
- `POST /works` - Criar obra
- `GET /works/:id` - Obter obra
- `PATCH /works/:id` - Atualizar obra
- `GET /works/:id/progress` - Progresso da obra

### Medições
- `POST /measurements` - Criar medição
- `GET /measurements/:id` - Obter medição
- `PATCH /measurements/:id/approve` - Aprovar medição
- `PATCH /measurements/:id/reject` - Rejeitar medição

### Pagamentos
- `GET /payments` - Listar pagamentos
- `POST /payments` - Processar pagamento
- `PATCH /payments/:id/confirm` - Confirmar pagamento com comprovante

### Pendências
- `GET /pending-items` - Listar pendências
- `GET /pending-items/user/:userId` - Pendências do usuário
- `PATCH /pending-items/:id/resolve` - Resolver pendência

### Relatórios
- `GET /reports/production` - Relatório de produção
- `GET /reports/payments` - Relatório de pagamentos
- `GET /reports/productivity` - Relatório de produtividade
- `GET /reports/dashboard` - Dashboard em tempo real

## 8. Segurança

### Camadas de Proteção
1. **HTTPS**: Toda comunicação encriptada
2. **JWT**: Autenticação stateless
3. **RBAC**: Controle de acesso por perfil
4. **Rate Limiting**: Proteção contra abuso
5. **Input Validation**: Validação de dados de entrada
6. **CORS**: Configuração segura
7. **Audit Trail**: Log de todas as ações

### Conformidade LGPD
- Consentimento de coleta de dados
- Direito de acesso aos dados
- Direito de exclusão
- Criptografia de dados sensíveis
- Política de privacidade clara

## 9. Offline & Sincronização (Mobile)

```
┌──────────────────────┐
│   Dispositivo Offline │
│  ┌────────────────┐  │
│  │ Local Database │  │
│  │   (SQLite)     │  │
│  └────────────────┘  │
│   ↓ (quando online)  │
└──────────────────────┘
         │
         ↓
┌──────────────────────┐
│   Sincronização      │
│  - Queue de mudanças │
│  - Conflito resolve  │
└──────────────────────┘
         │
         ↓
┌──────────────────────┐
│   Backend Server     │
│   (Servidor Principal)
└──────────────────────┘
```

## 10. Escalabilidade

### Recomendações de Scaling
1. **Horizontal Scaling**: Múltiplas instâncias do backend atrás de load balancer
2. **Database Replication**: Read replicas para relatórios
3. **Caching**: Redis para dados frequentes
4. **CDN**: CloudFront/CloudFlare para assets estáticos
5. **Microserviços**: Possível separar relatórios em serviço independente

### Performance
- Índices no banco de dados
- Paginação de resultados
- Query optimization
- Connection pooling

## 11. Deployment

### Ambiente Local
```bash
docker-compose up
```

### Ambiente Cloud (AWS)
- RDS para PostgreSQL
- ECS/EKS para containers
- S3 para armazenamento de arquivos
- ALB para load balancing

### CI/CD Pipeline
```
Git Push → Tests → Build → Deploy to Staging → Deploy to Production
```
