# 📊 ANÁLISE DE GAPS: Backend vs Frontend

**Gerado em:** 09/02/2026  
**Objetivo:** Identificar todos os módulos backend que ainda NÃO têm telas/componentes correspondentes no frontend

---

## 📋 MAPEAMENTO COMPLETO

### ✅ MÓDULOS COM BACKEND E FRONTEND EXISTENTES

| # | Módulo | Backend Controller | Backend Service | Frontend Page | Frontend Componentes | Status |
|----|--------|-------------------|-----------------|----------------|--------------------|--------|
| 1 | **auth** | ✅ auth.controller.ts | ✅ auth.service.ts | ✅ Auth/LoginPage | ✅ Form | 🟡 Parcial |
| 2 | **usuarios** | ✅ usuarios.controller.ts | ✅ usuarios.service.ts | ✅ Usuarios/UsuariosPage | ✅ CRUD Form | 🟡 Parcial |
| 3 | **obras** | ✅ obras.controller.ts | ✅ obras.service.ts | ✅ Obras/ObrasPage | ✅ CRUD Form | 🟡 Básico |
| 4 | **colaboradores** | ✅ colaboradores.controller.ts | ✅ colaboradores.service.ts | ✅ Colaboradores/ColaboradoresPage | ✅ CRUD Form | 🟡 Básico |
| 5 | **clientes** | ✅ clientes.controller.ts | ✅ clientes.service.ts | ✅ Clientes/ClientesPage | ✅ CRUD Form | 🟡 Básico |
| 6 | **servicos** | ✅ servicos.controller.ts | ✅ servicos.service.ts | ✅ Servicos/ServicosPage | ✅ CRUD Form | 🟡 Básico |
| 7 | **auditoria** | ✅ auditoria.controller.ts | ✅ auditoria.service.ts | ✅ Auditoria/AuditoriaPage | ✅ Tabela | 🟢 Completo |
| 8 | **financeiro** | ✅ financeiro.controller.ts | ✅ financeiro.service.ts | ✅ Financeiro/FinanceiroPage | ✅ Dashboard | 🟡 Básico |

---

### 🔴 MÓDULOS COM BACKEND MAS SEM FRONTEND

| # | Módulo | Backend Controller | Backend Service | Frontend Page | Impacto | Prioridade |
|----|---------|--------------------|-----------------|-----------|---------|-----------|
| 9 | **pavimentos** | ✅ pavimentos.controller.ts | ✅ pavimentos.service.ts | ❌ NENHUMA | Alto | 🔴 P1 |
| 10 | **ambientes** | ✅ ambientes.controller.ts | ✅ ambientes.service.ts | ❌ NENHUMA | Alto | 🔴 P1 |
| 11 | **itens-ambiente** | ✅ itens-ambiente.controller.ts | ✅ itens-ambiente.service.ts | ❌ NENHUMA | Alto | 🔴 P1 |
| 12 | **alocacoes** | ✅ alocacoes.controller.ts | ✅ alocacoes.service.ts | ❌ NENHUMA | Alto | 🔴 P1 |
| 13 | **medicoes** | ✅ medicoes.controller.ts | ✅ medicoes.service.ts | ❌ NENHUMA | Alto | 🔴 P1 |
| 14 | **precos** | ✅ precos.controller.ts | ✅ precos.service.ts | ❌ NENHUMA | Crítico | 🔴 P0 |
| 15 | **notificacoes** | ✅ notificacoes.controller.ts | ✅ notificacoes.service.ts | ❌ NENHUMA | Médio | 🟡 P2 |
| 16 | **relatorios** | ✅ relatorios.controller.ts | ✅ relatorios.service.ts | ❌ NENHUMA | Médio | 🟡 P2 |
| 17 | **sessoes** | ✅ sessoes.controller.ts | ✅ sessoes.service.ts | ❌ NENHUMA | Baixo | 🟢 P3 |

---

## 🔍 DETALHAMENTO POR MÓDULO

