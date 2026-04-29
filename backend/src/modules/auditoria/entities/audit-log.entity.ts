import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Usuario } from '../../auth/entities/usuario.entity';

export enum AcaoAuditoriaEnum {
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  EXPORT = 'EXPORT',
}

@Entity('tb_audit_logs')
@Index(['tabela_afetada', 'id_registro'])
@Index(['id_usuario'])
@Index(['momento'])
export class AuditLog {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  momento: Date;

  @Column({ type: 'uuid' })
  id_usuario: string;

  @Column({ length: 100 })
  tabela_afetada: string;

  @Column({ type: 'uuid', nullable: true })
  id_registro: string | null;

  @Column({
    type: 'enum',
    enum: AcaoAuditoriaEnum,
  })
  acao: AcaoAuditoriaEnum;

  @Column({ type: 'jsonb', nullable: true })
  dados_antes: any;

  @Column({ type: 'jsonb', nullable: true })
  dados_depois: any;

  @Column({ type: 'inet', nullable: true })
  ip_origem: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  user_agent: string | null;

  @Column({ type: 'text', nullable: true })
  justificativa: string | null;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;
}
