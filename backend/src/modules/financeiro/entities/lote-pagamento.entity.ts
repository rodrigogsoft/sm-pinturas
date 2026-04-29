import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

export enum StatusLoteEnum {
  ABERTO = 'ABERTO',
  PAGO = 'PAGO',
  CANCELADO = 'CANCELADO',
}

export enum TipoPagamentoEnum {
  PIX = 'PIX',
  TED = 'TED',
  DINHEIRO = 'DINHEIRO',
  CHEQUE = 'CHEQUE',
}

@Entity('tb_lotes_pagamento')
export class LotePagamento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  descricao: string;

  @Column({ type: 'date' })
  data_competencia: Date;

  @Column({ type: 'date', nullable: true })
  data_pagamento: Date | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  valor_total: number;

  @Column({ type: 'int' })
  qtd_medicoes: number;

  @Column({
    type: 'enum',
    enum: StatusLoteEnum,
    default: StatusLoteEnum.ABERTO,
  })
  status: StatusLoteEnum;

  @Column({
    type: 'enum',
    enum: TipoPagamentoEnum,
    nullable: true,
  })
  tipo_pagamento: TipoPagamentoEnum | null;

  @Column({ type: 'uuid' })
  id_criado_por: string;

  @Column({ type: 'uuid', nullable: true })
  id_aprovado_por: string | null;

  @Column({ type: 'text', nullable: true })
  observacoes: string | null;

  @Column({ default: false })
  deletado: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
