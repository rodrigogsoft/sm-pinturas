import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';
import { IsLooseUuid } from '../../../common/decorators/is-loose-uuid.decorator';

export class ReabrirPeriodoFolhaDto {
  @ApiProperty({ description: 'Data inicial da competencia', example: '2026-03-01' })
  @IsDateString()
  data_inicio: string;

  @ApiProperty({ description: 'Data final da competencia', example: '2026-03-31' })
  @IsDateString()
  data_fim: string;

  @ApiPropertyOptional({ description: 'Filtrar por colaborador especifico' })
  @IsOptional()
  @IsLooseUuid()
  id_colaborador?: string;

  @ApiPropertyOptional({ description: 'Filtrar por obra especifica' })
  @IsOptional()
  @IsLooseUuid()
  id_obra?: string;
}
