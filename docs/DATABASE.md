# Database Schema - JB Pinturas

## 1. Diagrama Entidade-Relacionamento (ER)

```
┌─────────────┐         ┌──────────────┐
│   Users     │◄────────┤  Audit Logs  │
└─────────────┘         └──────────────┘
      │ │
      │ └────────────┐
      │              │
      │         ┌────────────┐
      │         │Pending Items
      │         └────────────┘
      │
  ┌───┴─────────────────────────────────┐
  │                                     │
  │  (Admin/Manager/Financial/Foreman)   │
  │                                     │
┌─┴────────┐   ┌──────────────┐    ┌──────────────┐
│Collaborators├──┤Measurements  ├────┤Service Types │
└────────────┘   └──────────────┘    └──────────────┘
  │                     │
  │            ┌────────┴────────┐
  │            │                 │
  │      ┌─────────┐      ┌──────────┐
  │      │Payments │      │Works     │
  │      └─────────┘      └──────────┘
  │                            │
  │            ┌───────────────┘
  │            │
  │      ┌──────────┐
  │      │ Clients  │
  │      └──────────┘
  │
  └──→ ┌──────────────────┐
       │ Notifications    │
       └──────────────────┘
```

## 2. Tabelas Detalhadas

### 2.1 Users (Usuários)
```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  cpf VARCHAR(20) UNIQUE,
  role VARCHAR(50) NOT NULL DEFAULT 'foreman',
    -- Valores: 'admin', 'manager', 'financial', 'foreman'
  status VARCHAR(20) DEFAULT 'active',
    -- Valores: 'active', 'inactive', 'suspended'
  is_email_verified BOOLEAN DEFAULT false,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_cpf ON public.users(cpf);
CREATE INDEX idx_users_role ON public.users(role);
```

### 2.2 Clients (Clientes)
```sql
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL,
    -- Valores: 'pj' (Pessoa Jurídica), 'pf' (Pessoa Física)
  cnpj_cpf VARCHAR(20) UNIQUE NOT NULL,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(20),
  phone VARCHAR(20),
  email VARCHAR(255),
  contact_person VARCHAR(255),
  contact_phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_clients_cnpj_cpf ON public.clients(cnpj_cpf);
CREATE INDEX idx_clients_active ON public.clients(is_active);
```

### 2.3 Works (Obras)
```sql
CREATE TABLE public.works (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  start_date DATE,
  estimated_end_date DATE,
  actual_end_date DATE,
  status VARCHAR(50) DEFAULT 'planning',
    -- Valores: 'planning', 'in_progress', 'paused', 'completed', 'cancelled'
  measurement_deadline DATE NOT NULL,
  payment_deadline DATE NOT NULL,
  budget_amount DECIMAL(12,2),
  spent_amount DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  responsible_foreman UUID REFERENCES users(id)
);

CREATE INDEX idx_works_client_id ON public.works(client_id);
CREATE INDEX idx_works_status ON public.works(status);
CREATE INDEX idx_works_foreman ON public.works(responsible_foreman);
```

### 2.4 Work Environments (Ambientes da Obra)
```sql
CREATE TABLE public.work_environments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
    -- Exemplos: 'Apartamento 101', 'Garagem A', 'Corredor'
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
    -- Valores: 'pending', 'in_progress', 'completed'
  sequence_order INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_work_environments_work_id ON public.work_environments(work_id);
```

### 2.5 Service Types (Tipos de Serviço)
```sql
CREATE TABLE public.service_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
    -- Exemplos: 'Pintura Apartamento', 'Pintura Garagem'
  description TEXT,
  unit VARCHAR(20) NOT NULL,
    -- Valores: 'm2' (metro quadrado), 'ml' (metro linear), 'unit' (unidade)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_service_types_active ON public.service_types(is_active);
```

### 2.6 Work Services (Serviços da Obra)
```sql
CREATE TABLE public.work_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  service_type_id UUID NOT NULL REFERENCES service_types(id),
  agreed_value DECIMAL(12,2) NOT NULL,
    -- Valor acordado com o cliente
  total_quantity DECIMAL(10,2),
    -- Quantidade total esperada
  status VARCHAR(50) DEFAULT 'pending',
    -- Valores: 'pending', 'in_progress', 'completed'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_work_services_work_id ON public.work_services(work_id);
```