### 🔴 CRÍTICO - PREÇOS (P0)

**Backend:**
```
✅ precos.controller.ts
   - POST /precos (criar)
   - GET /precos (listar)
   - GET /precos/:id
   - PATCH /precos/:id
   - DELETE /precos/:id

✅ precos.service.ts
   - CRUD completo
   - Integração com ItemAmbiente
   - Criptografia AES-256 (RN01)
```

**Frontend:**
- ❌ NÃO EXISTE página de preços
- ❌ NÃO EXISTE formulário de preço
- ❌ NÃO EXISTE tabela de preços
- ❌ NÃO EXISTE validação de margem (RF04)

**Impacto:**
- RF04 - Fluxo de Preço com Margem está 100% bloqueado sem UI
- RN01 - Cegueira Financeira não pode ser testada
- Encarregado não pode ver preços

**Estimativa:** 6-8 horas

---

### 🔴 ALTO - HIERARQUIA DE ATIVOS (P1)

#### **9. PAVIMENTOS**

**Backend:**
```
✅ pavimentos.controller.ts (completo)
✅ pavimentos.service.ts (completo)
```

**Frontend:**
- ❌ NENHUMA tela
- ❌ NENHUM componente
- ❌ Não há modo de criar/editar pavimentos

**Impacto:** RF02 incompleto

**Estimativa:** 3-4 horas

---

#### **10. AMBIENTES**

**Backend:**
```
✅ ambientes.controller.ts (completo)
✅ ambientes.service.ts (completo)
```

**Frontend:**
- ❌ NENHUMA tela
- ❌ NENHUM componente
- ❌ Não há modo de criar/editar ambientes

**Impacto:** RF02 incompleto, RF07 (bloqueio) não pode ser implementado sem UI de ambientes

**Estimativa:** 3-4 horas

---

#### **11. ITENS-AMBIENTE**

**Backend:**
```
✅ itens-ambiente.controller.ts (completo)
✅ itens-ambiente.service.ts (completo)
   - Relaciona Ambiente + TabelaPreco + Area
   - Validações de FK
```

**Frontend:**
- ❌ NENHUMA tela
- ❌ Não há modal para adicionar itens a um ambiente
- ❌ Não há visualização de itens por ambiente

**Impacto:** Não é possível cadastrar que um ambiente tem um determinado serviço

**Estimativa:** 4-6 horas

---

### 🔴 ALTO - ALOCAÇÕES E MEDIÇÕES (P1)

#### **12. ALOCAÇÕES**

**Backend:**
```
✅ alocacoes.controller.ts (completo)
✅ alocacoes.service.ts (completo RN02, RN03)
   - Validação de agenda
   - Bloqueio se preço não APROVADO
   - Validação 1:1 (ambiente = 1 colaborador)
```

**Frontend:**
- ❌ NENHUMA tela
- ❌ NENHUM componente de alocação
- ❌ RF07 (UI com Toast/Shake) não pode ser implementado
- ❌ Encarregado não consegue alocar colaboradores

**Impacto:** 
- RF07 bloqueado
- RN03 (unicidade) não é validada na UI
- Operação core do sistema sem interface

**Estimativa:** 8-10 horas (drag-drop + validação + toast)

---

#### **13. MEDIÇÕES**

**Backend:**
```
✅ medicoes.controller.ts (completo)
✅ medicoes.service.ts (completo RN02, RF08)
   - Validação de travamento (RN02)
   - Detecção de excedentes (RF08)
   - Cálculo de percentual
```

**Frontend:**
- ❌ NENHUMA tela
- ❌ Não há formulário de medição
- ❌ RF08 (Excedentes) não pode ter UI visual
- ❌ Encarregado não consegue registrar medições

**Impacto:**
- RF08 (Excedentes) sem feedback visual
- Ciclo core de operação sem UI
- Produção não consegue ser registrada

**Estimativa:** 6-8 horas

---

### 🟡 MÉDIO - NOTIFICAÇÕES E RELATÓRIOS (P2)

