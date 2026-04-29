import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateItemAmbienteDto {
  @ApiProperty({
    example: 'Pintura parede norte',
    description: 'Nome do elemento de serviço',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  nome_elemento?: string;

  @ApiProperty({
    example: 30.0,
    description: 'Área planejada para este item de ambiente',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  area_planejada?: number;
}