### 2.7 Collaborators (Colaboradores)
```sql
CREATE TABLE public.collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  full_name VARCHAR(255) NOT NULL,
  cpf VARCHAR(20) UNIQUE NOT NULL,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  phone VARCHAR(20),
  birth_date DATE,
  bank_name VARCHAR(100),
  bank_account VARCHAR(50),
  bank_digit VARCHAR(2),
  account_type VARCHAR(20),
    -- Valores: 'checking', 'savings'
  pix_key VARCHAR(255),
    -- CPF, Email, Telefone ou Aleatória
  payment_method VARCHAR(50) DEFAULT 'bank_transfer',
    -- Valores: 'bank_transfer', 'pix', 'cash'
  hourly_rate DECIMAL(10,2),
    -- Taxa horária base
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_collaborators_cpf ON public.collaborators(cpf);
CREATE INDEX idx_collaborators_user_id ON public.collaborators(user_id);
```

### 2.8 Work Allocations (Alocações de Colaboradores)
```sql
CREATE TABLE public.work_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  collaborator_id UUID NOT NULL REFERENCES collaborators(id),
  environment_id UUID NOT NULL REFERENCES work_environments(id),
  service_type_id UUID NOT NULL REFERENCES service_types(id),
  allocation_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'allocated',
    -- Valores: 'allocated', 'working', 'completed', 'cancelled'
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_work_allocations_work_id ON public.work_allocations(work_id);
CREATE INDEX idx_work_allocations_collaborator_id ON public.work_allocations(collaborator_id);
```

### 2.9 Measurements (Medições)
```sql
CREATE TABLE public.measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id UUID NOT NULL REFERENCES works(id),
  environment_id UUID REFERENCES work_environments(id),
  collaborator_id UUID NOT NULL REFERENCES collaborators(id),
  service_type_id UUID NOT NULL REFERENCES service_types(id),
  quantity DECIMAL(10,3) NOT NULL,
    -- Quantidade realizada
  unit_value DECIMAL(10,2) NOT NULL,
    -- Valor por unidade
  total_value DECIMAL(12,2) NOT NULL,
    -- Total = quantity × unit_value
  adjustment_value DECIMAL(12,2) DEFAULT 0,
    -- Ajustes ou bônus
  total_with_adjustments DECIMAL(12,2),
    -- Total incluindo ajustes
  ceiling_value DECIMAL(12,2),
    -- Valor teto para o colaborador
  exceeds_ceiling BOOLEAN DEFAULT false,
    -- Indica se ultrapassou o teto
  justification TEXT,
    -- Justificativa se ultrapassou teto
  photos_urls TEXT[] DEFAULT '{}',
    -- Array de URLs das fotos
  client_authorization_url VARCHAR(500),
    -- URL da foto da autorização do cliente
  status VARCHAR(50) DEFAULT 'pending',
    -- Valores: 'pending', 'approved', 'rejected', 'paid'
  rejected_reason TEXT,
  submitted_by UUID NOT NULL REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_measurements_work_id ON public.measurements(work_id);
CREATE INDEX idx_measurements_collaborator_id ON public.measurements(collaborator_id);
CREATE INDEX idx_measurements_status ON public.measurements(status);
```

### 2.10 Payments (Pagamentos)
```sql
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborator_id UUID NOT NULL REFERENCES collaborators(id),
  measurement_id UUID REFERENCES measurements(id),
  amount DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
    -- Valores: 'bank_transfer', 'pix', 'cash'
  status VARCHAR(50) DEFAULT 'pending',
    -- Valores: 'pending', 'processing', 'paid', 'failed', 'disputed'
  payment_proof_url VARCHAR(500),
    -- URL do comprovante
  payment_date DATE,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_by UUID REFERENCES users(id),
  notes TEXT
);

CREATE INDEX idx_payments_collaborator_id ON public.payments(collaborator_id);
CREATE INDEX idx_payments_status ON public.payments(status);
```

### 2.11 Client Charges (Cobranças aos Clientes)
```sql
CREATE TABLE public.client_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id UUID NOT NULL REFERENCES works(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  total_amount DECIMAL(12,2) NOT NULL,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  remaining_amount DECIMAL(12,2),
  status VARCHAR(50) DEFAULT 'pending',
    -- Valores: 'pending', 'partially_paid', 'paid', 'overdue', 'disputed'
  due_date DATE NOT NULL,
  payment_proof_url VARCHAR(500),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_client_charges_work_id ON public.client_charges(work_id);
CREATE INDEX idx_client_charges_client_id ON public.client_charges(client_id);
CREATE INDEX idx_client_charges_status ON public.client_charges(status);
```

