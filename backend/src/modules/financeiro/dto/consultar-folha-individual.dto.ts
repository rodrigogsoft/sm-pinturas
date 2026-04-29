import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';
import { IsLooseUuid } from '../../../common/decorators/is-loose-uuid.decorator';
import { IsInt, Max, Min } from 'class-validator';

export class ConsultarFolhaIndividualDto {
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

  @ApiPropertyOptional({ description: 'Filtrar por lote' })
  @IsOptional()
  @IsLooseUuid()
  id_lote_pagamento?: string;

  @ApiPropertyOptional({ description: 'Filtrar por obra' })
  @IsOptional()
  @IsLooseUuid()
  id_obra?: string;

  @ApiPropertyOptional({ description: 'Filtrar por nome do colaborador (busca parcial)' })
  @IsOptional()
  @IsString()
  colaborador?: string;

  @ApiPropertyOptional({ description: 'Filtrar por nome do serviço (busca parcial)' })
  @IsOptional()
  @IsString()
  servico?: string;

  @ApiPropertyOptional({
    description: 'Status agregado da folha',
    enum: ['ABERTO', 'PAGO', 'CANCELADO'],
  })
  @IsOptional()
  @IsIn(['ABERTO', 'PAGO', 'CANCELADO'])
  status?: 'ABERTO' | 'PAGO' | 'CANCELADO';

  @ApiPropertyOptional({
    description: 'Pagina da consulta (padrao: 1)',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Quantidade de itens por pagina (padrao: 50, max: 200)',
    example: 50,
    minimum: 1,
    maximum: 200,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}
