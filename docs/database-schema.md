# Arquitetura do Banco de Dados - JB Pinturas ERP

## Visão Geral

O banco de dados PostgreSQL 15+ foi projetado seguindo princípios de:
- **Distributed ID (UUID v4)**: Para suportar geração offline no mobile
- **Soft Delete**: Todas as tabelas possuem `deleted_at` para integridade histórica
- **Timestamps**: `created_at` e `updated_at` para Delta Sync
- **ACID Compliance**: Robustez em transações financeiras

---

## Domínios e Tabelas

### 1. Identidade e Segurança (IAM)

#### `tb_perfis`
Tabela estática que define os 4 perfis do sistema (RBAC).

| ID | Perfil | Descrição |
|----|--------|-----------|
| 1 | ADMINISTRADOR | Gestão completa do sistema |
| 2 | GESTOR | Aprovação de preços e margens |
| 3 | FINANCEIRO | Gestão de clientes e pagamentos |
| 4 | ENCARREGADO | Operação de campo (sem visão de preços de venda) |

**Campo Especial:**
- `permissoes_json` (JSONB): Matriz de capacidades dinâmicas

#### `tb_usuarios`
Usuários do sistema com autenticação JWT + MFA opcional.

**Campos Críticos:**
- `senha_hash`: Bcrypt/Argon2
- `mfa_secret`: TOTP secret para autenticação de dois fatores
- `fcm_token`: Token para Push Notifications (Firebase)

---

### 2. Estrutura de Obra (Engenharia)

#### Hierarquia
```
tb_clientes
  └── tb_obras
       └── tb_pavimentos
            └── tb_ambientes
                 └── tb_itens_ambiente
```

#### `tb_obras`
Obra principal com status de ciclo de vida.

**Status:**
- `PLANEJAMENTO`: Obra em fase de orçamento
- `ATIVA`: Em execução
- `SUSPENSA`: Temporariamente parada
- `CONCLUIDA`: Finalizada

**Índice Full-Text:**
```sql
CREATE INDEX idx_obras_nome ON tb_obras USING gin(nome gin_trgm_ops);
```
Permite busca fuzzy por nome da obra.

#### `tb_pavimentos`
Setorização da obra (ex: "5º Pavimento", "Térreo").

**Campo `ordem`**: Para ordenação visual na lista.

#### `tb_ambientes`
Local específico de trabalho (ex: "Apto 3401", "Escadaria Norte").

**Campo `status_bloqueio`**: Impede alocação quando TRUE (ex: obra embargada).

---

### 3. Financeiro e Precificação (Core)

#### `tb_catalogo_servicos`
Catálogo global de serviços padronizados.

**Unidades de Medida:**
- `M2`: Metro quadrado
- `ML`: Metro linear
- `UN`: Unidade
- `VB`: Verba fechada

**Campo `permite_decimal`**: Regra de interface (Bloqueia vírgula se false).

#### `tb_tabela_precos` ⚠️ CRÍTICO
Tabela que liga serviço à obra com **precificação dual**.

**Regra de Negócio (RN01 - Cegueira Financeira):**
- `preco_custo`: **Visível ao Encarregado** (valor a pagar ao colaborador)
- `preco_venda`: **Oculto ao Encarregado** (valor a receber do cliente)

**Campo Calculado:**
```sql
margem_percentual DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
        WHEN preco_custo > 0 THEN ((preco_venda - preco_custo) / preco_custo * 100)
        ELSE 0
    END
) STORED
```

**Status de Aprovação:**
1. **PENDENTE**: Financeiro inseriu, aguardando Gestor
2. **APROVADO**: Gestor validou a margem
3. **REJEITADO**: Margem insuficiente ou erro

**Constraint Única:**
```sql
UNIQUE(id_obra, id_servico_catalogo, deleted_at)
```
Impede duplicação de preço para o mesmo serviço na mesma obra.

---

### 4. Operação de Campo (Offline Sync)

#### `tb_colaboradores`
Recursos humanos que executam os serviços.

**Campo Criptografado:**
- `dados_bancarios_enc`: Criptografado AES-256 no nível da aplicação (não no PostgreSQL)

#### `tb_sessoes_diarias` (RDO)
Relatório Diário de Obra - Sessão de trabalho do encarregado.

**Campos de Geolocalização:**
- `geo_lat`, `geo_long`: Para validar presença no canteiro

#### `tb_alocacoes_tarefa` ⚠️ CRÍTICO
**Regra de Negócio (RN03 - Unicidade):** Um ambiente = Um colaborador ativo.

**Constraint de Unicidade:**
```sql
CREATE UNIQUE INDEX idx_alocacoes_unicidade_ambiente 
ON tb_alocacoes_tarefa(id_item_ambiente) 
WHERE status = 'EM_ANDAMENTO' AND deleted_at IS NULL;
```

Garante que:
- Se Colaborador A está trabalhando no Ambiente X
- Colaborador B **NÃO PODE** ser alocado no Ambiente X até A finalizar

**Tratamento na UI (RF07):**
- Feedback visual (Toast/Shake)
- Mensagem: *"Ambiente em uso por [Nome]. Encerre a tarefa anterior primeiro."*

#### `tb_medicoes`
Resultado final da produção.

