# API Documentation - JB Pinturas

## Base URL
```
http://localhost:3001/api
```

## Autenticação
Todos os endpoints (exceto login) requerem um header `Authorization`:
```
Authorization: Bearer <seu_token_jwt>
```

## Endpoints

### 🔐 Autenticação

#### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "usuario@jbpinturas.com",
  "password": "senha123456"
}

Response 200:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "usuario@jbpinturas.com",
    "fullName": "João Silva",
    "role": "foreman"
  }
}
```

#### Registrar Usuário
```
POST /auth/register
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "novo.usuario@jbpinturas.com",
  "password": "senha123456",
  "fullName": "Maria Silva",
  "phone": "11999999999",
  "cpf": "12345678900",
  "role": "foreman"
}

Response 201:
{
  "id": "uuid",
  "email": "novo.usuario@jbpinturas.com",
  "fullName": "Maria Silva",
  "role": "foreman"
}
```

### 👥 Usuários

#### Listar Usuários
```
GET /users?page=1&limit=10
Authorization: Bearer <token>

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "email": "usuario@jbpinturas.com",
      "fullName": "João Silva",
      "phone": "11999999999",
      "cpf": "12345678900",
      "role": "foreman",
      "status": "active"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

#### Obter Usuário
```
GET /users/:id
Authorization: Bearer <token>

Response 200:
{
  "id": "uuid",
  "email": "usuario@jbpinturas.com",
  "fullName": "João Silva",
  "phone": "11999999999",
  "cpf": "12345678900",
  "role": "foreman",
  "status": "active",
  "createdAt": "2024-01-05T10:00:00Z",
  "updatedAt": "2024-01-05T10:00:00Z"
}
```

#### Atualizar Usuário
```
PATCH /users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "João Silva Atualizado",
  "phone": "11988888888"
}

Response 200:
{
  "id": "uuid",
  "email": "usuario@jbpinturas.com",
  "fullName": "João Silva Atualizado",
  "phone": "11988888888",
  ...
}
```

### 🏢 Clientes

#### Listar Clientes
```
GET /clients?page=1&limit=10&isActive=true
Authorization: Bearer <token>

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "name": "Construtora XYZ",
      "type": "pj",
      "cnpjCpf": "12345678000195",
      "address": "Rua das Flores, 123",
      "city": "São Paulo",
      "state": "SP",
      "phone": "1133333333",
      "email": "contato@construtora.com",
      "isActive": true
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

#### Criar Cliente
```
POST /clients
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Construtora XYZ",
  "type": "pj",
  "cnpjCpf": "12345678000195",
  "address": "Rua das Flores, 123",
  "city": "São Paulo",
  "state": "SP",
  "phone": "1133333333",
  "email": "contato@construtora.com",
  "contactPerson": "João da Silva",
  "contactPhone": "11999999999"
}

Response 201:
{
  "id": "uuid",
  "name": "Construtora XYZ",
  ...
}
```

#### Atualizar Cliente
```
PATCH /clients/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "phone": "1133333334"
}

Response 200:
{
  "id": "uuid",
  ...
}
```

### 🏗️ Obras

#### Listar Obras
```
GET /works?page=1&limit=10&status=in_progress&clientId=uuid
Authorization: Bearer <token>

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "name": "Prédio Residencial A",
      "clientId": "uuid",
      "client": { "id": "uuid", "name": "Construtora XYZ" },
      "address": "Avenida Principal, 456",
      "city": "São Paulo",
      "status": "in_progress",
      "budgetAmount": 50000.00,
      "spentAmount": 25000.00,
      "measurementDeadline": "2024-02-05",
      "paymentDeadline": "2024-02-10"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

#### Criar Obra
```
POST /works
Authorization: Bearer <token>
Content-Type: application/json

{
  "clientId": "uuid",
  "name": "Prédio Residencial A",
  "address": "Avenida Principal, 456",
  "city": "São Paulo",
  "state": "SP",
  "budgetAmount": 50000.00,
  "measurementDeadline": "2024-02-05",
  "paymentDeadline": "2024-02-10",
  "responsibleForeman": "uuid"
}

Response 201:
{
  "id": "uuid",
  ...
}
```

#### Obter Progresso da Obra
```
GET /works/:id/progress
Authorization: Bearer <token>

Response 200:
{
  "workId": "uuid",
  "status": "in_progress",
  "totalEnvironments": 10,
  "completedEnvironments": 5,
  "completionPercentage": 50,
  "measurements": [
    {
      "id": "uuid",
      "quantity": 120,
      "totalValue": 3600,
      "status": "approved"
    }
  ],
  "totalSpent": 25000,
  "budgetRemaining": 25000
}
```

### 📏 Medições

#### Criar Medição
```
POST /measurements
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "workId": "uuid",
  "collaboratorId": "uuid",
  "serviceTypeId": "uuid",
  "environmentId": "uuid",
  "quantity": 120,
  "unitValue": 30,
  "adjustmentValue": 0,
  "clientAuthorizationUrl": "foto_base64_ou_url",
  "photos": [arquivo1, arquivo2]
}

Response 201:
{
  "id": "uuid",
  "workId": "uuid",
  "collaboratorId": "uuid",
  "quantity": 120,
  "unitValue": 30,
  "totalValue": 3600,
  "status": "pending",
  "createdAt": "2024-01-05T10:00:00Z"
}
```

