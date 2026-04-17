# 🚀 SETUP FRONTEND DASHBOARD - GUIA RÁPIDO

## ✅ Checklist Pré-Requisitos

1. **Backend rodando** em `http://localhost:3000`
2. **Banco de dados** com dados de seed
3. **CORS configurado** para aceitar `http://localhost:5173`

---

## 📋 Passo a Passo

### 1️⃣ Configurar CORS no Backend

Edite o arquivo `backend/.env` e atualize:

```env
CORS_ORIGIN=http://localhost:5173,http://localhost:3001,http://localhost:19006
```

### 2️⃣ Instalar Dependências do Frontend

```powershell
cd frontend
npm install
```

### 3️⃣ Configurar Environment Variables

O arquivo `frontend/.env` já está criado com:
```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_ENV=development
```

### 4️⃣ Iniciar Backend (Terminal 1)

```powershell
cd backend
npm run start:dev
```

Aguarde até ver:
```
[Nest] Application successfully started on port 3000
```

### 5️⃣ Iniciar Frontend (Terminal 2)

```powershell
cd frontend
npm run dev
```

Aguarde até ver:
```
VITE ready in XXX ms
➜  Local:   http://localhost:5173/
```

### 6️⃣ Abrir Browser

Acesse: **http://localhost:5173**

---

## 🔑 Fazer Login

Na tela de login, use as credenciais de seed:

- **Email**: `admin@example.com`
- **Senha**: `senha123`

> 💡 **Dica**: As credenciais aparecem na tela de login como hint!

---

## ✨ Testar o Dashboard

Após login bem-sucedido, você será redirecionado para `/dashboard`.

### Features para Testar:

1. **KPIs Principais** (4 cards no topo):
   - ✅ Obras Ativas
   - ✅ Total de Medições
   - ✅ Valor Total (formatado em R$)
   - ✅ Margem Média (com indicador visual)

2. **Filtro de Período**:
   - Clique no chip "Este Mês"
   - Selecione: Hoje / Esta Semana / Este Mês / Este Ano
   - Dashboard recarrega automaticamente

3. **Botão Refresh**:
   - Clique no ícone de refresh (⟳) no topo direito
   - Dashboard recarrega dados da API

4. **Detalhes por Obra**:
   - Seção expandida no final da página
   - Cards coloridos por obra
   - Color-coding da margem:
     - 🟢 Verde: Margem >= 20%
     - 🟡 Amarelo: Margem >= 10%
     - 🔴 Vermelho: Margem < 10%

---

## 🐛 Troubleshooting

### Erro: "Erro de conexão com o servidor"

**Causa**: Backend não está rodando ou URL incorreta

**Solução**:
```powershell
# Verificar se backend está rodando
cd backend
npm run start:dev

# Verificar URL no frontend/.env
VITE_API_URL=http://localhost:3000/api/v1
```

### Erro: "CORS policy: No 'Access-Control-Allow-Origin'"

**Causa**: Backend não está permitindo origem do frontend

**Solução**:
```env
# backend/.env
CORS_ORIGIN=http://localhost:5173,http://localhost:3001,http://localhost:19006
```

Reinicie o backend após alterar.

### Erro: "401 Unauthorized" no Dashboard

**Causa**: Token expirado ou inválido

**Solução**:
1. Abrir DevTools (F12)
2. Console → `localStorage.clear()`
3. Refresh da página (F5)
4. Fazer login novamente

### Dashboard mostra "0" em todas as métricas

**Causa**: Banco de dados sem dados de seed

**Solução**:
```powershell
cd backend
npm run seed
```

### Login não funciona

**Causa**: Endpoint `/auth/login` não está respondendo

**Verificações**:
1. Backend rodando em `http://localhost:3000`
2. Verificar logs do backend no terminal
3. Testar endpoint direto no browser/Postman:
   ```http
   POST http://localhost:3000/api/v1/auth/login
   Content-Type: application/json

   {
     "email": "admin@example.com",
     "password": "senha123"
   }
   ```

---

## 🔍 Verificar Integração

### DevTools Console (F12)

Se tudo estiver funcionando, você NÃO deve ver:
- ❌ Erros de CORS
- ❌ Erros 401/403
- ❌ Network errors

Você DEVE ver:
- ✅ `GET http://localhost:3000/api/v1/relatorios/dashboard-financeiro?periodo=mes` → Status 200
- ✅ Token JWT no localStorage (Application → Local Storage)

### Network Tab (F12)

1. Fazer login
   ```
   POST /api/v1/auth/login → 201 Created
   Response: { user, access_token }
   ```

2. Dashboard carrega
   ```
   GET /api/v1/relatorios/dashboard-financeiro?periodo=mes → 200 OK
   Headers: Authorization: Bearer eyJhbGc...
   ```

---

## 📊 Dados de Teste

Se você executou o seed, deve ter aproximadamente:

- **3 Obras** ativas
- **15-20 Medições** no total
- **Margens** variando entre 15-25%
- **Valores** entre R$ 50.000 - R$ 200.000

---

## ✅ Checklist de Sucesso

- [ ] Backend rodando sem erros
- [ ] Frontend rodando em localhost:5173
- [ ] Login funciona e redireciona para dashboard
- [ ] Token JWT salvo no localStorage
- [ ] Dashboard carrega dados reais (não 12, 45, 128, 28%)
- [ ] Filtro de período funciona
- [ ] Botão refresh funciona
- [ ] Detalhes por obra aparecem
- [ ] Cores da margem corretas
- [ ] Sem erros no Console (F12)

---

## 🎉 Próximos Passos

Após confirmar que o dashboard funciona:

1. Implementar outras páginas (Obras, Clientes, etc.)
2. Adicionar mais relatórios
3. Implementar CRUD operations
4. Adicionar testes E2E

---

## 📞 Comandos Úteis

```powershell
# Backend
cd backend
npm run start:dev        # Dev mode
npm run build            # Build
npm run test:e2e        # Testes E2E
npm run seed            # Popular BD

# Frontend
cd frontend
npm run dev             # Dev server
npm run build           # Build produção
npm run preview         # Preview build
npm run lint            # Lint

# Docker (alternativa)
docker-compose up       # Subir tudo
```

---

## 🔗 URLs Úteis

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api/v1
- Swagger Docs: http://localhost:3000/api-docs
- Dashboard Endpoint: http://localhost:3000/api/v1/relatorios/dashboard-financeiro

---

**Data de Atualização**: 07/02/2026  
**Versão**: 1.0
