import {
  IsString,
  IsOptional,
  IsNumber,
  Length,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePavimentoDto {
  @ApiProperty({
    example: '1º Pavimento',
    description: 'Nome do pavimento',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  nome?: string;

  @ApiProperty({
    example: 1,
    description: 'Ordem do pavimento',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(999)
  ordem?: number;
}
