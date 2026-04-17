# Roteiro de Evidências QA - Contas a Pagar (Folha Agregada)

Objetivo: padronizar a coleta de evidências da homologação para rastreabilidade e auditoria funcional.

Tempo estimado de execução: 15 a 20 minutos
Perfil recomendado: QA + usuário FINANCEIRO

## 1. Convenção de Evidências

## 1.1 Padrão de nome dos arquivos

Use o formato:

`QA_CONTAS_PAGAR_<ID_ITEM>_<RESULTADO>_<YYYYMMDD>_<HHMM>.png`

Exemplos:
- QA_CONTAS_PAGAR_03_OK_20260403_1430.png
- QA_CONTAS_PAGAR_05_NOK_20260403_1438.png

## 1.2 Resultado por item

- OK: comportamento conforme esperado
- NOK: comportamento incorreto ou inconsistente
- NA: não aplicável ao ambiente/cenário

## 1.3 Evidências mínimas por item

- 1 print da tela inteira
- 1 print focado no ponto validado (quando aplicável)
- Mensagem de erro/sucesso completa, se existir

---

## 2. Registro de Execução

- Responsável:
- Data:
- Ambiente (DEV/HML/PRD):
- Build/Commit:
- Navegador e versão:
- Resolução usada no desktop:
- Dispositivo ou viewport mobile:

---

## 3. Matriz de Evidências (Desktop)

## Item 01 - Abertura da tela

- Objetivo: validar carregamento inicial sem erro
- Passos:
1. Entrar em Financeiro > Contas a Pagar
2. Aguardar carregamento completo
- Critério de aprovação:
- Página renderiza sem erro 500 e sem quebra visual
- Evidências esperadas:
- Print inicial completo
- Nome sugerido do print:
- QA_CONTAS_PAGAR_01_OK_YYYYMMDD_HHMM.png
- Resultado: OK / NOK / NA
- Observações:

## Item 02 - Cards de topo

- Objetivo: validar cards Total a Pagar, Total Pago e Colaboradores no Período
- Passos:
1. Com filtros padrão, capturar valores dos cards
2. Comparar com dados exibidos no grid
- Critério de aprovação:
- Cards não exibem NaN/undefined e refletem o conjunto atual
- Evidências esperadas:
- Print dos cards
- Print do grid correspondente
- Nome sugerido do print:
- QA_CONTAS_PAGAR_02_OK_YYYYMMDD_HHMM.png
- Resultado: OK / NOK / NA
- Observações:

## Item 03 - Filtro por período

- Objetivo: validar atualização do grid/cards por data
- Passos:
1. Definir data início e fim
2. Aplicar filtro
- Critério de aprovação:
- Dados retornados são compatíveis com o período
- Evidências esperadas:
- Print dos filtros preenchidos
- Print do resultado
- Nome sugerido do print:
- QA_CONTAS_PAGAR_03_OK_YYYYMMDD_HHMM.png
- Resultado: OK / NOK / NA
- Observações:

## Item 04 - Filtro por colaborador

- Objetivo: validar busca textual por colaborador
- Passos:
1. Digitar parte do nome de um colaborador conhecido
2. Validar redução de resultados
- Critério de aprovação:
- Apenas colaboradores compatíveis aparecem
- Evidências esperadas:
- Print do campo com texto
- Print dos resultados
- Nome sugerido do print:
- QA_CONTAS_PAGAR_04_OK_YYYYMMDD_HHMM.png
- Resultado: OK / NOK / NA
- Observações:

## Item 05 - Filtro por serviço

- Objetivo: validar filtro de serviço
- Passos:
1. Selecionar/informar serviço
2. Validar itens retornados
- Critério de aprovação:
- Itens retornados pertencem ao serviço filtrado
- Evidências esperadas:
- Print do filtro
- Print da coluna de serviços no grid
- Nome sugerido do print:
- QA_CONTAS_PAGAR_05_OK_YYYYMMDD_HHMM.png
- Resultado: OK / NOK / NA
- Observações:

## Item 06 - Filtro por status

- Objetivo: validar ABERTO e PAGO
- Passos:
1. Filtrar ABERTO e registrar quantidade
2. Filtrar PAGO e registrar quantidade
- Critério de aprovação:
- Não há mistura de status no resultado de cada filtro
- Evidências esperadas:
- Print ABERTO
- Print PAGO
- Nome sugerido do print:
- QA_CONTAS_PAGAR_06_OK_YYYYMMDD_HHMM.png
- Resultado: OK / NOK / NA
- Observações:

## Item 07 - Paginação server-side