#### **14. NOTIFICAÇÕES**

**Backend:**
```
✅ notificacoes.controller.ts (completo)
✅ notificacoes.service.ts (implementado)
   - Criação de notificações
   - Marca como lida
   - Listar por usuário
```

**Frontend:**
- ❌ NENHUMA tela
- ❌ NENHUM componente de notificação
- ❌ Não há badge com contador
- ❌ Não há drawer/modal de notificações
- ❌ RF09 (Alertas Operacionais) sem UI

**Impacto:**
- RF09 sem visual
- Usuário não vê qualquer alerta
- Sistema não comunica eventos

**Estimativa:** 4-6 horas (badge + drawer + service)

---

#### **15. RELATÓRIOS**

**Backend:**
```
✅ relatorios.controller.ts
✅ relatorios.service.ts
   - Geração de relatórios
   - Exportação PDF
   - Agregação de dados
```

**Frontend:**
- ❌ NENHUMA tela específica de relatórios
- ❌ Não há dashboard consolidado
- ❌ Não há gráficos/charts
- ❌ RF10 (Alertas Financeiros) sem visualização

**Impacto:**
- RF10 sem UI
- Gestor não consegue análises
- Sem visibilidade financeira

**Estimativa:** 8-12 horas (charts + dashboard + filtros)

---

### 🟢 BAIXO - SESSIONS (P3)

#### **16. SESSÕES**

**Backend:**
```
✅ sessoes.controller.ts
✅ sessoes.service.ts
   - Gerenciamento de sessões ativas
   - Logout
   - Tracking de login/logout
```

**Frontend:**
- ❌ Página não é crítica
- ℹ️ Pode ser integrada no painel de usuários

**Impacto:** Baixo - é interno/administrativo

**Estimativa:** 1-2 horas (integração em Usuarios page)

---

## 📊 RESUMO GERAL

| Categoria | Módulos | Status |
|-----------|---------|--------|
| Com Backend + Frontend | 8 | 🟡 Existem mas precisam melhorias |
| Com Backend SEM Frontend | 9 | 🔴 BLOQUEADOR CRÍTICO |
| **Total Módulos** | **17** | **~53% incompleto** |

---

## 🎯 PLANO DE AÇÃO (Prioridade)

### **P0 - CRÍTICO (Dia 1 - 6-8h)**
```
[1] Frontend: Tela de PREÇOS (precos/PrecoPage)
    ├─ Listar preços por item
    ├─ Criar/editar com validação de margem
    ├─ Status: RASCUNHO → PENDENTE → APROVADO
    └─ Integrar com backend /api/v1/precos

[2] Frontend: Tela de ITENS-AMBIENTE (itens-ambiente/ItensAmbientePage)
    ├─ Form para adicionar serviço a um ambiente
    ├─ Listar + editar + deletar
    └─ Integrar ambiente com preço
```

### **P1 - ALTO (Dia 2-3 - 16-20h)**
```
[3] Frontend: Tela de HIERARQUIA (Pavimentos + Ambientes)
    ├─ Tree view: Obra > Pavimento > Ambiente
    ├─ CRUD pavimentos
    ├─ CRUD ambientes
    └─ Drag-reorder pavimentos

[4] Frontend: Tela de ALOCAÇÕES (RF07 com Toast/Shake)
    ├─ Drag-drop colaborador para ambiente
    ├─ Validação RN03 (1:1)
    ├─ Toast de erro/sucesso
    ├─ Shake animation se ocupado
    └─ Desabilitar drop se ambiente tem ativo

[5] Frontend: Tela de MEDIÇÕES (RF08 com Excedentes)
    ├─ Form de medição por alocação
    ├─ Cálculo %executado
    ├─ Toast se excedente
    ├─ Campo justificativa obrigatório se > planejado
    └─ Upload foto de evidência
```

