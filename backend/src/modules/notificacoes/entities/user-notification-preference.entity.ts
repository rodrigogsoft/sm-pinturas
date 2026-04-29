import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { NotificationChannelEnum } from './notification-template.entity';

@Entity('tb_user_notification_preferences')
@Index(['id_usuario', 'canal', 'event_type'], { unique: true })
export class UserNotificationPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  id_usuario: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  event_type: string | null;

  @Column({
    type: 'enum',
    enum: NotificationChannelEnum,
  })
  canal: NotificationChannelEnum;

  @Column({ default: true })
  habilitado: boolean;

  @Column({ type: 'varchar', length: 5, nullable: true })
  quiet_hours_inicio: string | null;

  @Column({ type: 'varchar', length: 5, nullable: true })
  quiet_hours_fim: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
