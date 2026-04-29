import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Notificacao } from './notificacao.entity';
import { NotificationChannelEnum } from './notification-template.entity';

export enum NotificationDeliveryStatusEnum {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
}

@Entity('tb_notification_deliveries')
export class NotificationDelivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  id_notificacao: string;

  @Column({
    type: 'enum',
    enum: NotificationChannelEnum,
  })
  canal: NotificationChannelEnum;

  @Column({
    type: 'enum',
    enum: NotificationDeliveryStatusEnum,
    default: NotificationDeliveryStatusEnum.PENDING,
  })
  status: NotificationDeliveryStatusEnum;

  @Column({ type: 'int', default: 0 })
  tentativas: number;

  @Column({ type: 'int', default: 4 })
  max_tentativas: number;

  @Column({ type: 'timestamptz', nullable: true })
  proxima_tentativa_em: Date | null;

  @Column({ type: 'text', nullable: true })
  erro_ultima_tentativa: string | null;

  @Column({ type: 'jsonb', nullable: true })
  provedor_resposta: Record<string, any> | null;

  @Column({ type: 'timestamptz', nullable: true })
  enviado_em: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Notificacao)
  @JoinColumn({ name: 'id_notificacao' })
  notificacao: Notificacao;
}
