# 🧪 Teste do CRUD Users - Guia Completo

## 📌 Endpoints Users

| Método | Endpoint | Descrição | Role Requerida |
|--------|----------|-----------|-----------------|
| **POST** | `/users` | Criar novo usuário | admin |
| **GET** | `/users` | Listar usuários com paginação | admin |
| **GET** | `/users/role/:role` | Listar por papel | admin |
| **GET** | `/users/active` | Listar apenas ativos | admin |
| **GET** | `/users/profile` | Obter seu perfil | todos |
| **GET** | `/users/:id` | Obter detalhes do usuário | admin ou próprio |
| **PATCH** | `/users/profile` | Atualizar seu perfil | todos |
| **PATCH** | `/users/:id` | Atualizar usuário | admin |
| **PATCH** | `/users/:id/status/:status` | Alterar status | admin |
| **DELETE** | `/users/:id` | Deletar usuário (soft delete) | admin |

---

## 🔐 Permissões por Papel

| Ação | Admin | Manager | Financial | Foreman |
|------|-------|---------|-----------|---------|
| Criar usuário | ✅ | ❌ | ❌ | ❌ |
| Listar todos usuários | ✅ | ❌ | ❌ | ❌ |
| Ver outro perfil | ✅ | ❌ | ❌ | ❌ |
| Ver próprio perfil | ✅ | ✅ | ✅ | ✅ |
| Atualizar outro perfil | ✅ | ❌ | ❌ | ❌ |
| Atualizar próprio perfil | ✅ | ✅ | ✅ | ✅ |
| Alterar role/status | ✅ | ❌ | ❌ | ❌ |

---

## 🧪 Cenário 1: Criar Usuários

### 1.1 Login como Admin
```bash
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@jbpinturas.com","password":"admin123"}' | jq -r '.access_token')

echo "Token: $TOKEN"
```

### 1.2 Criar Usuário Manager
```bash
curl -X POST http://localhost:3001/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@jbpinturas.com",
    "password": "manager123",
    "fullName": "João Manager",
    "phone": "(11) 98765-4321",
    "role": "manager"
  }'
```

**Resposta Esperada** (201):
```json
{
  "id": "...",
  "email": "manager@jbpinturas.com",
  "fullName": "João Manager",
  "role": "manager",
  "status": "active",
  "createdAt": "2026-01-05T...",
  "updatedAt": "2026-01-05T..."
}
```

### 1.3 Criar Usuário Financial
```bash
curl -X POST http://localhost:3001/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "financial@jbpinturas.com",
    "password": "financial123",
    "fullName": "Maria Financial",
    "phone": "(11) 97654-3210",
    "cpf": "12345678901",
    "role": "financial"
  }'
```

### 1.4 Criar Usuário Foreman
```bash
curl -X POST http://localhost:3001/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "foreman@jbpinturas.com",
    "password": "foreman123",
    "fullName": "Carlos Foreman",
    "phone": "(11) 96543-2109",
    "role": "foreman"
  }'
```

---

## 🔍 Cenário 2: Listar Usuários

### 2.1 Listar Todos (Admin)
```bash
curl -X GET http://localhost:3001/users?page=1&limit=10 \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta**:
```json
{
  "data": [
    {
      "id": "...",
      "email": "admin@jbpinturas.com",
      "fullName": "Admin Pintura",
      "role": "admin",
      "status": "active"
    },
    {
      "id": "...",
      "email": "manager@jbpinturas.com",
      "fullName": "João Manager",
      "role": "manager",
      "status": "active"
    }
  ],
  "total": 4,
  "page": 1,
  "lastPage": 1
}
```

### 2.2 Listar por Papel
```bash
# Todos os managers
curl -X GET http://localhost:3001/users/role/manager \
  -H "Authorization: Bearer $TOKEN"

# Todos os foreman
curl -X GET http://localhost:3001/users/role/foreman \
  -H "Authorization: Bearer $TOKEN"

# Todos os financial
curl -X GET http://localhost:3001/users/role/financial \
  -H "Authorization: Bearer $TOKEN"
```

### 2.3 Listar com Busca
```bash
curl -X GET "http://localhost:3001/users?page=1&limit=10&search=João" \
  -H "Authorization: Bearer $TOKEN"

curl -X GET "http://localhost:3001/users?page=1&limit=10&role=manager" \
  -H "Authorization: Bearer $TOKEN"
```

### 2.4 Listar Apenas Ativos
```bash
curl -X GET http://localhost:3001/users/active \
  -H "Authorization: Bearer $TOKEN"
```

---

## 👤 Cenário 3: Gerenciar Perfil

### 3.1 Ver Próprio Perfil (Qualquer Usuário)
```bash
curl -X GET http://localhost:3001/users/profile \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "admin@jbpinturas.com",
  "fullName": "Admin Pintura",
  "phone": "(11) 99999-8888",
  "cpf": null,
  "role": "admin",
  "status": "active",
  "isEmailVerified": false,
  "lastLogin": "2026-01-05T10:30:00Z",
  "createdAt": "2026-01-05T10:30:00Z",
  "updatedAt": "2026-01-05T10:30:00Z"
}
```

### 3.2 Atualizar Próprio Perfil (Não Admin)
```bash
# Login como Manager
MANAGER_TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@jbpinturas.com","password":"manager123"}' | jq -r '.access_token')

# Atualizar perfil
curl -X PATCH http://localhost:3001/users/profile \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "João Manager Silva",
    "phone": "(11) 99876-5432"
  }'
```

### 3.3 Tentar Alterar Role (Deve Falhar)
```bash
curl -X PATCH http://localhost:3001/users/profile \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin"
  }'
