import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StatusProgressoEnum } from '../../../common/enums';
import { Ambiente } from '../../pavimentos/entities/pavimento.entity';
import { TabelaPreco } from '../../precos/entities/tabela-preco.entity';

@Entity('tb_itens_ambiente')
export class ItemAmbiente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  id_ambiente: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  nome_elemento: string | null;

  @Column({ type: 'uuid', nullable: true })
  id_tabela_preco: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  area_planejada: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  area_medida_total: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  progresso: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: StatusProgressoEnum.ABERTO,
  })
  status: StatusProgressoEnum;

  @Column({ default: false })
  deletado: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Ambiente)
  @JoinColumn({ name: 'id_ambiente' })
  ambiente: Ambiente;

  @ManyToOne(() => TabelaPreco, { nullable: true })
  @JoinColumn({ name: 'id_tabela_preco' })
  tabelaPreco: TabelaPreco | null;
}
