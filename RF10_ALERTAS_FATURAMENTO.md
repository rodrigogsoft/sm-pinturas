# RF10 - Alertas de Faturamento

**Sprint:** 1  
**Prioridade:** P0  
**Status:** ✅ Completo  
**Data:** 10/02/2026

## 📋 Descrição

Sistema automatizado de alertas para prazos de faturamento de medições, com notificações enviadas 2 dias antes do vencimento aos usuários relevantes (Admin, Gestor, Financeiro).

## 🎯 Objetivos Alcançados

### 1. Infraestrutura de Jobs
- ✅ Módulo de jobs configurado com BullMQ
- ✅ Integração com Redis para processamento assíncrono
- ✅ Sistema de agendamento com cron jobs

### 2. Job de Verificação de Prazos
- ✅ Execução diária automatizada (9h)
- ✅ Busca medições com prazo iminente (≤ 2 dias)
- ✅ Filtragem de medições não faturadas

### 3. Sistema de Notificações
- ✅ Integração com NotificacoesService
- ✅ Notificações para perfis: Admin, Gestor, Financeiro
- ✅ Priorização baseada em urgência (ALTA para ≤1 dia, MEDIA para 2 dias)
- ✅ Mensagens contextualizadas (HOJE, AMANHÃ, X dias)

### 4. Extensões de Schema
- ✅ Novos campos em `tb_medicoes`:
  - `data_prevista_faturamento` (DATE)
  - `data_faturamento_realizado` (DATE)
  - `id_obra` (UUID) - denormalização para performance
- ✅ Migration 003 criada e documentada
- ✅ Índice otimizado para consultas de alertas

## 📁 Arquivos Criados/Modificados

### Novos Arquivos

#### Backend - Módulo Jobs
```
backend/src/modules/jobs/
├── jobs.module.ts                              # Configuração do módulo
├── services/
│   └── alertas-faturamento.service.ts         # Lógica de negócio
└── processors/
    └── alertas-faturamento.processor.ts       # Processador de jobs
```

#### Migrations
```
backend/database/migrations/
└── 003_add_faturamento_fields.sql             # Campos de faturamento
```

### Arquivos Modificados

#### Entities
- `backend/src/modules/medicoes/entities/medicao.entity.ts`
  - Adicionados campos: `data_prevista_faturamento`, `data_faturamento_realizado`, `id_obra`
  - Adicionado relacionamento com Obra

#### Configuração
- `backend/src/app.module.ts`
  - Import e registro do JobsModule

#### Schema
- `backend/database/init.sql`
  - Atualizada estrutura de `tb_medicoes` com novos campos

## 🔧 Detalhes Técnicos

### Agendamento de Jobs

**Padrão Cron:** `0 9 * * *` (diariamente às 9h)

```typescript
await this.alertasQueue.add(
  'verificar-prazos-faturamento',
  {},
  {
    repeat: {
      pattern: '0 9 * * *',
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
);
```

### Lógica de Verificação

1. **Busca Medições:**
   - `data_prevista_faturamento` ≤ hoje + 2 dias
   - `data_faturamento_realizado` IS NULL

2. **Cálculo de Prioridade:**
   - 0 dias → ALTA (vence HOJE)
   - 1 dia → ALTA (vence AMANHÃ)
   - 2 dias → MEDIA (vence em 2 dias)

3. **Criação de Notificações:**
   - Tipo: `CICLO_FATURAMENTO`
   - Destinatários: Admin, Gestor, Financeiro
   - Dados extras: `id_medicao`, `id_obra`, `data_prevista`, `dias_restantes`

### Relacionamentos Otimizados

**Denormalização Controlada:**
- Campo `id_obra` adicionado em `tb_medicoes` para evitar joins complexos:
  ```
  Medicao → AlocacaoTarefa → ItemAmbiente → Ambiente → Pavimento → Obra
  ```
- Migration popula automaticamente `id_obra` para registros existentes

### Mensagens Contextualizadas

```typescript
// Vence hoje
"⚠️ URGENTE: O prazo de faturamento da medição #abc123 da obra "Prédio Central" (ACME Corp) vence HOJE!"

// Vence amanhã
"⏰ Atenção: O prazo de faturamento da medição #abc123 da obra "Prédio Central" (ACME Corp) vence AMANHÃ!"

// Vence em 2 dias
"📅 Lembrete: O prazo de faturamento da medição #abc123 da obra "Prédio Central" (ACME Corp) vence em 2 dias."
```

