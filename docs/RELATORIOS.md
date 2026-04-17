# Relatórios e Dashboards - Documentação Técnica

## 📊 Visão Geral

O módulo de Relatórios fornece 4 endpoints especializados para análise de dados operacionais e financeiros em tempo real:

1. **Dashboard Financeiro** - Resumo de custo x receita por obra
2. **Relatório de Medições** - Lista paginada de medições realizadas
3. **Relatório de Produtividade** - Análise de desempenho por colaborador
4. **Relatório de Margem de Lucro** - Análise de lucratividade por serviço

---

## 🔐 Controle de Acesso

### Dashboard Financeiro
- **Acesso**: Gestor, Admin
- **Objetivo**: Visão executiva de lucratividade
- **Dados**: Agregados por obra com período configurável

### Relatório de Medições
- **Acesso**: Gestor, Financeiro, Encarregado, Admin
- **Objetivo**: Rastreamento de atividades em campo
- **Dados**: Detalhado com filtros e paginação

### Relatório de Produtividade
- **Acesso**: Gestor, Encarregado, Admin
- **Objetivo**: Avaliação de desempenho da equipe
- **Dados**: Agrupado por colaborador com período configurável

### Relatório de Margem de Lucro
- **Acesso**: Gestor, Financeiro, Admin
- **Objetivo**: Análise de rentabilidade por serviço
- **Dados**: Detalhado com métricas de utilização

---

## 🕐 Períodos Suportados

Todos os endpoints de período suportam os seguintes valores:

| Período | Intervalo | Descrição |
|---------|-----------|-----------|
| `dia` | 00:00 - 23:59 | Período de 24 horas (hoje) |
| `semana` | Domingo - Sábado | Semana atual (de domingo a sábado) |
| `mes` | 1º - Último dia | Mês corrente |
| `ano` | 1º jan - 31 dez | Ano corrente |

**Exemplo de Cálculo**:
```javascript
// Se hoje é 07/02/2026 (quarta-feira)
periodo: 'semana'
// Retorna dados de: 01/02/2026 até 07/02/2026
```

---

## 📈 Dashboard Financeiro

### Endpoint
```http
GET /relatorios/dashboard-financeiro?periodo=mes&id_obra={uuid}
```

### Métrica: Margem Percentual
```
Margem = (Receita Total - Custo Total) / Receita Total * 100
```

### Estrutura de Resposta

```json
{
  "periodo": {
    "tipo": "mes",
    "inicio": "2026-02-01",
    "fim": "2026-02-28"
  },
  "metricas": {
    "obras_ativas": 5,              // Quantidade de obras com movimentação
    "total_medicoes": 150,          // Total de medições realizadas
    "custo_total": 15000.50,        // Somatória de custos (preco_custo * qtd)
    "receita_total": 22500.75,      // Somatória de vendas (preco_venda * qtd)
    "lucro_bruto": 7500.25,         // receita_total - custo_total
    "margem_percentual": 33.33      // (lucro / receita) * 100
  },
  "por_obra": [
    {
      "obra_id": "uuid",
      "obra_nome": "Edifício Primavera",
      "custo": 3000.00,
      "receita": 4500.00,
      "lucro": 1500.00,
      "margem": 33.33,
      "medicoes": 30
    }
  ]
}
```

### Casos de Uso

1. **Acompanhamento Mensal**: Monitorar lucratividade mês a mês
2. **Por Obra**: Identificar obras mais rentáveis
3. **Comparativo Temporal**: Analisar tendências comparando períodos

---

## 📋 Relatório de Medições

### Endpoint
```http
GET /relatorios/medicoes?page=1&limit=20&id_obra={uuid}&status_pagamento=ABERTO
```

### Estrutura de Resposta

```json
{
  "data": [
    {
      "id": "uuid",
      "data": "2026-02-07",
      "obra": "Edifício Primavera",              // Nome da obra (via relacionamento)
      "colaborador": "João Silva",                // Nome do colaborador
      "servico": "Pintura Parede",                // Identificação do serviço
      "quantidade": 25.50,                        // unidades executadas
      "status": "ABERTO",                         // StatusPagamentoEnum
      "excedente": false                          // Flag de excedente (flag_excedente)
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 350,
    "pages": 18
  }
}
```

