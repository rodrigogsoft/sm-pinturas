# 🧪 Plano de Testes End-to-End - JB Pinturas

Data: 7 de Fevereiro de 2026

## 📋 Pré-requisitos

- Docker Desktop: **ATIVO**
- PostgreSQL: 5432
- Redis: 6379
- Backend: http://localhost:3000/api/v1
- Frontend: http://localhost:5173
- API Docs: http://localhost:3000/api/docs

## 1️⃣ TESTES DE AUTENTICAÇÃO

### 1.1 Login com Credenciais Válidas
```bash
POST /auth/login
Body: {
  "email": "admin@jbpinturas.com",
  "senha": "senha123"
}
Expected: 200 OK
Response: { token: "jwt...", usuario: {...} }
```
- ✅ Retorna JWT token
- ✅ Token válido para requisições subsequentes
- ✅ Token armazenado em localStorage (frontend)
- ✅ Token persiste em AsyncStorage (mobile)

### 1.2 Login com Credenciais Inválidas
```bash
POST /auth/login
Body: {
  "email": "admin@jbpinturas.com",
  "senha": "wrongpassword"
}
Expected: 401 Unauthorized
```
- ✅ Retorna erro 401
- ✅ Nenhum token armazenado
- ✅ Mensagem de erro clara

### 1.3 Logout
```bash
POST /auth/logout
Headers: Authorization: Bearer <token>
Expected: 200 OK
```
- ✅ Token é invalidado
- ✅ Próximas requisições com token retornam 401
- ✅ localStorage/AsyncStorage limpos

### 1.4 Auto Login com Token Válido
- ✅ App reload mantém autenticação
- ✅ Dashboard carrega diretamente (não volta para login)

### 1.5 Auto Logout em 401
- ✅ Token expirado → redireciona para login
- ✅ Token inválido → redireciona para login

## 2️⃣ TESTES DE OBRAS (CRUD)

### 2.1 Listar Obras
```bash
GET /obras?page=1&limit=50&status=em_progresso
Expected: 200 OK
Response: {
  data: [
    { id_obra, nome, endereco, status, valor_contrato, area_total, ... }
  ],
  total: 15,
  page: 1,
  limit: 50
}
```
- ✅ Retorna paginação corretamente
- ✅ Filtro por status funciona
- ✅ Dados aparecem em frontend DataGrid
- ✅ Refresh atualiza lista

### 2.2 Criar Obra
```bash
POST /obras
Body: {
  "nome": "Pintura Residencial 2026",
  "endereco": "Rua Teste, 123",
  "data_inicio": "2026-02-07",
  "data_previsao_termino": "2026-03-07",
  "status": "planejada",
  "valor_contrato": 50000,
  "area_total": 500
}
Expected: 201 Created
```
- ✅ Nova obra aparece na lista
- ✅ ID gerado corretamente
- ✅ Timestamps criados
- ✅ Dialog do frontend fecha após sucesso
- ✅ Toast notification exibida

### 2.3 Editar Obra
```bash
PATCH /obras/{id}
Body: { "status": "em_progresso", "area_total": 550 }
Expected: 200 OK
```
- ✅ Dados atualizados no banco
- ✅ Lista reflete mudanças
- ✅ Dialog fecha automaticamente

### 2.4 Deletar Obra
```bash
DELETE /obras/{id}
Expected: 200 OK
```
- ✅ Obra removida do banco
- ✅ Lista atualiza
- ✅ Confirmação antes de deletar (frontend)

## 3️⃣ TESTES DE CLIENTES (CRUD)

### 3.1 Listar Clientes
```bash
GET /clientes?page=1&limit=50
Expected: 200 OK com array de clientes
```
- ✅ DataGrid mostra todos
- ✅ Paginação funciona
- ✅ Refresh atualiza

### 3.2 Criar Cliente
- ✅ Email validado (único)
- ✅ Telefone em formato correto
- ✅ Dia do mês válido (1-28/29/30/31)
- ✅ Novo cliente aparece na lista

### 3.3 Editar Cliente
- ✅ Todos os campos atualizáveis
- ✅ Validações mantidas

### 3.4 Deletar Cliente
- ✅ Com confirmação
- ✅ Remove da lista

## 4️⃣ TESTES DE COLABORADORES (CRUD + Toggle)

### 4.1 Listar Colaboradores
```bash
GET /colaboradores?page=1&limit=50&ativo=true
Expected: 200 OK com colaboradores ativos
```
- ✅ Mostra apenas ativos por padrão
- ✅ Toggle visível para status

### 4.2 Criar Colaborador
- ✅ Nome, função, telefone, status
- ✅ Valida telefone
- ✅ Status padrão: ativo

### 4.3 Editar Colaborador Ativo ↔ Inativo
- ✅ Toggle switch na tabela
- ✅ PATCH imediato ao clicar
- ✅ Cor do chip muda (verde/cinza)
- ✅ Colaboradores inativos não aparecem em dropdowns de RDO

### 4.4 Deletar Colaborador
- ✅ Com confirmação
- ✅ Não pode deletar com RDOs associadas (validação)

## 5️⃣ TESTES DE RELATÓRIOS

### 5.1 Relatório de Medições
```bash
GET /relatorios/medicoes?page=1&limit=10&status_pagamento=PENDENTE
```
- ✅ Filtra por status de pagamento
- ✅ DataGrid com 7 colunas corretas
- ✅ CSV export funciona
- ✅ Paginação funciona

