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
import { Usuario } from '../../auth/entities/usuario.entity';

export enum StatusSessaoEnum {
  ABERTA = 'ABERTA',
  ENCERRADA = 'ENCERRADA',
}

@Entity('tb_sessoes_diarias')
export class SessaoDiaria {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  id_encarregado: string;

  @Column({ type: 'uuid', nullable: true })
  id_obra: string;

  @Column({ type: 'date' })
  data_sessao: Date;

  @Column({ type: 'timestamptz' })
  hora_inicio: Date;

  @Column({ type: 'timestamptz', nullable: true })
  hora_fim: Date | null;

  @Column({ type: 'float', nullable: true })
  geo_lat: number | null;

  @Column({ type: 'float', nullable: true })
  geo_long: number | null;

  @Column({ type: 'text', nullable: true })
  assinatura_url: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  nome_assinante: string | null;

  @Column({ type: 'varchar', length: 14, nullable: true })
  cpf_assinante: string | null;

  @Column({ type: 'text', nullable: true })
  observacoes: string | null;

  @Column({ type: 'text', nullable: true })
  justificativa: string | null;

  @Column({
    type: 'enum',
    enum: StatusSessaoEnum,
    default: StatusSessaoEnum.ABERTA,
  })
  status: StatusSessaoEnum;

  @Column({ default: false })
  deletado: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_encarregado' })
  encarregado: Usuario;

  // Relacionamento com alocações será criado no módulo de alocações
}
