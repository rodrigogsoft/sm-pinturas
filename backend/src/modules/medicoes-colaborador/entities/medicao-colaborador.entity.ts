import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { StatusPagamentoEnum } from '../../../common/enums';
import { AlocacaoItem } from '../../alocacoes-itens/entities/alocacao-item.entity';
import { Colaborador } from '../../colaboradores/entities/colaborador.entity';
import { ItemAmbiente } from '../../itens-ambiente/entities/item-ambiente.entity';
import { Medicao } from '../../medicoes/entities/medicao.entity';
import { LotePagamento } from '../../financeiro/entities/lote-pagamento.entity';

@Entity('tb_medicoes_colaborador')
export class MedicaoColaborador {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  id_alocacao_item: string;

  @Column({ type: 'uuid' })
  id_colaborador: string;

  @Column({ type: 'uuid' })
  id_item_ambiente: string;

  @Column({ type: 'uuid', nullable: true })
  id_medicao_legado: string | null;

  @Column({ type: 'uuid', nullable: true })
  id_lote_pagamento: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  qtd_executada: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  area_planejada: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  percentual_conclusao_item: number | null;

  @Column({ default: false })
  flag_excedente: boolean;

  @Column({ type: 'text', nullable: true })
  justificativa: string | null;

  @Column({ type: 'text', nullable: true })
  foto_evidencia_url: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: StatusPagamentoEnum.ABERTO,
  })
  status_pagamento: StatusPagamentoEnum;

  @Column({ type: 'date' })
  data_medicao: Date;

  @Column({ default: false })
  deletado: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => AlocacaoItem)
  @JoinColumn({ name: 'id_alocacao_item' })
  alocacao_item: AlocacaoItem;

  @ManyToOne(() => Colaborador)
  @JoinColumn({ name: 'id_colaborador' })
  colaborador: Colaborador;

  @ManyToOne(() => ItemAmbiente)
  @JoinColumn({ name: 'id_item_ambiente' })
  item_ambiente: ItemAmbiente;

  @ManyToOne(() => Medicao)
  @JoinColumn({ name: 'id_medicao_legado' })
  medicao_legado: Medicao | null;

  @ManyToOne(() => LotePagamento)
  @JoinColumn({ name: 'id_lote_pagamento' })
  lote_pagamento: LotePagamento | null;
}
