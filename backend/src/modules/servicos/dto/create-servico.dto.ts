import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CategoriaServicoEnum } from '../../../common/enums';
import { Transform } from 'class-transformer';

export class CreateServicoDto {
  @ApiProperty({
    example: 'Pintura 3 demãos',
    description: 'Nome do serviço',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 200)
  nome: string;

  @ApiProperty({
    example: 'M2',
    description: 'Unidade de medida (M2, ML, UN, VB)',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  @Transform(({ value }) => value?.toUpperCase?.())
  unidade_medida: string;

  @ApiProperty({
    example: CategoriaServicoEnum.PINTURA,
    description: 'Categoria do serviço',
    enum: CategoriaServicoEnum,
    default: CategoriaServicoEnum.OUTROS,
  })
  @IsEnum(CategoriaServicoEnum)
  @IsOptional()
  categoria?: CategoriaServicoEnum;

  @ApiProperty({
    example: 'Pintura completa com 3 demãos de tinta acrílica',
    description: 'Descrição do serviço',
    required: false,
  })
  @IsString()
  @IsOptional()
  descricao?: string;

}
