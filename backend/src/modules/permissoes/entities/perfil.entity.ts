import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('tb_perfis')
export class Perfil {
  @PrimaryColumn({ type: 'smallint' })
  id: number;

  @Column({ length: 50, unique: true })
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao: string | null;

  @Column({ type: 'jsonb', nullable: true })
  permissoes_modulos: Record<string, any> | null;
}
