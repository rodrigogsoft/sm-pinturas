import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Colaborador } from '../../colaboradores/entities/colaborador.entity';
import { Obra } from '../../obras/entities/obra.entity';
import { Usuario } from '../../auth/entities/usuario.entity';
import { ValeAdiantamentoParcela } from './vale-adiantamento-parcela.entity';

export enum StatusValeAdiantamentoEnum {
  SOLICITADO = 'SOLICITADO',
  APROVADO = 'APROVADO',
  PAGO = 'PAGO',
  PARCIALMENTE_COMPENSADO = 'PARCIALMENTE_COMPENSADO',
  COMPENSADO = 'COMPENSADO',
  CANCELADO = 'CANCELADO',
}

@Entity('tb_vales_adiantamento')
export class ValeAdiantamento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  id_colaborador: string;

  @Column({ type: 'uuid', nullable: true })
  id_obra: string | null;

  @Column({ type: 'date' })
  data_solicitacao: Date;

  @Column({ type: 'date', nullable: true })
  data_aprovacao: Date | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  valor_solicitado: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  valor_aprovado: number | null;

  @Column({ type: 'varchar', length: 30, default: StatusValeAdiantamentoEnum.SOLICITADO })
  status: StatusValeAdiantamentoEnum;

  @Column({ type: 'text', nullable: true })
  motivo: string | null;

  @Column({ type: 'text', nullable: true })
  observacoes: string | null;

  @Column({ type: 'uuid', nullable: true })
  id_aprovado_por: string | null;

  @Column({ default: false })
  deletado: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Colaborador)
  @JoinColumn({ name: 'id_colaborador' })
  colaborador: Colaborador;

  @ManyToOne(() => Obra)
  @JoinColumn({ name: 'id_obra' })
  obra: Obra | null;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_aprovado_por' })
  aprovado_por: Usuario | null;

  @OneToMany(() => ValeAdiantamentoParcela, (parcela) => parcela.vale_adiantamento)
  parcelas: ValeAdiantamentoParcela[];
}
