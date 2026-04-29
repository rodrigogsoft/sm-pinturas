import {
  IsUUID,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePrecoDto {
  @ApiProperty({
    example: 'uuid-da-obra',
    description: 'ID da obra',
  })
  @IsString()
  id_obra: string;

  @ApiProperty({
    example: 1,
    description: 'ID do serviço do catálogo',
  })
  @IsInt()
  id_servico_catalogo: number;

  @ApiProperty({
    example: 25.0,
    description: 'Preço de custo',
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  preco_custo: number;

  @ApiProperty({
    example: 35.0,
    description: 'Preço de venda',
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  preco_venda: number;

  @ApiProperty({
    example: 'Preço especial para esta obra',
    description: 'Observações sobre o preço',
    required: false,
  })
  @IsString()
  @IsOptional()
  observacoes?: string;
}
