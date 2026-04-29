import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Obra } from '../../obras/entities/obra.entity';
import { ServicoCatalogo } from '../../servicos/entities/servico-catalogo.entity';
import { Usuario } from '../../auth/entities/usuario.entity';

export enum StatusAprovacaoEnum {
  RASCUNHO = 'RASCUNHO',
  PENDENTE = 'PENDENTE',
  APROVADO = 'APROVADO',
  REJEITADO = 'REJEITADO',
}

@Entity('tb_tabela_precos')
export class TabelaPreco {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  id_obra: string;

  @Column({ type: 'int' })
  id_servico_catalogo: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  preco_custo: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  preco_venda: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, insert: false, update: false })
  margem_percentual: number | null;

  @Column({
    type: 'enum',
    enum: StatusAprovacaoEnum,
    default: StatusAprovacaoEnum.RASCUNHO,
  })
  status_aprovacao: StatusAprovacaoEnum;

  @Column({ type: 'timestamp', nullable: true })
  data_submissao: Date | null;

  @Column({ type: 'uuid', nullable: true })
  id_usuario_submissor: string | null;

  @Column({ type: 'timestamp', nullable: true })
  data_aprovacao: Date | null;

  @Column({ type: 'uuid', nullable: true })
  id_usuario_aprovador: string | null;

  @Column({ type: 'timestamp', nullable: true })
  data_rejeicao: Date | null;

  @Column({ type: 'uuid', nullable: true })
  id_usuario_rejeitador: string | null;

  @Column({ type: 'text', nullable: true })
  justificativa_rejeicao: string | null;

  @Column({ type: 'text', nullable: true })
  observacoes: string | null;

  @Column({ default: false })
  deletado: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Obra)
  @JoinColumn({ name: 'id_obra' })
  obra: Obra;

  @ManyToOne(() => ServicoCatalogo)
  @JoinColumn({ name: 'id_servico_catalogo' })
  servico: ServicoCatalogo;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'id_usuario_aprovador' })
  aprovador: Usuario;
}
