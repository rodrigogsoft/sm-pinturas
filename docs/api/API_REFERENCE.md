# API Reference - JB Pinturas ERP

## 📚 Visão Geral

Base URL: `http://localhost:3000/api/v1`

Todas as rotas (exceto login/register) requerem autenticação via Bearer Token.

## 🔐 Autenticação

### POST /auth/login
Login no sistema

**Body:**
```json
{
  "email": "admin@jbpinturas.com.br",
  "password": "Admin@2026"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "nome_completo": "Administrador",
    "email": "admin@jbpinturas.com.br",
    "id_perfil": 1
  }
}
```

### POST /auth/refresh
Renovar token expirado

**Headers:** `Authorization: Bearer {refresh_token}`

### POST /auth/logout
Logout e invalidação de token

---

## 👥 Usuários

### GET /usuarios
Lista todos os usuários

**Query Params:**
- `ativo` (boolean): Filtrar por status

**Permissions:** ADMIN, GESTOR

### POST /usuarios
Criar novo usuário

**Body:**
```json
{
  "nome_completo": "João Silva",
  "email": "joao@jbpinturas.com.br",
  "senha": "Senha@123",
  "id_perfil": 4,
  "id_criado_por": "uuid"
}
```

**Permissions:** ADMIN

### GET /usuarios/:id
Buscar usuário por ID

### PATCH /usuarios/:id
Atualizar usuário

### DELETE /usuarios/:id
Deletar usuário (soft delete)

**Permissions:** ADMIN

---

## 🏢 Clientes

### GET /clientes
Lista todos os clientes

### POST /clientes
Criar novo cliente

**Body:**
```json
{
  "razao_social": "Construtora ABC LTDA",
  "cnpj_nif": "12.345.678/0001-99",
  "email": "contato@abc.com.br",
  "telefone": "(11) 98765-4321",
  "endereco": "Rua Exemplo, 123",
  "dia_corte": 15
}
```

**Permissions:** ADMIN, FINANCEIRO

### GET /clientes/:id
Buscar cliente por ID

### PATCH /clientes/:id
Atualizar cliente

### DELETE /clientes/:id
Deletar cliente

---

## 👷 Colaboradores

### GET /colaboradores
Lista todos os colaboradores

### POST /colaboradores
Criar novo colaborador

**Body:**
```json
{
  "nome_completo": "Maria Santos",
  "cpf_nif": "111.111.111-11",
  "telefone": "(11) 91111-1111",
  "email": "maria@example.com",
  "data_nascimento": "1990-05-15"
}
```

**Permissions:** ADMIN, ENCARREGADO

---

## 🏗️ Obras

### GET /obras
Lista todas as obras

**Query Params:**
- `status`: PLANEJAMENTO | ATIVA | SUSPENSA | CONCLUIDA
- `id_cliente`: uuid

### POST /obras
Criar nova obra com hierarquia completa

**Body:**
```json
{
  "nome": "Edifício Residencial XYZ",
  "endereco_completo": "Av. Exemplo, 1000",
  "status": "PLANEJAMENTO",
  "data_inicio": "2026-02-01",
  "data_previsao_fim": "2026-12-31",
  "id_cliente": "uuid",
  "pavimentos": [
    {
      "nome": "Térreo",
      "ordem": 0,
      "ambientes": [
        {
          "nome": "Hall de Entrada",
          "area_m2": 30.5
        }
      ]
    }
  ]
}
```

**Permissions:** ADMIN, ENCARREGADO

### GET /obras/:id
Buscar obra completa (com pavimentos e ambientes)

### PATCH /obras/:id
Atualizar obra

---

## 💰 Preços

### GET /precos
Lista tabela de preços

**Query Params:**
- `id_obra`: uuid
- `status_aprovacao`: PENDENTE | APROVADO | REJEITADO

### POST /precos
Criar preço (RF04 - Dual: Custo/Venda)

**Body:**
```json
{
  "id_obra": "uuid",
  "id_servico_catalogo": 1,
  "preco_custo": 18.00,
  "preco_venda": 25.00
}
```

**Permissions:** ADMIN, FINANCEIRO

**Observação:** Preço fica com status PENDENTE, aguardando aprovação do Gestor.

### POST /precos/:id/aprovar
Aprovar preço de venda (RF04 - Gestor valida margem)

**Body:**
```json
{
  "id_aprovado_por": "uuid"
}
```

**Permissions:** ADMIN, GESTOR

### POST /precos/:id/rejeitar
Rejeitar preço de venda

---

## 📝 Sessões (RDO Digital)

### POST /sessoes
Abrir nova sessão diária (RF06)

