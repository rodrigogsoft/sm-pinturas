import { IsObject, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePermissoesDto {
  @ApiProperty({
    description: 'Mapa de permissões por módulo (JSONB)',
    example: {
      dashboard: { ativo: true, acoes: { visualizar: true } },
      clientes: { ativo: true, acoes: { visualizar: true, criar: true, editar: true, apagar: false } },
    },
  })
  @IsObject()
  @IsNotEmpty()
  permissoes_modulos: Record<string, any>;
}
