# Postman Collection - JB Pinturas API

Collection completa com **32 endpoints** documentados e prontos para testes.

## Como usar

### 1. Importar no Postman
- Abra **Postman** (ou online em postman.com)
- Clique em **"Import"**
- Selecione os arquivos:
  - `JB_Pinturas_API.postman_collection.json`
  - `JB_Pinturas_Local.postman_environment.json`

### 2. Configurar Ambiente
- Abra **Environments** (lado esquerdo)
- Selecione **JB Pinturas Local**
- Certifique-se de que `baseUrl = http://localhost:3001`

### 3. Testar Endpoints
- **Auth → Login** — Obtém token JWT (salvo automaticamente em `authToken`)
- Todos os outros endpoints usam o token automaticamente via `{{authToken}}`

## Estrutura de Endpoints

### Auth (2)
- `POST /auth/register` — Registra novo admin
- `POST /auth/login` — Faz login e obtém JWT

### Users (10)
- `POST /users` — Criar usuário (admin)
- `GET /users` — Listar com paginação/filtros
- `GET /users/:id` — Obter por ID
- `GET /users/profile` — Perfil do usuário logado
- `GET /users/role/:role` — Filtrar por role
- `GET /users/active` — Apenas ativos
- `PATCH /users/profile` — Atualizar próprio perfil
- `PATCH /users/:id` — Atualizar por ID (admin)
- `PATCH /users/:id/status/:status` — Alterar status
- `DELETE /users/:id` — Soft delete

### Clients (7)
- `POST /clients` — Criar cliente
- `GET /clients` — Listar com paginação/search
- `GET /clients/:id` — Obter por ID
- `GET /clients/active` — Clientes ativos
- `GET /clients/inactive` — Clientes inativos
- `PATCH /clients/:id` — Atualizar cliente
- `DELETE /clients/:id` — Soft delete

### Works (8)
- `POST /works` — Criar obra
- `GET /works` — Listar com status/clientId filters
- `GET /works/:id` — Obter por ID
- `GET /works/status/:status` — Filtrar por status
- `GET /works/client/:clientId` — Obras de um cliente
- `PATCH /works/:id` — Atualizar obra
- `PATCH /works/:id/status/:status` — Alterar status (define `actualEndDate` se completed)
- `DELETE /works/:id` — Soft delete

### Collaborators (5)
- `POST /collaborators` — Criar colaborador
- `GET /collaborators` — Listar com paginação/search
- `GET /collaborators/:id` — Obter por ID
- `GET /collaborators/status/:status` — Filtrar por status
- `PATCH /collaborators/:id` — Atualizar colaborador
- `DELETE /collaborators/:id` — Soft delete

## Fluxo Recomendado de Testes

1. **Auth → Register Admin** (ou use Login se admin já existe)
2. **Auth → Login** — Copie o token automaticamente
3. **Clients → Create Client** — Crie um cliente de teste
4. **Works → Create Work** — Crie uma obra para o cliente
5. **Collaborators → Create Collaborator** — Crie um colaborador
6. **Works → Update Work Status** — Mude status para `completed`
7. **Users → List Users** — Veja todos os usuários

## Dicas

- Todos os UUIDs nos exemplos são placeholders; substitua pelos reais após criar recursos.
- Variáveis de ambiente (e.g., `{{baseUrl}}`, `{{authToken}}`) são ajustadas automaticamente.
- Status válidos para Works: `planning`, `in_progress`, `paused`, `completed`, `cancelled`
- Status válidos para Users: `active`, `inactive`, `suspended`

## Notas

- Coloque o backend rodando em `http://localhost:3001` antes de usar
- Se mudar para staging/produção, atualize `baseUrl` no ambiente
- Crie novos ambientes para produção se necessário