**Body:**
```json
{
  "id_encarregado": "uuid",
  "id_obra": "uuid",
  "data_sessao": "2026-02-07",
  "hora_inicio": "2026-02-07T08:00:00Z",
  "geo_lat": -23.550520,
  "geo_long": -46.633308,
  "assinatura_url": "https://s3.../assinatura.png"
}
```

**Permissions:** ADMIN, ENCARREGADO

**Validação:** 
- Não permite abrir duas sessões para o mesmo encarregado na mesma data
- Assinatura digital é obrigatória na abertura da sessão

### GET /sessoes/aberta/:id_encarregado
Buscar sessão aberta do encarregado

### POST /sessoes/:id/encerrar
Encerrar sessão (Fechar RDO)

**Body:**
```json
{
  "hora_fim": "2026-02-07T18:00:00Z",
  "assinatura_url": "https://s3.../assinatura.png",
  "observacoes": "Trabalho concluído conforme planejado"
}
```

**Nota:** A assinatura é opcional no encerramento, pois já foi coletada na abertura da sessão. Pode ser fornecida novamente para atualização se necessário.

### GET /sessoes/:id/duracao
Calcular duração da sessão em horas

---

## 🎯 Alocações (Controle 1:1)

### POST /alocacoes
Alocar colaborador em ambiente (RF07)

**Body:**
```json
{
  "id_sessao": "uuid",
  "id_ambiente": "uuid",
  "id_colaborador": "uuid",
  "id_servico_catalogo": 1,
  "hora_inicio": "2026-02-07T08:30:00Z"
}
```

**Permissions:** ADMIN, ENCARREGADO

**Validação:** 
- ✅ Ambiente só pode ter 1 colaborador ativo (status = EM_ANDAMENTO)
- ✅ Colaborador não pode estar em 2 ambientes simultaneamente

**Error Response (409):**
```json
{
  "message": "Ambiente em uso por João Silva. Encerre a tarefa anterior primeiro.",
  "codigo": "AMBIENTE_OCUPADO",
  "colaborador_atual": {
    "id": "uuid",
    "nome": "João Silva"
  }
}
```

### GET /alocacoes/ativas
Listar todas as alocações em andamento

### GET /alocacoes/ambiente/:id_ambiente/verificar
Verificar se ambiente está ocupado (usado pela UI mobile)

**Response:**
```json
{
  "ocupado": true,
  "alocacao": {
    "id": "uuid",
    "colaborador": {
      "nome": "João Silva"
    }
  }
}
```

### POST /alocacoes/:id/concluir
Finalizar alocação

**Body:**
```json
{
  "hora_fim": "2026-02-07T12:00:00Z",
  "observacoes": "Finalizado conforme solicitado"
}
```

### POST /alocacoes/:id/pausar
Pausar alocação temporariamente

### POST /alocacoes/:id/retomar
Retomar alocação pausada

---

## 📊 Medições

### POST /medicoes
Criar medição (RF08 - Validação de Excedentes)

**Body:**
```json
{
  "id_alocacao": "uuid",
  "qtd_executada": 25.5,
  "area_planejada": 20.0,
  "data_medicao": "2026-02-07",
  "justificativa": "Encontrada área adicional não mapeada",
  "foto_evidencia_url": "https://s3.../evidencia.jpg"
}
```

**Permissions:** ADMIN, ENCARREGADO

**Validação RF08:**
- Se `qtd_executada > area_planejada`:
  - ✅ `justificativa` é **obrigatória**
  - ✅ `foto_evidencia_url` é **obrigatória**
  - ✅ `flag_excedente` automaticamente = true

**Error Response (400):**
```json
{
  "message": "Justificativa obrigatória para medição excedente",
  "codigo": "EXCEDENTE_SEM_JUSTIFICATIVA",
  "qtd_executada": 25.5,
  "area_planejada": 20.0,
  "excedente": 5.5
}
```

### GET /medicoes
Listar medições

**Query Params:**
- `status_pagamento`: ABERTO | LOTE_CRIADO | PAGO
- `flag_excedente`: true | false
- `data_inicio`, `data_fim`: YYYY-MM-DD

### GET /medicoes/excedentes
Listar apenas medições excedentes

**Permissions:** ADMIN, GESTOR

### GET /medicoes/pendentes-pagamento
Listar medições com status ABERTO

**Permissions:** ADMIN, GESTOR, FINANCEIRO

### GET /medicoes/relatorio/producao
Relatório de produtividade por colaborador

**Query Params:** `data_inicio`, `data_fim` (obrigatórios)

