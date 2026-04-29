import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('tb_notification_rules')
export class NotificationRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  nome: string;

  @Column({ type: 'varchar', length: 120 })
  event_type: string;

  @Column({ type: 'simple-array', nullable: true })
  perfis_destino: string[] | null;

  @Column({ type: 'simple-array', nullable: true })
  ids_usuarios_destino: string[] | null;

  @Column({ type: 'simple-array' })
  canais: string[];

  @Column({ type: 'varchar', length: 20, default: 'MEDIA' })
  prioridade: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  template_codigo: string | null;

  @Column({ default: true })
  ativo: boolean;

  @Column({ type: 'int', default: 300 })
  dedupe_window_seconds: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
