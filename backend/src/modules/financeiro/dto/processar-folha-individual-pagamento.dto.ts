import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsEnum, IsOptional, IsString, ArrayMinSize } from 'class-validator';
import { IsLooseUuid } from '../../../common/decorators/is-loose-uuid.decorator';
import { TipoPagamentoEnum } from '../entities/lote-pagamento.entity';

export class ProcessarFolhaIndividualPagamentoDto {
  @ApiProperty({
    description: 'IDs das medições colaborador que serão marcadas como pagas',
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsLooseUuid({ each: true })
  medicoes_ids: string[];

  @ApiProperty({ description: 'Data do pagamento', example: '2026-04-03' })
  @IsDateString()
  data_pagamento: string;

  @ApiProperty({
    description: 'Forma de pagamento',
    enum: TipoPagamentoEnum,
  })
  @IsEnum(TipoPagamentoEnum)
  tipo_pagamento: TipoPagamentoEnum;

  @ApiPropertyOptional({ description: 'Observações do pagamento' })
  @IsOptional()
  @IsString()
  observacoes?: string;
}
