import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsNumber,
  IsOptional,
  Min,
  Max,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePavimentoDto {
  @ApiProperty({
    example: 'Térreo',
    description: 'Nome do pavimento',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  nome: string;

  @ApiProperty({
    example: 0,
    description: 'Ordem do pavimento (0=Térreo, 1=1º andar, etc)',
  })
  @IsNumber()
  @Min(0)
  @Max(999)
  ordem: number;

  @ApiProperty({
    example: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    description: 'ID da obra que contém este pavimento',
  })
  @IsString()
  @IsNotEmpty()
  id_obra: string;
}
