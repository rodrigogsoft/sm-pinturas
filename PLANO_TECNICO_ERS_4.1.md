# Plano Técnico de Implementação - ERS 4.1

**Data:** 12 de março de 2026  
**Escopo:** RF11-RF15 e RN05-RN08 da ERS 4.1  
**Objetivo:** transformar o adendo funcional da ERS 4.1 em backlog técnico executável por banco, backend, frontend e mobile.

---

## 1. Resumo Executivo

A ERS 4.1 adiciona um novo fluxo operacional centrado em produção individual por item de ambiente. O ponto mais sensível é que o modelo atual ainda foi desenhado para a regra histórica de unicidade operacional por ambiente, enquanto o novo requisito exige múltiplos colaboradores simultâneos por item, medição individual, apropriação financeira detalhada, integração com folha e vale adiantamento.

**Ordem recomendada de execução:**
1. Modelo de dados e compatibilidade
2. Alocação por item
3. Medição individual
4. Apropriação financeira e folha
5. Vale adiantamento
6. Relatórios e UX final

**Estimativa consolidada:** 58-84 horas de implementação principal, sem contar homologação ampliada e ajustes de produção.

---

## 2. Premissas e Decisões

### 2.1 Premissas

- A ERS 4.0 base permanece válida para cadastro, segurança, auditoria, relatórios já existentes e workflow financeiro atual.
- O módulo novo deve preservar rastreabilidade completa em auditoria.
- O frontend web e o mobile devem consumir a mesma fonte de verdade para alocação por item e produção individual.
- O modelo antigo não deve ser removido abruptamente sem estratégia de migração.

### 2.2 Decisões recomendadas

- Tratar `tb_alocacoes_tarefa` como legado operacional e introduzir uma estrutura de alocação por item compatível com a ERS 4.1.
- Persistir produção individual como entidade própria, não apenas como efeito colateral da medição por alocação.
- Separar os conceitos de:
  - alocação operacional
  - medição individual
  - apropriação financeira
  - vale adiantamento
- Manter aprovação financeira e auditoria em workflows explícitos, sem depender apenas do lote atual.

---

## 3. Arquitetura Alvo

### 3.1 Banco de dados

**Novas tabelas propostas:**
- `tb_alocacoes_itens`
- `tb_medicoes_colaborador`
- `tb_apropriacoes_financeiras`
- `tb_vale_adiantamento`
- `tb_vale_adiantamento_parcelas` (recomendado)

**Ajustes em tabelas existentes:**
- `tb_alocacoes_tarefa`
  - revisar papel no fluxo 4.1
  - adicionar `valor_servico` e `justificativa` se ainda participar do processo
- `tb_medicoes`
  - decidir se permanece como agregado operacional ou se passa a espelhar consolidação de `tb_medicoes_colaborador`
- `tb_lotes_pagamento`
  - integrar com apropriações individuais aprovadas

### 3.2 Backend

**Módulos novos ou refatorados:**
- `modules/alocacoes-itens`
- `modules/medicoes-colaborador`
- `modules/apropriacao-financeira`
- `modules/vale-adiantamento`
- `modules/relatorios` com novos filtros e agregações

### 3.3 Frontend Web

**Telas principais:**
- Alocação por item com progresso total e individual
- Wizard de medição individual
- Aprovação financeira individualizada
- Gestão de vale adiantamento
- Relatórios sintético e analítico

### 3.4 Mobile

**Telas principais:**
- Alocação operacional por item
- Medição individual por colaborador/item
- Consulta de saldo de produção e pendências
- Consulta de vales e descontos

---

## 4. Backlog por Requisito

## 4.1 RF11 - Alocação por Itens de Ambiente

### Banco

- Criar `tb_alocacoes_itens` com:
  - `id`
  - `id_sessao`
  - `id_ambiente`
  - `id_item_ambiente`
  - `id_colaborador`
  - `hora_inicio`
  - `hora_fim`
  - `status`
  - `valor_servico`
  - `justificativa`
  - `created_at`
  - `updated_at`
  - `deletado`
- Criar índices por `id_item_ambiente`, `id_colaborador`, `status`, `id_sessao`
- Revisar a constraint atual de unicidade para deixar de bloquear simultaneidade por item quando o requisito permitir

### Backend

- Criar módulo `alocacoes-itens`
- Implementar endpoints:
  - `POST /alocacoes-itens`
  - `GET /alocacoes-itens`
  - `GET /alocacoes-itens/:id`
  - `PATCH /alocacoes-itens/:id`
  - `POST /alocacoes-itens/:id/concluir`
- Regras:
  - permitir múltiplos colaboradores no mesmo item quando a política operacional permitir
  - impedir duplicidade simultânea do mesmo colaborador em dois itens incompatíveis
  - registrar obrigatoriamente início e fim
  - auditar toda criação, edição, conclusão e correção

### Frontend Web

