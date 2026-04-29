import { IsOptional, IsDateString, IsString, IsInt, IsNumber, Min } from 'class-validator';
import { IsLooseUuid } from '../../../common/decorators/is-loose-uuid.decorator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAlocacaoDto {
  @ApiProperty({ description: 'ID da sessão diária', example: 'uuid' })
  @IsLooseUuid()
  id_sessao: string;

  @ApiProperty({ description: 'ID do ambiente', example: 'uuid' })
  @IsLooseUuid()
  id_ambiente: string;

  @ApiPropertyOptional({ description: 'ID do item de ambiente (opcional)', example: 'uuid' })
  @IsOptional()
  @IsLooseUuid()
  id_item_ambiente?: string;

  @ApiProperty({ description: 'ID do colaborador', example: 'uuid' })
  @IsLooseUuid()
  id_colaborador: string;

  @ApiPropertyOptional({ description: 'ID do serviço do catálogo', example: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  id_servico_catalogo?: number;

  @ApiPropertyOptional({ description: 'Preço de custo informado na alocação', example: 25.5 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  preco_custo?: number;

  @ApiProperty({ description: 'Hora de início da alocação (ISO 8601)', example: '2026-02-07T08:30:00Z' })
  @IsDateString()
  hora_inicio: string;

  @ApiPropertyOptional({ description: 'Observações sobre a alocação' })
  @IsOptional()
  @IsString()
  observacoes?: string;
}
