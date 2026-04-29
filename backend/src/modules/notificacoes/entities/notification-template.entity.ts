import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum NotificationChannelEnum {
  IN_APP = 'IN_APP',
  PUSH = 'PUSH',
  EMAIL = 'EMAIL',
}

@Entity('tb_notification_templates')
export class NotificationTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 120 })
  codigo: string;

  @Column({
    type: 'enum',
    enum: NotificationChannelEnum,
  })
  canal: NotificationChannelEnum;

  @Column({ type: 'varchar', length: 200 })
  titulo_template: string;

  @Column({ type: 'text' })
  mensagem_template: string;

  @Column({ default: true })
  ativo: boolean;

  @Column({ type: 'int', default: 1 })
  versao: number;

  @Column({ type: 'jsonb', nullable: true })
  variaveis: string[] | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
