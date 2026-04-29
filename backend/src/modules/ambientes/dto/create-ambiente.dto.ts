import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsNumber,
  IsOptional,
  Length,
  Min,
  IsPositive,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAmbienteDto {
  @ApiProperty({
    example: 'Sala 101',
    description: 'Nome do ambiente',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  nome: string;

  @ApiProperty({
    example: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    description: 'ID do pavimento que contém este ambiente',
  })
  @IsString()
  @IsNotEmpty()
  id_pavimento: string;

  @ApiProperty({
    example: 25.5,
    description: 'Área do ambiente em m²',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  area_m2?: number;

  @ApiProperty({
    example: 'Sala comercial com vista para a rua',
    description: 'Descrição do ambiente',
    required: false,
  })
  @IsString()
  @IsOptional()
  descricao?: string;
}
