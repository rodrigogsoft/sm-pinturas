import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Usuario } from '../../auth/entities/usuario.entity';

export enum TipoNotificacaoEnum {
  MEDICAO_PENDENTE = 'MEDICAO_PENDENTE',
  CICLO_FATURAMENTO = 'CICLO_FATURAMENTO',
  LOTE_APROVACAO = 'LOTE_APROVACAO',
  PRECO_PENDENTE = 'PRECO_PENDENTE',
  OBRA_ATRASO = 'OBRA_ATRASO',
  SISTEMA = 'SISTEMA',
}

export enum PrioridadeEnum {
  BAIXA = 'BAIXA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
  CRITICA = 'CRITICA',
}

@Entity('tb_notificacoes')
export class Notificacao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  id_usuario_destinatario: string;

  @Column({
    type: 'enum',
    enum: TipoNotificacaoEnum,
  })
  tipo: TipoNotificacaoEnum;

  @Column({ length: 200 })
  titulo: string;

  @Column({ type: 'text' })
  mensagem: string;

  @Column({
    type: 'enum',
    enum: PrioridadeEnum,
    default: PrioridadeEnum.MEDIA,
  })
  prioridade: PrioridadeEnum;

  @Column({ default: false })
  lida: boolean;

  @Column({ default: false })
  clicada: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lida_em: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  clicada_em: Date | null;

  @Column({ type: 'uuid', nullable: true })
  id_evento: string | null;

  @Column({ type: 'jsonb', nullable: true })
  dados_extras: any;

  @Column({ type: 'uuid', nullable: true })
  id_entidade_relacionada: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  tipo_entidade: string | null;

  @Column({ default: false })
  deletado: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario_destinatario' })
  destinatario: Usuario;
}
