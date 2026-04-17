import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('tb_clientes')
export class Cliente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  nome: string;

  @Column({ length: 20, nullable: true })
  cpfCnpj: string;

  @Column({ length: 20, nullable: true })
  telefone: string;

  @Column({ length: 200, nullable: true })
  email: string;

  @Column({ length: 300, nullable: true })
  endereco: string;

  @Column({ default: false })
  deletado: boolean;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;
}
