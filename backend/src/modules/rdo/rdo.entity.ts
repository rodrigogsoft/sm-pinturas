import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Usuario } from '../auth/entities/usuario.entity';
import { Obra } from '../obras/entities/obra.entity';

@Entity('rdo_digital')
export class Rdo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Usuario, { nullable: false })
  usuario: Usuario;

  @ManyToOne(() => Obra, { nullable: false })
  obra: Obra;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  data: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  localizacao_gps: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  assinatura: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  foto_url: string;

  @Column({ type: 'varchar', length: 32, default: 'ABERTO' })
  status: string;

  @CreateDateColumn()
  criado_em: Date;
}
