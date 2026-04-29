import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { IsLooseUuid } from '../../../common/decorators/is-loose-uuid.decorator';

export class CreateMedicaoColaboradorDto {
  @ApiProperty({ description: 'ID da alocacao por item' })
  @IsLooseUuid()
  id_alocacao_item: string;

  @ApiProperty({ description: 'ID do colaborador' })
  @IsLooseUuid()
  id_colaborador: string;

  @ApiProperty({ description: 'ID do item de ambiente' })
  @IsLooseUuid()
  id_item_ambiente: string;

  @ApiPropertyOptional({ description: 'ID da medicao legado vinculada' })
  @IsOptional()
  @IsLooseUuid()
  id_medicao_legado?: string;

  @ApiProperty({ description: 'Quantidade executada pelo colaborador', example: 12.5 })
  @IsNumber()
  @Min(0)
  qtd_executada: number;

  @ApiPropertyOptional({ description: 'Area planejada do item para referencia', example: 25 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  area_planejada?: number;

  @ApiPropertyOptional({ description: 'Percentual de conclusao do item', example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentual_conclusao_item?: number;

  @ApiPropertyOptional({ description: 'Justificativa operacional' })
  @IsOptional()
  @IsString()
  justificativa?: string;

  @ApiPropertyOptional({ description: 'URL da foto de evidencia' })
  @IsOptional()
  @IsString()
  foto_evidencia_url?: string;

  @ApiPropertyOptional({ description: 'Data da medicao', example: '2026-03-12' })
  @IsOptional()
  @IsDateString()
  data_medicao?: string;
}
