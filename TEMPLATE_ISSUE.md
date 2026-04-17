# 📝 TEMPLATE DE ISSUE/TASK

Use este template para criar issues no Jira/GitHub/Trello para rastrear o progresso de cada feature.

---

## EXEMPLO: RF04 - Workflow de Aprovação de Preços

### 📌 Issue Info
- **ID:** RF04-SPRINT1
- **Tipo:** Feature
- **Prioridade:** 🔴 Crítica (P0)
- **Sprint:** Sprint 1 (10-21 Fev 2026)
- **Estimativa:** 12-14 horas
- **Assignee:** Backend Dev + Frontend Dev

---

### 📋 Descrição

**Objetivo:**  
Implementar workflow de aprovação de preços para garantir que apenas preços com margem adequada sejam aprovados pelo Gestor, conforme especificado na ERS 4.0 (RF04).

**Contexto:**  
Atualmente, o Financeiro cria preços mas não há processo formal de validação de margem. Isso pode resultar em serviços não lucrativos sendo precificados.

**Referências:**
- [ERS 4.0 - RF04](docs/ERS-v4.0.md#rf04)
- [Comparativo de Gaps](COMPARATIVO_ERS_4.0_IMPLEMENTACAO.md#rf04)
- [Plano de Ação Sprint 1](PLANO_ACAO_ERS_4.0.md#task-11)

---

### ✅ Critérios de Aceite

#### Backend
- [ ] Migration SQL executada com sucesso (colunas de workflow + margem_minima)
- [ ] Endpoint `PATCH /precos/:id/submeter` funciona (Financeiro)
- [ ] Endpoint `PATCH /precos/:id/aprovar` funciona (Gestor)
- [ ] Endpoint `PATCH /precos/:id/rejeitar` funciona (Gestor)
- [ ] Validação: margem < margem_minima → erro
- [ ] Notificação criada ao submeter (Gestor recebe)
- [ ] Notificação criada ao aprovar/rejeitar (Financeiro recebe)
- [ ] Auditoria registra todas as transições
- [ ] Swagger atualizado
- [ ] 3 testes unitários (service)
- [ ] 2 testes E2E (fluxo RASCUNHO → APROVADO, RASCUNHO → REJEITADO)

#### Frontend
- [ ] Componente `AprovacaoPrecoModal.tsx` criado
- [ ] Modal exibe: preço custo, venda, margem %, margem mínima
- [ ] Indicador visual: margem OK (verde) ou abaixo (amarelo)
- [ ] Botões "Aprovar" e "Rejeitar" funcionam
- [ ] Formulário de rejeição: justificativa obrigatória (min 10 chars)
- [ ] Toast de feedback ao aprovar/rejeitar
- [ ] Tabela de preços mostra coluna "Ações" condicional por perfil:
  - Financeiro + status RASCUNHO → botão "Submeter"
  - Gestor + status PENDENTE → botão "Analisar"
  - Outros casos → chip com status
- [ ] Responsivo (testado em mobile)

---

### 🧪 Cenários de Teste

#### Teste 1: Financeiro Submete Preço com Margem Adequada
```gherkin
Given Financeiro está logado
And existe preço com status RASCUNHO
And margem calculada é 25% (acima do mínimo de 20%)
When Financeiro clica em "Submeter"
Then status muda para PENDENTE
And notificação é enviada ao Gestor
And audit log registra ação "SUBMIT_APPROVAL"
```

#### Teste 2: Gestor Aprova Preço
```gherkin
Given Gestor está logado
And existe preço com status PENDENTE
When Gestor clica em "Analisar" → "Aprovar"
And insere observações (opcional)
And confirma
Then status muda para APROVADO
And notificação é enviada ao Financeiro
And preço está liberado para uso em medições
```

#### Teste 3: Gestor Rejeita Preço
```gherkin
Given Gestor está logado
And existe preço com status PENDENTE
When Gestor clica em "Analisar" → "Rejeitar"
And NÃO insere justificativa
Then sistema exibe erro "Justificativa obrigatória"

When Gestor insere justificativa válida (>10 chars)
And confirma
Then status muda para REJEITADO
And notificação é enviada ao Financeiro com motivo
```

#### Teste 4: Financeiro Tenta Submeter com Margem Baixa
```gherkin
Given existe obra com margem_minima = 20%
And Financeiro cria preço com custo R$ 100 e venda R$ 115
And margem calculada é 15% (abaixo do mínimo)
When Financeiro tenta submeter
Then sistema retorna erro 400
And mensagem: "Margem calculada (15%) está abaixo do mínimo de 20%"
```

---

### 🔧 Subtasks

Quebre a issue em subtasks menores:

- [ ] **[Backend]** Criar migration SQL
- [ ] **[Backend]** Implementar `submeterParaAprovacao()` em service
- [ ] **[Backend]** Implementar `aprovar()` em service
- [ ] **[Backend]** Implementar `rejeitar()` em service
- [ ] **[Backend]** Criar DTOs com validação
- [ ] **[Backend]** Adicionar endpoints no controller
- [ ] **[Backend]** Integrar com NotificacoesService
- [ ] **[Backend]** Atualizar Swagger
- [ ] **[Backend]** Criar testes unitários
- [ ] **[Backend]** Criar testes E2E
- [ ] **[Frontend]** Criar componente AprovacaoPrecoModal
- [ ] **[Frontend]** Integrar modal na PrecosPage
- [ ] **[Frontend]** Adicionar coluna de ações na tabela
- [ ] **[Frontend]** Implementar lógica condicional por perfil
- [ ] **[Frontend]** Adicionar toast de feedback
- [ ] **[Frontend]** Testar responsividade

---

### 📦 Dependências

#### Bloqueadores (deve estar completo antes)
- Nenhum

#### Dependências (features relacionadas)
- RF10 (Alertas) usará o status de aprovação
- RN02 (Travamento) já validava status, agora workflow está completo

---

### 🐛 Riscos Conhecidos

| Risco | Probabilidade | Mitigação |
|-------|---------------|-----------|
| Margem mínima diferente por tipo de serviço | Média | Fase 1: margem por obra. Fase 2: margem por serviço (futuro) |
| Gestor offline quando recebe notificação | Baixa | Notificação persiste, será vista quando voltar online |
| Conflito: 2 gestores aprovam simultaneamente | Baixa | Lock otimista (versioning) ou mutex no backend |

---

### 📸 Mockups/Wireframes

**Modal de Aprovação:**
```
┌────────────────────────────────────┐
│ Aprovação de Preço                 │
├────────────────────────────────────┤
│ Pintura Látex 2 Demãos             │
│ Obra: Residencial Vista Verde      │
├────────────────────────────────────┤
│ Preço Custo:  R$ 100,00            │
│ Preço Venda:  R$ 125,00            │
├────────────────────────────────────┤
│ ✅ Margem: 25%                      │
│ Mínimo exigido: 20% ✓ Atende       │
├────────────────────────────────────┤
│ [ Aprovar Preço ] [ Rejeitar ]     │
└────────────────────────────────────┘
```

---

### 📊 Definição de Pronto (DoD)

Esta issue só será considerada DONE quando:

✅ **Código**
- [ ] Code review aprovado por pelo menos 1 dev senior
- [ ] Zero warnings no build (TypeScript, ESLint)
- [ ] Commits seguem padrão Conventional Commits

✅ **Testes**
- [ ] Cobertura de testes >80% (backend service)
- [ ] Testes E2E passando em CI/CD
- [ ] Validado manualmente em staging

✅ **Documentação**
- [ ] Swagger atualizado (backend)
- [ ] CHANGELOG.md atualizado
- [ ] Comentários no código para lógica complexa

✅ **Deploy**
- [ ] Migrations executadas em staging
- [ ] Feature testada em staging
- [ ] QA sign-off

✅ **Demo**
- [ ] Demo gravada (Loom) de 2-3 min
- [ ] Compartilhada no Slack #dev-jb-pinturas

---

### 🔗 Links Úteis

- **Figma:** [Link do design]
- **API Docs:** http://localhost:3000/api/docs#/Precos
- **Staging:** https://staging.jbpinturas.com
- **Slack Thread:** #dev-jb-pinturas

---

### 💬 Comentários

_(Área para discussões durante o desenvolvimento)_

---

**Criado em:** 10/02/2026  
**Última atualização:** 10/02/2026  
**Status:** 📝 To Do → 🏗️ In Progress → 👀 In Review → ✅ Done
