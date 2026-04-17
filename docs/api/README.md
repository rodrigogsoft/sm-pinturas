# API Reference - JB Pinturas ERP

## 🚀 Base URL

```
Development: http://localhost:3000/api/v1
Production:  https://api.jbpinturas.com/api/v1
```

## 🔐 Autenticação

Todas as rotas protegidas requerem um token JWT no header:

```http
Authorization: Bearer {token}
```

### Obter Token

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "senha123"
}
```

**Response 200:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "nome_completo": "João Silva",
    "email": "user@example.com",
    "id_perfil": 4
  }
}
```

---

## 📚 Endpoints

### 🏢 Obras

#### Listar Todas as Obras

```http
GET /obras
Authorization: Bearer {token}
```

**Query Parameters:**
- `status` (optional): PLANEJAMENTO | ATIVA | SUSPENSA | CONCLUIDA
- `page` (optional): número da página (default: 1)
- `limit` (optional): itens por página (default: 10)

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "nome": "Edifício Primavera",
      "endereco_completo": "Rua das Flores, 123",
      "status": "ATIVA",
      "data_inicio": "2026-01-15",
      "data_previsao_fim": "2026-06-30",
      "cliente": {
        "id": "uuid",
        "razao_social": "Construtora XYZ"
      },
      "total_pavimentos": 10,
      "total_ambientes": 120
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 45
  }
}
```

#### Criar Nova Obra

```http
POST /obras
Authorization: Bearer {token}
Content-Type: application/json
```

**Permissões:** ENCARREGADO, ADMIN

**Body:**
```json
{
  "nome": "Edifício Jardim",
  "endereco_completo": "Av. Principal, 456",
  "data_inicio": "2026-03-01",
  "data_previsao_fim": "2026-12-31",
  "id_cliente": "uuid",
  "observacoes": "Obra de grande porte"
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "nome": "Edifício Jardim",
  "status": "PLANEJAMENTO",
  "created_at": "2026-02-06T10:30:00Z"
}
```

#### Obter Obra por ID

```http
GET /obras/{id}
Authorization: Bearer {token}
```

**Response 200:**
```json
{
  "id": "uuid",
  "nome": "Edifício Primavera",
  "endereco_completo": "Rua das Flores, 123",
  "status": "ATIVA",
  "data_inicio": "2026-01-15",
  "data_previsao_fim": "2026-06-30",
  "cliente": {...},
  "pavimentos": [
    {
      "id": "uuid",
      "nome": "Térreo",
      "ordem": 0,
      "ambientes": [...]
    }
  ],
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-02-05T15:30:00Z"
}
```

---

### 👥 Clientes

#### Listar Clientes

```http
GET /clientes
Authorization: Bearer {token}
```

**Permissões:** FINANCEIRO, GESTOR, ADMIN

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "razao_social": "Construtora ABC Ltda",
      "cnpj_nif": "12345678000199",
      "email": "contato@abc.com.br",
      "dia_corte": 15
    }
  ]
}
```

#### Criar Cliente

```http
POST /clientes
Authorization: Bearer {token}
Content-Type: application/json
```

**Permissões:** FINANCEIRO, ADMIN

**Body:**
```json
{
  "razao_social": "Construtora Nova Ltda",
  "cnpj_nif": "98765432000188",
  "email": "contato@nova.com.br",
  "telefone": "(11) 98765-4321",
  "endereco": "Rua Teste, 789",
  "dia_corte": 10
}
```

---

### 💰 Tabela de Preços

#### Criar/Atualizar Preço

```http
POST /precos
Authorization: Bearer {token}
Content-Type: application/json
```

**Permissões:** FINANCEIRO (criar), GESTOR (aprovar)

**Body:**
```json
{
  "id_obra": "uuid",
  "id_servico_catalogo": 1,
  "preco_custo": 25.00,
  "preco_venda": 35.00
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "preco_custo": 25.00,
  "preco_venda": 35.00,
  "margem_percentual": 40.00,
  "status_aprovacao": "PENDENTE"
}
```

#### Aprovar Preço

```http
PATCH /precos/{id}/aprovar
Authorization: Bearer {token}
```

**Permissões:** GESTOR, ADMIN

**Response 200:**
```json
{
  "id": "uuid",
  "status_aprovacao": "APROVADO",
  "data_aprovacao": "2026-02-06T14:30:00Z",
  "id_usuario_aprovador": "uuid"
}
```

