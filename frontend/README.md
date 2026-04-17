# Frontend - JB Pinturas ERP

## 🚀 Início Rápido

### 1. Instalar dependências
```bash
cd frontend
npm install
```

### 2. Configurar ambiente
```bash
# Copiar .env.example para .env
copy .env.example .env  # Windows
cp .env.example .env    # Linux/Mac
```

### 3. Iniciar servidor de desenvolvimento
```bash
npm run dev
```

O frontend estará disponível em: http://localhost:5173

## 🔑 Login

Use as credenciais de seed do backend:

- **Email**: admin@example.com
- **Senha**: senha123

## 📦 Tecnologias

- **React 18** - Framework UI
- **TypeScript** - Type safety
- **Material UI v5** - Componentes
- **Redux Toolkit** - Estado global
- **React Router v6** - Navegação
- **Axios** - Cliente HTTP
- **Vite** - Build tool

## 📁 Estrutura

```
src/
├── components/          # Componentes reutilizáveis
│   ├── Layout.tsx      # AppBar + Drawer
│   └── ProtectedRoute.tsx  # Guard de autenticação
├── pages/              # Páginas da aplicação
│   ├── Auth/
│   │   └── LoginPage.tsx   # ✅ Login com API
│   ├── Dashboard/
│   │   └── DashboardPage.tsx  # ✅ Dashboard com dados reais
│   ├── Obras/
│   ├── Clientes/
│   └── ...
├── services/           # Chamadas à API
│   └── api.ts         # ✅ Axios config + endpoints
├── store/             # Redux
│   ├── index.ts
│   └── slices/
│       ├── authSlice.ts   # ✅ Autenticação
│       └── ...
├── types/             # TypeScript types
│   └── relatorios.ts  # ✅ Tipos do Dashboard
└── App.tsx            # Rotas principais
```

## 🔌 Integração com Backend

### API Service Layer

O arquivo `src/services/api.ts` centraliza todas as chamadas à API:

```typescript
import { authAPI, relatoriosAPI, obrasAPI } from './services/api';

// Login
const response = await authAPI.login(email, password);

// Dashboard
const dashboard = await relatoriosAPI.getDashboardFinanceiro({ periodo: 'mes' });
```

### Interceptors

**Request Interceptor**: Adiciona automaticamente o token JWT em todas as requisições
**Response Interceptor**: 
- Trata erros 401 (logout automático)
- Trata erros de rede
- Retorna mensagens padronizadas

### Environment Variables

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_ENV=development
```

## ✅ Features Implementadas

### 1. Autenticação (LoginPage)
- ✅ Form com email e senha
- ✅ Integração com `/auth/login`
- ✅ Salvamento de token no localStorage
- ✅ Dispatch para Redux store
- ✅ Redirect para dashboard após login
- ✅ Loading state e error handling
- ✅ Dica de credenciais na tela

### 2. Dashboard (DashboardPage)
- ✅ Fetch de dados reais de `/relatorios/dashboard-financeiro`
- ✅ 4 KPI cards:
  - Obras Ativas
  - Total de Medições
  - Valor Total (formatado em BRL)
  - Margem Média (com indicador visual)
- ✅ Filtro por período (Dia, Semana, Mês, Ano)
- ✅ Botão de refresh
- ✅ Loading state (CircularProgress)
- ✅ Error handling (Alert)
- ✅ Seção "Detalhes por Obra"
- ✅ Color-coding de margem:
  - Verde: >= 20%
  - Amarelo: >= 10%
  - Vermelho: < 10%

### 3. Redux Store
- ✅ authSlice com User, Token, isAuthenticated
- ✅ Persistência de token no localStorage
- ✅ Actions: setUser, logout, setLoading

### 4. Protected Routes
- ✅ Guard verificando autenticação
- ✅ Redirect para /login se não autenticado
- ✅ Loading state durante verificação

## 🧪 Como Testar

### 1. Backend rodando
```bash
cd backend
npm run start:dev
```

### 2. Frontend rodando
```bash
cd frontend
npm run dev
```

### 3. Teste o fluxo
1. Acesse http://localhost:5173
2. Faça login com `admin@example.com` / `senha123`
3. Veja o dashboard carregando dados reais
4. Teste os filtros de período
5. Teste o botão de refresh
6. Logout e teste redirect para /login

## 🐛 Troubleshooting

### CORS Error
Se vir erro de CORS, verifique que o backend tem:
```typescript
// main.ts
app.enableCors({
  origin: 'http://localhost:5173',
  credentials: true,
});
```

### 401 Unauthorized
- Verifique se o token está sendo salvo no localStorage
- Verifique se o interceptor está anexando o header Authorization
- Verifique validade do token no backend

### Dashboard vazio
- Verifique se há dados de seed no banco
- Execute `npm run seed` no backend
- Verifique logs do console.error()

## 📝 Próximos Passos

- [ ] Implementar páginas de Obras
- [ ] Implementar páginas de Clientes
- [ ] Implementar páginas de Colaboradores
- [ ] Implementar páginas de Serviços
- [ ] Implementar páginas de Relatórios
- [ ] Implementar Auditoria
- [ ] Implementar Usuários
- [ ] Adicionar testes unitários
- [ ] Adicionar testes E2E

## 🔐 Perfis de Usuário

```typescript
enum PerfilEnum {
  ADMIN = 1,      // Acesso total
  GESTOR = 2,     // Gestão de obras
  FINANCEIRO = 3, // Financeiro
  ENCARREGADO = 4 // RDO mobile
}
```