- Adaptar [frontend/src/pages/AlocacaoPage.tsx](frontend/src/pages/AlocacaoPage.tsx) ou criar nova página dedicada
- Exibir:
  - obra
  - ambiente
  - item
  - colaboradores ativos
  - progresso total do ambiente
  - progresso individual por colaborador
- Adicionar histórico de alocação por item

### Mobile

- Evoluir [mobile/src/screens/Alocacao/AlocacaoScreen.tsx](mobile/src/screens/Alocacao/AlocacaoScreen.tsx)
- Incluir seleção de item explícita
- Exibir ocupação por item e progresso individual
- Permitir concluir alocação por item sem ambiguidade com o ambiente inteiro

### Testes

- múltiplos colaboradores no mesmo item
- colaborador em conflito operacional
- registro obrigatório de início/fim
- histórico consistente após concluir e reabrir sessão

### Estimativa

- 16-24 horas

---

## 4.2 RF12 - Medição Individual

### Banco

- Criar `tb_medicoes_colaborador` com:
  - `id`
  - `id_alocacao_item`
  - `id_colaborador`
  - `id_item_ambiente`
  - `area_medida`
  - `observacao`
  - `foto_evidencia_url`
  - `flag_excedente`
  - `justificativa`
  - `data_medicao`
  - `created_at`
  - `updated_at`
- Avaliar view ou tabela de consolidação por ambiente

### Backend

- Criar módulo `medicoes-colaborador`
- Implementar endpoints:
  - `POST /medicoes-colaborador`
  - `GET /medicoes-colaborador`
  - `PATCH /medicoes-colaborador/:id`
  - `POST /medicoes-colaborador/:id/corrigir`
- Regras:
  - área medida <= área planejada, salvo excedente justificado
  - foto obrigatória para excedente
  - atualização do progresso individual
  - atualização do progresso total do item e do ambiente
  - correção permitida antes do fechamento do período

### Frontend Web

- Criar wizard de medição individual por item
- Campos:
  - colaborador
  - item
  - área medida
  - observação
  - foto
- Exibir alerta de excedente com exigência de justificativa e evidência

### Mobile

- Evoluir [mobile/src/screens/MedicoesScreen.tsx](mobile/src/screens/MedicoesScreen.tsx)
- Transformar o fluxo atual em wizard explícito por colaborador/item
- Mostrar progresso planejado, executado individual e saldo restante

### Testes

- medição normal
- medição excedente com justificativa
- medição excedente sem justificativa
- recálculo de progresso total do ambiente
- correção antes do fechamento

### Estimativa

- 10-14 horas

---

## 4.3 RF13 - Apropriação Financeira

### Banco

- Criar `tb_apropriacoes_financeiras` com:
  - `id`
  - `id_medicao_colaborador`
  - `id_colaborador`
  - `id_item_ambiente`
  - `area_medida`
  - `preco_venda_unitario`
  - `valor_calculado`
  - `status`
  - `aprovado_por`
  - `aprovado_em`
  - `justificativa_aprovacao`
  - `competencia`
- Integrar com `tb_lotes_pagamento` ou criar vínculo por lote

### Backend

- Criar módulo `apropriacao-financeira`
- Fórmula padrão:
  - `valor_calculado = area_medida * preco_venda_unitario`
- Regras:
  - excedente relevante pode exigir aprovação financeira/gestor
  - apropriação aprovada entra na folha
  - lote financeiro passa a consumir apropriações aprovadas, não apenas somatório de `qtd_executada`
- Ajustar `FinanceiroService.createLote()` para usar a nova fonte de valor

### Frontend Web

- Criar tela de aprovação por colaborador/item/período
- Exibir:
  - obra
  - ambiente
  - item
  - colaborador
  - área medida
  - preço aplicado
  - valor calculado
  - status

### Mobile

- Disponibilizar consulta de produção individual e valor preliminar
- Não é necessário aprovar no mobile na primeira entrega, mas a leitura operacional é recomendada

### Testes

- cálculo de valor
- integração com preço aprovado
- bloqueio de apropriação inconsistente
- geração de lote a partir de apropriação aprovada

### Estimativa

- 12-18 horas

---

## 4.4 RF14 - Vale Adiantamento

### Banco

- Criar `tb_vale_adiantamento` com:
  - `id`
  - `id_colaborador`
  - `status` (`ABERTO`, `LANCADO`, `DESCONTADO`)
  - `situacao` (`DESCONTAVEL`, `NAO_DESCONTAVEL`)
  - `valor_total`
  - `saldo_devedor`
  - `forma_desconto`
  - `observacao`
  - `limite_bloqueio_snapshot`
  - `created_at`
  - `updated_at`
- Criar `tb_vale_adiantamento_parcelas`

### Backend

- Criar módulo `vale-adiantamento`
- Endpoints:
  - `POST /vale-adiantamento`
  - `GET /vale-adiantamento`
  - `GET /vale-adiantamento/:id`
  - `POST /vale-adiantamento/:id/lancar`
  - `POST /vale-adiantamento/:id/descontar`
  - `PATCH /vale-adiantamento/:id/parcelas`
