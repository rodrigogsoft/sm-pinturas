import {
  IsNumber,
  IsBoolean,
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
  Max,
  ArrayMinSize,
  IsNotEmpty,
} from 'class-validator';
import { IsLooseUuid } from '../../../common/decorators/is-loose-uuid.decorator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum CategoriaAmbienteEnum {
  APARTAMENTO = 'APARTAMENTO',
  COMUM = 'COMUM',
}

export enum ModoConflitoEnum {
  FAIL = 'FAIL',
  SKIP = 'SKIP',
}

export class TipoAmbienteDto {
  @ApiProperty({
    enum: CategoriaAmbienteEnum,
    description: 'APARTAMENTO: gera apartamentos numerados. COMUM: área de uso comum.',
  })
  @IsEnum(CategoriaAmbienteEnum)
  categoria: CategoriaAmbienteEnum;

  @ApiProperty({
    example: 'Hall',
    required: false,
    description: 'Nome base para áreas COMUNS (obrigatório para categoria COMUM)',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  nomeBase?: string;

  @ApiProperty({ example: 30.5, description: 'Área em m² (obrigatório)' })
  @IsNumber()
  @Min(0.01)
  areaM2: number;

  @ApiProperty({
    example: 4,
    description: 'Quantidade por pavimento (máx 99 para APARTAMENTO)',
  })
  @IsNumber()
  @Min(1)
  @Max(99)
  qtdPorPavimento: number;
}

export class CreateAmbientesLoteDto {
  @ApiProperty({ description: 'ID da obra' })
  @IsLooseUuid()
  obraId: string;

  @ApiProperty({
    type: [String],
    description: 'IDs dos pavimentos que receberão os ambientes',
  })
  @IsArray()
  @IsLooseUuid({ each: true })
  @ArrayMinSize(1)
  pavimentoIds: string[];

  @ApiProperty({
    type: [TipoAmbienteDto],
    description: 'Layout de ambientes a replicar em cada pavimento',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TipoAmbienteDto)
  @ArrayMinSize(1)
  tipos: TipoAmbienteDto[];

  @ApiProperty({
    enum: ModoConflitoEnum,
    default: ModoConflitoEnum.SKIP,
    required: false,
    description:
      'FAIL: bloqueia se existir nome igual. SKIP: pula existentes (idempotente, padrão).',
  })
  @IsEnum(ModoConflitoEnum)
  @IsOptional()
  modoConflito?: ModoConflitoEnum;
}
