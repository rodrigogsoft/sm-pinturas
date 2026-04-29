import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AlocacaoTarefa } from '../../alocacoes/entities/alocacao-tarefa.entity';
import { Obra } from '../../obras/entities/obra.entity';
import { StatusPagamentoEnum } from '../../../common/enums';

@Entity('tb_medicoes')
export class Medicao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  id_alocacao: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  qtd_executada: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  area_planejada: number | null;

  @Column({ default: false })
  flag_excedente: boolean;

  @Column({ type: 'text', nullable: true })
  justificativa: string | null;

  @Column({ type: 'text', nullable: true })
  foto_evidencia_url: string | null;

  @Column({
    type: 'enum',
    enum: StatusPagamentoEnum,
    default: StatusPagamentoEnum.ABERTO,
  })
  status_pagamento: StatusPagamentoEnum;

  @Column({ type: 'uuid', nullable: true })
  id_lote_pagamento: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  valor_calculado: number | null;

  @Column({ type: 'date', nullable: true })
  data_medicao: Date | null;

  @Column({ type: 'date', nullable: true })
  data_prevista_faturamento: Date | null;

  @Column({ type: 'date', nullable: true })
  data_faturamento_realizado: Date | null;

  @Column({ type: 'uuid', nullable: true })
  id_obra: string | null;

  @Column({ default: false })
  deletado: boolean;

  @ManyToOne(() => Obra)
  @JoinColumn({ name: 'id_obra' })
  obra: Obra;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  deleted_at: Date | null;

  @ManyToOne(() => AlocacaoTarefa)
  @JoinColumn({ name: 'id_alocacao' })
  alocacao: AlocacaoTarefa;
}