---

### 📝 Sessões Diárias (RDO)

#### Criar RDO

```http
POST /sessoes
Authorization: Bearer {token}
Content-Type: application/json
```

**Permissões:** ENCARREGADO, ADMIN

**Body:**
```json
{
  "data_sessao": "2026-02-06",
  "hora_inicio": "2026-02-06T07:00:00Z",
  "geo_lat": -23.550520,
  "geo_long": -46.633308,
  "observacoes": "Início dos trabalhos no térreo"
}
```

#### Finalizar RDO

```http
PATCH /sessoes/{id}/finalizar
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Form Data:**
- `hora_fim`: 2026-02-06T17:00:00Z
- `assinatura`: (arquivo imagem)

---

### 📊 Dashboard Financeiro

#### Obter Métricas

```http
GET /financeiro/dashboard
Authorization: Bearer {token}
```

**Permissões:** GESTOR, ADMIN

**Query Parameters:**
- `periodo`: dia | semana | mes | ano
- `id_obra` (optional): filtrar por obra

**Response 200:**
```json
{
  "periodo": {
    "inicio": "2026-02-01",
    "fim": "2026-02-06"
  },
  "metricas": {
    "obras_ativas": 12,
    "total_medicoes": 345,
    "custo_total": 125000.00,
    "receita_total": 175000.00,
    "lucro_bruto": 50000.00,
    "margem_percentual": 40.00
  },
  "por_obra": [
    {
      "obra_id": "uuid",
      "obra_nome": "Edifício Primavera",
      "custo": 35000.00,
      "receita": 49000.00,
      "lucro": 14000.00,
      "margem": 40.00
    }
  ]
}
```

---

## 📋 Códigos de Status HTTP

| Código | Significado |
|--------|-------------|
| 200 | OK - Requisição bem-sucedida |
| 201 | Created - Recurso criado com sucesso |
| 204 | No Content - Sucesso sem corpo de resposta |
| 400 | Bad Request - Dados inválidos |
| 401 | Unauthorized - Não autenticado |
| 403 | Forbidden - Sem permissão |
| 404 | Not Found - Recurso não encontrado |
| 409 | Conflict - Conflito (ex: duplicação) |
| 422 | Unprocessable Entity - Validação falhou |
| 429 | Too Many Requests - Rate limit excedido |
| 500 | Internal Server Error - Erro do servidor |

---

## ⚠️ Tratamento de Erros

**Formato de Erro Padrão:**

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email must be valid"
    }
  ],
  "timestamp": "2026-02-06T10:30:00Z",
  "path": "/api/v1/usuarios"
}
```

---

## 🔒 Rate Limiting

- **Limite:** 100 requisições por minuto por IP
- **Header de Resposta:**
  - `X-RateLimit-Limit`: Limite total
  - `X-RateLimit-Remaining`: Requisições restantes
  - `X-RateLimit-Reset`: Timestamp de reset

---

## 📖 Documentação Interativa

**Swagger UI:** http://localhost:3000/api/docs

Acesse para testar todos os endpoints diretamente no navegador.

---
## 📊 Relatórios e Dashboards

### Dashboard Financeiro

```http
GET /relatorios/dashboard-financeiro
Authorization: Bearer {token}
```

**Permissões:** GESTOR, FINANCEIRO, ADMIN

**Query Parameters:**
- `periodo` (optional): DIA | SEMANA | MES | ANO (default: MES)
- `id_obra` (optional): filtrar por obra específica

**Response 200:**
```json
{
  "periodo": {
    "tipo": "mes",
    "inicio": "2026-02-01",
    "fim": "2026-02-28"
  },
  "metricas": {
    "obras_ativas": 5,
    "total_medicoes": 150,
    "custo_total": 15000.50,
    "receita_total": 22500.75,
    "lucro_bruto": 7500.25,
    "margem_percentual": 33.33
  },
  "por_obra": [
    {
      "obra_id": "uuid",
      "obra_nome": "Edifício Primavera",
      "custo": 3000.00,
      "receita": 4500.00,
      "lucro": 1500.00,
      "margem": 33.33,
      "medicoes": 30
    }
  ]
}
```

---

### Relatório de Medições

```http
GET /relatorios/medicoes
Authorization: Bearer {token}
```

**Permissões:** GESTOR, FINANCEIRO, ENCARREGADO, ADMIN

