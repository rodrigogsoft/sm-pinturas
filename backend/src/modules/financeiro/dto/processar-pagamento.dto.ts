import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { IsLooseUuid } from '../../../common/decorators/is-loose-uuid.decorator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoPagamentoEnum } from '../entities/lote-pagamento.entity';

export class ProcessarPagamentoDto {
  @ApiProperty({ description: 'Data do pagamento', example: '2026-02-07' })
  @IsDateString()
  data_pagamento: string;

  @ApiProperty({ description: 'Tipo de pagamento', enum: TipoPagamentoEnum })
  @IsEnum(TipoPagamentoEnum)
  tipo_pagamento: TipoPagamentoEnum;

  @ApiPropertyOptional({
    description: 'DEPRECATED: autoria é obtida da sessão autenticada',
  })
  @IsOptional()
  @IsLooseUuid()
  id_processado_por?: string;

  @ApiPropertyOptional({ description: 'Observações sobre o processamento' })
  @IsOptional()
  observacoes?: string;
}
