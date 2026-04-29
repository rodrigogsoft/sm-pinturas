import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { IsLooseUuid } from '../../../common/decorators/is-loose-uuid.decorator';

export class ConsultarApropriacaoDetalhadaDto {
  @ApiPropertyOptional({ description: 'Data inicial da competencia', example: '2026-03-01' })
  @IsOptional()
  @IsDateString()
  data_inicio?: string;

  @ApiPropertyOptional({ description: 'Data final da competencia', example: '2026-03-31' })
  @IsOptional()
  @IsDateString()
  data_fim?: string;

  @ApiPropertyOptional({ description: 'Filtrar por colaborador' })
  @IsOptional()
  @IsLooseUuid()
  id_colaborador?: string;

  @ApiPropertyOptional({ description: 'Filtrar por obra' })
  @IsOptional()
  @IsLooseUuid()
  id_obra?: string;

  @ApiPropertyOptional({ description: 'Filtrar por item de ambiente' })
  @IsOptional()
  @IsLooseUuid()
  id_item_ambiente?: string;

  @ApiPropertyOptional({ description: 'Pagina da consulta', example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Itens por pagina', example: 50, minimum: 1, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}
