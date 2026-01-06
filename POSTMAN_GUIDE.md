# 🧪 POSTMAN Collection - Phase 1 Testing

> Importar este arquivo no Postman para testar todos os endpoints implementados

## Setup Inicial

1. **Abrir Postman**
2. **Importar Collection**: File → Import
3. **Selecionar este arquivo**: `POSTMAN_COLLECTION.json`
4. **Configurar Environment** (opcional):
   - `baseUrl`: `http://localhost:3001`
   - `token`: Será preenchido após login

---

## 📝 Variáveis de Ambiente (Postman)

```json
{
  "baseUrl": "http://localhost:3001",
  "token": "",
  "clientId": "",
  "workId": "",
  "collaboratorId": ""
}
```

---

## 🔐 1. Autenticação

### Login - Obter Token
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@jbpinturas.com",
  "password": "admin123"
}
```

**Resposta Esperada** (201):
```json
{
  "access_token": "eyJhbGc...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "admin@jbpinturas.com",
    "fullName": "Admin Pintura",
    "role": "admin",
    "status": "active"
  }
}
```

> **Dica**: Copie o `access_token` e cole nas variáveis Postman como `token`

---

## 👥 2. CRUD - Clientes

### 2.1 Criar Cliente
```http
POST /clients
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "name": "Empresa ABC Construções",
  "type": "pj",
  "cnpjCpf": "12345678000100",
  "email": "contato@abc.com",
  "phone": "(11) 98765-4321",
  "address": "Av. Principal, 123",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "01234-567",
  "contactPerson": "João Silva",
  "contactPhone": "(11) 3456-7890"
}
```

**Resposta Esperada** (201):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Empresa ABC Construções",
  "type": "pj",
  "cnpjCpf": "12345678000100",
  "email": "contato@abc.com",
  "isActive": true,
  "createdAt": "2026-01-05T10:30:00Z",
  "updatedAt": "2026-01-05T10:30:00Z"
}
```

> **Dica**: Copie o `id` para `clientId` nas variáveis

---

### 2.2 Listar Clientes (com paginação)
```http
GET /clients?page=1&limit=10
Authorization: Bearer {{token}}
```

**Parâmetros**:
- `page`: número da página (default: 1)
- `limit`: itens por página (default: 10)
- `search`: buscar por nome, CNPJ/CPF ou email (opcional)

**Resposta Esperada** (200):
```json
{
  "data": [
    {
      "id": "...",
      "name": "Empresa ABC Construções",
      "type": "pj",
      "cnpjCpf": "12345678000100",
      "isActive": true
    }
  ],
  "total": 1,
  "page": 1,
  "lastPage": 1
}
```

---

### 2.3 Listar Apenas Clientes Ativos
```http
GET /clients/active
Authorization: Bearer {{token}}
```

**Resposta**: Array de clientes com `isActive: true`

---

### 2.4 Obter Detalhes do Cliente
```http
GET /clients/{{clientId}}
Authorization: Bearer {{token}}
```

**Resposta** (200): Detalhes completos do cliente

---

### 2.5 Atualizar Cliente
```http
PATCH /clients/{{clientId}}
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "email": "novo-email@abc.com",
  "phone": "(11) 99999-8888"
}
```

**Resposta** (200): Cliente atualizado

---

### 2.6 Deletar Cliente (Soft Delete)
```http
DELETE /clients/{{clientId}}
Authorization: Bearer {{token}}
```

**Resposta** (200):
```json
{
  "message": "Cliente deletado com sucesso"
}
```

> **Nota**: O cliente fica marcado como `isActive: false`, não é deletado

---

## 🏗️ 3. CRUD - Obras

### 3.1 Criar Obra
```http
POST /works
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "clientId": "{{clientId}}",
  "name": "Pintura Sala Principal",
  "description": "Pintura interna de 2 ambientes - 150 m²",
  "address": "Av. Principal, 123",
  "city": "São Paulo",
  "state": "SP",
  "startDate": "2026-01-10",
  "estimatedEndDate": "2026-02-10",
  "measurementDeadline": "2026-02-05",
  "paymentDeadline": "2026-02-20",
  "budgetAmount": 5000,
  "responsibleForeman": "id-do-encarregado"
}
```

**Resposta** (201): Obra criada com ID

---

### 3.2 Listar Obras (com filtros)
```http
GET /works?page=1&limit=10&status=in_progress&clientId={{clientId}}
Authorization: Bearer {{token}}
```

**Parâmetros**:
- `status`: `planning`, `in_progress`, `paused`, `completed`, `cancelled`
- `clientId`: filtrar por cliente

---

### 3.3 Listar Obras por Status
```http
GET /works/status/in_progress
Authorization: Bearer {{token}}
```

---

### 3.4 Listar Obras de um Cliente
```http
GET /works/client/{{clientId}}
Authorization: Bearer {{token}}
```

---

### 3.5 Obter Detalhes da Obra
```http
GET /works/{{workId}}
Authorization: Bearer {{token}}
```

---

### 3.6 Atualizar Obra
```http
PATCH /works/{{workId}}
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "estimatedEndDate": "2026-02-15",
  "budgetAmount": 5500
}
```

