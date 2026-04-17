import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { PerfilEnum } from '../../../common/enums';

@Entity('tb_usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  nome: string;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column()
  senha: string;

  @Column({ type: 'enum', enum: PerfilEnum, default: PerfilEnum.ENCARREGADO })
  perfil: PerfilEnum;

  @Column({ default: false })
  deletado: boolean;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;
}