**Response:**
```json
[
  {
    "id": "uuid",
    "nome": "João Silva",
    "total_executado": 150.5,
    "total_medicoes": 12,
    "excedentes": 2
  }
]
```

---

## 💵 Financeiro

### POST /financeiro/lotes
Criar lote de pagamento

**Body:**
```json
{
  "descricao": "Pagamento Quinzenal - Fev/2026",
  "data_competencia": "2026-02-15",
  "medicoes_ids": ["uuid1", "uuid2", "uuid3"],
  "id_criado_por": "uuid"
}
```

**Permissions:** ADMIN, FINANCEIRO

**Validação:**
- ✅ Medições devem estar com status = ABERTO
- ✅ Após criação, medições ficam = LOTE_CRIADO

### GET /financeiro/lotes
Listar lotes

**Query Params:**
- `status`: RASCUNHO | AGUARDANDO_APROVACAO | APROVADO | PAGO | CANCELADO

### GET /financeiro/lotes/:id/medicoes
Listar medições do lote

### POST /financeiro/lotes/:id/enviar-aprovacao
Enviar lote para aprovação do Gestor

**Permissions:** ADMIN, FINANCEIRO

### POST /financeiro/lotes/:id/aprovar
Gestor aprova lote (RF04)

**Body:**
```json
{
  "id_aprovado_por": "uuid"
}
```

**Permissions:** ADMIN, GESTOR

### POST /financeiro/lotes/:id/processar-pagamento
Financeiro processa pagamento

**Body:**
```json
{
  "data_pagamento": "2026-02-07",
  "tipo_pagamento": "PIX",
  "id_processado_por": "uuid"
}
```

**Permissions:** ADMIN, FINANCEIRO

**Validação:** Lote deve estar com status = APROVADO

### GET /financeiro/dashboard
Dashboard financeiro

**Response:**
```json
{
  "total_lotes": 10,
  "total_pago": 45000.00,
  "total_pendente": 15000.00,
  "por_status": {
    "rascunho": 1,
    "aguardando_aprovacao": 2,
    "aprovado": 1,
    "pago": 5,
    "cancelado": 1
  }
}
```

---

## 🔔 Notificações

### GET /notificacoes/usuario/:id_usuario
Listar notificações do usuário

**Query Params:**
- `lida`: true | false
- `tipo`: MEDICAO_PENDENTE | CICLO_FATURAMENTO | LOTE_APROVACAO | etc.
- `prioridade`: BAIXA | MEDIA | ALTA | CRITICA

### GET /notificacoes/usuario/:id_usuario/nao-lidas/count
Contar notificações não lidas

**Response:**
```json
{
  "count": 5
}
```

### POST /notificacoes/:id/marcar-lida
Marcar notificação como lida

### POST /notificacoes/usuario/:id_usuario/marcar-todas-lidas
Marcar todas como lidas

---

## 📋 Auditoria

### GET /auditoria/logs
Listar logs de auditoria

**Query Params:**
- `id_usuario`: uuid
- `tabela_afetada`: tb_usuarios | tb_obras | etc.
- `acao`: INSERT | UPDATE | DELETE | APPROVE | REJECT | LOGIN | EXPORT
- `data_inicio`, `data_fim`: YYYY-MM-DD

**Permissions:** ADMIN, GESTOR

**Observação:** Limitado a 1000 registros por consulta

### GET /auditoria/historico/:tabela/:id_registro
Histórico completo de um registro

**Exemplo:**
```
GET /auditoria/historico/tb_tabela_precos/uuid-do-preco
```

**Response:** Lista cronológica de todas as alterações no registro

### GET /auditoria/usuario/:id_usuario/atividade
Análise de atividade do usuário

**Permissions:** ADMIN

### GET /auditoria/relatorios/acoes-criticas
Relatório de aprovações e rejeições

**Query Params:** `data_inicio`, `data_fim` (obrigatórios)

### GET /auditoria/estatisticas
Estatísticas de auditoria

**Response:**
```json
{
  "total_logs": 5420,
  "por_acao": {
    "INSERT": 2000,
    "UPDATE": 1500,
    "APPROVE": 200,
    "DELETE": 50
  },
  "por_tabela": {
    "tb_medicoes": 1200,
    "tb_alocacoes_tarefa": 800
  },
  "top_usuarios": [
    {
      "id_usuario": "uuid",
      "count": 450
    }
  ]
}
```

---

## 📖 Swagger UI

Documentação interativa completa disponível em:

**URL:** `http://localhost:3000/api/docs`

Inclui:
- 📝 Todos os endpoints
- 🔍 Schemas de request/response
- 🧪 Interface para testar APIs
- 🔐 Autenticação integrada