```

**Resposta Esperada** (403):
```json
{
  "statusCode": 403,
  "message": "Você não pode alterar seu próprio papel ou status",
  "error": "Forbidden"
}
```

---

## 🔧 Cenário 4: Operações Admin

### 4.1 Atualizar Usuário (Admin)
```bash
curl -X PATCH http://localhost:3001/users/{manager_id} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "João Manager Atualizado",
    "phone": "(11) 98765-4321"
  }'
```

### 4.2 Alterar Status do Usuário
```bash
# Suspender usuário
curl -X PATCH http://localhost:3001/users/{user_id}/status/suspended \
  -H "Authorization: Bearer $TOKEN"

# Desativar usuário
curl -X PATCH http://localhost:3001/users/{user_id}/status/inactive \
  -H "Authorization: Bearer $TOKEN"

# Ativar novamente
curl -X PATCH http://localhost:3001/users/{user_id}/status/active \
  -H "Authorization: Bearer $TOKEN"
```

### 4.3 Deletar Usuário (Soft Delete)
```bash
curl -X DELETE http://localhost:3001/users/{user_id} \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta**:
```json
{
  "message": "Usuário deletado com sucesso"
}
```

---

## ❌ Cenário 5: Testes de Erro

### 5.1 Criar Usuário com Email Duplicado
```bash
curl -X POST http://localhost:3001/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@jbpinturas.com",
    "password": "password123",
    "fullName": "Test User",
    "role": "manager"
  }'
```

**Resposta Esperada** (409):
```json
{
  "statusCode": 409,
  "message": "Email já existe",
  "error": "Conflict"
}
```

### 5.2 Criar Usuário com CPF Duplicado
```bash
curl -X POST http://localhost:3001/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "duplicate@test.com",
    "password": "password123",
    "fullName": "Test User",
    "cpf": "12345678900",
    "role": "manager"
  }'
```

**Resposta Esperada** (409):
```json
{
  "statusCode": 409,
  "message": "CPF já existe",
  "error": "Conflict"
}
```

### 5.3 Não-Admin Tentando Criar Usuário
```bash
curl -X POST http://localhost:3001/users \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "password123",
    "fullName": "Test User",
    "role": "foreman"
  }'
```

**Resposta Esperada** (403):
```json
{
  "statusCode": 403,
  "message": "Apenas administradores podem criar usuários",
  "error": "Forbidden"
}
```

### 5.4 Não-Admin Tentando Listar Todos Usuários
```bash
curl -X GET http://localhost:3001/users \
  -H "Authorization: Bearer $MANAGER_TOKEN"
```

**Resposta Esperada** (403):
```json
{
  "statusCode": 403,
  "message": "Apenas administradores podem listar usuários",
  "error": "Forbidden"
}
```

---

## 📊 Validações Implementadas

| Campo | Validação | Exemplo Válido |
|-------|-----------|-----------------|
| **email** | Email válido | `admin@jbpinturas.com` |
| **password** | Mínimo 8 caracteres | `password123` |
| **fullName** | 3-255 caracteres | `João Silva` |
| **phone** | Formato (XX) XXXXX-XXXX | `(11) 98765-4321` |
| **cpf** | 11 dígitos | `12345678900` |
| **role** | admin, manager, financial, foreman | `admin` |
| **status** | active, inactive, suspended | `active` |

---

## 🔄 Fluxo Completo de Teste

1. **Login com Admin**
   ```bash
   curl -X POST http://localhost:3001/auth/login \
     -d '{"email":"admin@jbpinturas.com","password":"admin123"}'
   ```

2. **Criar 4 Usuários (um de cada role)**
   - Manager
   - Financial
   - Foreman
   - Outro Foreman

3. **Listar todos**
   ```bash
   curl http://localhost:3001/users \
     -H "Authorization: Bearer $TOKEN"
   ```

4. **Listar por papel**
   ```bash
   curl http://localhost:3001/users/role/foreman \
     -H "Authorization: Bearer $TOKEN"
   ```

5. **Login com cada usuário**
   - Verificar que cada um vê seu próprio perfil
   - Verificar que não conseguem ver outros

6. **Atualizar dados de um usuário**
   ```bash
   curl -X PATCH http://localhost:3001/users/{id} \
     -H "Authorization: Bearer $TOKEN" \
     -d '{"fullName":"Novo Nome"}'
   ```

7. **Alterar status para suspended**
   ```bash
   curl -X PATCH http://localhost:3001/users/{id}/status/suspended \
     -H "Authorization: Bearer $TOKEN"
   ```

8. **Voltar status para active**
   ```bash
   curl -X PATCH http://localhost:3001/users/{id}/status/active \
     -H "Authorization: Bearer $TOKEN"
   ```

9. **Deletar um usuário**
   ```bash
   curl -X DELETE http://localhost:3001/users/{id} \
     -H "Authorization: Bearer $TOKEN"
   ```

10. **Verificar que ficou marcado como inativo**
    ```bash
    curl http://localhost:3001/users/active \
      -H "Authorization: Bearer $TOKEN"
    ```

---

## 📝 Notas Importantes

✅ **Senhas nunca são retornadas** nas respostas
✅ **Soft delete** - usuários deletados ficam com status `inactive`
✅ **Permissions check** - cada endpoint valida permissões
✅ **Role-based access** - apenas admin pode gerenciar usuários
✅ **Own profile access** - todos podem ver/atualizar seu próprio perfil
✅ **Email e CPF únicos** - não permite duplicatas

---

## 🔗 Endpoints Relacionados

- [POSTMAN_GUIDE.md](../POSTMAN_GUIDE.md) - Guia geral
- [PHASE1_SPRINT1_COMPLETA.md](../PHASE1_SPRINT1_COMPLETA.md) - Implementação
- [docs/API.md](../docs/API.md) - Especificação completa

---

**Pronto para testar! 🚀**
