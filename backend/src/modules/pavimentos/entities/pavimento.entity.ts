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
import { StatusProgressoEnum } from '../../../common/enums';
import { Obra } from '../../obras/entities/obra.entity';

@Entity('tb_pavimentos')
export class Pavimento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  id_obra: string;

  @Column({ length: 100 })
  nome: string;

  @Column({ type: 'int' })
  ordem: number;

  @Column({ type: 'int', nullable: true })
  nivel: number | null;

  @Column({ default: false })
  is_cobertura: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  progresso: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: StatusProgressoEnum.ABERTO,
  })
  status_progresso: StatusProgressoEnum;

  @Column({ default: false })
  deletado: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Obra, (obra) => obra.pavimentos)
  @JoinColumn({ name: 'id_obra' })
  obra: Obra;

  @OneToMany(() => Ambiente, (ambiente) => ambiente.pavimento)
  ambientes: Ambiente[];
}

@Entity('tb_ambientes')
export class Ambiente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  id_pavimento: string;

  @Column({ length: 100 })
  nome: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  area_m2: number | null;

  @Column({ type: 'text', nullable: true })
  descricao: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  progresso: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: StatusProgressoEnum.ABERTO,
  })
  status_progresso: StatusProgressoEnum;

  @Column({ default: false })
  deletado: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Pavimento, (pavimento) => pavimento.ambientes)
  @JoinColumn({ name: 'id_pavimento' })
  pavimento: Pavimento;
}
