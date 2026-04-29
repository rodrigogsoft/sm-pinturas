import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Obra } from '../../obras/entities/obra.entity';
import { Usuario } from '../../auth/entities/usuario.entity';

export enum StatusOsFinalizacaoEnum {
  CONCLUIDA = 'CONCLUIDA',
  PARCIAL = 'PARCIAL',
}

@Entity('tb_os_finalizacao')
export class OsFinalizacao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  id_obra: string;

  @Column({ type: 'uuid' })
  id_usuario_responsavel: string;

  /** Nome do fiscalizador que assinou */
  @Column({ length: 200 })
  nome_fiscalizador: string;

  /** CPF do fiscalizador */
  @Column({ length: 14 })
  cpf_fiscalizador: string;

  /** URL da imagem da assinatura digital armazenada no S3/storage */
  @Column({ type: 'text' })
  assinatura_url: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: StatusOsFinalizacaoEnum.CONCLUIDA,
  })
  status: StatusOsFinalizacaoEnum;

  /**
   * Justificativa obrigatória quando há elementos incompletos
   * e o usuário opta por finalizar parcialmente (PARCIAL)
   */
  @Column({ type: 'text', nullable: true })
  justificativa_incompletude: string | null;

  /** Itens incompletos no momento da finalização (snapshot JSON) */
  @Column({ type: 'jsonb', nullable: true })
  itens_incompletos: Array<{
    id_item_ambiente: string;
    descricao: string;
    progresso: number;
  }> | null;

  /** Percentual geral da obra no momento da finalização */
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  progresso_no_momento: number;

  @CreateDateColumn()
  data_finalizacao: Date;

  @ManyToOne(() => Obra)
  @JoinColumn({ name: 'id_obra' })
  obra: Obra;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario_responsavel' })
  usuario_responsavel: Usuario;
}
