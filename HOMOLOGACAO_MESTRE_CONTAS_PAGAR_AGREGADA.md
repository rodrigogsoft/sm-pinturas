# Homologação Mestre - Contas a Pagar (Folha Agregada)

Objetivo: documento único para execução e evidência da homologação funcional da tela Contas a Pagar agregada por colaborador.

Tempo total estimado: 15 a 25 minutos
Perfis recomendados: QA + usuário FINANCEIRO

---

## 1. Dados da Execução

- Responsável:
- Data:
- Ambiente (DEV/HML/PRD):
- Build/Commit:
- Navegador e versão:
- Resolução desktop:
- Dispositivo/viewport mobile:

---

## 2. Pré-condições

1. Backend e frontend em execução.
2. Login com perfil FINANCEIRO.
3. Base com:
- ao menos 2 colaboradores no mesmo período,
- ao menos 1 colaborador em período diferente,
- registros ABERTO e PAGO.

Critério de aceite:
- A tela abre sem erro 500, sem travamento e sem quebra de layout.

Evidência:
- Print da tela inicial carregada.

---

## 3. Convenção de Evidências

### 3.1 Nome dos arquivos

Use o padrão:

`QA_CONTAS_PAGAR_<ID_ITEM>_<RESULTADO>_<YYYYMMDD>_<HHMM>.png`

Exemplos:
- QA_CONTAS_PAGAR_03_OK_20260403_1430.png
- QA_CONTAS_PAGAR_09_NOK_20260403_1452.png

### 3.2 Resultado por item

- OK: conforme esperado
- NOK: comportamento incorreto/inconsistente
- NA: não aplicável

### 3.3 Evidência mínima

- 1 print da tela inteira
- 1 print focado no ponto validado (quando aplicável)
- Mensagem de sucesso/erro completa, se houver

---

## 4. Matriz Unificada de Homologação

## Item 01 - Abertura da tela

- Objetivo: validar carga inicial sem erro.
- Passos:
1. Acessar Financeiro > Contas a Pagar.
2. Aguardar carregamento completo.
- Critério de aprovação:
- Sem erro 500 e sem quebra visual.
- Evidência:
- Print tela completa.
- Arquivo sugerido:
- QA_CONTAS_PAGAR_01_OK_YYYYMMDD_HHMM.png
- Resultado: OK / NOK / NA
- Observações:

## Item 02 - Cards de topo

- Objetivo: validar Total a Pagar, Total Pago, Colaboradores no Período.
- Passos:
1. Capturar valores dos cards no estado inicial.
2. Conferir consistência com os dados visíveis no grid.
- Critério de aprovação:
- Valores sem NaN/undefined e coerentes com os itens filtrados.
- Evidência:
- Print dos cards + print do grid.
- Arquivo sugerido:
- QA_CONTAS_PAGAR_02_OK_YYYYMMDD_HHMM.png
- Resultado: OK / NOK / NA
- Observações:

## Item 03 - Filtro por período

- Objetivo: validar recorte por data.
- Passos:
1. Informar data início e fim.
2. Aplicar filtro.
- Critério de aprovação:
- Grid e cards refletem somente o período.
- Evidência:
- Print dos filtros preenchidos + resultado.
- Arquivo sugerido:
- QA_CONTAS_PAGAR_03_OK_YYYYMMDD_HHMM.png
- Resultado: OK / NOK / NA
- Observações:

## Item 04 - Filtro por colaborador

- Objetivo: validar busca textual por nome.
- Passos:
1. Digitar trecho do nome do colaborador.
2. Validar redução correta de itens.
- Critério de aprovação:
- Apenas colaboradores compatíveis aparecem.
- Evidência:
- Print do filtro + grid filtrado.
- Arquivo sugerido:
- QA_CONTAS_PAGAR_04_OK_YYYYMMDD_HHMM.png
- Resultado: OK / NOK / NA
- Observações:

