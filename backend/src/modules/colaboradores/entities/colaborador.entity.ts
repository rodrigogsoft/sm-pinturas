import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('tb_colaboradores')
export class Colaborador {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  nome_completo: string;

  @Column({ length: 20, unique: true })
  cpf_nif: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefone: string | null;

  @Column({ type: 'date', nullable: true })
  data_nascimento: Date | null;

  @Column({ type: 'text', nullable: true })
  endereco: string | null;

  @Column({ type: 'text', nullable: true })
  dados_bancarios_enc: string | null;

  @Column({ default: true })
  ativo: boolean;

  @Column({ default: false })
  deletado: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  /**
   * Campo transiente: dados bancários descriptografados
   * RN04: Nunca armazenado como plaintext no banco
   * Apenas presente em memória para transporte na API
   */
  dados_bancarios?: {
    banco: string;
    agencia: string;
    conta: string;
    tipo_conta: string;
  } | null;
}
