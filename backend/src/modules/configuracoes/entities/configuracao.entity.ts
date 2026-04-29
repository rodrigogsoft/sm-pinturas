import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum TipoConfiguracaoEnum {
  INTEGER = 'integer',
  BOOLEAN = 'boolean',
  STRING = 'string',
}

@Entity('tb_configuracoes')
export class Configuracao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Chave única que identifica a regra (ex: max_alocacoes_simultaneas_colaborador) */
  @Column({ type: 'varchar', length: 100, unique: true })
  chave: string;

  /** Valor atual como texto; interpretar conforme o tipo */
  @Column({ type: 'text' })
  valor: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: TipoConfiguracaoEnum.STRING,
  })
  tipo: TipoConfiguracaoEnum;

  @Column({ type: 'varchar', length: 255 })
  descricao: string;

  /** Se falso, a regra é ignorada/desativada e vale o comportamento padrão */
  @Column({ default: true })
  ativo: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