**Query Parameters:**
- `id_obra` (optional): filtrar por obra
- `status_pagamento` (optional): ABERTO | PAGO | PROCESSANDO
- `page` (optional): página (default: 1)
- `limit` (optional): itens por página (default: 20)

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "data": "2026-02-07",
      "obra": "Edifício Primavera",
      "colaborador": "João Silva",
      "servico": "Pintura Parede",
      "quantidade": 25.50,
      "status": "ABERTO",
      "excedente": false
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 350,
    "pages": 18
  }
}
```

---

### Relatório de Produtividade

```http
GET /relatorios/produtividade
Authorization: Bearer {token}
```

**Permissões:** GESTOR, ENCARREGADO, ADMIN

**Query Parameters:**
- `periodo` (optional): DIA | SEMANA | MES | ANO (default: MES)
- `id_obra` (optional): filtrar por obra específica

**Response 200:**
```json
{
  "periodo": {
    "tipo": "mes",
    "inicio": "2026-02-01",
    "fim": "2026-02-28"
  },
  "colaboradores": [
    {
      "colaborador_id": "uuid",
      "colaborador_nome": "João Silva",
      "total_medicoes": 45,
      "total_unidades": 567.50,
      "obras": ["Edifício Primavera", "Casa Vila"],
      "media_por_medicao": 12.61
    }
  ],
  "total_colaboradores": 8,
  "unidades_totais": 4250.75
}
```

---

### Relatório de Margem de Lucro

```http
GET /relatorios/margem-lucro
Authorization: Bearer {token}
```

**Permissões:** GESTOR, FINANCEIRO, ADMIN

**Query Parameters:**
- `id_obra` (optional): filtrar por obra
- `page` (optional): página (default: 1)
- `limit` (optional): itens por página (default: 20)

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "obra": "Edifício Primavera",
      "servico": "Pintura Parede",
      "preco_custo": 50.00,
      "preco_venda": 75.00,
      "margem_percentual": 50.00,
      "status": "APROVADO",
      "vezes_utilizado": 125,
      "atende_minimo": true
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "pages": 8,
    "margem_media": 32.45
  }
}
```

---
## 🧪 Exemplos de Uso

### cURL

```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"senha123"}'

# Dashboard Financeiro
curl -X GET "http://localhost:3000/api/v1/relatorios/dashboard-financeiro?periodo=mes" \
  -H "Authorization: Bearer {token}"

# Relatório de Medições
curl -X GET "http://localhost:3000/api/v1/relatorios/medicoes?page=1&limit=20" \
  -H "Authorization: Bearer {token}"

# Relatório de Produtividade
curl -X GET "http://localhost:3000/api/v1/relatorios/produtividade?periodo=semana" \
  -H "Authorization: Bearer {token}"

# Relatório de Margem de Lucro
curl -X GET "http://localhost:3000/api/v1/relatorios/margem-lucro?id_obra={obraId}" \
  -H "Authorization: Bearer {token}"

# Listar obras (com token)
curl -X GET http://localhost:3000/api/v1/obras \
  -H "Authorization: Bearer {token}"
```

### JavaScript (Axios)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Dashboard Financeiro
const dashboard = await api.get('/relatorios/dashboard-financeiro', {
  params: {
    periodo: 'mes',
    id_obra: 'uuid' // opcional
  }
});
console.log('Metricas:', dashboard.data.metricas);

// Relatório de Medições
const medicoes = await api.get('/relatorios/medicoes', {
  params: {
    page: 1,
    limit: 20,
    id_obra: 'uuid' // opcional
  }
});
console.log('Medições:', medicoes.data.data);

// Relatório de Produtividade
const produtividade = await api.get('/relatorios/produtividade', {
  params: {
    periodo: 'semana',
    id_obra: 'uuid' // opcional
  }
});
console.log('Colaboradores:', produtividade.data.colaboradores);

// Relatório de Margem de Lucro
const margem = await api.get('/relatorios/margem-lucro', {
  params: {
    page: 1,
    limit: 20,
    id_obra: 'uuid' // opcional
  }
});
console.log('Preços:', margem.data.data);
console.log('Margem Média:', margem.data.meta.margem_media);

// Listar obras
const obras = await api.get('/obras');
console.log(obras.data);
```

---

**Última Atualização:** 07/02/2026  
**Versão da API:** v1