### **P2 - MÉDIO (Dia 4 - 10-14h)**
```
[6] Frontend: Tela de NOTIFICAÇÕES
    ├─ Badge de contador
    ├─ Drawer/Modal
    ├─ Listar notificações ordenadas
    ├─ Marcar como lida
    └─ Integrar webhook/websocket para real-time

[7] Frontend: DASHBOARD com RELATÓRIOS
    ├─ Charts de receita/custo por obra
    ├─ KPI: Margem, Taxa de Conclusão
    ├─ Filtros: Período, Obra, Cliente
    └─ Export PDF
```

### **P3 - COMPLEMENTAR (Dia 5+ - 5-8h)**
```
[8] Frontend: Integração de SESSÕES
    ├─ Painel de sessões ativas
    ├─ Logout remoto
    └─ Histórico de login/logout
```

---

## 💻 Estrutura de Pastas Frontend Necessária

```
src/pages/
├── Precos/
│   ├── index.ts
│   ├── PrecoPage.tsx
│   ├── components/
│   │   ├── PrecoForm.tsx
│   │   ├── PrecoTable.tsx
│   │   └── PrecoApprovalModal.tsx
│   └── hooks/
│       └── usePrecos.ts

├── Pavimentos/
│   ├── index.ts
│   ├── PavimentosPage.tsx
│   ├── components/
│   │   ├── PavimentoForm.tsx
│   │   ├── PavimentoTree.tsx
│   │   └── AmbienteForm.tsx
│   └── hooks/
│       └── usePavimentos.ts

├── ItensAmbiente/
│   ├── index.ts
│   ├── ItensAmbientePage.tsx
│   ├── components/
│   │   ├── ItemAmbienteForm.tsx
│   │   └── ItemAmbienteTable.tsx
│   └── hooks/
│       └── useItensAmbiente.ts

├── Alocacoes/
│   ├── index.ts
│   ├── AlocacoesPage.tsx
│   ├── components/
│   │   ├── DragDropBoard.tsx
│   │   ├── AlocacaoCard.tsx
│   │   └── AlocacaoForm.tsx
│   └── hooks/
│       └── useAlocacoes.ts

├── Medicoes/
│   ├── index.ts
│   ├── MedicoesPage.tsx
│   ├── components/
│   │   ├── MedicaoForm.tsx
│   │   ├── ExcedentesAlert.tsx
│   │   └── MedicaoList.tsx
│   └── hooks/
│       └── useMedicoes.ts

├── Notificacoes/
│   ├── index.ts
│   ├── NotificacoesPage.tsx
│   ├── components/
│   │   ├── NotificacoesBadge.tsx
│   │   ├── NotificacoesDrawer.tsx
│   │   └── NotificacaoItem.tsx
│   └── hooks/
│       └── useNotificacoes.ts

├── Relatorios/
│   ├── index.ts
│   ├── RelatoriosPage.tsx
│   ├── components/
│   │   ├── DashboardCharts.tsx
│   │   ├── KPICards.tsx
│   │   └── DataExport.tsx
│   └── hooks/
│       └── useRelatorios.ts

└── Sessoes/
    ├── index.ts
    ├── SessoesPage.tsx (integrado em Usuarios)
    └── components/
        └── SessoesTable.tsx
```

---

## 📈 Estimativa Total

| Prioridade | Módulos | Horas | Dias |
|----------|---------|-------|------|
| **P0** | 2 (Preços, Itens) | 10-12h | 1-1.5d |
| **P1** | 3 (Hierarquia, Alocações, Medições) | 20-24h | 2-3d |
| **P2** | 2 (Notificações, Relatórios) | 12-16h | 1.5-2d |
| **P3** | 1 (Sessões) | 2-3h | <1d |
| **TOTAL** | **8 módulos** | **44-55h** | **5-7 dias** |

---

**Status:** 🔴 **53% incompleto** - Sem as telas frontend, os requisitos RF02, RF04, RF07, RF08, RF09, RF10 estão 100% bloqueados.

**Recomendação:** Comece por P0 (Preços) pois desbloqueia RF04 e valida criptografia AES-256.
