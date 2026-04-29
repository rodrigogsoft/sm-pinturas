import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';
import { IsLooseUuid } from '../../../common/decorators/is-loose-uuid.decorator';

export class CreateOsFinalizacaoDto {
  @IsLooseUuid()
  @IsNotEmpty()
  id_obra: string;

  @IsString()
  @IsNotEmpty()
  nome_fiscalizador: string;

  /** CPF no formato 000.000.000-00 ou somente dígitos */
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, {
    message: 'CPF inválido',
  })
  cpf_fiscalizador: string;

  /** URL da assinatura (upload deve ser feito antes via /uploads) */
  @IsString()
  @IsNotEmpty()
  assinatura_url: string;

  /** Obrigatório quando há itens incompletos */
  @IsString()
  @IsOptional()
  justificativa_incompletude?: string;
}