---

### 3.7 Atualizar Status da Obra
```http
PATCH /works/{{workId}}/status/completed
Authorization: Bearer {{token}}
```

**Status Disponíveis**:
- `planning` - Planejamento
- `in_progress` - Em progresso
- `paused` - Pausada
- `completed` - Completa
- `cancelled` - Cancelada

---

### 3.8 Deletar Obra (Marcar como Cancelada)
```http
DELETE /works/{{workId}}
Authorization: Bearer {{token}}
```

---

## 👷 4. CRUD - Colaboradores

### 4.1 Criar Colaborador
```http
POST /collaborators
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "name": "João da Silva Pintor",
  "cpf": "12345678900",
  "phone": "(11) 98765-4321",
  "email": "joao.pintor@email.com",
  "address": "Rua das Flores, 456",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "01234-567",
  "bankName": "Banco Itaú",
  "bankAccount": "123456",
  "bankAgency": "0001",
  "bankAccountType": "conta_corrente",
  "hourlyRate": 75.50
}
```

**Resposta** (201): Colaborador criado

---

### 4.2 Listar Colaboradores
```http
GET /collaborators?page=1&limit=10&search=João
Authorization: Bearer {{token}}
```

---

### 4.3 Listar Apenas Colaboradores Ativos
```http
GET /collaborators/active
Authorization: Bearer {{token}}
```

---

### 4.4 Obter Detalhes do Colaborador
```http
GET /collaborators/{{collaboratorId}}
Authorization: Bearer {{token}}
```

---

### 4.5 Atualizar Colaborador
```http
PATCH /collaborators/{{collaboratorId}}
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "hourlyRate": 85.00,
  "pixKey": "joao@email.com"
}
```

---

### 4.6 Deletar Colaborador
```http
DELETE /collaborators/{{collaboratorId}}
Authorization: Bearer {{token}}
```

---

## 🧪 Cenário de Teste Completo

Siga esta sequência para testar o fluxo completo:

### 1. Autenticação
```
✅ POST /auth/login
   └─ Salvar token
```

### 2. Criar Cliente
```
✅ POST /clients
   └─ Salvar clientId
```

### 3. Criar Obra (vinculada ao Cliente)
```
✅ POST /works (com clientId)
   └─ Salvar workId
```

### 4. Criar Colaborador
```
✅ POST /collaborators
   └─ Salvar collaboratorId
```

### 5. Listar Todos
```
✅ GET /clients
✅ GET /works
✅ GET /collaborators
```

### 6. Atualizar Status da Obra
```
✅ PATCH /works/{{workId}}/status/in_progress
✅ PATCH /works/{{workId}}/status/completed
```

### 7. Buscar com Filtros
```
✅ GET /clients?search=Empresa
✅ GET /works?status=completed
✅ GET /collaborators?search=João
```

---

## ⚠️ Erros Comuns

### 401 - Unauthorized
**Problema**: Token expirado ou inválido
**Solução**: Fazer novo login e copiar novo token

```bash
POST /auth/login
```

### 409 - Conflict
**Problema**: CNPJ/CPF já existe
**Solução**: Usar outro CNPJ/CPF

### 404 - Not Found
**Problema**: ID não encontrado
**Solução**: Verificar se o ID está correto

### 400 - Bad Request
**Problema**: Dados inválidos
**Solução**: Verificar validação dos campos

---

## 💾 Exportar Collection

Para compartilhar a collection com o time:

1. Em Postman: **Collections** → Clicar nos **...**
2. **Export**
3. Salvar como `jb_pinturas_phase1.json`
4. Compartilhar com o time

---

## 🔄 Variáveis Dinâmicas

No Postman, após cada request bem-sucedido, faça:

### Após Login
```javascript
pm.environment.set("token", pm.response.json().access_token);
```

### Após Criar Cliente
```javascript
pm.environment.set("clientId", pm.response.json().id);
```

### Após Criar Obra
```javascript
pm.environment.set("workId", pm.response.json().id);
```

### Após Criar Colaborador
```javascript
pm.environment.set("collaboratorId", pm.response.json().id);
```

---

## 📊 Status Codes

| Código | Significado |
|--------|------------|
| **200** | OK - Request bem-sucedida |
| **201** | Created - Recurso criado |
| **204** | No Content - Deletado com sucesso |
| **400** | Bad Request - Dados inválidos |
| **401** | Unauthorized - Token inválido |
| **404** | Not Found - Recurso não encontrado |
| **409** | Conflict - CNPJ/CPF/CPF duplicado |
| **500** | Internal Server Error - Erro no servidor |

---

## 📚 Documentação Adicional

- [API.md](../docs/API.md) - Documentação completa dos endpoints
- [DATABASE.md](../docs/DATABASE.md) - Schema do banco
- [ARCHITECTURE.md](../docs/ARCHITECTURE.md) - Arquitetura da API

---

**Pronto para testar! 🚀**

Salve as credenciais:
- Email: `admin@jbpinturas.com`
- Senha: `admin123`
