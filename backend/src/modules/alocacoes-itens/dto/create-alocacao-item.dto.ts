import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';
import { IsLooseUuid } from '../../../common/decorators/is-loose-uuid.decorator';

export class CreateAlocacaoItemDto {
  @ApiProperty({ description: 'ID da sessao diaria' })
  @IsLooseUuid()
  id_sessao: string;

  @ApiProperty({ description: 'ID do ambiente' })
  @IsLooseUuid()
  id_ambiente: string;

  @ApiProperty({ description: 'ID do item de ambiente' })
  @IsLooseUuid()
  id_item_ambiente: string;

  @ApiProperty({ description: 'ID do colaborador' })
  @IsLooseUuid()
  id_colaborador: string;

  @ApiPropertyOptional({ description: 'ID da alocacao legado vinculada' })
  @IsOptional()
  @IsLooseUuid()
  id_alocacao_legado?: string;

  @ApiPropertyOptional({
    description: 'ERS 4.1 – ID da tabela de preço que define o tipo de serviço executado nesta alocação',
    example: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
  })
  @IsOptional()
  @IsLooseUuid()
  id_tabela_preco?: string;

  @ApiPropertyOptional({ description: 'Data/hora de inicio da alocacao', example: '2026-03-12T08:00:00Z' })
  @IsOptional()
  @IsDateString()
  hora_inicio?: string;

  @ApiPropertyOptional({ description: 'Observacoes operacionais' })
  @IsOptional()
  @IsString()
  observacoes?: string;
}
