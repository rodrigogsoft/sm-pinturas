import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PerfilEnum } from '../../../common/enums';

export class CreateColaboradorDto {
  @IsNotEmpty()
  @IsString()
  nome: string;

  @IsOptional()
  @IsString()
  cpf?: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsEnum(PerfilEnum)
  perfil: PerfilEnum;
}
