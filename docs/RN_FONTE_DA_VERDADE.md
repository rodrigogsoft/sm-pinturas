# Fonte Oficial - Regras de Negocio (RN)

Data de consolidacao: 12 de marco de 2026

Este documento e a fonte oficial de status das RN do projeto.

## Hierarquia de referencia

1. Codigo do backend e migrations ativas
2. Este documento
3. ERS base em docs/ERS-v4.0.md
4. Documentos de analise e comparativos (snapshot historico)

Se houver conflito entre documentos, considerar o codigo + este arquivo como verdade atual.

## RN01 - Cegueira Financeira

Regra:
- Encarregado nao pode visualizar preco_venda nem metadados de aprovacao de preco.

Status atual:
- Implementado no backend.
- Implementado no frontend web para coluna de preco de venda.

Evidencias de implementacao:
- backend/src/modules/precos/precos.controller.ts
- backend/src/common/utils/sensitive-data.filter.ts

## RN02 - Travamento de Faturamento

Regra:
- Nao gerar medicao/lote com preco nao aprovado.
- Excecao para Admin mediante justificativa.

Status atual:
- Implementado na criacao de medicao.
- Implementado na geracao de lote financeiro.
- Excecao Admin presente com justificativa no fluxo de medicao.

Evidencias de implementacao:
- backend/src/modules/medicoes/medicoes.service.ts
- backend/src/modules/medicoes/dto/create-medicao.dto.ts
- backend/src/modules/financeiro/financeiro.service.ts

## RN03 - Unicidade 1:1 de Alocacao

Regra:
- Um ambiente so pode ter um colaborador ativo por vez.
- Um colaborador nao pode estar ativo em dois ambientes ao mesmo tempo.

Status atual:
- Implementado com validacao de servico.
- Implementado com indice unico parcial para alocacao ativa na modelagem.

Evidencias de implementacao:
- backend/src/modules/alocacoes/alocacoes.service.ts
- backend/src/modules/alocacoes/entities/alocacao-tarefa.entity.ts

## RN04 - Seguranca de Dados Estendida

Regra:
- Criptografia AES-256 para dados sensiveis em repouso.
- Mascaramento de dados sensiveis por perfil.
- TLS para dados em transito em ambiente produtivo.

Status atual:
- Criptografia implementada no backend (AES-256-GCM).
- Mascaramento implementado no backend por perfil.
- TLS depende da configuracao de deploy.

Evidencias de implementacao:
- backend/src/common/crypto/crypto.service.ts
- backend/src/common/utils/sensitive-data.filter.ts
- backend/src/modules/colaboradores/colaboradores.service.ts

## Nota sobre documentos antigos

Documentos de analise podem manter snapshots de periodos anteriores e, por isso, podem citar lacunas ja corrigidas.
Ao atualizar qualquer documento de status, referenciar este arquivo na secao de RN.
