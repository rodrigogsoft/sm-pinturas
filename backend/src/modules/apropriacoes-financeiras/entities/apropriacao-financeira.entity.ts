import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MedicaoColaborador } from '../../medicoes-colaborador/entities/medicao-colaborador.entity';
import { Colaborador } from '../../colaboradores/entities/colaborador.entity';
import { Obra } from '../../obras/entities/obra.entity';
import { Usuario } from '../../auth/entities/usuario.entity';

export enum StatusApropriacao {
  PENDENTE = 'PENDENTE',
  APROVADO = 'APROVADO',
  REJEITADO = 'REJEITADO',
  PAGO = 'PAGO',
}

@Entity('tb_apropriacoes_financeiras')
export class ApropriacaoFinanceira {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  id_medicao_colaborador: string;

  @Column({ type: 'uuid' })
  id_colaborador: string;

  @Column({ type: 'uuid' })
  id_obra: string;

  /** Preço de venda unitário no momento da apropriação (snapshot) */
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  preco_venda_unitario: number;

  /** Área executada (qtd_executada da medição) */
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  area_executada: number;

  /** valor_calculado = area_executada × preco_venda_unitario */
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  valor_calculado: number;

  /** Competência (mês/ano de referência) */
  @Column({ type: 'date' })
  competencia: Date;

  @Column({
    type: 'varchar',
    length: 20,
    default: StatusApropriacao.PENDENTE,
  })
  status: StatusApropriacao;

  @Column({ type: 'uuid', nullable: true })
  id_aprovado_por: string | null;

  @Column({ type: 'date', nullable: true })
  data_aprovacao: Date | null;

  @Column({ type: 'text', nullable: true })
  justificativa_rejeicao: string | null;

  @Column({ default: false })
  deletado: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => MedicaoColaborador)
  @JoinColumn({ name: 'id_medicao_colaborador' })
  medicao_colaborador: MedicaoColaborador;

  @ManyToOne(() => Colaborador)
  @JoinColumn({ name: 'id_colaborador' })
  colaborador: Colaborador;

  @ManyToOne(() => Obra)
  @JoinColumn({ name: 'id_obra' })
  obra: Obra;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'id_aprovado_por' })
  aprovado_por: Usuario | null;
}
