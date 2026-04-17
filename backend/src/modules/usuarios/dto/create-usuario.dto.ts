import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { PerfilEnum } from '../../../common/enums';

export class CreateUsuarioDto {
  @IsNotEmpty()
  @IsString()
  nome: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(8)
  senha: string;

  @IsEnum(PerfilEnum)
  perfil: PerfilEnum;
}
