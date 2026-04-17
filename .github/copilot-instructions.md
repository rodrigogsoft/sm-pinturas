# Instruções do Projeto — SM Pinturas

## Idioma

Sempre responder em **português brasileiro**. Comentários no código também em português.

## Arquitetura

Monorepo com três aplicações:

- `backend/` — API REST: NestJS 10, TypeORM 0.3, PostgreSQL, Redis, BullMQ
- `frontend/` — Painel web: React 18, Vite, Material UI 5, Redux Toolkit, Axios
- `mobile/` — App de campo: React Native 0.74, Expo

## Backend

### Estrutura de módulos

Cada módulo fica em `backend/src/modules/{modulo}/` com os arquivos:
`controller`, `service`, `module`, `entities/`, `dto/`.

### Convenções obrigatórias

- Toda rota protegida usa `JwtAuthGuard` + `RolesGuard` com `@Roles(PerfilEnum.X)`.
- `PerfilEnum` vive em `backend/src/common/enums/index.ts`.
- `ValidationPipe` global com `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.
- Soft delete universal: coluna `deletado: boolean` — nunca `DELETE` físico.
- UUID como PK em todas as tabelas (exceto `tb_servicos_catalogo` que usa `serial int`).
- `DATABASE_SYNCHRONIZE=false` — **sempre usar migrations**, nunca synchronize em produção.
- Migrations em `backend/database/migrations/` como arquivos `.sql`.
- Parâmetros no QueryBuilder sempre parametrizados: `.andWhere('tabela.campo = :val', { val })` — nunca interpolação direta.

### RBAC — Perfis

| Perfil | Acesso |
|--------|--------|
| `ADMIN` | Tudo |
| `GESTOR` | Aprova preços, valida medições |
| `FINANCEIRO` | Clientes, preços, pagamentos |
| `ENCARREGADO` | Campo — **não vê `preco_venda`** |

## Frontend

- Axios centralizado em `frontend/src/services/api.ts` — interceptors adicionam JWT e tratam 401 com refresh.
- Estado global via Redux Toolkit: `authSlice`, `obrasSlice`, `clientesSlice`, `colaboradoresSlice`, `uiSlice`.
- Todas as rotas autenticadas passam por `ProtectedRoute`.
- Alto contraste via `useHighContrastTheme()` aplicado no `Layout`.

## Convenções gerais

- `PeriodoEnum` usa valores minúsculos: `dia`, `semana`, `mes`, `ano`.
- Colunas `GENERATED ALWAYS AS STORED` não devem ser adicionadas às entidades TypeORM sem a coluna existir no banco.
- Nunca usar `git push --force` nas branches `homol` e `producao`.

## Fluxo de branches

```
feature/* → main → homol → producao
```

## Design System — Frontend

### Paleta de cores

| Token | Hex | Uso |
|-------|-----|-----|
| Primária | `#0D1B8C` | Cabeçalhos, botões principais, links |
| Secundária | `#4A6CF7` | Hover, elementos interativos, alertas suaves |
| Background | `#FFFFFF` | Fundo e cards |
| Surface | `#F2F2F2` | Seções secundárias, background de painel |
| Text | `#333333` | Textos, legendas, ícones |
| Success | `#34C759` | Indicadores positivos |
| Error | `#FF3B30` | Erros e alertas críticos |
| Warning | `#FFD60A` | Notificações, status intermediário |

> Evitar cores muito saturadas que conflitem com o azul da logo.

### Tema Material UI (`frontend/src/theme.ts`)

```ts
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary:    { main: '#0D1B8C', contrastText: '#FFFFFF' },
    secondary:  { main: '#4A6CF7', contrastText: '#FFFFFF' },
    error:      { main: '#FF3B30' },
    warning:    { main: '#FFD60A' },
    success:    { main: '#34C759' },
    background: { default: '#FFFFFF', paper: '#F2F2F2' },
    text:       { primary: '#333333', secondary: '#666666' },
  },
  typography: {
    fontFamily: 'Inter, Roboto, sans-serif',
  },
});

export default theme;
```

### Convenções de UX

- **Menu lateral**: azul escuro (`#0D1B8C`); página ativa destacada com `#4A6CF7`.
- **Breadcrumbs**: obrigatório nas páginas de hierarquia `Obras → Pavimentos → Ambientes`.
- **Cards de dashboard**: fundo branco, `box-shadow: 0 2px 6px rgba(0,0,0,0.1)`, bordas arredondadas.
- **Botões primários**: `#0D1B8C` com hover `#4A6CF7`; botões de exclusão em `#FF3B30`.
- **Tipografia**: hierarquia clara — `h1/h2/h3` para títulos de página, labels menores em formulários.
- **Acessibilidade**: contraste mínimo WCAG 4.5:1; garantir compatibilidade da paleta com `AccessibilityModeToggle` (modo alto contraste).
- **Toasts**: fundo neutro com ícones coloridos de status (verde / vermelho / amarelo).
- **Formulários**: feedback visual explícito em campos obrigatórios e estados de erro.

## Comandos principais

```bash
# Backend
cd backend && npm run start:dev        # dev (porta 3006)
cd backend && npm run test:e2e         # 58 testes E2E
cd backend && npm run migration:run    # aplica migrations

# Frontend
cd frontend && npm run dev             # dev (porta 3001)

# Mobile
cd mobile && npm run start             # Metro bundler
```