## 🔍 Validações Implementadas

1. **Data Prevista Obrigatória:**
   - Alerta só é criado se `data_prevista_faturamento` não for null
   - Log de warning para medições sem data prevista

2. **Faturamento Realizado:**
   - Medições com `data_faturamento_realizado` preenchida são ignoradas

3. **Tratamento de Erros:**
   - Try-catch individual por notificação
   - Logs detalhados de sucesso/falha
   - Job não é interrompido se uma notificação falhar

## 📊 Integrações

### NotificacoesService
- Método: `create(CreateNotificacaoDto)`
- Campos utilizados:
  - `id_usuario_destinatario`
  - `tipo: CICLO_FATURAMENTO`
  - `titulo: "Alerta de Faturamento"`
  - `mensagem` (contextualizada)
  - `prioridade: ALTA | MEDIA`
  - `dados_extras` (JSON com detalhes)
  - `id_entidade_relacionada: medicao.id`
  - `tipo_entidade: "medicao"`

### Redis & BullMQ
- Fila: `alertas-faturamento`
- Job: `verificar-prazos-faturamento`
- Configuração: `backend/src/config/redis.config.ts`
- Variáveis de ambiente:
  - `REDIS_HOST` (default: localhost)
  - `REDIS_PORT` (default: 6379)
  - `REDIS_PASSWORD`
  - `REDIS_DB` (default: 0)

## 🚀 Inicialização

O job é agendado automaticamente ao iniciar a aplicação:

```typescript
// jobs.module.ts
export class JobsModule implements OnModuleInit {
  async onModuleInit() {
    await this.alertasFaturamentoService.agendarVerificacaoDiaria();
    this.logger.log('Jobs agendados com sucesso');
  }
}
```

## 🧪 Testes Recomendados

### Teste Manual
1. Criar medição com `data_prevista_faturamento` = hoje + 1 dia
2. Aguardar execução do job (ou trigger manual)
3. Verificar criação de notificações para Admin/Gestor/Financeiro
4. Validar prioridade ALTA
5. Verificar mensagem "vence AMANHÃ"

### Teste E2E Sugerido
```typescript
describe('RF10 - Alertas de Faturamento', () => {
  it('deve criar alertas para medições com prazo próximo', async () => {
    // Criar medição com prazo em 1 dia
    // Executar job verificarPrazosFaturamento()
    // Verificar notificações criadas
    // Validar usuários notificados (Admin, Gestor, Financeiro)
    // Validar prioridade e mensagem
  });

  it('deve ignorar medições já faturadas', async () => {
    // Criar medição com data_faturamento_realizado preenchida
    // Executar job
    // Verificar que nenhuma notificação foi criada
  });
});
```

## 📈 Monitoramento

### Logs Gerados
- `Iniciando verificação de prazos de faturamento...`
- `Encontradas X medições com prazo próximo`
- `Alerta criado para usuário {nome} ({email}) - Medição {id}`
- `Medição {id} sem data_prevista_faturamento. Pulando alerta.`
- `Verificação de prazos concluída com sucesso`

### Métricas Sugeridas
- Total de medições verificadas
- Total de alertas criados
- Taxa de sucesso de notificações
- Tempo médio de processamento

## 🔗 Relacionamentos com Outras Features

### Dependências
- **RF05 - Sistema de Notificações:** Base para envio de alertas
- **Medições:** Entity estendida com campos de faturamento

### Próximos Passos (Sprint 2+)
- **RF09 - Push Notifications:** Alertas via mobile
- **Painel de Gestão de Alertas:** Visualização de alertas agendados
- **Configuração de Prazos:** Personalizar dias de antecedência (atualmente fixo: 2 dias)

## ✅ Compliance ERS 4.0

| Requisito | Status | Observação |
|-----------|--------|------------|
| RF10.1 - Job agendado | ✅ | Cron diário às 9h |
| RF10.2 - Verificação 2 dias antes | ✅ | Implementado |
| RF10.3 - Notificação perfis relevantes | ✅ | Admin, Gestor, Financeiro |
| RF10.4 - Priorização de alertas | ✅ | ALTA/MEDIA baseado em dias |
| RF10.5 - Dados contextualizados | ✅ | Obra, cliente, dias restantes |

---

**Status Final:** Sprint 1 - 100% Completo ✅
- RF04 - Workflow de Preços ✅
- RN02 - Exceção Admin em Medições ✅
- RF10 - Alertas de Faturamento ✅
