import {
  IsNumber,
  IsBoolean,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { IsLooseUuid } from '../../../common/decorators/is-loose-uuid.decorator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePavimentosLoteDto {
  @ApiProperty({
    example: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    description: 'ID da obra',
  })
  @IsLooseUuid()
  obraId: string;

  @ApiProperty({
    example: 3,
    description:
      'Quantidade de pavimentos acima do solo (inclui térreo e cobertura quando presentes)',
  })
  @IsNumber()
  @Min(1)
  @Max(999)
  qtdPavimentosAcima: number;

  @ApiProperty({ example: true, description: 'Incluir pavimento térreo' })
  @IsBoolean()
  temTerreo: boolean;

  @ApiProperty({ example: false, description: 'Incluir cobertura' })
  @IsBoolean()
  temCobertura: boolean;

  @ApiProperty({ example: false, description: 'Incluir subsolos' })
  @IsBoolean()
  temSubsolo: boolean;

  @ApiProperty({
    example: 2,
    required: false,
    description: 'Quantidade de subsolos (obrigatório se temSubsolo = true)',
  })
  @IsNumber()
  @Min(1)
  @Max(99)
  @IsOptional()
  qtdSubsolos?: number;
}
