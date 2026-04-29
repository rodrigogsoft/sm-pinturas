import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum NotificationEventStatusEnum {
  RECEBIDO = 'RECEBIDO',
  PROCESSADO = 'PROCESSADO',
  IGNORADO = 'IGNORADO',
  ERRO = 'ERRO',
}

@Entity('tb_notification_events')
export class NotificationEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  event_type: string;

  @Column({ type: 'varchar', length: 80 })
  source_module: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  entity_type: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  entity_id: string | null;

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @Column({ type: 'timestamptz' })
  occurred_at: Date;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 180 })
  idempotency_key: string;

  @Column({
    type: 'enum',
    enum: NotificationEventStatusEnum,
    default: NotificationEventStatusEnum.RECEBIDO,
  })
  status: NotificationEventStatusEnum;

  @Column({ type: 'text', nullable: true })
  erro: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
