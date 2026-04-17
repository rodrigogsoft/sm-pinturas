import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { PerfilEnum } from '../../../common/enums';

@Entity('tb_colaboradores')
export class Colaborador {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  nome: string;

  @Column({ length: 20, nullable: true })
  cpf: string;

  @Column({ length: 20, nullable: true })
  telefone: string;

  @Column({ type: 'enum', enum: PerfilEnum, default: PerfilEnum.ENCARREGADO })
  perfil: PerfilEnum;

  @Column({ default: false })
  deletado: boolean;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;
}
