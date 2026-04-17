# Backlog Operacional - ERS 4.1

**Data:** 12 de março de 2026  
**Base:** [PLANO_TECNICO_ERS_4.1.md](PLANO_TECNICO_ERS_4.1.md)  
**Objetivo:** quebrar o escopo da ERS 4.1 em entregas executáveis, com recorte por sprint e por camada técnica.

---

## 1. Convenção

Para evitar colisão com documentos legados do workspace, usar sempre a forma:

- RF11 (ERS 4.1)
- RF12 (ERS 4.1)
- RF13 (ERS 4.1)
- RF14 (ERS 4.1)
- RF15 (ERS 4.1)

---

## 2. Epics

| Epic | Tema | Requisitos | Prioridade |
|---|---|---|---|
| **E1** | Modelo de dados 4.1 | RF11-RF14 | P0 |
| **E2** | Alocação por item | RF11, RN05 | P0 |
| **E3** | Medição individual | RF12, RN06, RN07 | P0 |
| **E4** | Apropriação financeira e folha | RF13, RN06 | P0 |
| **E5** | Vale adiantamento | RF14, RN08 | P0 |
| **E6** | Relatórios 4.1 | RF15 | P1 |
| **E7** | UX web/mobile 4.1 | RF11-RF15 | P1 |

---

## 3. Sprint 1 - Fundação 4.1

### Objetivo

Fechar modelagem, contratos e fluxo operacional mínimo de alocação por item e medição individual.

### Banco de dados

- [ ] Criar migration para `tb_alocacoes_itens`
- [ ] Criar migration para `tb_medicoes_colaborador`
- [ ] Revisar papel de `tb_alocacoes_tarefa` no fluxo novo
- [ ] Definir estratégia de coexistência entre modelo legado e 4.1
- [ ] Criar índices por item, colaborador, sessão e status

### Backend

- [ ] Criar módulo `alocacoes-itens`
- [ ] Criar entity, DTOs, controller e service de `alocacoes-itens`
- [ ] Implementar regra de múltiplos colaboradores por item
- [ ] Implementar regra de conflito operacional do colaborador
- [ ] Criar módulo `medicoes-colaborador`
- [ ] Implementar criação e atualização de medição individual
- [ ] Implementar regra de excedente com justificativa e foto
- [ ] Implementar recálculo de progresso por item e ambiente
- [ ] Auditar operações críticas de alocação e medição

### Frontend Web

- [ ] Definir se [frontend/src/pages/AlocacaoPage.tsx](frontend/src/pages/AlocacaoPage.tsx) será evoluída ou substituída
- [ ] Adaptar listagem de alocação para seleção explícita de item
- [ ] Criar primeira versão do wizard de medição individual no web

### Mobile

- [ ] Evoluir [mobile/src/screens/Alocacao/AlocacaoScreen.tsx](mobile/src/screens/Alocacao/AlocacaoScreen.tsx) para alocação por item
- [ ] Evoluir [mobile/src/screens/MedicoesScreen.tsx](mobile/src/screens/MedicoesScreen.tsx) para medição individual estruturada

### Critério de aceite

- [ ] Um item pode receber mais de um colaborador ativo quando permitido
- [ ] O mesmo colaborador não pode ficar em conflito operacional
- [ ] A medição individual atualiza progresso do item e do ambiente
- [ ] Excedente sem justificativa/foto é bloqueado

---

## 4. Sprint 2 - Financeiro 4.1

### Objetivo

Ligar produção individual ao cálculo financeiro e preparar a integração com folha e aprovação.

### Banco de dados

- [ ] Criar migration para `tb_apropriacoes_financeiras`
- [ ] Definir vínculo entre apropriação e lote de pagamento
- [ ] Adicionar campos auxiliares de aprovação e competência

### Backend

- [ ] Criar módulo `apropriacao-financeira`
- [ ] Implementar fórmula `valor = area_medida * preco_venda`
- [ ] Ajustar `FinanceiroService` para consumir apropriações aprovadas
- [ ] Implementar aprovação financeira por colaborador/item/período
- [ ] Implementar trilha de auditoria da aprovação
- [ ] Separar exceção operacional de exceção financeira

### Frontend Web

- [ ] Criar tela de apropriação financeira individual
- [ ] Exibir valor calculado, preço aplicado e status
- [ ] Criar filtro por obra, colaborador, item e competência

### Mobile

- [ ] Exibir consulta de produção e valor preliminar por colaborador/item

### Critério de aceite

- [ ] Cada medição individual gera apropriação financeira consistente
- [ ] Lote de pagamento deixa de depender de somatório simplificado de `qtd_executada`
- [ ] Gestor/Financeiro conseguem aprovar o valor individualizado

