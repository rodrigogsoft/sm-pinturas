import { IsString, IsDateString, IsOptional, IsEnum, IsNumber, IsArray } from 'class-validator';
import { IsLooseUuid } from '../../../common/decorators/is-loose-uuid.decorator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoPagamentoEnum } from '../entities/lote-pagamento.entity';

export class CreateLotePagamentoDto {
  @ApiProperty({ description: 'Descrição do lote', example: 'Pagamento Quinzenal - Janeiro/2026' })
  @IsString()
  descricao: string;

  @ApiProperty({ description: 'Data de competência', example: '2026-01-31' })
  @IsDateString()
  data_competencia: Date;

  @ApiProperty({ 
    description: 'IDs das medições a serem incluídas no lote',
    type: [String],
    example: ['uuid1', 'uuid2']
  })
  @IsArray()
  @IsLooseUuid({ each: true })
  medicoes_ids: string[];

  @ApiProperty({ description: 'ID do usuário criador' })
  @IsLooseUuid()
  id_criado_por: string;

  @ApiPropertyOptional({ description: 'Observações sobre o lote' })
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiPropertyOptional({ 
    description: 'Justificativa de exceção para Admin forçar geração de lote com preços pendentes (RN02)',
    example: 'Aprovação urgente do cliente, preços serão ajustados posteriormente'
  })
  @IsOptional()
  @IsString()
  justificativa_bypass_admin?: string;
}
