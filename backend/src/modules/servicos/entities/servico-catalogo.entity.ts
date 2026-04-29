import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CategoriaServicoEnum } from '../../../common/enums';

@Entity('tb_servicos_catalogo')
export class ServicoCatalogo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  nome: string;

  @Column({ length: 50 })
  unidade_medida: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: CategoriaServicoEnum.OUTROS,
  })
  categoria: CategoriaServicoEnum;

  @Column({ type: 'text', nullable: true })
  descricao: string | null;

  @Column({ default: false })
  deletado: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
