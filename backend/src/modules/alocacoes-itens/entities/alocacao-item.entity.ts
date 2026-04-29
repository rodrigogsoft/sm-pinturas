import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { SessaoDiaria } from '../../sessoes/entities/sessao-diaria.entity';
import { Ambiente } from '../../pavimentos/entities/pavimento.entity';
import { ItemAmbiente } from '../../itens-ambiente/entities/item-ambiente.entity';
import { Colaborador } from '../../colaboradores/entities/colaborador.entity';
import { AlocacaoTarefa } from '../../alocacoes/entities/alocacao-tarefa.entity';
import { TabelaPreco } from '../../precos/entities/tabela-preco.entity';

export enum StatusAlocacaoItemEnum {
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  CONCLUIDO = 'CONCLUIDO',
  PAUSADO = 'PAUSADO',
}

@Entity('tb_alocacoes_itens')
export class AlocacaoItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  id_sessao: string;

  @Column({ type: 'uuid' })
  id_ambiente: string;

  @Column({ type: 'uuid' })
  id_item_ambiente: string;

  @Column({ type: 'uuid' })
  id_colaborador: string;

  @Column({ type: 'uuid', nullable: true })
  id_alocacao_legado: string | null;

  // ERS 4.1 – tipo de serviço definido na alocação (não no cadastro do elemento)
  @Column({ type: 'uuid', nullable: true })
  id_tabela_preco: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: StatusAlocacaoItemEnum.EM_ANDAMENTO,
  })
  status: StatusAlocacaoItemEnum;

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

  @ManyToOne(() => AlocacaoTarefa)
  @JoinColumn({ name: 'id_alocacao_legado' })
  alocacao_legado: AlocacaoTarefa | null;

  @ManyToOne(() => TabelaPreco, { nullable: true })
  @JoinColumn({ name: 'id_tabela_preco' })
  tabela_preco: TabelaPreco | null;
}
