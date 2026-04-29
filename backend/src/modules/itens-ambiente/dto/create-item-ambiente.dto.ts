import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { IsLooseUuid } from '../../../common/decorators/is-loose-uuid.decorator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateItemAmbienteDto {
  @ApiProperty({
    example: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    description: 'ID do ambiente',
  })
  @IsLooseUuid()
  @IsNotEmpty()
  id_ambiente: string;

  @ApiPropertyOptional({
    example: 'Pintura parede norte',
    description: 'Nome do elemento de serviço (ERS 4.1: tipo de serviço definido na alocação)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nome_elemento?: string;

  @ApiPropertyOptional({
    example: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    description: 'ID da tabela de preço (opcional; o serviço pode ser definido na alocação)',
  })
  @IsOptional()
  @IsLooseUuid()
  id_tabela_preco?: string;

  @ApiProperty({
    example: 25.5,
    description: 'Área planejada para este elemento de serviço',
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  area_planejada: number;
}
