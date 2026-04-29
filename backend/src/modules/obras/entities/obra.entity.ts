import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Cliente } from '../../clientes/entities/cliente.entity';
import { Pavimento } from '../../pavimentos/entities/pavimento.entity';
import { Usuario } from '../../auth/entities/usuario.entity';

export enum StatusObraEnum {
  PLANEJAMENTO = 'PLANEJAMENTO',
  ATIVA = 'ATIVA',
  SUSPENSA = 'SUSPENSA',
  CONCLUIDA = 'CONCLUIDA',
}

@Entity('tb_obras')
export class Obra {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  nome: string;

  @Column({ type: 'text' })
  endereco_completo: string;

  @Column({
    type: 'enum',
    enum: StatusObraEnum,
    default: StatusObraEnum.PLANEJAMENTO,
  })
  status: StatusObraEnum;

  @Column({ type: 'date' })
  data_inicio: Date;

  @Column({ type: 'date', nullable: true })
  data_previsao_fim: Date | null;

  @Column({ type: 'date', nullable: true })
  data_conclusao: Date | null;

  @Column({ type: 'text', nullable: true })
  observacoes: string | null;

  @Column({ type: 'float', nullable: true })
  geo_lat: number | null;

  @Column({ type: 'float', nullable: true })
  geo_long: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 20 })
  margem_minima_percentual: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  progresso: number;

  @Column({ type: 'uuid' })
  id_cliente: string;

  @Column({ type: 'uuid', nullable: true })
  id_usuario_criador: string | null;

  @Column({ default: false })
  deletado: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Cliente)
  @JoinColumn({ name: 'id_cliente' })
  cliente: Cliente;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'id_usuario_criador' })
  usuario_criador: Usuario | null;

  @OneToMany(() => Pavimento, (pavimento) => pavimento.obra)
  pavimentos: Pavimento[];
}
