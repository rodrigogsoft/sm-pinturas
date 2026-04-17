# Mobile E2E Checklist - ERS 4.1

Data: 13 de marco de 2026
Status geral: Em fechamento avancado

## Status executivo
- Implementacao mobile ERS 4.1: 100% para escopo funcional planejado nesta trilha
- Validacao automatizada backend/write-flow: 100% (smoke recorrente com PASS)
- Validacao UX em dispositivo (emulador/aparelho): pendente
- Pronto para 100% final: sim, depende apenas de execucao manual dos cenarios A-E

## Escopo
Validar fluxo mobile ERS 4.1 de ponta a ponta:
1. Sessao aberta por obra
2. Alocacao por item de ambiente
3. Criacao de RDO com contexto ativo
4. Edicao de rascunho de RDO
5. Visualizacao read-only de RDO
6. Sincronizacao e refletir status imediato na UI

## Implementacao concluida
- [x] `Obras -> RDOForm` registrado no stack de navegacao
- [x] Criacao de RDO a partir de alocacao ativa com prefill de IDs ERS 4.1
- [x] Seletor explicito quando existem multiplas alocacoes ativas
- [x] Fallback inteligente: sem alocacao ativa, oferece atalho direto para tela de Alocacao da sessao aberta
- [x] Edicao de draft de RDO pela lista
- [x] Visualizacao de RDO em modo read-only
- [x] Sincronizacao atualiza estado local imediatamente (status chips/pendentes)

## Evidencias tecnicas
Arquivos chave alterados no ciclo:
- mobile/src/navigation/BottomTabNavigator.tsx
- mobile/src/screens/Alocacao/AlocacaoScreen.tsx
- mobile/src/screens/RDOListScreen.tsx
- mobile/src/screens/RDOFormScreen.tsx
- mobile/src/store/slices/rdoSlice.ts
- mobile/src/services/api.ts
- mobile/src/services/medicoes.service.ts
- mobile/src/services/alocacoes.service.ts

Validacoes executadas:
- Diagnosticos TS sem erros nos arquivos alterados
- Smoke script repetido apos cada bloco relevante:
  - Comando: `./scripts/test-ers41-writeflow.ps1 -Cleanup`
  - Resultado recorrente: `RESULT=PASS`
  - Cleanup recorrente:
    - `CLEANUP_VALE_STATUS=CANCELADO`
    - `CLEANUP_MEDICAO_OK=true`
    - `CLEANUP_ALOCACAO_OK=true`

## Execucao automatizada desta sessao
- [x] Fluxo de write ERS 4.1 validado apos cada incremento relevante
- [x] Regressao backend descartada em todas as etapas alteradas
- [x] Contrato de sincronizacao preservado com status final consistente
- [x] Integridade de cleanup preservada (sem lixo de dados apos testes)

## Roteiro E2E funcional (manual em dispositivo)
### Cenario A - Criacao de RDO com contexto
- [ ] Abrir sessao da obra
- [ ] Criar alocacao ativa
- [ ] Acessar lista RDO e clicar "Novo RDO"
- [ ] Verificar prefill de `id_alocacao_item`, `id_item_ambiente`, `id_colaborador`
- [ ] Salvar rascunho com geolocalizacao

### Cenario B - Multipla alocacao ativa
- [ ] Manter 2+ alocacoes ativas
- [ ] Clicar "Novo RDO"
- [ ] Confirmar abertura de modal de selecao
- [ ] Escolher alocacao e abrir RDOForm correto

### Cenario C - Ciclo de draft
- [ ] Editar um RDO rascunho pela lista
- [ ] Salvar alteracoes
- [ ] Confirmar que atualiza o mesmo `id_rdo` (sem duplicar)

### Cenario D - Visualizacao
- [ ] Abrir "Visualizar"
- [ ] Confirmar campos bloqueados e botao de salvar oculto

### Cenario E - Sincronizacao
- [ ] Executar sincronizacao
- [ ] Confirmar item marcado como sincronizado na tela sem fechar/reabrir
- [ ] Confirmar contador de pendentes atualizado imediatamente

## Riscos residuais
- Validacao em emulador/dispositivo ainda pendente nesta conversa.
- Fluxo backend foi validado via smoke; validacao UX final depende de navegacao manual no app.

## Plano de fechamento (ultima milha)
1. Rodar os cenarios A-E em emulador/aparelho e marcar cada item.
2. Registrar evidencias (print curto ou anotacao de resultado por cenario).
3. Reexecutar `./scripts/test-ers41-writeflow.ps1 -Cleanup` ao final do roteiro manual.
4. Marcar este documento como concluido e promover status para 100%.

## Template rapido de execucao (A-E)
Preencha durante o teste manual.

| Cenario | Status (Passou/Falhou) | Observacao curta | Evidencia |
|---|---|---|---|
| A - Criacao com contexto |  |  |  |
| B - Multipla alocacao |  |  |  |
| C - Ciclo de draft |  |  |  |
| D - Visualizacao read-only |  |  |  |
| E - Sincronizacao + UI imediata |  |  |  |

### Consolidado final
- Resultado geral: ( ) Aprovado para 100%  ( ) Reprovado
- Data/hora da execucao manual:
- Responsavel:
- Observacoes finais:

## Criterio de 100%
Considerar "mobile 100%" quando todos os itens dos cenarios A-E estiverem marcados, sem regressao no smoke script ERS 4.1.
