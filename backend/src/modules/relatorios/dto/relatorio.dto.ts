import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { IsLooseUuid } from '../../../common/decorators/is-loose-uuid.decorator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum PeriodoEnum {
  DIA = 'dia',
  SEMANA = 'semana',
  MES = 'mes',
  ANO = 'ano',
}

export class GetDashboardFinanceiroDto {
  @ApiPropertyOptional({
    enum: PeriodoEnum,
    default: 'mes',
    description: 'Período de análise',
  })
  @IsOptional()
  @IsEnum(PeriodoEnum)
  periodo?: PeriodoEnum = PeriodoEnum.MES;

  @ApiPropertyOptional({
    description: 'Filtrar por ID da obra',
  })
  @IsOptional()
  @IsLooseUuid()
  id_obra?: string;
}

export class GetRelatorioMedicoesDto {
  @ApiPropertyOptional({
    enum: PeriodoEnum,
    default: 'mes',
    description: 'Período de análise',
  })
  @IsOptional()
  @IsEnum(PeriodoEnum)
  periodo?: PeriodoEnum = PeriodoEnum.MES;

  @ApiPropertyOptional({
    description: 'Data inicial (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  data_inicio?: string;

  @ApiPropertyOptional({
    description: 'Data final (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  data_fim?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID da obra',
  })
  @IsOptional()
  @IsLooseUuid()
  id_obra?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por Status (PENDENTE, APROVADA, REJEITADA)',
  })
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por status de pagamento',
  })
  @IsOptional()
  status_pagamento?: string;

  @ApiPropertyOptional({
    description: 'Número da página',
    default: 1,
  })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Itens por página',
    default: 20,
  })
  @IsOptional()
  limit?: number = 20;
}

export class GetRelatorioProdutividadeDto {
  @ApiPropertyOptional({
    enum: PeriodoEnum,
    default: 'mes',
    description: 'Período de análise',
  })
  @IsOptional()
  @IsEnum(PeriodoEnum)
  periodo?: PeriodoEnum = PeriodoEnum.MES;

  @ApiPropertyOptional({
    description: 'Filtrar por ID da obra',
  })
  @IsOptional()
  @IsLooseUuid()
  id_obra?: string;

  @ApiPropertyOptional({
    description: 'Data inicial (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  data_inicio?: string;

  @ApiPropertyOptional({
    description: 'Data final (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  data_fim?: string;
}

export class GetRelatorioMargemDto {
  @ApiPropertyOptional({
    enum: PeriodoEnum,
    default: 'mes',
    description: 'Período de análise',
  })
  @IsOptional()
  @IsEnum(PeriodoEnum)
  periodo?: PeriodoEnum = PeriodoEnum.MES;

  @ApiPropertyOptional({
    description: 'Data inicial (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  data_inicio?: string;

  @ApiPropertyOptional({
    description: 'Data final (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  data_fim?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID da obra',
  })
  @IsOptional()
  @IsLooseUuid()
  id_obra?: string;

  @ApiPropertyOptional({
    description: 'Número da página',
    default: 1,
  })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Itens por página',
    default: 20,
  })
  @IsOptional()
  limit?: number = 20;
}
