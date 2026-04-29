import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  MaxLength,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsOptional,
} from 'class-validator';
import { IsLooseUuid } from '../../../common/decorators/is-loose-uuid.decorator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ItemLoteDto {
  @ApiProperty({ example: 'Pintura parede norte', description: 'Nome do elemento de serviço' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nome_elemento: string;

  @ApiProperty({ example: 25.5, description: 'Área planejada em m²' })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  area_planejada: number;
}

export class CreateItensAmbienteLoteDto {
  @ApiProperty({
    example: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    description: 'ID do ambiente onde os elementos serão cadastrados',
  })
  @IsLooseUuid()
  @IsNotEmpty()
  id_ambiente: string;

  @ApiProperty({
    example: [
      'dddddddd-dddd-dddd-dddd-dddddddddddd',
      'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    ],
    description: 'IDs dos ambientes alvo para replicar o lote. Se omitido, usa apenas id_ambiente.',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsLooseUuid({ each: true })
  id_ambientes?: string[];

  @ApiProperty({
    type: [ItemLoteDto],
    description: 'Lista de elementos de serviço a criar (nome + área planejada)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ItemLoteDto)
  itens: ItemLoteDto[];
}