### Campos de Filtro

- **id_obra**: UUID para filtrar por obra específica
- **status_pagamento**: ABERTO, PAGO, PROCESSANDO
- **page**: Número da página (começa em 1)
- **limit**: Itens por página (max 100)

### Casos de Uso

1. **Auditoria**: Verificar todas as medições de um período
2. **Cobrança**: Filtrar por status para saber o que cobrar
3. **Obra Específica**: Acompanhar execução de apenas uma obra

---

## 👥 Relatório de Produtividade

### Endpoint
```http
GET /relatorios/produtividade?periodo=mes&id_obra={uuid}
```

### Estrutura de Resposta

```json
{
  "periodo": {
    "tipo": "mes",
    "inicio": "2026-02-01",
    "fim": "2026-02-28"
  },
  "colaboradores": [
    {
      "colaborador_id": "uuid",
      "colaborador_nome": "João Silva",
      "total_medicoes": 45,                     // Quantidade de medições
      "total_unidades": 567.50,                 // Somatória de qtd_executada
      "obras": [                                 // Lista de obras onde trabalhou
        "Edifício Primavera",
        "Casa Vila"
      ],
      "media_por_medicao": 12.61                // total_unidades / total_medicoes
    }
  ],
  "total_colaboradores": 8,
  "unidades_totais": 4250.75
}
```

### Exemplo: Ranking de Produtividade

```json
[
  {
    "colaborador_nome": "João Silva",
    "total_unidades": 567.50,
    "media_por_medicao": 12.61
  },
  {
    "colaborador_nome": "Maria Santos",
    "total_unidades": 480.25,
    "media_por_medicao": 10.89
  }
]
```

### Casos de Uso

1. **Avaliação de Desempenho**: Comparar produtividade entre colaboradores
2. **Bônus por Produtividade**: Identificar top performers
3. **Alocação de Recursos**: Distribuir colaboradores em novos projetos

---

## 💹 Relatório de Margem de Lucro

### Endpoint
```http
GET /relatorios/margem-lucro?page=1&limit=20&id_obra={uuid}
```

### Estrutura de Resposta

```json
{
  "data": [
    {
      "id": "uuid",
      "obra": "Edifício Primavera",
      "servico": "Pintura Parede",
      "preco_custo": 50.00,
      "preco_venda": 75.00,
      "margem_percentual": 50.00,                // Calculada no BD: (venda-custo)/custo*100
      "status": "APROVADO",                      // StatusAprovacaoEnum
      "vezes_utilizado": 125,                    // Contagem de medições com esse serviço
      "atende_minimo": true                      // margem_percentual >= 20%
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "pages": 8,
    "margem_media": 32.45                        // Média de todas as margens
  }
}
```

### Validação de Margem

```
Margem Aceitável = percentual >= 20%
atende_minimo = margem_percentual >= 20
```

### Casos de Uso

1. **Análise de Rentabilidade**: Ver quais serviços são mais lucrativos
2. **Renegociação**: Identificar serviços com margem baixa
3. **Orçamentação**: Base para novos projetos

---

## 🔄 Fluxo de Dados

### Dashboard Financeiro
```
medicao (id_alocacao, qtd_executada, data_medicao)
    ↓
alocacao (id_servico_catalogo)
    ↓
tabela_preco (preco_custo, preco_venda, status_aprovacao)
    ↓
Cálculo: Custo = qtd * preco_custo
         Receita = qtd * preco_venda
         Lucro = Receita - Custo
```

### Relatório de Produtividade
```
medicao (qtd_executada, data_medicao)
    ↓
alocacao (id_colaborador)
    ↓
colaborador (nome_completo)
    ↓
Agrupamento por colaborador
Cálculo: total_unidades = SUM(qtd_executada)
         media = total_unidades / total_medicoes
```

---

