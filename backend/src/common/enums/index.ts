/**
 * Enums globais do sistema baseados na ERS v4.0
 */

export enum PerfilEnum {
  ADMIN = 1,
  GESTOR = 2,
  FINANCEIRO = 3,
  ENCARREGADO = 4,
}

export enum StatusUsuarioEnum {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
}

export enum StatusObraEnum {
  PLANEJAMENTO = 'PLANEJAMENTO',
  AGUARDANDO = 'AGUARDANDO',
  ATIVA = 'ATIVA',
  SUSPENSA = 'SUSPENSA',
  CONCLUIDA = 'CONCLUIDA',
}

export enum UnidadeMedidaEnum {
  M2 = 'M2',
  ML = 'ML',
  UN = 'UN',
  VB = 'VB',
}

export enum StatusAprovacaoEnum {
  PENDENTE = 'PENDENTE',
  APROVADO = 'APROVADO',
  REJEITADO = 'REJEITADO',
}

export enum StatusAlocacaoEnum {
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  CONCLUIDO = 'CONCLUIDO',
  PAUSADO = 'PAUSADO',
}

export enum StatusPagamentoEnum {
  ABERTO = 'ABERTO',
  PAGO = 'PAGO',
  CANCELADO = 'CANCELADO',
}

export enum AcaoAuditoriaEnum {
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  APPROVE = 'APPROVE',
}

export enum TipoNotificacaoEnum {
  ALERTA_OPERACIONAL = 'ALERTA_OPERACIONAL',
  ALERTA_FINANCEIRO = 'ALERTA_FINANCEIRO',
  SISTEMA = 'SISTEMA',
}

export enum StatusProgressoEnum {
  ABERTO = 'ABERTO',
  EM_PROGRESSO = 'EM_PROGRESSO',
  CONCLUIDO = 'CONCLUIDO',
}

export enum CategoriaServicoEnum {
  PINTURA = 'PINTURA',
  ELETRICA = 'ELETRICA',
  HIDRAULICA = 'HIDRAULICA',
  ALVENARIA = 'ALVENARIA',
  ACABAMENTO = 'ACABAMENTO',
  MARCENARIA = 'MARCENARIA',
  GESSO = 'GESSO',
  ESQUADRIAS = 'ESQUADRIAS',
  OUTROS = 'OUTROS',
}
