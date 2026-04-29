import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';
import { IsLooseUuid } from '../../../common/decorators/is-loose-uuid.decorator';

export class FecharPeriodoFolhaDto {
  @ApiProperty({ description: 'Data inicial da competencia', example: '2026-03-01' })
  @IsDateString()
  data_inicio: string;

  @ApiProperty({ description: 'Data final da competencia', example: '2026-03-31' })
  @IsDateString()
  data_fim: string;

  @ApiProperty({ description: 'Usuario responsavel pelo fechamento' })
  @IsLooseUuid()
  id_criado_por: string;

  @ApiPropertyOptional({ description: 'Filtrar por colaborador especifico' })
  @IsOptional()
  @IsLooseUuid()
  id_colaborador?: string;

  @ApiPropertyOptional({ description: 'Filtrar por obra especifica' })
  @IsOptional()
  @IsLooseUuid()
  id_obra?: string;

  @ApiPropertyOptional({ description: 'Observacoes do fechamento da competencia' })
  @IsOptional()
  @IsString()
  observacoes?: string;
}