## 🧪 Testes E2E

Arquivo: `backend/test/relatorios.e2e-spec.ts`

### Cobertura de Testes (35 testes passando)

- ✅ Dashboard com diferentes períodos
- ✅ Filtros por obra
- ✅ Lista de medições com paginação
- ✅ Relatório de produtividade
- ✅ Análise de margem de lucro
- ✅ Controle de acesso por role
- ✅ Validação de parâmetros
- ✅ Integridade de dados

### Executar Testes

```bash
cd backend
npm run test:e2e -- test/relatorios.e2e-spec.ts
```

---

## 🔧 Implementação Técnica

### Serviço (relatorios.service.ts)

```typescript
// 4 métodos principais
- getDashboardFinanceiro(periodo, idObra?)
- getRelatorioMedicoes(idObra, status, page, limit)
- getRelatorioProdutividade(periodo, idObra?)
- getRelatorioMargem(idObra, page, limit)

// Método auxiliar
- obterPeriodo(periodo): [Date, Date] // Calcula intervalo de datas
```

### Controlador (relatorios.controller.ts)

```typescript
// 4 endpoints GET protegidos
@Get('dashboard-financeiro')
@Roles('GESTOR', 'ADMIN')

@Get('medicoes')
@Roles('GESTOR', 'FINANCEIRO', 'ENCARREGADO', 'ADMIN')

@Get('produtividade')
@Roles('GESTOR', 'ENCARREGADO', 'ADMIN')

@Get('margem-lucro')
@Roles('GESTOR', 'FINANCEIRO', 'ADMIN')
```

### DTOs (relatorio.dto.ts)

```typescript
enum PeriodoEnum {
  DIA = 'dia',
  SEMANA = 'semana',
  MES = 'mes',
  ANO = 'ano',
}

// 4 DTO classes para validação de query parameters
GetDashboardFinanceiroDto
GetRelatorioMedicoesDto
GetRelatorioProdutividadeDto
GetRelatorioMargemDto
```

---

## 📊 Exemplos Práticos

### 1. Analisar Lucratividade Diária

```bash
curl -X GET "http://localhost:3000/api/v1/relatorios/dashboard-financeiro?periodo=dia" \
  -H "Authorization: Bearer {token}"
```

**Resposta**: Metricas do dia atual com lucro bruto e margem

### 2. Auditoria de Medições Pendentes

```bash
curl -X GET "http://localhost:3000/api/v1/relatorios/medicoes?status_pagamento=ABERTO&page=1" \
  -H "Authorization: Bearer {token}"
```

**Resposta**: Todas as medições em aberto para cobrança

### 3. Ranking de Colaboradores (Semana)

```bash
curl -X GET "http://localhost:3000/api/v1/relatorios/produtividade?periodo=semana" \
  -H "Authorization: Bearer {token}"
```

**Resposta**: Colaboradores ordenados por total_unidades (maior primeiro)

### 4. Serviços com Margem Baixa

```bash
curl -X GET "http://localhost:3000/api/v1/relatorios/margem-lucro" \
  -H "Authorization: Bearer {token}"
```

**Análise**: Identificar serviços onde `atende_minimo == false`

---

## ⚠️ Limitações e Considerações

1. **Performance**: Dashboard usa joins não-filtrados - pode ser lento com >10k medições
2. **Período**: Sempre usa data corrente como referência (sem suporte a períodos históricos)
3. **Cache**: Não implementado - considere adicionar Redis para dashboards frenquentes
4. **Audição**: Não registra visualização de relatórios (Audit Log)

---

## 🚀 Roadmap Futuro

- [ ] Exportar relatórios em PDF
- [ ] Agendamento de relatórios por email
- [ ] Período customizado (data_inicio até data_fim)
- [ ] Filtro por intervalo de margem
- [ ] Gráficos no painel (dashboards dinâmicos)
- [ ] Cache Redis para períodos fixos (dia/semana/mes)

---

**Versão**: 1.0.0  
**Última Atualização**: 07/02/2026  
**Status**: ✅ Produção
