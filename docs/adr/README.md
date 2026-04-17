# Architecture Decision Records (ADR)

Este diretório contém os registros de decisões arquiteturais importantes do projeto.

## O que é um ADR?

Um Architecture Decision Record (ADR) é um documento que captura uma decisão arquitetural importante, incluindo seu contexto e consequências.

## Formato

Cada ADR segue este formato:

```markdown
# ADR-XXX: Título da Decisão

## Status
[Proposto | Aceito | Rejeitado | Descontinuado | Substituído por ADR-YYY]

## Contexto
Por que precisamos tomar esta decisão?

## Decisão
O que decidimos fazer?

## Consequências
### Positivas
- Benefício 1
- Benefício 2

### Negativas
- Trade-off 1
- Trade-off 2

## Alternativas Consideradas
- Alternativa 1: Por que não foi escolhida
- Alternativa 2: Por que não foi escolhida
```

## Índice de ADRs

| ID | Título | Status | Data |
|----|--------|--------|------|
| [001](001-escolha-nestjs-backend.md) | Escolha do NestJS para Backend | ✅ Aceito | 2026-02-06 |
| [002](002-watermelondb-mobile.md) | WatermelonDB para Offline-First Mobile | ✅ Aceito | 2026-02-06 |
| [003](003-postgresql-banco-dados.md) | PostgreSQL como Banco de Dados Principal | ✅ Aceito | 2026-02-06 |
| [004](004-uuid-distributed-id.md) | UUID v4 para Chaves Primárias | ✅ Aceito | 2026-02-06 |
| [005](005-monorepo-structure.md) | Estrutura de Monorepo | ✅ Aceito | 2026-02-06 |

## Como Criar um Novo ADR

1. Copie o template: `cp template.md 00X-titulo-decisao.md`
2. Preencha todas as seções
3. Discuta com a equipe
4. Após aprovação, mude status para "Aceito"
5. Adicione à tabela de índice acima
6. Commit no repositório

## Princípios

- **Imutabilidade**: ADRs não devem ser deletados, apenas marcados como "Substituído"
- **Objetividade**: Foque em fatos e trade-offs, não opiniões
- **Concisão**: Seja claro e direto ao ponto
- **Rastreabilidade**: Referencie issues, PRs e discussões relevantes

## Recursos

- [ADR GitHub Org](https://adr.github.io/)
- [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
