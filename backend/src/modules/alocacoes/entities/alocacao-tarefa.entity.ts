import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { SessaoDiaria } from '../../sessoes/entities/sessao-diaria.entity';
import { Colaborador } from '../../colaboradores/entities/colaborador.entity';
import { Ambiente } from '../../pavimentos/entities/pavimento.entity';
import { ItemAmbiente } from '../../itens-ambiente/entities/item-ambiente.entity';

export enum StatusAlocacaoEnum {
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  CONCLUIDO = 'CONCLUIDO',
  PAUSADO = 'PAUSADO',
}

@Entity('tb_alocacoes_tarefa')
@Index(['id_ambiente', 'status'], { 
  unique: true,
  where: "status = 'EM_ANDAMENTO' AND deletado = false AND id_item_ambiente IS NULL"
})
export class AlocacaoTarefa {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  id_sessao: string;

  @Column({ type: 'uuid' })
  id_ambiente: string;

  @Column({ type: 'uuid', nullable: true })
  id_item_ambiente: string | null;

  @Column({ type: 'uuid' })
  id_colaborador: string;

  @Column({ type: 'int', nullable: true })
  id_servico_catalogo: number | null;

  @Column({
    type: 'enum',
    enum: StatusAlocacaoEnum,
    default: StatusAlocacaoEnum.EM_ANDAMENTO,
  })
  status: StatusAlocacaoEnum;

  @Column({ type: 'timestamptz' })
  hora_inicio: Date;

  @Column({ type: 'timestamptz', nullable: true })
  hora_fim: Date | null;

  @Column({ type: 'text', nullable: true })
  observacoes: string | null;

  @Column({ default: false })
  deletado: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => SessaoDiaria)
  @JoinColumn({ name: 'id_sessao' })
  sessao: SessaoDiaria;

  @ManyToOne(() => Ambiente)
  @JoinColumn({ name: 'id_ambiente' })
  ambiente: Ambiente;

  @ManyToOne(() => ItemAmbiente)
  @JoinColumn({ name: 'id_item_ambiente' })
  item_ambiente: ItemAmbiente;

  @ManyToOne(() => Colaborador)
  @JoinColumn({ name: 'id_colaborador' })
  colaborador: Colaborador;
}
