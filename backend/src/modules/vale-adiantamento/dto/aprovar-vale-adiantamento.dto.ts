import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';
import { IsLooseUuid } from '../../../common/decorators/is-loose-uuid.decorator';

export class AprovarValeAdiantamentoDto {
  @ApiProperty({ description: 'ID do usuario que esta aprovando' })
  @IsOptional()
  @IsLooseUuid()
  id_aprovado_por?: string;

  @ApiProperty({ description: 'Valor aprovado', example: 500 })
  @IsNumber()
  @Min(0.01)
  valor_aprovado: number;
}
