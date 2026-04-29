import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { IsLooseUuid } from '../../../common/decorators/is-loose-uuid.decorator';

export class DescontarValeAdiantamentoDto {
  @ApiProperty({ description: 'Valor a descontar do saldo devedor do vale', example: 250 })
  @IsNumber()
  @Min(0.01)
  valor_desconto: number;

  @ApiPropertyOptional({
    description: 'Data efetiva do desconto (padrao: data atual)',
    example: '2026-04-10',
  })
  @IsOptional()
  @IsDateString()
  data_desconto?: string;

  @ApiPropertyOptional({ description: 'ID do lote de pagamento relacionado ao desconto' })
  @IsOptional()
  @IsLooseUuid()
  id_lote_pagamento?: string;

  @ApiPropertyOptional({ description: 'Observacoes do desconto manual' })
  @IsOptional()
  @IsString()
  observacoes?: string;
}
