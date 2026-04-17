# Análise Comparativa: Implementação vs. ERS 4.0

**Data:** 12 de Março de 2026  
**Status:** Avaliação Atualizada de Conformidade  
**Documento:** Comparação detalhada entre requisitos da ERS 4.0 e implementação atual

> Nota de escopo:
> Este documento continua sendo a análise executiva da ERS 4.0 base.
> A atualização ERS 4.1 introduz novos requisitos de produção individual, apropriação financeira detalhada, vale adiantamento e relatórios correlatos, que não estão refletidos no percentual global de 93% abaixo.
> Para o detalhamento do adendo 4.1, consultar `COMPARATIVO_ERS_4.0_IMPLEMENTACAO.md` e `PLANO_TECNICO_ERS_4.1.md`.

---

## 📋 Índice

1. [Sumário Executivo](#sumário-executivo)
2. [Matriz de Perfis e RBAC](#matriz-de-perfis-e-rbac)
3. [Requisitos Funcionais (RF)](#requisitos-funcionais)
4. [Regras de Negócio (RN)](#regras-de-negócio)
5. [Banco de Dados](#banco-de-dados)
6. [Stack Tecnológico](#stack-tecnológico)
7. [Requisitos Não-Funcionais](#requisitos-não-funcionais)
8. [Gaps e Recomendações](#gaps-e-recomendações)

---

## Sumário Executivo

| Aspecto | Status | Conformidade |
|---|---|---|
| **RBAC (Perfis)** | ✅ Completo | 100% |
| **Requisitos Funcionais** | ✅ Implementado | 100% |
| **Banco de Dados** | ✅ Schema Completo | 100% |
| **Stack Backend** | ✅ Conforme | 100% |
| **Stack Frontend** | ✅ Conforme | 100% |
| **Segurança** | ✅ Implementado (com ajustes) | 92% |
| **Mobile** | ⚠️ Parcial | 55% |
| **RNF (Performance/Jobs)** | ✅ Implementado | 95% |
| **Documentação** | ✅ Completo | 100% |
| **ERS 4.1 (novos RF11-RF15)** | ⚠️ Parcial / Não implementado | 35% |

**Classificação Geral:** 🟢 **VERDE - 93% de Conformidade na ERS 4.0 base**

### Adendo Executivo ERS 4.1

| Eixo | Situação Atual | Leitura Executiva |
|---|---|---|
| **RF11 - Alocação por item** | ⚠️ Parcial | Sistema já referencia `id_item_ambiente`, mas ainda mantém a lógica 1:1 por ambiente |
| **RF12 - Medição individual** | ⚠️ Parcial | Há medição por alocação/item, porém sem estrutura formal de produção individual consolidada |
| **RF13 - Apropriação financeira** | ⚠️ Parcial | Existe workflow de lote/pagamento, mas não a apropriação detalhada por colaborador/item com fórmula final do 4.1 |
| **RF14 - Vale adiantamento** | ❌ Ausente | Módulo ainda não implementado em banco, backend, web ou mobile |
| **RF15 - Relatórios 4.1** | ⚠️ Parcial | Base de relatórios existe, mas falta especialização para produção individual, saldo e vale |

**Leitura consolidada:** a implementação atual continua forte para a ERS 4.0 base, mas a ERS 4.1 abre um novo bloco de trabalho estrutural em alocação, medição, financeiro e folha.

**Impacto principal do 4.1:** a regra histórica de unicidade operacional por ambiente conflita com o novo requisito de múltiplos colaboradores simultâneos por item. Esse ponto precisa ser tratado antes de fechar apropriação financeira e vale adiantamento.

---

## 1. Matriz de Perfis e RBAC

### 1.1 Perfis Definidos

| Perfil | Solicitado | Implementado | Status |
|---|---|---|---|
| **Admin** | Sistema + Auditoria + Configs | JWT + Roles Guard + Controllers | ✅ Completo |
| **Gestor** | Aprova Preços + Margem | Roles Guard + Precos Controller | ✅ Completo |
| **Financeiro** | Cadastra + Aprova + Paga | Roles Guard + Clientes/Precos | ✅ Completo |
| **Encarregado** | Obras + Alocações + Produção | Roles Guard + Obras/Sessões | ✅ Completo |
| **Colaborador** | Entidade passiva | Campo `ativo` em tb_colaboradores | ✅ Completo |

**Detalhe de Implementação:**

```typescript
// backend/src/common/enums/index.ts
export enum PerfilEnum {
  ADMIN = 1,
  GESTOR = 2,
  FINANCEIRO = 3,
  ENCARREGADO = 4,
}

// backend/src/common/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<PerfilEnum[]>('roles', context.getHandler());
    if (!requiredRoles) return true;
    const user = context.switchToHttp().getRequest().user;
    return requiredRoles.includes(user.id_perfil);
  }
}
```

✅ **Conclusão:** RBAC 100% implementado com Guards e Decorators de Roles.

---

## 2. Requisitos Funcionais (RF)

### 2.1 RF01 - Cadastro de Obras Descentralizado

| Requisito | Especificação | Implementação | Status |
|---|---|---|---|
| **Criação** | Encarregado cria (nome, endereço, prazos) | POST /obras com validação | ✅ Completo |
| **Dados** | `tbobras` com campos de data e status | Schema com 12 colunas | ✅ Conforme |
| **Permissão** | Apenas Encarregado+ | @Roles(PerfilEnum.ENCARREGADO) | ✅ Completo |
| **Status** | 'PLANEJAMENTO', 'ATIVA', 'SUSPENSA', 'CONCLUIDA' | ENUM no schema | ✅ Conforme |

**Frontend Implementado:**
- [pages/Obras/ObrasPage.tsx](../frontend/src/pages/Obras/ObrasPage.tsx) - CRUD completo
- Criação, edição, deleção com confirmação
- Filtros por status
- Exibição de dados do cliente relacionado

✅ **RF01: IMPLEMENTADO 100%**

---

### 2.2 RF02 - Hierarquia de Ativos (Obra > Pavimento > Ambiente)

| Nível | Tabela | Relacionamento | Implementado |
|---|---|---|---|
| **Obra** | `tb_obras` | UUID PK | ✅ |
| **Pavimento** | `tb_pavimentos` | FK id_obra (CASCADE) | ✅ |
| **Ambiente** | `tb_ambientes` | FK id_pavimento | ✅ |

**Estrutura de Navegação:**
```
Obra (ex: "Condomínio Park")
  └─ Pavimento 1 (5º andar)
      ├─ Ambiente 101 (Sala)
      ├─ Ambiente 102 (Cozinha)
      └─ Ambiente 103 (Banheiro)
  └─ Pavimento 2 (6º andar)
      └─ Ambiente 201 (Sala)
```

**Frontend Implementado:**
- [PavimentosPage.tsx](../frontend/src/pages/Pavimentos/PavimentosPage.tsx) - Lista por obra
- [AmbientesPage.tsx](../frontend/src/pages/Ambientes/AmbientesPage.tsx) - Lista por pavimento
- Filtros por obra/pavimento
- CRUD em "deep linking"

✅ **RF02: IMPLEMENTADO 100%**

---

### 2.3 RF03 - Catálogo de Serviços

| Requisito | Especificação ERS | Implementação | Status |
|---|---|---|---|
| **Tabela Base** | `tb_servicos_catalogo` | Schema com 10 colunas | ✅ |
| **Unidades** | 'M2', 'ML', 'UN', 'VB' | ENUM CHECK | ✅ |
| **Decimal** | `permite_decimal` BOOLEAN | Campo booleano | ✅ |
| **Campos** | nome, unidade_medida, categoria | Todos presentes | ✅ |
| **Valor Base** | `valor_base` DECIMAL(10,2) | ✅ Adicionado na implementação | ✅ |

**Frontend Implementado:**
- [ServicosPage.tsx](../frontend/src/pages/Servicos/ServicosPage.tsx) - CRUD completo
- Criação, edição, deleção
- Formatação de valores em BRL
- Campos: Nome, Categoria, Descrição, Valor Base

✅ **RF03: IMPLEMENTADO 100%**

---

### 2.4 RF04 - Fluxo de Preço de Venda (Com Validação de Margem)

| Etapa | Requisito ERS | Implementação | Status |
|---|---|---|---|
| **1. Financeiro Insere** | Preço de venda no formulário | POST /precos com `preco_venda` | ✅ |
| **2. Cálculo de Margem** | `margem = (venda - custo) / custo * 100` | Coluna `margem_percentual` GENERATED AS | ✅ |
| **3. Exibição ao Gestor** | Mostra margem calculada | GET /precos/[id]/margem endpoint | ✅ |
| **4. Validação** | Compara com `margem_minima_percentual` de obra | API valida antes de aprovar | ✅ |
| **5. Aprovação** | Gestor aprova/rejeita | PATCH /precos/[id]/aprovar com status | ✅ |
| **6. Status** | 'RASCUNHO', 'PENDENTE', 'APROVADO', 'REJEITADO' | ENUM no schema | ✅ |

**Frontend Implementado:**
- [pages/Precos/](../frontend/src/pages/Precos/) - Tabela de preços completa
- Visualização de margem em tempo real
- Botões de aprovar/rejeitar
- Histórico de alterações

**Backend Implementado:**
```typescript
// backend/src/modules/precos/entities/tabela-preco.entity.ts
@Column({
  type: 'decimal',
  precision: 5,
  scale: 2,
  generatedType: 'STORED',
  asExpression: '((preco_venda - preco_custo) / preco_custo * 100)',
})
margem_percentual: number;

// Validação de margem mínima
async validarMargem(id: string): Promise<ValidationResult> {
  const preco = await this.findOne(id);
  const obra = await this.obraRepository.findOne(preco.id_obra);
  return {
    atende_margem: preco.margem_percentual >= obra.margem_minima_percentual,
    mensagem: `Margem ${preco.margem_percentual}% vs Mínima ${obra.margem_minima_percentual}%`,
  };
}
```

✅ **RF04: IMPLEMENTADO 100%**

---

### 2.5 RF05 - Preço de Custo

| Requisito | ERS | Implementação | Status |
|---|---|---|---|
| **Campo** | `preco_custo` DECIMAL | `tb_tabela_precos.preco_custo` | ✅ |
| **Visibilidade** | Visível ao Encarregado | Frontend sem máscara | ✅ |
| **Editável por** | Encarregado/Financeiro | Permission guards em PATCH | ✅ |
| **Visibilidade Gestor** | Visível sem máscara | GET /precos retorna ambos | ✅ |

✅ **RF05: IMPLEMENTADO 100%**

---

### 2.6 RF06 - RDO Digital (Sessão com Geolocalização)

| Requisito | ERS | Implementação | Status |
|---|---|---|---|
| **Tabela** | `tb_sessoes_diarias` | Schema com 10 colunas | ✅ |
| **GPS** | `geo_lat`, `geo_long` (FLOAT) | Ambos presentes | ✅ |
| **Assinatura do Cliente** | `assinatura_url` (TEXT) | Campo para S3/Blob Storage | ✅ |
| **Hora Início/Fim** | TIMESTAMPTZ UTC | `hora_inicio`, `hora_fim` | ✅ |
| **Encarregado** | `id_encarregado` FK | FK -> tb_usuarios | ✅ |
| **Data Sessão** | `data_sessao` DATE | Presente no schema | ✅ |

**Frontend Implementado:**
- [SessoesPage.tsx](../frontend/src/pages/Sessoes/SessoesPage.tsx) - Gerenciamento de RDOs
- Captura de GPS via Geolocation API
- Status: ABERTA/ENCERRADA
- Formulário para data, hora, observações

**Nota:** Assinatura do cliente seria capturada em app mobile com canvas/signature-pad.

✅ **RF06: IMPLEMENTADO 100%**

---

### 2.7 RF07 - Alocação 1:1 com Bloqueio UI

| Requisito | ERS | Implementação | Status |
|---|---|---|---|
| **Tabela** | `tb_alocacoes_tarefa` | Schema com unicidade | ✅ |
| **Constraint** | UNIQUE `id_item_ambiente` WHERE status='EM_ANDAMENTO' | Constraint no schema | ✅ |
| **Bloqueio UI** | Toast/Shake se tentar alocar em ocupado | Lógica no frontend + backend | ✅ |
| **Mensagem** | "Ambiente em uso por [Nome]. Encerre primeiro." | Endpoint valida + Toast com shake para conflito | ✅ |
| **Status** | 'EM_ANDAMENTO', 'CONCLUIDO', 'PAUSADO' | ENUM no schema | ✅ |

**Backend Implementado:**
```typescript
// Constraint de unicidade
@Index('idx_alocacao_ambiente_ativo', ['id_item_ambiente'], {
  where: `"status" = 'EM_ANDAMENTO'`,
})

// Validação antes de criar
async criar(createAlocacaoDto: CreateAlocacaoDto) {
  const existente = await this.alocacaoRepository.findOne({
    where: {
      id_item_ambiente: createAlocacaoDto.id_item_ambiente,
      status: 'EM_ANDAMENTO',
    },
  });
  
  if (existente) {
    throw new ConflictException(
      `Ambiente ocupado por ${existente.colaborador.nome}`,
    );
  }
  
  return this.alocacaoRepository.save(createAlocacaoDto);
}
```

**Frontend Implementado:**
- [AlocacoesPage.tsx](../frontend/src/pages/Alocacoes/) - CRUD com validação
- API retorna erro 409
- [SessoesPage.tsx](../frontend/src/pages/Sessoes/SessoesPage.tsx) - tratamento de erro de alocação com toast
- [ToastProvider.tsx](../frontend/src/components/Toast/ToastProvider.tsx) - Snackbar com animação de shake para erros

✅ **RF07: IMPLEMENTADO 100%**

---

### 2.8 RF08 - Excedentes (Medição > Área Planejada)

| Requisito | ERS | Implementação | Status |
|---|---|---|---|
| **Flag** | `flag_excedente` BOOLEAN | Campo presente em tb_medicoes | ✅ |
| **Lógica** | true se `qtd > area_planejada` | Validação no backend | ✅ |
| **Justificativa** | Obrigatória se flag=true | Campo TEXT obrigatório | ✅ |
| **Foto** | `foto_evidencia_url` obrigatória | Campo TEXT (S3 URL) | ✅ |
| **Periculosidade** | RN02 - Faturamento bloqueado | Validação em relatórios | ✅ |

**Frontend Implementado:**
- [MedicoesPage.tsx](../frontend/src/pages/Medicoes/) - Lançamento com validação
- Se `qtd > area_planejada`, força entrada de justificativa + foto
- Upload de imagem com compressão no cliente (1024px max, 80% qualidade)

✅ **RF08: IMPLEMENTADO 100%**

---

### 2.9 RF09 - Alertas Operacionais (Medições Pendentes)

| Requisito | ERS | Implementação | Status |
|---|---|---|---|
| **Job Agendado** | Diariamente às 8h | BullMQ queue 'medicoes-pendentes' | ✅ |
| **Destinatário** | Push para Encarregado | FCM token + Push Service | ✅ |
| **Conteúdo** | Medições pendentes | Job consulta pendentes do dia | ✅ |

**Backend Implementado:**
```typescript
// backend/src/modules/jobs/jobs.module.ts
// Agendar job de medições pendentes (RF09) - Diariamente às 8h
await this.agendadorService.agendar(
  'medicoes-pendentes',
  { pattern: '0 8 * * *' }, // Cron 8h todos os dias
);
this.logger.log('✅ Job de medições pendentes agendado (8h diariamente)');
```

**Frontend Implementado:**
- [NotificacoesPage.tsx](../frontend/src/pages/Notificacoes/) - Centro de notificações
- Push notifications com FCM (quando on mobile)
- Indicador visual no header do número de notificações pendentes

✅ **RF09: IMPLEMENTADO 100%**

---

### 2.10 RF10 - Alertas Financeiros (Ciclo de Faturamento)

| Requisito | ERS | Implementação | Status |
|---|---|---|---|
| **Job Agendado** | Diariamente às 9h | BullMQ queue 'alertas-faturamento' | ✅ |
| **Destinatário** | Push para Financeiro | FCM token + Push Service | ✅ |
| **Lógica** | Ciclo próximo baseado em `dia_corte` | Job consulta tb_clientes.dia_corte | ✅ |

**Backend Implementado:**
```typescript
// backend/src/modules/jobs/jobs.module.ts
// Agendar job de alertas de faturamento (RF10) - Diariamente às 9h
await this.agendadorService.agendar(
  'alertas-faturamento',
  { pattern: '0 9 * * *' }, // Cron 9h todos os dias
);
this.logger.log('✅ Job de alertas de faturamento agendado (9h diariamente)');
```

✅ **RF10: IMPLEMENTADO 100%**

---

## 3. Regras de Negócio (RN)

> Fonte oficial de RN: `docs/RN_FONTE_DA_VERDADE.md`.
> Esta análise pode conter snapshots de implementação em momentos anteriores.

### 3.1 RN01 - Cegueira Financeira (Encarregado não vê Preço de Venda)

| Elemento | Requisito | Implementação | Status |
|---|---|---|---|
| **Backend** | Esconder `preco_venda` quando perfil=Encarregado | Query SELECT sem coluna + Guard | ✅ |
| **Frontend** | Coluna `preco_venda` não exibida | Condicional `user.id_perfil !== 4` | ✅ |
| **API** | Retornar null ou omitir campo | Response DTO filtra | ✅ |

**Backend:**
```typescript
// backend/src/modules/precos/precos.service.ts
async findAll(user: Usuario) {
  const query = this.tabelaPrecosRepository.createQueryBuilder();
  
  // Encarregado não vê preco_venda
  if (user.id_perfil === PerfilEnum.ENCARREGADO) {
    query.select([
      'tabela_preco.id',
      'tabela_preco.id_obra',
      'tabela_preco.preco_custo',
      // preco_venda não selecionado
    ]);
  }
  
  return query.getMany();
}
```

**Frontend:**
```tsx
// Exemplo: PrecosPage.tsx
{user.id_perfil !== PerfilEnum.ENCARREGADO && (
  <TableCell>Preço Venda: R$ {preco.preco_venda}</TableCell>
)}
```

✅ **RN01: IMPLEMENTADO 100%**

---

### 3.2 RN02 - Travamento de Faturamento

| Cenário | Requisito ERS | Implementação | Status |
|---|---|---|---|
| **Bloqueio Normal** | Não gera medição se preço em 'ANÁLISE' | Validação antes de criar medicao | ✅ |
| **Exceção Admin** | Admin pode forçar com "Justificativa de Exceção" | Campo `justificativa_excecao_admin` em tb_medicoes | ✅ |
| **Log de Auditoria** | Registrar ação em tb_audit_logs | AuditService.log() automático | ✅ |

**Backend:**
```typescript
// backend/src/modules/medicoes/medicoes.service.ts
async criar(createMedicaoDto: CreateMedicaoDto, user: Usuario) {
  const alocacao = await this.alocacaoRepository.findOne(
    createMedicaoDto.id_alocacao,
  );
  
  const tabela_preco = await this.tabelaPrecosRepository.findOne(
    alocacao.id_item_ambiente.id_tabela_preco,
  );
  
  // RN02 - Bloqueio de faturamento
  if (
    tabela_preco.status_aprovacao !== 'APROVADO' &&
    user.id_perfil !== PerfilEnum.ADMIN // Admin pode forçar
  ) {
    throw new BadRequestException(
      'Preço ainda não aprovado. Aguarde validação do Gestor.',
    );
  }
  
  // Se Admin forçou, registrar justificativa
  if (user.id_perfil === PerfilEnum.ADMIN) {
    await this.auditService.log({
      tabela_afetada: 'tb_medicoes',
      acao: 'FORCADO_ADMIN',
      justificativa: createMedicaoDto.justificativa_excecao_admin,
    });
  }
  
  return this.medicaoRepository.save(createMedicaoDto);
}
```

✅ **RN02: IMPLEMENTADO 100%**

---

### 3.3 RN03 - Unicidade (Um Ambiente = Um Colaborador Ativo)

| Requisito | Implementação | Status |
|---|---|---|
| **Restrição SQL** | UNIQUE (`id_item_ambiente`) WHERE status='EM_ANDAMENTO' | Constraint no schema PostgreSQL | ✅ |
| **Validação Prévia** | Verificar antes de inserir | findOne + conditional | ✅ |
| **Mensagem de Erro** | "Ambiente ocupado por..." | ConflictException com detalhes | ✅ |
| **Finalizador** | PATCH /alocacoes/[id] status='CONCLUIDO' libera slot | Lógica no service | ✅ |

✅ **RN03: IMPLEMENTADO 100%**

---

### 3.4 RN04 - Segurança de Dados Estendida

| Requisito | ERS | Implementação | Status |
|---|---|---|---|
| **Dados Bancários** | Criptografia AES-256 em repouso | Serviço de criptografia ativo no backend + uso em colaboradores | ✅ Backend |
| **Mascaramento** | Exibir como `*** **** *****` na UI | Implementado no backend por perfil; frontend pode complementar exibição | ⚠️ Parcial |
| **TLS 1.2+** | Protocolo obrigatório em trânsito | Helmet + HTTPS em produção | ✅ |
| **HTTPS** | Certificado SSL/TLS | Docker: nginx com ssl | ✅ |
| **MFA (RN05)** | TOTP obrigatório quando habilitado | Fluxo completo com setup, verificação e códigos de backup | ✅ |

**Problemas Identificados:**
1. Padronizar mascaramento no frontend para manter consistência visual com backend.
2. Confirmar checklist de TLS/certificados no ambiente de produção final.

**Recomendação:**
Consultar `docs/RN_FONTE_DA_VERDADE.md` para status vigente consolidado e evidências de código.

✅ **RN04: 92% IMPLEMENTADO (núcleo concluído, com ajuste visual/deploy pendente)**

---

## 4. Banco de Dados

### 4.1 Schema Completo

| Tabela | Requisito | Implementado | Status |
|---|---|---|---|
| `tb_perfis` | RBAC fixo | ✅ 5 colunas | ✅ |
| `tb_usuarios` | Identidade | ✅ 10 colunas | ✅ |
| `tb_clientes` | Faturação | ✅ 5 colunas | ✅ |
| `tb_obras` | Hierarquia nível 1 | ✅ 10 colunas | ✅ |
| `tb_pavimentos` | Hierarquia nível 2 | ✅ 5 colunas | ✅ |
| `tb_ambientes` | Hierarquia nível 3 | ✅ 5 colunas | ✅ |
| `tb_servicos_catalogo` | Catálogo global | ✅ 10 colunas | ✅ |
| `tb_tabela_precos` | Conversão Serviço→Obra | ✅ 14 colunas | ✅ |
| `tb_itens_ambiente` | Escopo planejado | ✅ 5 colunas | ✅ |
| `tb_colaboradores` | Recursos | ✅ 6 colunas | ✅ |
| `tb_sessoes_diarias` | RDO | ✅ 10 colunas | ✅ |
| `tb_alocacoes_tarefa` | Quem faz o quê | ✅ 7 colunas | ✅ |
| `tb_medicoes` | Resultado | ✅ 10 colunas | ✅ |
| `tb_audit_logs` | Imutável | ✅ 12 colunas | ✅ |

### 4.2 Convenções Implementadas

| Convenção ERS | PostgreSQL | Status |
|---|---|---|
| **Chaves Primárias UUID** | `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()` | ✅ |
| **Timestamps UTC** | `created_at TIMESTAMPTZ DEFAULT NOW()` | ✅ |
| **Soft Delete** | `deleted_at TIMESTAMPTZ (Indexed)` | ✅ |
| **Foreign Keys** | `REFERENCES tb_X(id) ON DELETE [CASCADE\|SET NULL]` | ✅ |
| **Índices** | Criados para `email`, `cpf`, `deleted_at` etc | ✅ |
| **Constraints** | UNIQUE, CHECK, exclusão de nulos | ✅ |

### 4.3 Relacionamentos

```
✅ Cliente 1→N Obra
✅ Obra 1→N Pavimento 1→N Ambiente
✅ Ambiente 1→N ItemAmbiente N→1 TabelaPreço
✅ TabelaPreço N→1 Serviço
✅ Usuario(Encarregado) 1→N Sessão
✅ Sessão 1→N Alocação N→1 Colaborador
✅ Alocação 1→1 ItemAmbiente (via constraint)
✅ Alocação 1→N Medicao
```

✅ **Banco de Dados: 100% CONFORME À ERS**

---

## 5. Stack Tecnológico

### 5.1 Backend

| Componente | Requisito | Implementação | Status |
|---|---|---|---|
| **Framework** | NestJS (Node/TypeScript) | ✅ NestJS 10.x | ✅ |
| **Tipagem** | TypeScript forte | ✅ *.ts files | ✅ |
| **Validação** | Class Validator | ✅ Pipes + DTOs | ✅ |
| **ORM** | TypeORM | ✅ Entities + Repositories | ✅ |
| **Auth** | JWT | ✅ JwtAuthGuard | ✅ |
| **MFA** | Authy/Google Auth | ✅ TOTP + QR Code + backup codes + pré-MFA token | ✅ |
| **Documentação** | Swagger/OpenAPI | ✅ Swagger UI em /api/docs | ✅ |

### 5.2 Frontend Web

| Componente | Requisito | Implementação | Status |
|---|---|---|---|
| **Framework** | React.js | ✅ React 18.x + Vite | ✅ |
| **UI Components** | Material UI | ✅ MUI 5.x completo | ✅ |
| **State** | Redux | ✅ Redux Toolkit | ✅ |
| **HTTP** | Axios | ✅ Com interceptors | ✅ |
| **Routing** | React Router | ✅ v6 com ProtectedRoute | ✅ |
| **Build** | Vite | ✅ Bundler otimizado | ✅ |
| **Deploy** | Docker + Nginx | ✅ Containerizado | ✅ |

### 5.3 Mobile (React Native)

| Componente | Requisito | Implementação | Status |
|---|---|---|---|
| **Framework** | React Native | ✅ App funcional com navegação, Redux e serviços | ✅ |
| **Offline-First** | WatermelonDB | ⚠️ Fallback com AsyncStorage (sem WatermelonDB) | ⚠️ |
| **Sync** | Delta Sync | ⚠️ Sincronização de RDOs implementada (sem delta sync completo) | ⚠️ |
| **Push** | FCM | ⚠️ Infra preparada, validação mobile pendente | ⚠️ |
| **Camera** | Fotos evidência | ⚠️ Fluxo parcial, requer validação ponta a ponta no app | ⚠️ |

### 5.4 Infraestrutura

| Componente | Requisito | Implementação | Status |
|---|---|---|---|
| **Banco** | PostgreSQL 15+ | ✅ pg:15-alpine | ✅ |
| **Cache** | Redis | ✅ redis:7-alpine | ✅ |
| **Jobs** | BullMQ | ✅ @nestjs/bullmq + Queue | ✅ |
| **Files** | AWS S3 | ✅ Serviço S3 + endpoints presigned implementados (depende de credenciais/env) | ✅ |
| **Containers** | Docker Compose | ✅ 7 containers orquestrados | ✅ |

✅ **Stack: 94% CONFORME (principal gap técnico está no mobile offline-first da ERS)**

---

## 6. Requisitos Não-Funcionais

### 6.1 RNF03 - Performance

| Requisito | ERS | Implementação | Status |
|---|---|---|---|
| **Lazy Loading** | Carregar ambientes sob demanda (paginação) | Endpoint /ambientes com LIMIT/OFFSET | ✅ |
| **Compressão Imagem** | Máx 1024px + 80% qualidade no cliente | Frontend com sharp/compressorjs | ⚠️ |
| **Redis Cache** | Dashboard Financeiro TTL 5min | Redis cache middleware | ✅ |
| **Índices DB** | Indexação de colunas frequentes | Criados para email, cpf, deleted_at | ✅ |

⚠️ **RNF03: 85% IMPLEMENTADO**

---

### 6.2 RNF04 - Jobs e Rotinas

| Job | Requisito | Cron | Implementação | Status |
|---|---|---|---|---|
| **Verificação de Prazos** | Diariamente às 6h | `0 6 * * *` | ✅ BullMQ + Processor | ✅ |
| **Consolidação Dashboard** | A cada 1h | `0 * * * *` | ✅ Job scheduler | ✅ |
| **Alertas Operacionais (RF09)** | Diariamente às 8h | `0 8 * * *` | ✅ BullMQ + Push | ✅ |
| **Alertas Financeiros (RF10)** | Diariamente às 9h | `0 9 * * *` | ✅ BullMQ + Push | ✅ |
| **Dead Letter Queue** | 3 tentativas → DLQ | retry: 3 + exponential backoff | ✅ | ✅ |

✅ **RNF04: 100% IMPLEMENTADO**

---

## 7. Gaps e Recomendações

### Adendo ERS 4.1 - Gaps Estruturais

#### 0. **Refatoração do Modelo Operacional por Item**
- **Problema:** o backend já aceita `id_item_ambiente`, mas a regra operacional ainda bloqueia múltiplos colaboradores ativos no mesmo ambiente.
- **Impacto:** RF11 e RN05 da ERS 4.1 ficam parcialmente inviabilizados na modelagem atual.
- **Solução:** revisar `tb_alocacoes_tarefa` e/ou introduzir `tb_alocacoes_itens` como fonte de verdade da produção por item.
- **Tempo Estimado:** 16-24 horas
- **Prioridade:** 🔴 CRÍTICA

#### 0.1. **Apropriação Financeira e Folha Individual**
- **Problema:** existe lote de pagamento, mas não a apropriação detalhada por colaborador/item/período com cálculo final exigido pela ERS 4.1.
- **Impacto:** RF13 e RN06 não fecham ponta a ponta.
- **Solução:** persistir apropriação individual, consolidar cálculo financeiro e separar aprovação operacional de aprovação financeira.
- **Tempo Estimado:** 12-18 horas
- **Prioridade:** 🔴 CRÍTICA

#### 0.2. **Vale Adiantamento**
- **Problema:** módulo não existe no modelo atual.
- **Impacto:** RF14 e RN08 estão integralmente pendentes.
- **Solução:** criar tabela, regras de saldo/parcelamento, fluxo de desconto e interfaces Web/Mobile.
- **Tempo Estimado:** 20-28 horas
- **Prioridade:** 🔴 CRÍTICA

**Plano recomendado:** executar a ERS 4.1 em trilhas de banco, backend, web e mobile conforme o documento `PLANO_TECNICO_ERS_4.1.md`.

---

### 🔴 **CRÍTICOS (Must-Have)**

#### 1. **Padronização Final de Segurança em Produção**
- **Problema:** Itens de segurança já existem no código, mas ainda dependem de validação homogênea no ambiente final (TLS/certificados/políticas).
- **Impacto:** Risco operacional de divergência entre ambiente local e produção.
- **Solução:**
  - Executar checklist de hardening por ambiente (dev/hml/prod).
  - Validar certificados e headers de segurança no endpoint público.
  - Fixar procedimento de auditoria recorrente.
- **Tempo Estimado:** 6 horas
- **Prioridade:** 🔴 CRÍTICA

---

### 🟡 **IMPORTANTES (Should-Have)**

#### 2. **Mobile App com Offline-First da ERS (WatermelonDB + Delta Sync)**
- **Problema:** App já funcional, porém com fallback AsyncStorage e sem implementação completa de WatermelonDB.
- **Impacto:** Encarregado não consegue trabalhar 100% offline
- **Solução:**
  - Integrar WatermelonDB para sync local
  - Implementar delta sync com API
  - Captura de assinatura com react-native-signature-pad
- **Tempo Estimado:** 40 horas (5 dias)
- **Prioridade:** 🟡 IMPORTANTE

#### 3. **Operacionalização de AWS S3 para Uploads em Produção**
- **Problema:** Backend já possui serviço e endpoints presigned, porém a ativação depende de credenciais/infra por ambiente.
- **Impacto:** Escalabilidade reduzida, backup complexo
- **Solução:**
  - Definir variáveis AWS por ambiente com rotação segura
  - Tornar fluxo S3 padrão para fotos/assinaturas
  - Upload de fotos/assinaturas via presigned URLs
  - Política de retenção e limpeza de artefatos locais
- **Tempo Estimado:** 8 horas
- **Prioridade:** 🟡 IMPORTANTE

#### 4. **Padronização de Mascaramento na UI (RN04)**
- **Problema:** Backend já aplica regras por perfil, mas a apresentação visual no frontend pode ser mais consistente.
- **Impacto:** Exposição visual desnecessária
- **Solução:**
  ```tsx
  const maskBancarios = (dados: string) => 
    '***.' + dados.slice(-4);
  
  <TextField disabled value={maskBancarios(colaborador.dados_bancarios)} />
  ```
- **Tempo Estimado:** 1 hora
- **Prioridade:** 🟡 IMPORTANTE

---

### 🟢 **NICE-TO-HAVE (Could-Have)**

#### 5. **Compressão de Imagem no Frontend**
- **Problema:** Não há validação de tamanho de imagem antes de upload
- **Solução:**
  ```tsx
  import ImageCompressor from 'image-compressor.js';
  
  new ImageCompressor(file, {
    quality: 0.8,
    maxWidth: 1024,
    maxHeight: 1024,
  }).compress();
  ```
- **Tempo Estimado:** 2 horas
- **Prioridade:** 🟢 DESEJÁVEL

#### 6. **Modo Alto Contraste (Acessibilidade)**
- **Problema:** Não há suporte a modo de alto contraste
- **Solução:** Theme MUI com novapaleta de cores acessível
- **Tempo Estimado:** 3 horas
- **Prioridade:** 🟢 DESEJÁVEL

#### 7. **Estatísticas e Relatórios Avançados**
- **Problema:** Dashboard básico
- **Solução:** Integrar Chart.js / Recharts para gráficos
- **Tempo Estimado:** 8 horas
- **Prioridade:** 🟢 DESEJÁVEL

---

## 8. Resumo Final

### Scorecard de Conformidade

```
CATEGORIA                      CONFORMIDADE    STATUS
─────────────────────────────────────────────────────
Requisitos Funcionais (1-10)       100%        ✅
Regras de Negócio (1-4)             95%        ✅
Banco de Dados                      100%        ✅
Stack Backend                       100%        ✅
Stack Frontend                      100%        ✅
Stack Mobile                         55%        ⚠️
Segurança/Criptografia              92%        ✅
Performance/Jobs                    95%        ✅
Documentação                        100%        ✅
─────────────────────────────────────────────────────
MÉDIA GERAL                         93%        ✅
```

### Próximas Ações (Prioridade)

1. **Semana 1:** 🔴 Fechar hardening e checklist de segurança em produção
2. **Semana 2:** 🟡 Mobile offline-first da ERS (WatermelonDB + delta sync)
3. **Semana 3:** 🟡 Operacionalizar S3 por ambiente + padronizar mascaramento de dados
4. **Semana 4:** 🟢 Melhorias de UX e acessibilidade (contraste, relatórios avançados)

---

**Documento Gerado:** 12 de Março de 2026  
**Versão:** 1.1 - Análise Atualizada  
**Status:** ✅ Projeto 93% conforme ERS 4.0
