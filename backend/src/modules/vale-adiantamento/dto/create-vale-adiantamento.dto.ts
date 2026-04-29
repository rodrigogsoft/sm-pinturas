import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { IsLooseUuid } from '../../../common/decorators/is-loose-uuid.decorator';
import { Type } from 'class-transformer';

export class CreateValeAdiantamentoParcelaDto {
  @ApiProperty({ description: 'Numero da parcela', example: 1 })
  @IsNumber()
  @Min(1)
  numero_parcela: number;

  @ApiProperty({ description: 'Valor da parcela', example: 250 })
  @IsNumber()
  @Min(0.01)
  valor_parcela: number;

  @ApiProperty({ description: 'Data prevista para desconto', example: '2026-04-05' })
  @IsDateString()
  data_prevista_desconto: string;

  @ApiPropertyOptional({ description: 'Observacoes da parcela' })
  @IsOptional()
  @IsString()
  observacoes?: string;
}

export class CreateValeAdiantamentoDto {
  @ApiProperty({ description: 'ID do colaborador' })
  @IsLooseUuid()
  id_colaborador: string;

  @ApiPropertyOptional({ description: 'ID da obra vinculada' })
  @IsOptional()
  @IsLooseUuid()
  id_obra?: string;

  @ApiPropertyOptional({ description: 'Data da solicitacao', example: '2026-03-12' })
  @IsOptional()
  @IsDateString()
  data_solicitacao?: string;

  @ApiProperty({ description: 'Valor solicitado', example: 1000 })
  @IsNumber()
  @Min(0.01)
  valor_solicitado: number;

  @ApiPropertyOptional({ description: 'Valor aprovado', example: 800 })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  valor_aprovado?: number;

  @ApiPropertyOptional({ description: 'Motivo do adiantamento' })
  @IsOptional()
  @IsString()
  motivo?: string;

  @ApiPropertyOptional({ description: 'Observacoes adicionais' })
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiPropertyOptional({ description: 'Usuario aprovador' })
  @IsOptional()
  @IsLooseUuid()
  id_aprovado_por?: string;

  @ApiPropertyOptional({ type: [CreateValeAdiantamentoParcelaDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateValeAdiantamentoParcelaDto)
  parcelas?: CreateValeAdiantamentoParcelaDto[];

  @ApiPropertyOptional({
    description: 'Quantidade de parcelas para geracao automatica quando parcelas nao forem informadas',
    example: 4,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24)
  qtd_parcelas_auto?: number;

  @ApiPropertyOptional({
    description: 'Data da primeira parcela para geracao automatica',
    example: '2026-04-05',
  })
  @IsOptional()
  @IsDateString()
  data_primeira_parcela?: string;
}
