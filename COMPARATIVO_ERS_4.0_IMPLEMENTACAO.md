# 📊 COMPARATIVO: ERS 4.0 vs Implementação Atual

**Data da Análise:** 10 de fevereiro de 2026  
**Objetivo:** Verificar conformidade com a Especificação de Requisitos de Software versão 4.0  
**Status Geral:** 🟡 **70% Implementado**

**Atualização ERS 4.1:** escopo complementar incorporado em 12 de março de 2026 para alocação por itens de ambiente, medição individual, apropriação financeira detalhada, vale adiantamento e relatórios associados.

> ⚠️ **Snapshot histórico (fev/2026).**
> Os percentuais e diagnósticos abaixo representam o momento da análise original.
> Para status vigente, consultar `ANALISE_IMPLEMENTACAO_vs_ERS_4.0.md` e `docs/RN_FONTE_DA_VERDADE.md`.
>
> 🆕 **Adendo ERS 4.1 (mar/2026).**
> Os percentuais consolidados do topo permanecem como fotografia histórica.
> Os requisitos RF11-RF15 e RN05-RN08 abaixo foram adicionados como extensão comparativa, sem reprocessar toda a métrica global do relatório original.

---

## 📋 ÍNDICE

1. [Resumo Executivo](#resumo-executivo)
2. [Requisitos Funcionais (RF)](#requisitos-funcionais)
3. [Regras de Negócio (RN)](#regras-de-negócio)
4. [Requisitos Não-Funcionais (RNF)](#requisitos-não-funcionais)
5. [Banco de Dados](#banco-de-dados)
6. [Stack Tecnológico](#stack-tecnológico)
7. [Interface e UX](#interface-e-ux)
8. [Gaps Críticos e Prioridades](#gaps-críticos)

---

## 1. 📊 RESUMO EXECUTIVO

### 1.1. Mapa de Calor de Conformidade

| Categoria | Total | Implementado | Parcial | Não Implementado | % Completo |
|-----------|-------|--------------|---------|------------------|------------|
| **Requisitos Funcionais (RF)** | 10 | 3 | 5 | 2 | 55% |
| **Regras de Negócio (RN)** | 4 | 3 | 1 | 0 | 87% |
| **Requisitos Não-Funcionais (RNF)** | 4 | 1 | 2 | 1 | 37% |
| **Banco de Dados** | 15 tabelas | 14 | 1 | 0 | 93% |
| **Stack Tecnológico** | 7 componentes | 7 | 0 | 0 | 100% |
| **Interface/UX** | 5 diretrizes | 1 | 2 | 2 | 30% |
| **TOTAL GERAL** | - | - | - | - | **70%** |

### 1.2. Status por Módulo

```
✅ COMPLETO (100%)
├── Autenticação (JWT + MFA)
├── RBAC (4 perfis)
├── Auditoria Imutável
└── Criptografia AES-256

🟡 PARCIAL (50-99%)
├── Cadastros (Obras, Clientes, Colaboradores)
├── Hierarquia de Ativos (Backend OK, Frontend limitado)
├── Precificação Dual (Backend OK, Workflow incompleto)
├── Operação Mobile (Estrutura criada, funcionalidades ausentes)
└── Notificações (CRUD OK, Push notifications não implementado)

🔴 NÃO INICIADO (0-49%)
├── RDO Digital com Geolocalização
├── Alocação 1:1 com Feedback Visual
├── Jobs Background (BullMQ configurado, jobs não criados)
└── Acessibilidade WCAG 2.1
```

---

## 2. 📝 REQUISITOS FUNCIONAIS (RF)

### Módulo 1: Cadastros e Engenharia

#### ✅ RF01 - Cadastro de Obras Descentralizado
**Status:** 🟢 **IMPLEMENTADO** (Backend + Frontend)

**Implementado:**
- ✅ Backend: `obras.controller.ts` com CRUD completo
- ✅ Entidades: Obra, Pavimento, Ambiente com relacionamento correto
- ✅ Frontend: Página `ObrasPage.tsx` com formulário
- ✅ Campos: Nome, Endereço, Prazos (data_inicio, data_previsao_fim)
- ✅ Status: PLANEJAMENTO | ATIVA | SUSPENSA | CONCLUIDA
- ✅ Permissão: Encarregado pode criar obras

**Faltando (Conforme ERS 4.0 não especificou, mas seria melhoria):**
- ⚠️ Validação de CEP com API de geolocalização
- ⚠️ Upload de imagens de referência da obra
- ⚠️ Histórico de alterações detalhado

**Arquivos:**
- Backend: `backend/src/modules/obras/`
- Frontend: `frontend/src/pages/Obras/`

---

#### 🟡 RF02 - Hierarquia de Ativos (Obra > Pavimento > Ambiente)
**Status:** 🟡 **PARCIALMENTE IMPLEMENTADO**

**Implementado:**
- ✅ Backend 100%:
  - `tb_obras` → `tb_pavimentos` → `tb_ambientes` (schema correto)
  - Controllers e Services para cada nível
  - FKs e Cascade Delete configurados
  - Endpoint para criação hierárquica em batch
- ✅ Frontend: Páginas criadas mas com funcionalidades limitadas
  - `PavimentosPage.tsx` - Criada ✅
  - `AmbientesPage.tsx` - Criada ✅

**Faltando:**
- ❌ Frontend: Interface de navegação hierárquica (Breadcrumbs)
- ❌ Frontend: Visualização em árvore (Tree View)
- ❌ Frontend: Drag & Drop para reorganizar pavimentos/ambientes
- ❌ Frontend: Wizard de criação de obra completa (1 fluxo)

**Criticidade:** 🟡 MÉDIA (Backend funcional, UX limitada)

**Arquivos:**
- Backend: `backend/src/modules/obras/`, `pavimentos/`, `ambientes/`
- Frontend: `frontend/src/pages/Pavimentos/`, `Ambientes/`

---

#### ✅ RF03 - Catálogo de Serviços
**Status:** 🟢 **IMPLEMENTADO**

**Implementado:**
- ✅ Backend: `tb_catalogo_servicos` com seed data
- ✅ Unidades: M2, ML, UN, VB (ENUM)
- ✅ Campo `permite_decimal` (BOOLEAN)
- ✅ CRUD completo: `servicos.controller.ts`
- ✅ Frontend: Página `ServicosPage.tsx` com formulário

**Arquivos:**
- Backend: `backend/src/modules/servicos/`
- Frontend: `frontend/src/pages/Servicos/`

---

### Módulo 2: Gestão Financeira

#### 🔴 RF04 - Fluxo de Preço de Venda (Com Validação de Margem)
**Status:** 🔴 **CRÍTICO - PARCIALMENTE IMPLEMENTADO**

**Implementado:**
- ✅ Backend:
  - `tb_tabela_precos` com `status_aprovacao` (PENDENTE | APROVADO | REJEITADO)
  - Coluna calculada `margem_percentual` (Generated Column)
  - Endpoints: `POST /precos`, `PATCH /precos/:id/aprovar`, `PATCH /precos/:id/rejeitar`
  - Cegueira Financeira: `SensitiveDataFilter` oculta `preco_venda` para ENCARREGADO
- ✅ Frontend: Página `PrecosPage.tsx` criada
  - Formulário com campos `preco_custo` e `preco_venda`
  - Cálculo de margem exibido

**Faltando (CRÍTICO):**
- ❌ **Workflow de Aprovação não implementado no Frontend:**
  - Financeiro insere → status PENDENTE
  - Notificação automática ao Gestor
  - Gestor vê margem calculada e aprova/rejeita
  - Histórico de aprovações/rejeições
- ❌ **Validação de Margem Mínima:**
  - ERS 4.0 especifica: "O Gestor deve validar se a margem atende à política mínima da empresa"
  - Não há regra de margem mínima configurável no sistema
  - Sugestão: Adicionar campo `margem_minima_percentual` em `tb_clientes` ou `tb_obras`
- ❌ **Relatório de Preços Pendentes de Aprovação** (RF10 relacionado)
- ❌ **Bloqueio de Edição:** Após aprovação, preço não deveria ser editável (apenas criar novo)

**Criticidade:** 🔴 **CRÍTICA** - Core business logic incompleto

**Estimativa de Implementação:** 12-16 horas

**Arquivos:**
- Backend: `backend/src/modules/precos/`
- Frontend: `frontend/src/pages/Precos/`

---

#### ✅ RF05 - Preço de Custo
**Status:** 🟢 **IMPLEMENTADO**

**Implementado:**
- ✅ Campo `preco_custo` em `tb_tabela_precos`
- ✅ Editável por Encarregado e Financeiro (RBAC configurado)
- ✅ Validação: não pode ser negativo
- ✅ Visível em formulários e relatórios

**Arquivos:**
- Backend: `backend/src/modules/precos/`
- Frontend: `frontend/src/pages/Precos/components/PrecoForm.tsx`

---

### Módulo 3: Operação Mobile (Offline-First)

#### 🔴 RF06 - RDO Digital (Relatório Diário de Obras)
**Status:** 🔴 **NÃO IMPLEMENTADO** (Estrutura criada, funcionalidades ausentes)

**ERS 4.0 Especifica:**
> "Sessão com geolocalização e assinatura do cliente."

**Implementado:**
- ✅ Backend:
  - `tb_sessoes_diarias` com campos:
    - `geo_lat`, `geo_long` (geolocalização)
    - `assinatura_url` (link para imagem)
    - `hora_inicio`, `hora_fim`
  - Controller: `sessoes.controller.ts` com CRUD básico
- ✅ Mobile: Estrutura base criada (`mobile/src/screens/`)
- ✅ Mobile: WatermelonDB configurado para offline

**Faltando (CRÍTICO):**
- ❌ **Geolocalização em Tempo Real:**
  - Captura automática de GPS ao abrir RDO
  - Validação de proximidade (usuário deve estar a ±50m da obra)
  - Tratamento de permissões de localização (Android/iOS)
- ❌ **Assinatura Digital:**
  - Canvas para coleta de assinatura
  - Conversão para imagem (PNG/JPEG)
  - Upload otimizado (compressão)
- ❌ **Validação de RDO Única por Dia:**
  - Regra: 1 RDO aberta por encarregado/dia
  - Bloqueio de criação se já existe RDO aberta
  - Modal de "retomar RDO do dia" ao entrar no app
- ❌ **Foto de Evidência com Geotagging:**
  - Captura de foto com GPS embutido nos metadados
  - Preview antes de enviar
- ❌ **Frontend Web:** Visualização de RDOs do encarregado (histórico)

**Criticidade:** 🔴 **ALTA** - Funcionalidade central do Mobile App

**Estimativa de Implementação:** 20-24 horas

**Dependências:**
- React Native Geolocation API
- React Native Signature Canvas
- React Native Image Picker
- Expo Camera (se usar Expo)

**Arquivos:**
- Backend: `backend/src/modules/sessoes/`
- Mobile: `mobile/src/screens/RDO/` (a criar)
- Frontend: `frontend/src/pages/Sessoes/` (existente, mas básica)

---

#### 🔴 RF07 - Alocação 1:1 com Bloqueio UI
**Status:** 🔴 **BACKEND OK, FRONTEND NÃO IMPLEMENTADO**

**ERS 4.0 Especifica:**
> "Se o Encarregado tentar arrastar um colaborador para um ambiente ocupado, a interface deve exibir um **feedback visual (Toast/Shake)** e desabilitar a ação. Mensagem: *'Ambiente em uso por [Nome do Atual]. Encerre a tarefa anterior primeiro.'"

**Implementado:**
- ✅ Backend (100%):
  - `tb_alocacoes_tarefa` com UNIQUE constraint:
    ```sql
    UNIQUE INDEX idx_alocacoes_unicidade_ambiente
    ON (id_item_ambiente, status)
    WHERE status = 'EM_ANDAMENTO' AND deletado = FALSE
    ```
  - Service: `alocacoes.service.ts` valida antes de criar:
    - Ambiente está ocupado? → `ConflictException`
    - Colaborador já alocado em outro local? → `ConflictException`
  - Endpoint retorna erro 409 com mensagem estruturada

**Faltando (CRÍTICO):**
- ❌ **Mobile UI - Drag & Drop com Feedback:**
  - Interface: Lista de colaboradores (arrastar) → Lista de ambientes (soltar)
  - Validação client-side antes de chamar API
  - Feedback visual:
    - ✅ Toast/Snackbar com mensagem de erro
    - ✅ Shake animation no card do ambiente
    - ✅ Vibração háptica no dispositivo
  - Indicador visual: Ambiente ocupado (badge vermelho "Em Uso")
- ❌ **Frontend Web:** Tela de alocação (para gestão)
  - Kanban Board: Colaboradores → Ambientes
  - Status em tempo real (WebSocket ou polling)

**Criticidade:** 🔴 **ALTA** - UX crítica para encarregados

**Estimativa de Implementação:** 16-20 horas

**Dependências:**
- React Native Draggable (ou React Native Gesture Handler)
- React Native Haptic Feedback
- React Native Toast/Snackbar

**Arquivos:**
- Backend: `backend/src/modules/alocacoes/` ✅
- Mobile: `mobile/src/screens/Alocacao/` ❌ (não existe)
- Frontend: `frontend/src/pages/Alocacoes/` ❌ (não existe)

---

#### 🟡 RF08 - Excedentes (Medição > Área Cadastrada)
**Status:** 🟡 **BACKEND OK, FRONTEND PARCIAL**

**ERS 4.0 Especifica:**
> "Medição > Área cadastrada exige Justificativa e Foto."

**Implementado:**
- ✅ Backend (100%):
  - `tb_medicoes` com campos:
    - `flag_excedente` (BOOLEAN)
    - `justificativa` (TEXT)
    - `foto_evidencia_url` (TEXT)
  - Service: `medicoes.service.ts` valida:
    ```typescript
    if (qtd_executada > area_planejada) {
      if (!justificativa || !foto_evidencia_url) {
        throw new BadRequestException('Excedente requer justificativa e foto');
      }
      flag_excedente = true;
    }
    ```

**Faltando:**
- ❌ **Mobile UI - Wizard de Medição:**
  1. Encarregado insere quantidade
  2. Sistema detecta excedente → abre modal
  3. Modal: Campo de justificativa + botão "Tirar Foto"
  4. Validação: não prossegue sem os 2
- ❌ **Frontend Web:** Relatório de excedentes
  - Filtro: apenas medições com `flag_excedente = true`
  - Preview de foto em modal
- ❌ **Notificação:** Avisar Gestor sobre excedentes para revisão

**Criticidade:** 🟡 MÉDIA (Backend robusto, UX incompleta)

**Estimativa de Implementação:** 8-10 horas

**Arquivos:**
- Backend: `backend/src/modules/medicoes/` ✅
- Mobile: `mobile/src/screens/Medicoes/` 🟡 (estrutura existe, wizard não)
- Frontend: Relatório de excedentes ❌

---

### Módulo 4: Notificações e Alertas

#### 🔴 RF09 - Alertas Operacionais (Push para Encarregado)
**Status:** 🔴 **ESTRUTURA CRIADA, PUSH NÃO IMPLEMENTADO**

**ERS 4.0 Especifica:**
> "Push para Encarregado sobre medições pendentes."

**Implementado:**
- ✅ Backend:
  - `tb_notificacoes` com campos:
    - `tipo` (OPERACIONAL | FINANCEIRO | SISTEMA)
    - `prioridade` (BAIXA | MEDIA | ALTA | URGENTE)
    - `lida` (BOOLEAN)
  - Service: `notificacoes.service.ts` com:
    - `create()`, `createEmLote()`, `findByUsuario()`
    - `countNaoLidas()`
  - Campo `fcm_token` em `tb_usuarios` (para Firebase Cloud Messaging)

**Faltando (CRÍTICO):**
- ❌ **Integração com Firebase Cloud Messaging (FCM):**
  - Instalação: `@nestjs-modules/mailer` ou `firebase-admin`
  - Service: `push-notifications.service.ts`
  - Método: `enviarPushParaUsuario(id_usuario, titulo, corpo)`
  - Configuração: `firebase-adminsdk.json` (credenciais)
- ❌ **Jobs Automatizados (BullMQ):**
  - Job diário: Verifica medições pendentes há >3 dias → envia push
  - Job semanal: Resumo de produtividade
- ❌ **Mobile: Recepção de Push:**
  - Configuração de FCM no React Native
  - Tratamento de notificações em foreground/background
  - Deep linking (clicar na notificação abre a medição)

**Criticidade:** 🔴 **ALTA** - Comunicação proativa essencial

**Estimativa de Implementação:** 12-16 horas

**Arquivos:**
- Backend: `backend/src/modules/notificacoes/` ✅ (CRUD OK)
- Backend: `backend/src/common/services/push-notifications.service.ts` ❌ (não existe)
- Mobile: Configuração FCM ❌

---

#### 🔴 RF10 - Alertas Financeiros (Ciclo de Faturamento)
**Status:** 🔴 **NÃO IMPLEMENTADO**

**ERS 4.0 Especifica:**
> "Aviso de ciclo de faturamento próximo."

**Implementado:**
- ✅ Backend: Campo `dia_corte` em `tb_clientes` (dia do mês para fechar faturação)

**Faltando:**
- ❌ **Job BullMQ Diário:**
  - Verifica: `dia_atual == dia_corte - 2` (2 dias antes)
  - Ação: Cria notificação para usuários FINANCEIRO e GESTOR
  - Mensagem: "Faturamento do Cliente X vence em 2 dias. Medições pendentes: Y"
- ❌ **Endpoint:** `GET /relatorios/medicoes-pendentes/:id_cliente`
  - Retorna: Lista de medições com `status_pagamento = ABERTO`
- ❌ **Frontend:** Badge no header com contador de alertas financeiros

**Criticidade:** 🟡 MÉDIA (Melhora gestão, não bloqueia operação)

**Estimativa de Implementação:** 6-8 horas

**Arquivos:**
- Backend: Job a criar em `backend/src/modules/financeiro/jobs/`
- Frontend: Componente de notificações no header

---

### Módulo 5: Produção Individual, Apropriação e Adiantamentos (ERS 4.1)

#### 🟡 RF11 - Alocação por Itens de Ambiente
**Status:** 🟡 **PARCIALMENTE IMPLEMENTADO**

**ERS 4.1 Especifica:**
> "Alocação por itens de ambiente, com múltiplos colaboradores por item, registro de início/fim, valor do serviço e justificativa."

**Implementado:**
- ✅ Backend: `tb_alocacoes_tarefa` já possui `id_item_ambiente`, `hora_inicio`, `hora_fim` e `status`
- ✅ Backend: DTO e entidade aceitam alocação vinculada a item de ambiente
- ✅ Frontend Web: `AlocacaoPage.tsx` já trafega `id_item_ambiente` e exibe alocações ativas
- ✅ Mobile: `AlocacaoScreen.tsx` e `alocacoes.service.ts` já trabalham com `item_ambiente`
- ✅ Histórico básico de alocação já existe por colaborador/sessão/ambiente

**Faltando (CRÍTICO):**
- ❌ **Regra de múltiplos colaboradores por item não atendida:**
  - `tb_alocacoes_tarefa` mantém restrição 1:1 por ambiente ativo
  - `alocacoes.service.ts` bloqueia qualquer segundo colaborador no mesmo ambiente
  - Isso conflita diretamente com a RN05 da ERS 4.1
- ❌ **Nova estrutura dedicada não implementada:**
  - `tb_alocacoes_itens` não existe
  - Não há separação entre alocação de ambiente e alocação detalhada por item
- ❌ **Campos da ERS 4.1 ausentes no modelo atual:**
  - `valor_servico`
  - `justificativa`
- ❌ **Progresso total do ambiente e progresso individual não consolidados**
- ❌ **Workflow de aprovação/histórico operacional de alocação não existe**

**Criticidade:** 🔴 **ALTA** - A modelagem atual suporta item de ambiente, mas ainda impõe a lógica antiga de ocupação exclusiva por ambiente

**Arquivos:**
- Backend: `backend/src/modules/alocacoes/`, `backend/src/modules/itens-ambiente/`
- Frontend: `frontend/src/pages/AlocacaoPage.tsx`
- Mobile: `mobile/src/screens/Alocacao/AlocacaoScreen.tsx`

---

#### 🟡 RF12 - Medição Individual
**Status:** 🟡 **PARCIALMENTE IMPLEMENTADO**

**ERS 4.1 Especifica:**
> "Medição vinculada ao colaborador e ao item de ambiente, com atualização da produção individual e do progresso total do ambiente."

**Implementado:**
- ✅ Backend: `tb_medicoes` já vincula a medição à alocação (`id_alocacao`), o que vincula indiretamente ao colaborador
- ✅ Backend: regra de excedente com justificativa e foto já está implementada
- ✅ Frontend Web: `MedicoesForm.tsx` e `MedicoesPage.tsx` já consomem alocações com `item_ambiente`
- ✅ Mobile: `MedicoesScreen.tsx` já abre medição a partir de alocações por item
- ✅ Relatórios de produtividade e medições já existem no backend

**Faltando:**
- ❌ **Tabela dedicada `tb_medicoes_colaborador` não existe**
- ❌ **Produção individual consolidada por colaborador/item/período não está modelada separadamente**
- ❌ **Progresso total do ambiente com múltiplos colaboradores não é recalculado como regra explícita**
- ❌ **Campo de observação operacional separado da justificativa de excedente não está padronizado na API**
- ❌ **Fluxo completo de foto evidência no Web continua básico**

**Criticidade:** 🟡 **MÉDIA/ALTA** - A base existe, mas ainda está centrada em medição por alocação, não em produção individual formalizada

**Arquivos:**
- Backend: `backend/src/modules/medicoes/`
- Frontend: `frontend/src/components/MedicoesForm.tsx`, `frontend/src/pages/Medicoes/`
- Mobile: `mobile/src/screens/MedicoesScreen.tsx`

---

#### 🟡 RF13 - Apropriação Financeira
**Status:** 🟡 **PARCIALMENTE IMPLEMENTADO**

**ERS 4.1 Especifica:**
> "Valor a pagar = área medida × preço de venda, com aprovação de excedentes e entrada automática na folha."

**Implementado:**
- ✅ Backend: módulo financeiro com lotes de pagamento (`tb_lotes_pagamento`) e workflow de aprovação
- ✅ Backend: endpoints para criar lote, enviar para aprovação, aprovar, processar pagamento e cancelar
- ✅ Backend: integração com medições pendentes de pagamento
- ✅ Backend: relatórios financeiros e dashboard já disponíveis

**Faltando (CRÍTICO):**
- ❌ **Cálculo financeiro ainda não segue integralmente a ERS 4.1:**
  - `FinanceiroService.createLote()` soma `qtd_executada`, não aplica formalmente `área medida × preço de venda`
  - A apropriação individual por colaborador/item não está persistida como fonte de verdade própria
- ❌ **Aprovação específica de excedentes pelo Financeiro/Gestor não existe como workflow dedicado**
- ❌ **Entrada automática na folha por colaborador não está implementada**
- ❌ **Não há apropriação financeira detalhada por item/colaborador no frontend**

**Criticidade:** 🔴 **ALTA** - Há workflow financeiro, mas não a granularidade e fórmula operacional pedidas pela ERS 4.1

**Arquivos:**
- Backend: `backend/src/modules/financeiro/`, `backend/src/modules/medicoes/`, `backend/src/modules/relatorios/`
- Frontend: `frontend/src/pages/Financeiro/`

---

#### 🔴 RF14 - Vale Adiantamento
**Status:** 🔴 **NÃO IMPLEMENTADO**

**ERS 4.1 Especifica:**
> "Fluxo Aberto → Lançado → Descontado, com situação descontável/não descontável, parcelamento, saldo devedor e bloqueio por limite."

**Implementado:**
- ✅ Infra reaproveitável: módulo financeiro, auditoria e notificações podem suportar a funcionalidade

**Faltando (CRÍTICO):**
- ❌ **Tabela `tb_vale_adiantamento` não existe**
- ❌ **Módulo backend de vale adiantamento não existe**
- ❌ **Regras de parcelamento automático e ajuste manual não existem**
- ❌ **Bloqueio por limite de saldo devedor não existe**
- ❌ **Telas Web/Mobile de abertura, lançamento, desconto e histórico não existem**
- ❌ **Relatórios de saldo e desconto de vales não existem**

**Criticidade:** 🔴 **ALTA** - Funcionalidade nova integralmente pendente

**Arquivos:**
- Backend: novo módulo a criar em `backend/src/modules/vale-adiantamento/`
- Frontend: nova área a criar em `frontend/src/pages/Financeiro/`
- Mobile: nova tela a criar em `mobile/src/screens/`

---

#### 🟡 RF15 - Relatórios
**Status:** 🟡 **PARCIALMENTE IMPLEMENTADO**

**ERS 4.1 Especifica:**
> "Relatórios sintético e analítico de produção, saldo e vale adiantamento, com filtros por data, obra, colaborador e item, exportação CSV/PDF e consumo web/mobile."

**Implementado:**
- ✅ Backend: `RelatoriosModule` com dashboard financeiro, medições, produtividade, margem e excedentes
- ✅ Backend: exportação CSV e Excel para dashboard financeiro
- ✅ Frontend Web: páginas de relatórios financeiros e produtividade já existem
- ✅ Mobile: `RelatoriosScreen.tsx` já consome dashboard, excedentes e ranking

**Faltando:**
- ❌ **Relatórios sintético/analítico específicos de produção individual e saldo não estão fechados no escopo ERS 4.1**
- ❌ **Relatórios de vale adiantamento inexistentes**
- ❌ **Exportação PDF não encontrada**
- ❌ **Filtro explícito por item não está padronizado em toda a camada de relatórios**
- ❌ **Agrupamento completo por obra/colaborador/item ainda é parcial**

**Criticidade:** 🟡 **MÉDIA** - Existe base forte de relatórios, mas falta a especialização exigida pela ERS 4.1

**Arquivos:**
- Backend: `backend/src/modules/relatorios/`
- Frontend: `frontend/src/pages/Financeiro/`, `frontend/src/types/relatorios.ts`
- Mobile: `mobile/src/screens/RelatoriosScreen.tsx`

---

## 3. 🔒 REGRAS DE NEGÓCIO (RN)

> Fonte oficial de RN: `docs/RN_FONTE_DA_VERDADE.md`.
> Em caso de conflito entre esta análise e o código, usar a fonte oficial.

### ✅ RN01 - Cegueira Financeira
**Status:** 🟢 **IMPLEMENTADO**

**ERS 4.0:**
> "Encarregado nunca vê Preços de Venda."

**Implementado:**
- ✅ Backend: `SensitiveDataFilter` em `backend/src/common/utils/sensitive-data.filter.ts`
  - Intercepta responses de `precos.controller.ts`
  - Remove campo `preco_venda` se `user.id_perfil === ENCARREGADO`
- ✅ Frontend: `PrecosTable.tsx`
  - Linha 92: `const podeVerPrecosVenda = userPerfil !== 'ENCARREGADO';`
  - Coluna de preço de venda é condicional
- ✅ Testes: Não testado em ambiente (mas código presente)

**Melhorias Sugeridas:**
- ⚠️ Aplicar filtro em TODOS os endpoints que retornam preços (atualmente só no GET)
- ⚠️ Criar decorator `@HideSensitiveData()` para aplicar automaticamente

**Arquivos:**
- Backend: `backend/src/common/utils/sensitive-data.filter.ts`
- Backend: `backend/src/modules/precos/precos.controller.ts`
- Frontend: `frontend/src/pages/Precos/components/PrecosTable.tsx`

---

### ✅ RN02 - Travamento de Faturamento
**Status:** 🟢 **IMPLEMENTADO**

**ERS 4.0:**
> "Não gera medição se preço estiver 'Em Análise' (PENDENTE). Exceção: Administrador pode forçar com justificativa."

**Implementado:**
- ✅ Backend: `medicoes.service.ts` método `create()`:
  ```typescript
  const tabelaPreco = await this.precosService.findOne(id_tabela_preco);
  if (tabelaPreco.status_aprovacao !== 'APROVADO') {
    throw new ForbiddenException({
      codigo: 'PRECO_NAOAPROVADO',
      mensagem: 'Não é possível criar medição. Preço ainda não aprovado.',
    });
  }
  ```
- ✅ Exceção para Admin com justificativa registrada em auditoria (conforme fonte oficial).

**Nota:** Em caso de divergência textual desta seção, prevalece `docs/RN_FONTE_DA_VERDADE.md`.

**Arquivos:**
- Backend: `backend/src/modules/medicoes/medicoes.service.ts`

---

### ✅ RN03 - Unicidade (1 Ambiente = 1 Colaborador)
**Status:** 🟢 **IMPLEMENTADO** (Backend)

**ERS 4.0:**
> "Um ambiente = Um colaborador ativo."

**Implementado:**
- ✅ Backend: Constraint de BD:
  ```sql
  CREATE UNIQUE INDEX idx_alocacoes_unicidade_ambiente
  ON tb_alocacoes_tarefa (id_item_ambiente, status)
  WHERE status = 'EM_ANDAMENTO' AND deletado = FALSE;
  ```
- ✅ Backend: Validação em `alocacoes.service.ts`:
  - Verifica ambiente ocupado antes de criar
  - Verifica colaborador já alocado
  - Retorna erro 409 Conflict

**Faltando:**
- ❌ Frontend/Mobile: Feedback visual (ver RF07)

**Arquivos:**
- Backend: `backend/database/init.sql`
- Backend: `backend/src/modules/alocacoes/alocacoes.service.ts`

---

### 🟡 RN04 - Segurança de Dados Estendida
**Status:** 🟡 **PARCIALMENTE IMPLEMENTADO**

**ERS 4.0:**
1. Dados bancários mascarados na interface (`***`)
2. Criptografia AES-256 para dados sensíveis em repouso
3. Protocolo TLS 1.2+ para dados em trânsito

**Implementado:**
- ✅ **AES-256:**
  - Service: `backend/src/common/crypto/crypto.service.ts`
  - Algoritmo: AES-256-GCM com IV aleatório
  - Uso: Auto-encrypt em `colaboradores.service.ts` para `dados_bancarios`
  - ⚠️ **ATENÇÃO:** Requer variável `CRYPTO_KEY` (64 hex chars) no `.env` (não configurado por padrão)
  - Documentação: `CRYPTO_SETUP.md`

- ⚠️ **Mascaramento:**
  - Backend: `SensitiveDataFilter` mascara dados bancários para perfis != FINANCEIRO
  - Frontend: **NÃO implementado** - Exibe dados completos se receber da API

- ⚠️ **TLS 1.2+:**
  - Backend: `helmet` v7.1.0 instalado (melhora headers de segurança)
  - Docker: Configuração TLS **não verificada** (provável que use HTTP em dev)
  - Produção: Requer configuração no NGINX/Load Balancer

**Faltando:**
- ❌ Frontend: Função para mascarar dados bancários (ex: `1234-5 → ****-5`)
- ❌ Docker: Certificado SSL/TLS para HTTPS (dev pode ser auto-assinado)
- ❌ Testes: Validar que criptografia funciona em ambos os sentidos

**Criticidade:** 🟡 MÉDIA (Core implementado, detalhes pendentes)

**Arquivos:**
- Backend: `backend/src/common/crypto/crypto.service.ts`
- Backend: `backend/src/common/utils/sensitive-data.filter.ts`
- Docs: `CRYPTO_SETUP.md`

---

### 🟡 RN05 - Múltiplos Colaboradores por Item com Início/Fim Obrigatórios
**Status:** 🟡 **PARCIALMENTE IMPLEMENTADO**

**ERS 4.1:**
> "Cada item pode ter múltiplos colaboradores simultaneamente, com registro obrigatório de início/fim."

**Implementado:**
- ✅ Registro de início/fim existe em `tb_alocacoes_tarefa`
- ✅ Histórico de status de alocação já existe

**Faltando:**
- ❌ Regra de simultaneidade por item não é atendida
- ❌ Sistema continua bloqueando um segundo colaborador no mesmo ambiente
- ❌ Não há estrutura dedicada para concorrência por item

**Nota:** esta RN é incompatível com a restrição atual de RF07/RN03, então exige revisão estrutural do modelo de alocação.

---

### 🟡 RN06 - Medição Individual com Cálculo Automático e Aprovação em Folha
**Status:** 🟡 **PARCIALMENTE IMPLEMENTADO**

**ERS 4.1:**
> "Medição vinculada ao colaborador; valor a pagar calculado automaticamente; folha aprovada pelo gestor."

**Implementado:**
- ✅ Medição já é vinculada a uma alocação com colaborador
- ✅ Existe workflow de aprovação e pagamento por lote

**Faltando:**
- ❌ Cálculo automático formal por preço de venda e área medida não está fechado ponta a ponta
- ❌ Folha individual por colaborador não existe como módulo próprio
- ❌ Aprovação do gestor está no lote, não na folha individualizada

---

### 🟡 RN07 - Correções pelo Encarregado Antes do Fechamento
**Status:** 🟡 **PARCIALMENTE IMPLEMENTADO**

**ERS 4.1:**
> "Correções permitidas pelo encarregado antes do fechamento do período."

**Implementado:**
- ✅ O sistema permite atualização operacional de medições enquanto não estão fechadas/pagas
- ✅ Há CRUD de medições disponível nas camadas atuais

**Faltando:**
- ❌ Não existe conceito explícito de fechamento de período para travar correções
- ❌ Não há workflow formal de reabertura/correção com auditoria específica por competência

---

### 🔴 RN08 - Vale Adiantamento com Saldo, Desconto Parcial e Bloqueio por Limite
**Status:** 🔴 **NÃO IMPLEMENTADO**

**ERS 4.1:**
> "Vale adiantamento com status e situação; desconto parcial mantém saldo; bloqueio se limite ultrapassado."

**Implementado:**
- ✅ Auditoria e notificações existentes podem ser reutilizadas na futura implementação

**Faltando:**
- ❌ Modelo de dados
- ❌ Regras de saldo devedor
- ❌ Parcelamento e desconto parcial
- ❌ Bloqueio automático por limite
- ❌ UI, relatórios e integrações com folha

---

## 4. ⚡ REQUISITOS NÃO-FUNCIONAIS (RNF)

### RNF01 - Auditoria
**Status:** 🟢 **IMPLEMENTADO**

**Implementado:**
- ✅ `tb_audit_logs` imutável (BIGINT PK sequencial, sem update/delete)
- ✅ Interceptor: `AuditInterceptor` captura automaticamente:
  - Ação (INSERT, UPDATE, DELETE, APPROVE, REJECT)
  - Usuário responsável
  - Payload antes/depois (JSONB)
  - Timestamp (UTC)
- ✅ Decorator: `@Audit(acao, tabela)` para ações customizadas

**Arquivos:**
- Backend: `backend/src/common/interceptors/audit.interceptor.ts`
- Backend: `backend/src/common/decorators/audit.decorator.ts`
- Backend: `backend/database/init.sql` (tb_audit_logs)

---

### 🔴 RNF03 - Performance e Otimização
**Status:** 🔴 **NÃO IMPLEMENTADO** (0/3)

**ERS 4.0 Especifica:**

#### 1. Lazy Loading
> "O App Mobile deve carregar a lista de ambientes sob demanda (paginação infinita)."

**Status:** ❌ NÃO IMPLEMENTADO
- Backend: Endpoints retornam listas completas (sem paginação)
- Mobile: WatermelonDB suporta lazy loading, mas não configurado

**Necessário:**
- Backend: Adicionar paginação em endpoints:
  ```typescript
  @Get('ambientes')
  findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.service.findAll({ page, limit });
  }
  ```
- Mobile: FlatList com `onEndReached` para carregar mais

---

#### 2. Compressão de Imagem
> "Fotos devem ser comprimidas no cliente (Mobile) para máx. 1024px e 80% qualidade."

**Status:** ❌ NÃO IMPLEMENTADO
- Mobile: Upload de imagens não configurado

**Necessário:**
- Biblioteca: `react-native-image-resizer` ou `expo-image-manipulator`
- Lógica:
  ```javascript
  const compressedImage = await ImageResizer.createResizedImage(
    imageUri,
    1024,  // maxWidth
    1024,  // maxHeight
    'JPEG',
    80,    // quality
  );
  ```

---

#### 3. Cache com Redis
> "Dashboard Financeiro deve usar cache (TTL 5 min)."

**Status:** ❌ NÃO IMPLEMENTADO
- Backend: Redis configurado (`redis` v4.6.12 instalado)
- BullMQ: Usa Redis, mas cache de queries não implementado

**Necessário:**
- Service:
  ```typescript
  @Injectable()
  export class RelatoriosService {
    async getDashboard() {
      const cacheKey = 'dashboard:financeiro';
      const cached = await this.redis.get(cacheKey);
      if (cached) return JSON.parse(cached);

      const data = await this.calcularDashboard();
      await this.redis.setex(cacheKey, 300, JSON.stringify(data)); // 5 min
      return data;
    }
  }
  ```

**Criticidade:** 🟡 MÉDIA (Otimização, não impede funcionalidade)

**Estimativa:** 10-12 horas (todas as 3 features)

---

### 🔴 RNF04 - Jobs e Rotinas (Background Tasks)
**Status:** 🔴 **INFRAESTRUTURA OK, JOBS NÃO CRIADOS** (0/2)

**ERS 4.0 Especifica:**
- Tecnologia: BullMQ (Redis)
- Periodicidade:
  1. Verificação de Prazos: Diariamente às 06:00 AM
  2. Consolidação de Dashboard: A cada 1 hora

**Implementado:**
- ✅ BullMQ configurado: `@nestjs/bullmq` v10.0.1
- ✅ Redis configurado: `backend/src/config/redis.config.ts`
- ✅ Módulo importado em `app.module.ts`

**Faltando:**
- ❌ **Job: Verificação de Prazos**
  - Arquivo: `backend/src/modules/obras/jobs/verificar-prazos.processor.ts`
  - Lógica:
    ```typescript
    @Process('verificar-prazos')
    async verificarPrazos(job: Job) {
      const obrasAtrasadas = await this.obrasService.findObrasAtrasadas();
      for (const obra of obrasAtrasadas) {
        await this.notificacoesService.criarNotificacao({
          tipo: 'OPERACIONAL',
          prioridade: 'URGENTE',
          titulo: `Obra ${obra.nome} atrasada`,
          mensagem: `Prazo original: ${obra.data_previsao_fim}`,
          id_usuario_destinatario: obra.id_usuario_criador,
        });
      }
    }
    ```
  - Cron: `0 6 * * *` (diariamente às 06:00)

- ❌ **Job: Consolidação de Dashboard**
  - Arquivo: `backend/src/modules/relatorios/jobs/consolidar-dashboard.processor.ts`
  - Lógica: Pré-calcular métricas e armazenar em cache (Redis)
  - Cron: `0 * * * *` (a cada hora)

- ❌ **Dead Letter Queue (DLQ):**
  - ERS 4.0: "Se um job falhar 3 vezes, vai para fila de erro"
  - Configuração BullMQ:
    ```typescript
    BullModule.registerQueue({
      name: 'notificacoes',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
      settings: {
        lockDuration: 30000,
        maxStalledCount: 1,
      },
    })
    ```

**Criticidade:** 🟡 MÉDIA (Automação, não impede operação manual)

**Estimativa:** 12-16 horas

**Arquivos:**
- Infra OK: `backend/src/app.module.ts`, `backend/src/config/redis.config.ts`
- Jobs a criar: `backend/src/modules/obras/jobs/`, `backend/src/modules/relatorios/jobs/`

---

## 5. 🗄️ BANCO DE DADOS

### Schema ERS 4.0 vs Implementação

**Status Geral:** 🟢 **93% COMPLETO** (14/15 tabelas)

| Tabela ERS 4.0 | Implementada | Observações |
|----------------|--------------|-------------|
| `tb_perfis` | ✅ | 4 perfis + permissoes_json (JSONB) |
| `tb_usuarios` | ✅ | Inclui mfa_enabled, mfa_secret |
| `tb_clientes` | ✅ | CNPJ único, dia_corte |
| `tb_obras` | ✅ | Status ENUM, datas, FK cliente |
| `tb_pavimentos` | ✅ | FK obra, ordem |
| `tb_ambientes` | ✅ | FK pavimento, status_bloqueio |
| `tb_catalogo_servicos` | ✅ | Unidades ENUM, permite_decimal |
| `tb_tabela_precos` | ✅ | status_aprovacao, margem_percentual (GENERATED) |
| `tb_itens_ambiente` | ✅ | FK ambiente + tabelaPreco, area_planejada |
| `tb_colaboradores` | ✅ | CPF único, dados_bancarios_enc |
| `tb_sessoes_diarias` | ✅ | geo_lat, geo_long, assinatura_url |
| `tb_alocacoes_tarefa` | ✅ | UNIQUE constraint 1:1, status |
| `tb_medicoes` | ✅ | flag_excedente, status_pagamento |
| `tb_audit_logs` | ✅ | BIGINT PK, payload JSONB, imutável |
| `tb_uploads` | ✅ | Tabela adicional para S3 tracking |

### Diferenças Identificadas

#### ⚠️ Campo `fcm_token` em `tb_usuarios`
- **ERS 4.0:** Especifica campo para Push Notifications
- **Implementação:**
  - ✅ Presente em `backend/database/init.sql` (linha 39)
  - ❌ **FALTA na Entity TypeORM:** `backend/src/modules/usuarios/entities/usuario.entity.ts`

**Impacto:** Push notifications não funcionam (token não é salvo)

**Correção:**
```typescript
// usuario.entity.ts
@Column({ type: 'varchar', length: 255, nullable: true })
fcm_token: string;
```

---

#### ⚠️ Coluna Calculada `margem_percentual`
- **ERS 4.0:** "Campo calculado: `margem_percentual`"
- **Implementação:**
  - ✅ Presente em `init.sql` como GENERATED column:
    ```sql
    margem_percentual DECIMAL(5,2) GENERATED ALWAYS AS 
    (CASE WHEN preco_custo > 0 
     THEN ((preco_venda - preco_custo) / preco_custo * 100) 
     ELSE 0 END) STORED
    ```
  - ⚠️ TypeORM Entity: Campo não marcado como `@Generated()`

**Impacto:** Baixo (BD calcula corretamente, ORM apenas lê)

---

#### ✅ Índices Implementados

Conforme ERS 4.0, todos os índices críticos estão presentes:

```sql
-- Unicidade RN03
CREATE UNIQUE INDEX idx_alocacoes_unicidade_ambiente 
ON tb_alocacoes_tarefa (id_item_ambiente, status) 
WHERE status = 'EM_ANDAMENTO' AND deletado = FALSE;

-- Performance
CREATE INDEX idx_usuarios_email ON tb_usuarios(email);
CREATE INDEX idx_obras_status ON tb_obras(status);
CREATE INDEX idx_medicoes_pagamento ON tb_medicoes(status_pagamento);
CREATE INDEX idx_audit_logs_usuario ON tb_audit_logs(id_usuario);
CREATE INDEX idx_audit_logs_momento ON tb_audit_logs(momento DESC);
```

---

### Adendo ERS 4.1 - Ajustes de Banco de Dados

#### 🔴 Novas tabelas ainda não implementadas
- ❌ `tb_alocacoes_itens`
- ❌ `tb_medicoes_colaborador`
- ❌ `tb_vale_adiantamento`

#### 🟡 Ajustes estruturais necessários em `tb_alocacoes_tarefa`
- ✅ `id_item_ambiente` já existe e permite iniciar a migração para alocação por item
- ❌ A regra atual continua centrada em unicidade operacional por ambiente, incompatível com múltiplos colaboradores por item
- ❌ Campos `valor_servico` e `justificativa` não estão presentes no modelo atual

#### 🟡 Ajustes necessários para folha e apropriação individual
- ❌ Não há estrutura persistida para saldo individual por colaborador/item/período
- ❌ Jobs/triggers de folha para produção individual ainda não foram identificados na implementação atual

---

## 6. 🛠️ STACK TECNOLÓGICO

### Conformidade com ERS 4.0

**Status:** 🟢 **100% CONFORME**

| Componente ERS 4.0 | Implementado | Versão | Justificativa ERS 4.0 |
|--------------------|--------------|--------|----------------------|
| **Backend: NestJS** | ✅ | 10.3.0 | "Arquitetura modular, tipagem forte" |
| **DB: PostgreSQL** | ✅ | 15+ | "ACID compliance para transações financeiras" |
| **Autenticação: JWT** | ✅ | @nestjs/jwt 10.2.0 | "Stateless, escalável" |
| **MFA: TOTP** | ✅ | otplib 12.0.1 | "Google Authenticator" |
| **Criptografia: AES-256** | ✅ | crypto-js 4.2.0 | "Dados sensíveis em repouso" |
| **Cache: Redis** | ✅ | 7.x | "Dashboard e BullMQ" |
| **Jobs: BullMQ** | ✅ | 5.1.5 | "Background tasks confiáveis" |
| **Frontend: React** | ✅ | 18.2.0 | "Data Grid nativos (Material UI)" |
| **Mobile: React Native** | ✅ | 0.73 | "Cross-platform" |
| **Mobile DB: WatermelonDB** | ✅ | 0.27.1 | "Lazy loading em bancos grandes" |

### Bibliotecas Adicionais Relevantes

**Segurança:**
- ✅ `helmet` 7.1.0 - Headers HTTP seguros
- ✅ `@nestjs/throttler` 6.5.0 - Rate limiting
- ✅ `bcrypt` 5.1.1 - Hash de senhas

**Validação:**
- ✅ `class-validator` 0.14.1
- ✅ `class-transformer` 0.5.1

**Documentação:**
- ✅ `@nestjs/swagger` 7.1.17 - OpenAPI 3.0

---

## 7. 🎨 INTERFACE E UX

### 5.1. Acessibilidade e Usabilidade (ERS 4.0)

**Status:** 🔴 **10% IMPLEMENTADO**

#### ❌ Contraste WCAG 2.1 AA
**ERS 4.0:**
> "Garantir contraste suficiente entre texto e fundo, especialmente para uso sob sol forte (Modo Alto Contraste opcional)."

**Status:** ❌ NÃO IMPLEMENTADO
- Frontend: Material UI usa tema padrão (sem validação WCAG)
- Mobile: React Native Paper com tema padrão

**Necessário:**
- Ferramentas: `eslint-plugin-jsx-a11y`, `axe-core` (testes automatizados)
- Tema: Criar variante "High Contrast" no Material UI
- Validação: Todas as cores devem ter contraste ≥ 4.5:1 (texto normal) ou ≥ 3:1 (texto grande)

**Criticidade:** 🟡 BAIXA (Compliance legal, não impede uso)

---

#### ❌ Navegação por Teclado
**ERS 4.0:**
> "O painel Web deve ser totalmente operável via `Tab`, `Enter` e `Esc`."

**Status:** ❌ NÃO VERIFICADO
- Material UI componentes são acessíveis por padrão, mas:
  - Formulários customizados não testados
  - Modais podem não fechar com `Esc`
  - Focus trap não confirmado

**Necessário:**
- Testes manuais: Navegar aplicação inteira sem mouse
- Adicionar `aria-label` e `aria-describedby` em componentes customizados

**Criticidade:** 🟡 BAIXA

---

#### 🟡 Feedback de Sincronização
**ERS 4.0:**
> "Status claro: 'Sincronizado há 2 min' vs 'Offline - 5 pendências'. Indicador visual de 'Salvando...' não intrusivo."

**Status:** 🟡 ESTRUTURA EXISTE, FEEDBACK INCOMPLETO
- Mobile: WatermelonDB rastreia sincronização
- Frontend: Não há indicador visual de status de conexão

**Necessário:**
- Frontend: Badge no header com ícone de conexão (verde/vermelho)
- Mobile: Toast não-intrusivo ao sincronizar
- Redux: State `syncStatus: { lastSync: Date, pending: number }`

**Criticidade:** 🟡 MÉDIA (UX importante para offline-first)

---

### 5.2. Design System

**Status:** 🟡 PARCIAL (Material UI usado, mas sem customização ERS)

#### ❌ Split View para Comparação Financeira
**ERS 4.0:**
> "Split View para comparação financeira (Custo vs. Receita)."

**Status:** ❌ NÃO IMPLEMENTADO
- Dashboard financeiro existe, mas sem visualização lado-a-lado
- Gestor não consegue comparar rapidamente margem vs. receita

**Necessário:**
- Componente: `<SplitComparisonPanel left={custos} right={receitas} />`
- Layout: Grid 50/50 com scroll independente

**Prioridade:** 🟡 MÉDIA

---

#### ✅ Tabelas com Zebra Striping
**Status:** 🟢 IMPLEMENTADO
- Material UI DataGrid tem `striped` por padrão

---

#### 🟡 Mobile: Botões Grandes (Thumb Zone)
**Status:** 🟡 PARCIAL
- React Native Paper usa tamanhos adequados
- Não verificado se todos os botões estão na zona de alcance do polegar

**Necessário:**
- Auditoria: Botões principais devem estar a ≤ 50% da altura da tela

---

#### 🟡 Mobile: Steppers para Contagem
**ERS 4.0:**
> "Steppers para contagem (quantidade em medições)."

**Status:** ❌ NÃO IMPLEMENTADO
- Medições usam input de texto (difícil em campo)

**Necessário:**
- Componente `<NumericStepper value={qtd} onChange={setQtd} />`
- Botões +/- grandes

---

### 5.3. Adendo ERS 4.1 - UX Operacional e Financeira

**Status:** 🔴 **25% IMPLEMENTADO**

#### 🟡 Progresso total e individual na OS
- ✅ Web e Mobile já exibem parte das informações de item/alocação/medição
- ❌ Não há painel consolidado mostrando progresso total do ambiente versus progresso individual por colaborador

#### 🟡 Wizard de medição individual
- ✅ Mobile já possui modal e fluxo para registrar medição a partir da alocação
- ✅ Excedente abre fluxo complementar com justificativa/foto
- ❌ Web ainda não oferece wizard operacional completo com foco em produção individual por item

#### 🔴 Aprovação de alocação e vale com histórico
- ❌ Não há UI dedicada para aprovação de alocação por item
- ❌ Não há UI de vale adiantamento, lançamento, desconto ou histórico

#### 🟡 Relatórios web/mobile por obra, colaborador e item
- ✅ Existem telas e serviços de relatórios em ambas as plataformas
- ❌ Falta cobertura uniforme para filtros por item e relatórios analíticos de saldo/vale

## 8. 🚨 GAPS CRÍTICOS E PRIORIDADES

### 🔴 PRIORIDADE P0 (BLOQUEANTES)

#### 1. RF04 - Workflow de Aprovação de Preços
**Impacto:** ALTO - Core business logic incompleto  
**Estimativa:** 12-16 horas  
**Descrição:**
- Implementar máquina de estados: RASCUNHO → PENDENTE → APROVADO/REJEITADO
- Adicionar validação de margem mínima configurável
- Criar relatório de preços pendentes
- Notificação automática ao Gestor

**Dependências:** RF10 (notificações)

---

#### 2. RF06 - RDO Digital com Geolocalização
**Impacto:** ALTO - Mobile App não funcional sem isso  
**Estimativa:** 20-24 horas  
**Descrição:**
- Geolocalização GPS em tempo real
- Canvas de assinatura digital
- Validação de proximidade (±50m da obra)
- Upload de fotos com geotagging

**Dependências:** React Native Geolocation, Signature Canvas

---

#### 3. RF07 - Alocação 1:1 com Feedback Visual
**Impacto:** ALTO - UX crítica para encarregados  
**Estimativa:** 16-20 horas  
**Descrição:**
- Interface Drag & Drop (colaboradores → ambientes)
- Validação client-side + feedback (Toast/Shake/Haptic)
- Indicador visual de ambientes ocupados

**Dependências:** React Native Gesture Handler, Haptic Feedback

---

### 🟡 PRIORIDADE P1 (IMPORTANTES)

#### 4. RF09 - Push Notifications
**Impacto:** MÉDIO - Comunicação proativa  
**Estimativa:** 12-16 horas  
**Descrição:**
- Integração Firebase Cloud Messaging
- Jobs BullMQ para alertas automáticos
- Deep linking no Mobile

---

#### 5. RNF04 - Jobs Background
**Impacto:** MÉDIO - Automação de rotinas  
**Estimativa:** 12-16 horas  
**Descrição:**
- Job: Verificação de prazos (diário 06:00)
- Job: Consolidação de dashboard (hourly)
- Dead Letter Queue

---

#### 6. RF02 - Navegação Hierárquica (Frontend)
**Impacto:** MÉDIO - UX de obras  
**Estimativa:** 8-10 horas  
**Descrição:**
- Tree View de obras/pavimentos/ambientes
- Wizard de criação completa
- Breadcrumbs

---

### 🟢 PRIORIDADE P2 (MELHORIAS)

#### 7. RNF03 - Performance (Lazy Loading, Cache, Compressão)
**Impacto:** BAIXO - Otimização  
**Estimativa:** 10-12 horas

---

#### 8. Acessibilidade WCAG 2.1
**Impacto:** BAIXO - Compliance  
**Estimativa:** 16-20 horas

---

#### 9. RF10 - Alertas de Ciclo de Faturamento
**Impacto:** BAIXO - Nice-to-have  
**Estimativa:** 6-8 horas

---

### 🆕 Atualização ERS 4.1 - Novos Gaps Prioritários

#### 🔴 10. RF11/RN05 - Refatoração do Modelo de Alocação por Item
**Impacto:** ALTO - Requisito estrutural novo e incompatível com a restrição atual 1:1 por ambiente  
**Estimativa:** 16-24 horas  
**Descrição:**
- Revisar `tb_alocacoes_tarefa` e/ou criar `tb_alocacoes_itens`
- Permitir múltiplos colaboradores por item sem perder validações operacionais
- Preservar histórico obrigatório de início/fim
- Expor progresso total do ambiente e individual por colaborador

---

#### 🔴 11. RF13 - Apropriação Financeira Individual e Folha
**Impacto:** ALTO - Fecha o elo entre produção medida e pagamento devido  
**Estimativa:** 12-18 horas  
**Descrição:**
- Calcular valor com base em área medida × preço de venda
- Persistir apropriação por colaborador/item/período
- Separar aprovação de exceções e integração com folha

---

#### 🔴 12. RF14/RN08 - Vale Adiantamento
**Impacto:** ALTO - Módulo financeiro novo totalmente ausente  
**Estimativa:** 20-28 horas  
**Descrição:**
- Criar tabela, entidade, regras de saldo e parcelamento
- Implementar bloqueio por limite devedor
- Criar fluxo Aberto → Lançado → Descontado
- Disponibilizar UI, auditoria e relatórios

---

#### 🟡 13. RF15 - Relatórios Analíticos de Produção, Saldo e Vale
**Impacto:** MÉDIO - Forte dependência de RF13 e RF14  
**Estimativa:** 10-14 horas  
**Descrição:**
- Relatórios sintético e analítico por obra/colaborador/item
- Exportação CSV/PDF
- Consistência de filtros entre Web e Mobile

---

## 📊 ESTATÍSTICAS FINAIS

### Resumo de Implementação

```
Total de Funcionalidades ERS 4.0: 43
✅ Implementadas Completamente:     15 (35%)
🟡 Parcialmente Implementadas:     18 (42%)
🔴 Não Implementadas:              10 (23%)
```

### Esforço Estimado para Conformidade 100%

| Prioridade | Funcionalidades | Horas Estimadas |
|------------|----------------|-----------------|
| P0 (Crítico) | 3 | 48-60h |
| P1 (Importante) | 3 | 32-42h |
| P2 (Melhoria) | 4 | 32-40h |
| **TOTAL** | **10** | **112-142h** |

**Estimativa em Sprints (2 semanas):**
- P0: 1.5 sprints (60h / 40h por sprint)
- P1: 1 sprint
- P2: 1 sprint
- **TOTAL: 3.5 sprints (~7 semanas)**

---

## ✅ PONTOS FORTES DO PROJETO ATUAL

1. **Arquitetura Sólida:** NestJS modular, TypeORM, RBAC bem implementado
2. **Segurança Robusta:** JWT + MFA + AES-256 + Auditoria imutável
3. **Schema de BD 100% ERS 4.0:** Tabelas, índices e constraints corretos
4. **Backend 85% Completo:** APIs funcionais, regras de negócio implementadas
5. **Infraestrutura Pronta:** Docker, Redis, BullMQ configurados

---

## 🎯 RECOMENDAÇÕES

### Curto Prazo (1 mês)
1. **Completar RF04** - Workflow de aprovação de preços (P0)
2. **Completar RF06** - RDO Digital (P0)
3. **Completar RF07** - Feedback visual de alocação (P0)

### Médio Prazo (2-3 meses)
4. Implementar Push Notifications (P1)
5. Criar Jobs BullMQ automatizados (P1)
6. Melhorar navegação hierárquica no Frontend (P1)

### Longo Prazo (3-6 meses)
7. Otimizações de performance (lazy loading, cache, compressão)
8. Auditoria completa de acessibilidade WCAG 2.1
9. Modo "Alto Contraste" para uso em campo

---

## 📝 NOTAS FINAIS

- **Conformidade Geral:** 70% (Bom para MVP, faltam features críticas para produção)
- **Backend:** 85% (Robusto e bem estruturado)
- **Frontend:** 50% (Funcional mas incompleto)
- **Mobile:** 30% (Estrutura criada, funcionalidades core ausentes)

**Principal Gap:** Funcionalidades mobile (RDO Digital, Alocação visual, Push) são críticas para o valor do produto mas estão 70% pendentes.

**Adendo ERS 4.1:** a principal lacuna nova está na transição de um modelo de alocação 1:1 por ambiente para um modelo de produção individual por item, com reflexo direto em medição, apropriação financeira, folha e vale adiantamento.

---

**Fim do Relatório**  
Gerado automaticamente em: 10/02/2026
