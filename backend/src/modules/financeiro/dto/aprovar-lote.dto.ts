import { IsOptional } from 'class-validator';
import { IsLooseUuid } from '../../../common/decorators/is-loose-uuid.decorator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AprovarLoteDto {
  @ApiPropertyOptional({
    description: 'DEPRECATED: autoria é obtida da sessão autenticada',
  })
  @IsOptional()
  @IsLooseUuid()
  id_aprovado_por?: string;
}