## Item 05 - Filtro por serviço

- Objetivo: validar filtro por serviço.
- Passos:
1. Informar/selecionar serviço.
2. Validar linhas retornadas.
- Critério de aprovação:
- Resultado condiz com o serviço informado.
- Evidência:
- Print do filtro + coluna de serviços no grid.
- Arquivo sugerido:
- QA_CONTAS_PAGAR_05_OK_YYYYMMDD_HHMM.png
- Resultado: OK / NOK / NA
- Observações:

## Item 06 - Filtro por status

- Objetivo: validar ABERTO e PAGO.
- Passos:
1. Filtrar ABERTO e registrar quantidade.
2. Filtrar PAGO e registrar quantidade.
- Critério de aprovação:
- Não há mistura de status no resultado de cada filtro.
- Evidência:
- Print ABERTO + print PAGO.
- Arquivo sugerido:
- QA_CONTAS_PAGAR_06_OK_YYYYMMDD_HHMM.png
- Resultado: OK / NOK / NA
- Observações:

## Item 07 - Paginação server-side

- Objetivo: validar troca de páginas no backend.
- Passos:
1. Definir limite baixo por página (ex.: 5).
2. Ir para próxima página e retornar.
- Critério de aprovação:
- Itens mudam entre páginas e totais permanecem coerentes.
- Evidência:
- Print página 1 + print página 2.
- Arquivo sugerido:
- QA_CONTAS_PAGAR_07_OK_YYYYMMDD_HHMM.png
- Resultado: OK / NOK / NA
- Observações:

## Item 08 - Pagamento por linha

- Objetivo: validar ação individual.
- Passos:
1. Escolher linha ABERTO.
2. Executar pagamento da linha.
3. Recarregar lista.
- Critério de aprovação:
- Linha migra para PAGO e cards atualizam.
- Evidência:
- Print antes + depois.
- Arquivo sugerido:
- QA_CONTAS_PAGAR_08_OK_YYYYMMDD_HHMM.png
- Resultado: OK / NOK / NA
- Observações:

## Item 09 - Pagamento em massa

- Objetivo: validar processamento em lote por seleção.
- Passos:
1. Selecionar múltiplas linhas ABERTO.
2. Acionar Pagar selecionados.
3. Recarregar e validar.
- Critério de aprovação:
- Todas as selecionadas viram PAGO; não selecionadas não mudam.
- Evidência:
- Print da seleção + print após processamento.
- Arquivo sugerido:
- QA_CONTAS_PAGAR_09_OK_YYYYMMDD_HHMM.png
- Resultado: OK / NOK / NA
- Observações:

## Item 10 - Exportação CSV

- Objetivo: validar export com filtros ativos.
- Passos:
1. Aplicar filtros.
2. Exportar CSV.
3. Abrir arquivo e conferir colunas.
- Critério de aprovação:
- Respeita filtros e inclui dados esperados.
- Evidência:
- Print da tela + print do arquivo.
- Arquivo sugerido:
- QA_CONTAS_PAGAR_10_OK_YYYYMMDD_HHMM.png
- Resultado: OK / NOK / NA
- Observações:

## Item 11 - Exportação XLSX

- Objetivo: validar export XLSX.
- Passos:
1. Exportar XLSX.
2. Validar colunas e volume.
- Critério de aprovação:
- Dados equivalentes ao conjunto filtrado.
- Evidência:
- Print da planilha aberta.
- Arquivo sugerido:
- QA_CONTAS_PAGAR_11_OK_YYYYMMDD_HHMM.png
- Resultado: OK / NOK / NA
- Observações:

## Item 12 - Exportação PDF

- Objetivo: validar export PDF.
- Passos:
1. Exportar PDF.
2. Verificar legibilidade e integridade dos dados.
- Critério de aprovação:
- Conteúdo legível e coerente com filtros.
- Evidência:
- Print/PDF exportado.
- Arquivo sugerido:
- QA_CONTAS_PAGAR_12_OK_YYYYMMDD_HHMM.png
- Resultado: OK / NOK / NA
- Observações:

