import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { LotePagamento } from '../../financeiro/entities/lote-pagamento.entity';
import { ValeAdiantamento } from './vale-adiantamento.entity';

export enum StatusParcelaValeEnum {
  PENDENTE = 'PENDENTE',
  DESCONTADO = 'DESCONTADO',
  CANCELADO = 'CANCELADO',
}

@Entity('tb_vales_adiantamento_parcelas')
export class ValeAdiantamentoParcela {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  id_vale_adiantamento: string;

  @Column({ type: 'int' })
  numero_parcela: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  valor_parcela: number;

  @Column({ type: 'date' })
  data_prevista_desconto: Date;

  @Column({ type: 'date', nullable: true })
  data_desconto_realizado: Date | null;

  @Column({ type: 'varchar', length: 20, default: StatusParcelaValeEnum.PENDENTE })
  status: StatusParcelaValeEnum;

  @Column({ type: 'uuid', nullable: true })
  id_lote_pagamento: string | null;

  @Column({ type: 'text', nullable: true })
  observacoes: string | null;

  @Column({ default: false })
  deletado: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => ValeAdiantamento, (vale) => vale.parcelas)
  @JoinColumn({ name: 'id_vale_adiantamento' })
  vale_adiantamento: ValeAdiantamento;

  @ManyToOne(() => LotePagamento)
  @JoinColumn({ name: 'id_lote_pagamento' })
  lote_pagamento: LotePagamento | null;
}
