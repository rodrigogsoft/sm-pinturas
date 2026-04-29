import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsEnum,
  IsOptional,
  IsDateString,
  Length,
  ValidateNested,
  IsArray,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { StatusObraEnum } from '../entities/obra.entity';

export class CreateAmbienteDto {
  @ApiProperty({ example: 'Sala 101' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  nome: string;

  @ApiProperty({ example: 25.5, required: false })
  @IsNumber()
  @IsOptional()
  area_m2?: number;

  @ApiProperty({ example: 'Sala comercial', required: false })
  @IsString()
  @IsOptional()
  descricao?: string;
}

export class CreatePavimentoDto {
  @ApiProperty({ example: 'Térreo' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  nome: string;

  @ApiProperty({ example: 0, description: 'Ordem do pavimento (0=Térreo, 1=1º andar...)' })
  @IsNumber()
  @Min(0)
  ordem: number;

  @ApiProperty({ type: [CreateAmbienteDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAmbienteDto)
  @IsOptional()
  ambientes?: CreateAmbienteDto[];
}

export class CreateObraDto {
  @ApiProperty({
    example: 'Edifício Primavera',
    description: 'Nome da obra',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 200)
  nome: string;

  @ApiProperty({
    example: 'Rua das Flores, 123 - São Paulo/SP',
    description: 'Endereço completo da obra',
  })
  @IsString()
  @IsNotEmpty()
  endereco_completo: string;

  @ApiProperty({
    example: '2026-01-15',
    description: 'Data de início da obra',
  })
  @IsString()
  data_inicio: string;

  @ApiProperty({
    example: '2026-12-31',
    description: 'Data prevista de término',
    required: false,
  })
  @IsString()
  @IsOptional()
  data_previsao_fim?: string;

  @ApiProperty({
    example: 'uuid-do-cliente',
    description: 'ID do cliente',
  })
  @IsString()
  @IsNotEmpty()
  id_cliente: string;

  @ApiProperty({
    example: 'Obra de grande porte',
    description: 'Observações sobre a obra',
    required: false,
  })
  @IsString()
  @IsOptional()
  observacoes?: string;

  @ApiProperty({
    enum: StatusObraEnum,
    default: StatusObraEnum.PLANEJAMENTO,
    required: false,
  })
  @IsEnum(StatusObraEnum)
  @IsOptional()
  status?: StatusObraEnum;

  @ApiProperty({ type: [CreatePavimentoDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePavimentoDto)
  @IsOptional()
  pavimentos?: CreatePavimentoDto[];
}