## Item 13 - Responsividade mobile

- Objetivo: validar layout em viewport mobile.
- Passos:
1. Simular viewport mobile.
2. Navegar por filtros, grid e ações.
- Critério de aprovação:
- Sem sobreposição crítica e com boa legibilidade.
- Evidência:
- Print da visão mobile.
- Arquivo sugerido:
- QA_CONTAS_PAGAR_13_OK_YYYYMMDD_HHMM.png
- Resultado: OK / NOK / NA
- Observações:

## Item 14 - Ações principais no mobile

- Objetivo: validar acessibilidade de ações críticas.
- Passos:
1. Aplicar filtro.
2. Selecionar item.
3. Confirmar acesso a pagar/exportar.
- Critério de aprovação:
- Ações continuam acionáveis no mobile.
- Evidência:
- Print antes + print depois.
- Arquivo sugerido:
- QA_CONTAS_PAGAR_14_OK_YYYYMMDD_HHMM.png
- Resultado: OK / NOK / NA
- Observações:

---

## 5. Smoke de Consistência Final

Passos:
1. Filtrar ABERTO e anotar total.
2. Pagar 1 item.
3. Reaplicar ABERTO e validar redução.
4. Filtrar PAGO e validar aumento correspondente.

Critério de aprovação:
- Migração entre status refletida no grid e nos cards sem inconsistência.

Evidência:
- Print antes e depois das ações.

---

## 6. Consolidação Final

- Total OK:
- Total NOK:
- Total NA:
- Status final: APROVADO / APROVADO COM RESSALVAS / REPROVADO

## 6.1 Defeitos (preencher para cada NOK)

- ID do item:
- Severidade: Baixa / Média / Alta / Crítica
- Descrição:
- Passos de reprodução:
- Evidência:
- Responsável pelo ajuste:

## 6.2 Parecer

- Conclusão do QA:
- Pendências obrigatórias antes da liberação:
- Assinatura:

---

## 7. Referência (artefatos originais)

- Checklist resumido: CHECKLIST_HOMOLOGACAO_CONTAS_PAGAR_AGREGADA.md
- Roteiro detalhado de evidências: ROTEIRO_EVIDENCIAS_QA_CONTAS_PAGAR_AGREGADA.md

---

## 8. Ata de Homologação

Título da ata: Homologação funcional da tela Contas a Pagar (Folha Agregada)

- Data da reunião de homologação:
- Início:
- Término:
- Participantes:
- Ambiente validado:
- Versão/Build validada:

### 8.1 Resultado executivo

- Itens OK:
- Itens NOK:
- Itens NA:
- Risco residual:
- Decisão preliminar: APROVAR / APROVAR COM RESSALVAS / REPROVAR

### 8.2 Pendências e plano de ação

| ID | Pendência | Severidade | Responsável | Prazo | Status |
|---|---|---|---|---|---|
| 1 |  |  |  |  |  |
| 2 |  |  |  |  |  |
| 3 |  |  |  |  |  |

### 8.3 Quadro de assinaturas

| Papel | Nome | Parecer | Data | Assinatura |
|---|---|---|---|---|
| QA |  | APROVAR / APROVAR COM RESSALVAS / REPROVAR |  |  |
| Produto |  | APROVAR / APROVAR COM RESSALVAS / REPROVAR |  |  |
| Tech Lead |  | APROVAR / APROVAR COM RESSALVAS / REPROVAR |  |  |

### 8.4 Decisão final de liberação

- Status final: LIBERAR / LIBERAR COM RESSALVAS / NÃO LIBERAR
- Justificativa da decisão:
- Condições obrigatórias para produção (se houver):
- Data alvo para revalidação (se houver):