---

## 5. Sprint 3 - Vale Adiantamento

### Objetivo

Implementar o módulo financeiro novo de vales, com saldo, parcelamento e desconto.

### Banco de dados

- [ ] Criar migration para `tb_vale_adiantamento`
- [ ] Criar migration para `tb_vale_adiantamento_parcelas`
- [ ] Adicionar índices por colaborador, status e competência

### Backend

- [ ] Criar módulo `vale-adiantamento`
- [ ] Implementar criação de vale
- [ ] Implementar lançamento do vale
- [ ] Implementar desconto parcial
- [ ] Implementar cálculo de saldo devedor
- [ ] Implementar bloqueio automático por limite
- [ ] Auditar toda mudança de status

### Frontend Web

- [ ] Criar tela de abertura de vale
- [ ] Criar tela de parcelamento
- [ ] Criar tela de desconto e histórico

### Mobile

- [ ] Criar tela de consulta de vale e saldo

### Critério de aceite

- [ ] Fluxo `ABERTO -> LANCADO -> DESCONTADO` funcional
- [ ] Desconto parcial mantém saldo
- [ ] Bloqueio por limite impede novos lançamentos quando necessário

---

## 6. Sprint 4 - Relatórios e UX Final

### Objetivo

Fechar leitura gerencial e operacional da ERS 4.1 em web e mobile.

### Backend

- [ ] Expandir `RelatoriosModule` com relatórios sintético e analítico
- [ ] Adicionar filtros por data, obra, colaborador e item
- [ ] Adicionar exportação CSV
- [ ] Adicionar exportação PDF

### Frontend Web

- [ ] Criar relatório sintético de produção
- [ ] Criar relatório analítico por colaborador/item
- [ ] Criar relatório de saldo de vale adiantamento
- [ ] Criar painel de progresso total e individual

### Mobile

- [ ] Exibir relatórios sintéticos simplificados
- [ ] Exibir saldo de produção e pendências

### Critério de aceite

- [ ] Web e mobile leem a mesma base de dados 4.1
- [ ] Exportações funcionam para produção e saldo
- [ ] Filtro por item está padronizado

---

## 7. Lista de Issues Recomendadas

### P0

- [ ] ISSUE-ERS41-001 - Modelar `tb_alocacoes_itens` e coexistência com `tb_alocacoes_tarefa`
- [ ] ISSUE-ERS41-002 - Implementar API de alocação por item
- [ ] ISSUE-ERS41-003 - Implementar `tb_medicoes_colaborador` e API de medição individual
- [ ] ISSUE-ERS41-004 - Consolidar progresso total do ambiente e individual por colaborador
- [ ] ISSUE-ERS41-005 - Implementar `tb_apropriacoes_financeiras`
- [ ] ISSUE-ERS41-006 - Refatorar `FinanceiroService` para cálculo financeiro 4.1
- [ ] ISSUE-ERS41-007 - Implementar `tb_vale_adiantamento`
- [ ] ISSUE-ERS41-008 - Implementar regras de saldo, parcelamento e bloqueio

### P1

- [ ] ISSUE-ERS41-009 - Criar wizard web de medição individual
- [ ] ISSUE-ERS41-010 - Evoluir alocação mobile por item
- [ ] ISSUE-ERS41-011 - Criar tela web de apropriação financeira
- [ ] ISSUE-ERS41-012 - Criar telas web de vale adiantamento
- [ ] ISSUE-ERS41-013 - Expandir relatórios 4.1 com filtros por item
- [ ] ISSUE-ERS41-014 - Adicionar exportação PDF para relatórios 4.1

### P2

- [ ] ISSUE-ERS41-015 - Criar consulta mobile de saldo e vales
- [ ] ISSUE-ERS41-016 - Refinar UX de progresso operacional
- [ ] ISSUE-ERS41-017 - Padronizar nomenclatura 4.1 em documentação histórica

---

## 8. Dependências

- ISSUE-ERS41-001 bloqueia 002, 003, 005
- ISSUE-ERS41-003 alimenta 004, 005, 013
- ISSUE-ERS41-005 bloqueia 006 e parte de 013
- ISSUE-ERS41-007 bloqueia 008, 012, 015

---

## 9. Resultado Esperado

Ao final do backlog 4.1, o sistema deve conseguir:

- alocar múltiplos colaboradores por item de ambiente
- medir produção individual por colaborador/item
- calcular apropriação financeira detalhada
- integrar produção aprovada à folha/lote
- controlar vale adiantamento com saldo e desconto
- emitir relatórios sintético e analítico coerentes com o novo modelo