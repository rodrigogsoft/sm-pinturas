import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { PerfilEnum } from '../../../common/enums';

@Entity('tb_usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  nome_completo: string;

  @Column({ length: 200, unique: true })
  email: string;

  @Column({ length: 255 })
  @Exclude()
  senha_hash: string;

  @Column({ type: 'smallint' })
  id_perfil: PerfilEnum;

  @Column({ default: true })
  ativo: boolean;

  @Column({ type: 'varchar', length: 32, nullable: true })
  @Exclude()
  mfa_secret: string | null;

  @Column({ default: false })
  mfa_habilitado: boolean;

  @Column({ type: 'timestamp', nullable: true })
  mfa_configurado_em: Date | null;

  @Column({ type: 'simple-array', nullable: true })
  @Exclude()
  mfa_backup_codes: string[] | null;

  @Column({ type: 'timestamp', nullable: true })
  ultimo_acesso: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Exclude()
  fcm_token: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Exclude()
  refresh_token_hash: string | null;

  @Column({ type: 'timestamp', nullable: true })
  refresh_token_expires_at: Date | null;

  @Column({ type: 'uuid', nullable: true })
  id_criado_por: string | null;

  @Column({ default: false })
  deletado: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'id_criado_por' })
  criador: Usuario;
}
