# Checklist de Homologação Manual - Contas a Pagar (Folha Agregada)

Tempo estimado: 10 a 15 minutos
Objetivo: validar se a tela Contas a Pagar agregada por colaborador está consistente em UI, regras e integração

## 1. Pré-condições (2 min)

1. Backend e frontend em execução.
2. Usuário com perfil FINANCEIRO autenticado.
3. Base com dados em pelo menos 2 colaboradores no mesmo período e 1 colaborador em período diferente.
4. Pelo menos um registro com status ABERTO e um com status PAGO.

Critério de aceite:
- Tela abre sem erro 500, sem travamento e sem layout quebrado.

## 2. Carga inicial e cards de topo (1 min)

1. Abrir Financeiro > Contas a Pagar.
2. Conferir cards de topo:
- Total a Pagar
- Total Pago
- Colaboradores no Período
3. Comparar com o total mostrado no grid carregado para o mesmo filtro padrão.

Critério de aceite:
- Valores carregam na primeira renderização.
- Não há NaN, undefined ou zero indevido quando existem dados.

## 3. Filtros em tempo real (3 min)

1. Aplicar filtro por período (data início/fim).
2. Aplicar filtro por colaborador (texto parcial do nome).
3. Aplicar filtro por serviço.
4. Aplicar filtro por status (ABERTO e PAGO).
5. Limpar filtros e confirmar retorno ao estado inicial.

Critério de aceite:
- Grid e cards atualizam conforme filtros.
- Filtro de status ABERTO não traz itens PAGO.
- Filtro de colaborador reduz corretamente para nomes compatíveis.

## 4. Paginação server-side (2 min)

1. Ajustar limite para forçar múltiplas páginas (ex.: 5 por página).
2. Navegar para próxima página e voltar.
3. Conferir número total de registros e total de páginas.

Critério de aceite:
- Mudança de página consulta o backend (sem repetir sempre os mesmos itens).
- Contadores de paginação condizem com o volume filtrado.

## 5. Ações de pagamento (3 min)

### 5.1 Pagamento por linha
1. Selecionar uma linha ABERTO.
2. Acionar pagamento individual.
3. Confirmar sucesso e recarregar lista.

Critério de aceite:
- Linha muda para PAGO após atualização.
- Totais de topo refletem a alteração.

### 5.2 Pagamento em massa
1. Marcar múltiplas linhas ABERTO.
2. Acionar Pagar selecionados.
3. Confirmar sucesso e recarregar lista.

Critério de aceite:
- Todas as linhas selecionadas são processadas.
- Nenhuma linha não selecionada é alterada.

## 6. Exportações (2 min)

1. Com filtros ativos, exportar CSV.
2. Exportar XLSX.
3. Exportar PDF.
4. Abrir arquivos e validar colunas essenciais:
- Colaborador
- Competência
- Serviços
- Medição
- Valor
- Status

Critério de aceite:
- Exportação respeita filtros ativos.
- Conteúdo inclui todos os registros filtrados (não apenas página atual).

## 7. Responsividade e UX (2 min)

1. Testar em viewport desktop.
2. Testar em viewport mobile (simulação no DevTools).
3. Verificar legibilidade da tabela, ações e filtros.

Critério de aceite:
- Sem sobreposição de elementos.
- Ações principais continuam acessíveis.

## 8. Smoke de consistência final (1 min)

1. Filtrar ABERTO e contar registros.
2. Pagar um item.
3. Refazer o filtro ABERTO e validar diminuição.
4. Filtrar PAGO e validar aumento correspondente.

Critério de aceite:
- Movimento entre status é refletido no grid e nos cards sem inconsistência.

---

## Resultado da homologação

- Aprovado sem ressalvas
- Aprovado com ressalvas
- Reprovado

## Campos para registro

- Responsável:
- Data:
- Ambiente:
- Evidências (prints/links):
- Observações finais:
