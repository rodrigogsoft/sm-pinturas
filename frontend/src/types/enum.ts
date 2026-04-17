/**
 * Enums compartilhados com o backend
 * Mantém sincronização entre frontend e backend
 */

export enum StatusSessaoEnum {
  ABERTA = 'ABERTA',
  ENCERRADA = 'ENCERRADA',
}

export enum PerfilEnum {
  ADMIN = 1,
  GESTOR = 2,
  FINANCEIRO = 3,
  ENCARREGADO = 4,
}

export enum StatusAprovacoesEnum {
  RASCUNHO = 'RASCUNHO',
  PENDENTE = 'PENDENTE',
  APROVADO = 'APROVADO',
  REJEITADO = 'REJEITADO',
}