- Regras:
  - parcelamento automático com possibilidade de ajuste manual
  - desconto parcial mantém saldo
  - bloqueio automático se limite devedor for ultrapassado
  - toda movimentação auditada

### Frontend Web

- Criar páginas de:
  - abertura de vale
  - lançamento
  - controle de parcelas
  - desconto
  - histórico por colaborador

### Mobile

- Entrega inicial recomendada como consulta e histórico
- Operações de lançamento/desconto podem ficar prioritariamente no web

### Testes

- parcelamento automático
- ajuste manual
- desconto parcial
- transição de status
- bloqueio por limite

### Estimativa

- 20-28 horas

---

## 4.5 RF15 - Relatórios

### Backend

- Expandir `RelatoriosModule` para:
  - produção sintética por período
  - produção analítica por colaborador/item
  - saldo de produção
  - saldo de vale adiantamento
  - desconto por período
- Filtros mínimos:
  - data inicial/final
  - obra
  - colaborador
  - item
- Exportações:
  - CSV
  - PDF

### Frontend Web

- Criar telas ou abas dedicadas:
  - relatório sintético
  - relatório analítico
  - relatório de vales
  - relatório de saldo por colaborador

### Mobile

- Exibir filtros simplificados e leitura sintética
- Disponibilizar analítico resumido por colaborador e item

### Testes

- filtros combinados
- agregação correta
- exportação CSV/PDF
- consistência entre web e mobile

### Estimativa

- 10-14 horas

---

## 5. Fases de Execução

## Fase 0 - Preparação

- alinhar nomenclatura final do domínio 4.1
- decidir estratégia de convivência com `tb_alocacoes_tarefa`
- mapear migração de dados legados

**Saída:** ADR curta ou decisão técnica registrada.

## Fase 1 - Banco e contratos

- migrations das novas tabelas
- DTOs e entidades iniciais
- contratos OpenAPI

**Saída:** schema estável para backend e frontend.

## Fase 2 - Backend operacional

- alocação por item
- medição individual
- regras de fechamento/correção
- auditoria e notificações

**Saída:** APIs operacionais completas.

## Fase 3 - Backend financeiro

- apropriação financeira
- integração com folha/lotes
- vale adiantamento

**Saída:** fluxo financeiro 4.1 funcional.

## Fase 4 - Web e Mobile

- telas operacionais
- telas financeiras
- relatórios
- ajustes de UX

**Saída:** operação ponta a ponta nas interfaces.

## Fase 5 - Homologação

- testes integrados
- smoke tests por perfil
- conferência de auditoria
- validação com dados de competência real

**Saída:** pacote apto para validação de negócio.

---

## 6. Dependências Críticas

- RF11 desbloqueia RF12 e RF13
- RF12 alimenta RF13 e RF15
- RF13 e RF14 alimentam RF15
- RN05 entra em conflito com a modelagem operacional antiga e deve ser resolvida cedo

---

## 7. Critérios de Pronto

Um incremento da ERS 4.1 só deve ser dado como concluído quando houver:

- migration aplicada e versionada
- DTO/entity/service/controller prontos
- auditoria para operações críticas
- teste unitário das regras principais
- smoke test manual por perfil afetado
- evidência de uso no web e, quando aplicável, no mobile

---

## 8. Riscos

### Risco 1 - Conflito entre regra antiga e nova

- **Descrição:** o sistema atual foi construído em torno da alocação exclusiva por ambiente.
- **Mitigação:** isolar o fluxo 4.1 em estrutura nova, com migração gradual.

### Risco 2 - Apropriação financeira inconsistente

- **Descrição:** usar medição agregada como base de pagamento pode gerar divergência com a produção individual.
- **Mitigação:** criar fonte de verdade explícita para apropriação e lote.

### Risco 3 - Explosão de complexidade no mobile

- **Descrição:** tentar entregar todos os fluxos operacionais e financeiros no mobile desde a primeira etapa.
- **Mitigação:** priorizar operação e consulta, deixando administração financeira pesada no web.

---

## 9. Próximo Sprint Recomendado

### Sprint 1

- modelagem e migrations de RF11/RF12
- módulo backend de alocação por item
- módulo backend de medição individual
- ajustes mínimos no web para operar o novo fluxo

### Sprint 2

- apropriação financeira
- integração com lote/folha
- telas web de aprovação
- leitura operacional no mobile

### Sprint 3

- vale adiantamento
- relatórios 4.1
- exportações
- homologação e endurecimento de regras

---

## 10. Observação sobre Numeração

O workspace já reutiliza RF11-RF15 em documentos legados para outros temas. Para evitar ambiguidade, toda referência nova deve usar a forma:

- `RF11 (ERS 4.1)`
- `RF12 (ERS 4.1)`
- `RF13 (ERS 4.1)`
- `RF14 (ERS 4.1)`
- `RF15 (ERS 4.1)`

Isso vale para backlog, issues, PRs e documentação futura.