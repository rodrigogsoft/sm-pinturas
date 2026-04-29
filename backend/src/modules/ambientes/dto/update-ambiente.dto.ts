import {
  IsString,
  IsOptional,
  IsNumber,
  Length,
  IsPositive,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAmbienteDto {
  @ApiProperty({
    example: 'Sala 102',
    description: 'Nome do ambiente',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  nome?: string;

  @ApiProperty({
    example: 30.0,
    description: 'Área do ambiente em m²',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  area_m2?: number;

  @ApiProperty({
    example: 'Sala com janelas grandes',
    description: 'Descrição do ambiente',
    required: false,
  })
  @IsString()
  @IsOptional()
  descricao?: string;
}