#### Aprovar Medição
```
PATCH /measurements/:id/approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "approvalNotes": "Medição aprovada conforme solicitado"
}

Response 200:
{
  "id": "uuid",
  "status": "approved",
  "approvedAt": "2024-01-05T10:30:00Z"
}
```

#### Rejeitar Medição
```
PATCH /measurements/:id/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "rejectionReason": "Quantidade não corresponde ao acordado"
}

Response 200:
{
  "id": "uuid",
  "status": "rejected",
  "rejectedReason": "Quantidade não corresponde ao acordado"
}
```

### 💰 Pagamentos

#### Listar Pagamentos
```
GET /payments?status=pending&collaboratorId=uuid
Authorization: Bearer <token>

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "collaboratorId": "uuid",
      "amount": 3600,
      "status": "pending",
      "createdAt": "2024-01-05T10:00:00Z"
    }
  ]
}
```

#### Processar Pagamento
```
POST /payments
Authorization: Bearer <token>
Content-Type: application/json

{
  "collaboratorId": "uuid",
  "measurementId": "uuid",
  "amount": 3600,
  "paymentMethod": "bank_transfer"
}

Response 201:
{
  "id": "uuid",
  "status": "processing"
}
```

#### Confirmar Pagamento com Comprovante
```
PATCH /payments/:id/confirm
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "paymentProof": arquivo
}

Response 200:
{
  "id": "uuid",
  "status": "paid",
  "paidAt": "2024-01-05T10:30:00Z"
}
```

### ⏳ Pendências

#### Listar Pendências
```
GET /pending-items?status=open&assignedTo=uuid
Authorization: Bearer <token>

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "type": "measurement",
      "title": "Medição pendente - Apartamento 101",
      "description": "Medição do serviço de pintura",
      "assignedTo": "uuid",
      "status": "open",
      "priority": "high",
      "dueDate": "2024-01-06",
      "createdAt": "2024-01-05T10:00:00Z"
    }
  ]
}
```

#### Resolver Pendência
```
PATCH /pending-items/:id/resolve
Authorization: Bearer <token>
Content-Type: application/json

{
  "resolutionNotes": "Medição aprovada"
}

Response 200:
{
  "id": "uuid",
  "status": "closed",
  "resolvedAt": "2024-01-05T10:30:00Z"
}
```

### 🔔 Notificações

#### Listar Notificações
```
GET /notifications?isRead=false
Authorization: Bearer <token>

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "type": "measurement",
      "title": "Nova medição",
      "message": "Medição enviada para revisão",
      "isRead": false,
      "createdAt": "2024-01-05T10:00:00Z"
    }
  ]
}
```

#### Marcar como Lido
```
PATCH /notifications/:id/read
Authorization: Bearer <token>

Response 200:
{
  "id": "uuid",
  "isRead": true
}
```

### 📊 Relatórios

#### Relatório de Produção
```
GET /reports/production?workId=uuid&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>

Response 200:
{
  "workId": "uuid",
  "period": { "start": "2024-01-01", "end": "2024-01-31" },
  "measurements": [
    {
      "id": "uuid",
      "collaborator": "João Silva",
      "serviceType": "Pintura de Apartamento",
      "quantity": 120,
      "completionDate": "2024-01-10"
    }
  ],
  "totalMeasurements": 5,
  "totalQuantity": 600
}
```

#### Relatório de Pagamentos
```
GET /reports/payments?startDate=2024-01-01&endDate=2024-01-31&workId=uuid
Authorization: Bearer <token>

Response 200:
{
  "period": { "start": "2024-01-01", "end": "2024-01-31" },
  "payments": [
    {
      "id": "uuid",
      "collaborator": "João Silva",
      "amount": 3600,
      "status": "paid",
      "paidDate": "2024-01-15"
    }
  ],
  "totalPaid": 18000,
  "totalPending": 3600
}
```

#### Dashboard em Tempo Real
```
GET /reports/dashboard
Authorization: Bearer <token>

Response 200:
{
  "totalWorks": 20,
  "activeWorks": 15,
  "completedWorks": 5,
  "totalCollaborators": 100,
  "totalClients": 100,
  "totalSpent": 450000,
  "pendingPayments": 25000,
  "pendingCharges": 35000,
  "overdueDates": [
    {
      "type": "measurement",
      "count": 2,
      "daysOverdue": 3
    }
  ]
}
```

## Códigos de Status HTTP

- `200 OK` - Requisição bem-sucedida
- `201 Created` - Recurso criado com sucesso
- `400 Bad Request` - Dados inválidos
- `401 Unauthorized` - Autenticação necessária
- `403 Forbidden` - Acesso negado
- `404 Not Found` - Recurso não encontrado
- `409 Conflict` - Conflito (ex: email já existe)
- `500 Internal Server Error` - Erro do servidor

## Rate Limiting

- Limite: 1000 requisições por hora
- Header: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

## Paginação

Padrão:
```
?page=1&limit=10&sort=-createdAt
```

Resposta:
```json
{
  "data": [],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

## Filtros

Exemplo:
```
/works?status=in_progress&clientId=uuid&budgetAmount[gte]=10000&budgetAmount[lte]=50000
```

## Swagger

Documentação interativa disponível em:
```
http://localhost:3001/api/docs
```