### 5.2 Relatório de Produtividade
```bash
GET /relatorios/produtividade?periodo=mes
```
- ✅ Período seletor funciona (dia/semana/mês/ano)
- ✅ Refetch automático ao mudar período
- ✅ Cálculo horas/m² correto
- ✅ Color coding: verde (<0.5), amarelo (<1.0), vermelho (>=1.0)
- ✅ CSV export com período no nome

### 5.3 Relatório de Margem de Lucro
```bash
GET /relatorios/margem-lucro?page=1&limit=10
```
- ✅ 4 KPI cards com totais corretos
- ✅ DataGrid mostra margem de lucro
- ✅ Chips color-coded por percentual
- ✅ CSV export funciona

### 5.4 Dashboard Financeiro
- ✅ 3 cards de navegação ligam para relatórios
- ✅ Hover effect funciona
- ✅ Ícones corretos e coloridos

## 6️⃣ TESTES DE NAVEGAÇÃO & UI

### 6.1 Frontend Geral
- ✅ Layout geral carrega sem erros
- ✅ Aside menu navegável
- ✅ Todas as rotas acessam sem 404
- ✅ Responsividade (desktop/tablet/mobile)
- ✅ Dark mode (se implementado)

### 6.2 DataGrids
- ✅ Paginação funciona
- ✅ Sorting funciona
- ✅ Resize colunas funciona
- ✅ Scroll horizontal OK

### 6.3 Dialogs
- ✅ Abrem ao clicar
- ✅ Carregam dados pré-existentes (edit)
- ✅ Validação antes de salvar
- ✅ Erro message exibida se falhar
- ✅ Fecham ao salvar ou cancelar

## 7️⃣ TESTES DE PERFORMANCE & ERROS

### 7.1 Carregamento
- ✅ Primeira carga: < 3 segundos
- ✅ Navegação entre páginas: < 500ms
- ✅ Busca/filtro: < 1 segundo

### 7.2 Tratamento de Erros
- ✅ Backend indisponível: erro amigável
- ✅ Validação de campos: mensagens claras
- ✅ Timeout de requisição: retry automático
- ✅ Network error: toast com "Erro de conexão"

### 7.3 Concorrência
- ✅ Dois usuários criando obra: não gera duplicação
- ✅ Editar e deletar simultâneos: último ganha (ou erro)

## 8️⃣ TESTES MOBILE (quando houver internet)

### 8.1 Autenticação Mobile
```bash
POST /auth/login (do app mobile)
```
- ✅ JWT armazenado em AsyncStorage
- ✅ Token persiste ao reabrir app

### 8.2 Sincronização Offline → Online
- ✅ RDO criado offline (status: rascunho)
- ✅ App fica offline (flight modo)
- ✅ Novo RDO: salvo localmente
- ✅ App online novamente
- ✅ Botão "Sincronizar" ativo
- ✅ Clica sincronizar → POST /medicoes/batch
- ✅ Status muda para "sincronizado"
- ✅ ID backend recebido

### 8.3 Captura de Foto
- ✅ Camera/Image picker abre
- ✅ Foto armazenada como base64 no RDO
- ✅ Preview exibido no form

### 8.4 Assinatura Digital
- ✅ SignatureCanvas abre
- ✅ Desenho capturado
- ✅ PNG gerado corretamente

### 8.5 Localização GPS
- ✅ Geolocation solicita permissão
- ✅ Coordenadas capturadas
- ✅ Armazenadas no RDO

## 🎯 Critérios de Sucesso

✅ **Todos os testes passam sem erros críticos**
✅ **Frontend compila sem warnings**
✅ **API responde em < 200ms (p99)**
✅ **Nenhuma perda de dados**
✅ **Sincronização offline funciona**
✅ **Permissões solicitadas (mobile)**
✅ **Logs claros de sucesso/erro**

## 📊 Matriz de Cobertura

| Feature | Unit | Integration | E2E |
|---------|------|-------------|-----|
| Auth | ✅ | ✅ | ✅ |
| Obras CRUD | ✅ | ✅ | ✅ |
| Clientes CRUD | ✅ | ✅ | ✅ |
| Colaboradores CRUD | ✅ | ✅ | ✅ |
| Relatórios | ✅ | ✅ | ✅ |
| Mobile Sync | ✅ | ✅ | ⏳ |
| GPS | ⏳ | ⏳ | ⏳ |
| Fotos | ⏳ | ⏳ | ⏳ |

## 📝 Comandos para Executar Testes

```bash
# Backend: Testes unitários
cd backend
npm run test

# Backend: E2E (requer Docker)
npm run test:e2e

# Frontend: Testes
cd frontend
npm run test

# Lint
npm run lint

# Build prod
npm run build

# Cypress E2E (futuro)
npm run e2e
```

## 🐛 Issues Conhecidas (se houver)

- [ ] Issue 1: Descrição
- [ ] Issue 2: Descrição

## ✅ Checklist Final

Antes de deploy para produção:

- [ ] Todos os testes passam
- [ ] Frontend build sem warnings
- [ ] Backend logs clean
- [ ] Database migrations aplicadas
- [ ] Redis conectado
- [ ] Variáveis de ambiente configuradas
- [ ] SSL/TLS configurado
- [ ] CORS configurado corretamente
- [ ] Rate limiting ativo
- [ ] Logs de auditoria configurados
- [ ] Backup database rotina
- [ ] Monitoramento ativo (APM)
