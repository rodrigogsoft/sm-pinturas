import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'audit';

export interface AuditMetadata {
  acao: 'INSERT' | 'UPDATE' | 'DELETE' | 'APPROVE';
  tabela: string;
  descricao?: string;
}

/**
 * Decorador para marcar endpoints que devem ser auditados
 * Uso: @Audit('UPDATE', 'tb_tabela_precos', 'Aprovou preço')
 */
export const Audit = (
  acao: 'INSERT' | 'UPDATE' | 'DELETE' | 'APPROVE',
  tabela: string,
  descricao?: string,
) => SetMetadata(AUDIT_KEY, { acao, tabela, descricao } as AuditMetadata);
