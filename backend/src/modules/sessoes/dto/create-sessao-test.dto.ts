import { IsOptional, IsNumber, IsString } from 'class-validator';
import { IsLooseUuid } from '../../../common/decorators/is-loose-uuid.decorator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO simples para criar uma nova sessão
 * As datas são aceitas como strings ISO 8601 e convertidas no serviço
 */
export class CreateSessaoDto {
  @ApiProperty({ description: 'ID do encarregado responsável', example: 'uuid' })
  @IsLooseUuid()
  id_encarregado: string;

  @ApiPropertyOptional({ description: 'ID da obra', example: 'uuid' })
  @IsOptional()
  @IsLooseUuid()
  id_obra?: string;

  @ApiProperty({ description: 'Data da sessão (YYYY-MM-DD)', example: '2026-02-07' })
  @IsString()
  data_sessao: string;

  @ApiProperty({ description: 'Hora de início (ISO 8601)', example: '2026-02-07T08:00:00Z' })
  @IsString()
  hora_inicio: string;

  @ApiPropertyOptional({ description: 'Latitude GPS' })
  @IsOptional()
  @IsNumber()
  geo_lat?: number;

  @ApiPropertyOptional({ description: 'Longitude GPS' })
  @IsOptional()
  @IsNumber()
  geo_long?: number;

  @ApiProperty({ description: 'URL da assinatura digital' })
  @IsString()
  assinatura_url: string;

  @ApiPropertyOptional({ description: 'Observações da sessão' })
  @IsOptional()
  @IsString()
  observacoes?: string;
}