### 2.12 Pending Items (Pendências)
```sql
CREATE TABLE public.pending_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
    -- Valores: 'measurement', 'approval', 'payment', 'charging', 'other'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  reference_type VARCHAR(50),
    -- Valores: 'measurement', 'payment', 'charge', 'work'
  reference_id UUID,
  assigned_to UUID NOT NULL REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'open',
    -- Valores: 'open', 'in_progress', 'closed'
  priority VARCHAR(20) DEFAULT 'normal',
    -- Valores: 'low', 'normal', 'high', 'urgent'
  due_date DATE,
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES users(id),
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_pending_items_assigned_to ON public.pending_items(assigned_to);
CREATE INDEX idx_pending_items_status ON public.pending_items(status);
CREATE INDEX idx_pending_items_type ON public.pending_items(type);
```

### 2.13 Notifications (Notificações)
```sql
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
    -- Valores: 'measurement', 'approval', 'payment', 'charging', 'system'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  reference_type VARCHAR(50),
  reference_id UUID,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
```

### 2.14 Audit Logs (Logs de Auditoria)
```sql
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
    -- Exemplos: 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT'
  entity_type VARCHAR(100) NOT NULL,
    -- Exemplos: 'measurement', 'payment', 'work', 'user'
  entity_id UUID NOT NULL,
  description TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  status VARCHAR(50) DEFAULT 'success',
    -- Valores: 'success', 'failure'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);
```

### 2.15 User Permissions (Permissões Personalizadas)
```sql
CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_key VARCHAR(100) NOT NULL,
    -- Exemplos: 'view_reports', 'approve_measurements', 'process_payments'
  is_granted BOOLEAN DEFAULT true,
  granted_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, permission_key)
);

CREATE INDEX idx_user_permissions_user_id ON public.user_permissions(user_id);
```

## 3. Views Úteis

```sql
-- Vista: Resumo de Obras
CREATE VIEW work_summary AS
SELECT 
  w.id,
  w.name,
  c.name as client_name,
  w.status,
  COUNT(DISTINCT m.id) as total_measurements,
  SUM(m.total_value) as total_paid,
  w.budget_amount,
  (w.budget_amount - SUM(m.total_value)) as remaining_budget
FROM works w
JOIN clients c ON w.client_id = c.id
LEFT JOIN measurements m ON w.id = m.work_id AND m.status = 'approved'
GROUP BY w.id, w.name, c.name, w.status, w.budget_amount;

-- Vista: Pendências do Usuário
CREATE VIEW user_pending_items AS
SELECT 
  p.id,
  p.type,
  p.title,
  p.priority,
  p.due_date,
  u.full_name as assigned_to,
  COUNT(*) OVER (PARTITION BY p.assigned_to) as total_pending
FROM pending_items p
JOIN users u ON p.assigned_to = u.id
WHERE p.status = 'open';

-- Vista: Saldo Colaborador
CREATE VIEW collaborator_balance AS
SELECT 
  c.id,
  c.full_name,
  COUNT(DISTINCT m.id) as total_measurements,
  SUM(m.total_with_adjustments) as total_earned,
  SUM(p.amount) as total_paid,
  (SUM(m.total_with_adjustments) - COALESCE(SUM(p.amount), 0)) as balance_pending
FROM collaborators c
LEFT JOIN measurements m ON c.id = m.collaborator_id AND m.status = 'approved'
LEFT JOIN payments p ON c.id = p.collaborator_id AND p.status = 'paid'
GROUP BY c.id, c.full_name;
```

## 4. Migrations (Exemplo com TypeORM)

As migrations serão criadas automaticamente pelo TypeORM durante o desenvolvimento:

```bash
# Gerar nova migration
npm run typeorm migration:generate -- -n CreateUsersTable

# Executar migrations
npm run typeorm migration:run

# Reverter última migration
npm run typeorm migration:revert
```

## 5. Índices de Performance

Todos os índices foram criados nas tabelas principais para otimizar:
- Buscas por status
- Buscas por IDs estrangeiros
- Queries frequentes em relatórios
- Filtros por data

## 6. Backup e Disaster Recovery

```sql
-- Exemplo de backup completo
pg_dump -U postgres -h localhost -F c db_jb_pinturas > backup.sql

-- Restaurar backup
pg_restore -U postgres -h localhost -d db_jb_pinturas backup.sql
```
