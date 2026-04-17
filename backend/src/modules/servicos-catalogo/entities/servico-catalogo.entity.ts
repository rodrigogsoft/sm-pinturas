import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('tb_servicos_catalogo')
export class ServicoCatalogo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  descricao: string;

  @Column({ length: 50, nullable: true })
  unidade: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  precoCusto: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  precoVenda: number;

  @Column({ default: false })
  deletado: boolean;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;
}