**Campo `flag_excedente`:**
```sql
flag_excedente = TRUE quando qtd_executada > area_planejada
```

**Obrigatoriedade (RF08):**
- Se `flag_excedente = TRUE`:
  - Campo `justificativa` é obrigatório
  - Campo `foto_evidencia_url` é obrigatório

---

### 5. Auditoria e Logs

#### `tb_audit_logs`
Tabela **IMUTÁVEL** (append-only) para rastreabilidade completa.

**Campos:**
- `payload_antes`: Snapshot do registro antes da alteração
- `payload_depois`: Snapshot após a alteração
- `acao`: INSERT, UPDATE, DELETE, APPROVE

**Uso:**
- Compliance
- Investigação de fraudes
- Rollback de dados

---

## Views Materializadas

### `vw_obras_completas`
Visão consolidada das obras com:
- Dados do cliente
- Nome do encarregado responsável
- Total de pavimentos e ambientes

### `vw_dashboard_financeiro` ⚠️ CRÍTICO
Dashboard de lucratividade por obra.

**Métricas:**
- `custo_total`: Soma de (qtd_executada × preco_custo)
- `receita_total`: Soma de (qtd_executada × preco_venda)
- `lucro_bruto`: receita_total - custo_total
- `margem_percentual`: (lucro_bruto / receita_total) × 100

**Performance:**
- Cachear no Redis (TTL 5 min)
- Usar BullMQ para atualização periódica

---

## Estratégias de Performance

### 1. Índices Full-Text Search (pg_trgm)
```sql
CREATE INDEX idx_obras_nome ON tb_obras USING gin(nome gin_trgm_ops);
```
Permite busca fuzzy: "pintura" encontra "Pinturas JB"

### 2. Índices Compostos
```sql
CREATE INDEX idx_pavimentos_ordem ON tb_pavimentos(id_obra, ordem);
```
Otimiza ordenação de pavimentos por obra.

### 3. Partial Indexes
```sql
CREATE INDEX idx_usuarios_ativos ON tb_usuarios(id) WHERE deleted_at IS NULL;
```
Índice apenas para registros não deletados.

---

## Triggers Automáticos

### 1. Update Timestamp
```sql
CREATE TRIGGER trigger_update_timestamp
BEFORE UPDATE ON tb_*
EXECUTE FUNCTION update_updated_at_column();
```
Atualiza `updated_at` automaticamente em toda alteração.

---

## Estratégia de Sync Offline (Mobile)

### 1. Delta Sync
O mobile sincroniza apenas registros alterados.

**Query no Mobile:**
```sql
SELECT * FROM tb_obras 
WHERE updated_at > :last_sync_timestamp
```

### 2. Conflict Resolution
**Estratégia:** Last-Write-Wins (LWW)
- Se dois dispositivos editam o mesmo registro offline
- O que sincronizar por último vence
- `updated_at` é a chave de desempate

### 3. UUID v4
Gerado no cliente para evitar colisões:
```typescript
import { v4 as uuidv4 } from 'uuid';
const newObra = { id: uuidv4(), nome: 'Obra Nova' };
```

---

## Segurança

### 1. Row-Level Security (RLS)
Future implementation para isolamento multi-tenant.

### 2. Criptografia
**Em Repouso:**
- `dados_bancarios_enc`: AES-256 no backend
- Chave armazenada em variável de ambiente `ENCRYPTION_KEY`

**Em Trânsito:**
- TLS 1.2+ obrigatório
- Certificado Let's Encrypt

### 3. Mascaramento de Dados
**Interface:**
```typescript
// Perfil ENCARREGADO vê:
preco_venda: '***'

// Perfil GESTOR vê:
preco_venda: 150.00
```

---

## Backup e Recuperação

### Estratégia
1. **Incremental**: Diário às 02:00 AM
2. **Completo**: Semanal aos domingos
3. **Retenção**: 30 dias

### Comando
```bash
pg_dump -h localhost -U jb_admin -F c -b -v -f backup_$(date +%Y%m%d).dump jb_pinturas_db
```

---

## Migrations

### Ferramenta
TypeORM Migrations

### Comandos
```bash
# Gerar migration
npm run migration:generate -- src/database/migrations/NomeDaMigration

# Executar migrations
npm run migration:run

# Reverter última migration
npm run migration:revert
```

---

## Monitoramento

### Queries Lentas
```sql
-- Top 10 queries mais lentas
SELECT 
    query,
    mean_exec_time,
    calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Conexões Ativas
```sql
SELECT count(*) FROM pg_stat_activity;
```

---

## Glossário Técnico

| Termo | Significado |
|-------|-------------|
| **Delta Sync** | Sincronização incremental (apenas diferenças) |
| **Soft Delete** | Exclusão lógica (flag deleted_at) sem remoção física |
| **UUID v4** | Identificador único universal (128 bits) |
| **RBAC** | Role-Based Access Control |
| **JSONB** | JSON binário (indexável no PostgreSQL) |
| **pg_trgm** | Extensão para busca fuzzy (trigrams) |

---

**Última Atualização:** Fevereiro 2026  
**Versão:** 1.0  
**Responsável:** Arquiteto de Banco de Dados