- Objetivo: validar navegação entre páginas
- Passos:
1. Definir limite baixo por página (ex.: 5)
2. Avançar e retornar páginas
- Critério de aprovação:
- Itens mudam entre páginas e totais permanecem consistentes
- Evidências esperadas:
- Print página 1
- Print página 2
- Nome sugerido do print:
- QA_CONTAS_PAGAR_07_OK_YYYYMMDD_HHMM.png
- Resultado: OK / NOK / NA
- Observações:

## Item 08 - Pagamento por linha

- Objetivo: validar ação individual
- Passos:
1. Selecionar linha ABERTO
2. Acionar pagamento da linha
3. Recarregar lista
- Critério de aprovação:
- Linha muda para PAGO e cards atualizam
- Evidências esperadas:
- Print antes do pagamento
- Print após pagamento
- Nome sugerido do print:
- QA_CONTAS_PAGAR_08_OK_YYYYMMDD_HHMM.png
- Resultado: OK / NOK / NA
- Observações:

## Item 09 - Pagamento em massa

- Objetivo: validar processamento de múltiplas linhas
- Passos:
1. Marcar múltiplas linhas ABERTO
2. Acionar Pagar selecionados
3. Validar retorno
- Critério de aprovação:
- Todas selecionadas viram PAGO e nenhuma não selecionada é alterada
- Evidências esperadas:
- Print da seleção
- Print do resultado
- Nome sugerido do print:
- QA_CONTAS_PAGAR_09_OK_YYYYMMDD_HHMM.png
- Resultado: OK / NOK / NA
- Observações:

## Item 10 - Exportação CSV

- Objetivo: validar exportação com filtros ativos
- Passos:
1. Aplicar filtros
2. Exportar CSV
3. Abrir arquivo
- Critério de aprovação:
- Colunas essenciais presentes e dados condizem com filtros
- Evidências esperadas:
- Print da tela com filtros
- Print do arquivo aberto
- Nome sugerido do print:
- QA_CONTAS_PAGAR_10_OK_YYYYMMDD_HHMM.png
- Resultado: OK / NOK / NA
- Observações:

## Item 11 - Exportação XLSX

- Objetivo: validar exportação XLSX
- Passos:
1. Exportar XLSX
2. Conferir colunas e volume
- Critério de aprovação:
- Dados equivalentes ao conjunto filtrado
- Evidências esperadas:
- Print da planilha
- Nome sugerido do print:
- QA_CONTAS_PAGAR_11_OK_YYYYMMDD_HHMM.png
- Resultado: OK / NOK / NA
- Observações:

## Item 12 - Exportação PDF

- Objetivo: validar exportação PDF
- Passos:
1. Exportar PDF
2. Conferir legibilidade e dados
- Critério de aprovação:
- PDF contém informações essenciais e legíveis
- Evidências esperadas:
- Print/PDF da exportação
- Nome sugerido do print:
- QA_CONTAS_PAGAR_12_OK_YYYYMMDD_HHMM.png
- Resultado: OK / NOK / NA
- Observações:

---

## 4. Matriz de Evidências (Mobile)

## Item 13 - Layout mobile

- Objetivo: validar responsividade geral
- Passos:
1. Abrir em viewport mobile
2. Navegar pelos filtros e grid
- Critério de aprovação:
- Sem sobreposição de elementos e sem truncamento crítico
- Evidências esperadas:
- Print da visão geral mobile
- Nome sugerido do print:
- QA_CONTAS_PAGAR_13_OK_YYYYMMDD_HHMM.png
- Resultado: OK / NOK / NA
- Observações:

## Item 14 - Ações principais no mobile

- Objetivo: validar acessibilidade de ações críticas
- Passos:
1. Executar um filtro
2. Selecionar linha
3. Verificar botões de pagamento/exportação
- Critério de aprovação:
- Ações continuam acessíveis e acionáveis
- Evidências esperadas:
- Print antes da ação
- Print após ação
- Nome sugerido do print:
- QA_CONTAS_PAGAR_14_OK_YYYYMMDD_HHMM.png
- Resultado: OK / NOK / NA
- Observações:

---

## 5. Consolidação Final

- Total de itens OK:
- Total de itens NOK:
- Total de itens NA:
- Status final da homologação: APROVADO / APROVADO COM RESSALVAS / REPROVADO

## 5.1 Registro de defeitos (se houver)

Para cada NOK:
- ID do item:
- Severidade: Baixa / Média / Alta / Crítica
- Descrição objetiva:
- Passos para reproduzir:
- Evidência associada:
- Responsável pelo tratamento:

## 5.2 Parecer final

- Conclusão do QA:
- Pendências obrigatórias antes de liberar:
- Assinatura do responsável:
