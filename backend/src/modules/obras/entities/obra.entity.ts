import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Cliente } from '../../clientes/entities/cliente.entity';

@Entity('tb_obras')
export class Obra {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  descricao: string;

  @Column({ length: 300, nullable: true })
  endereco: string;

  @Column({ nullable: true, type: 'date' })
  dataInicio: Date;

  @Column({ nullable: true, type: 'date' })
  dataPrevisaoFim: Date;

  @Column({ default: 'EM_ANDAMENTO', length: 30 })
  status: string;

  @ManyToOne(() => Cliente, { eager: false })
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @Column({ type: 'uuid', nullable: true })
  clienteId: string;

  @Column({ default: false })
  deletado: boolean;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;
}
