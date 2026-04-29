import {
  IsString,
  IsNotEmpty,
  IsEmail,
  MinLength,
  IsEnum,
  IsBoolean,
  IsOptional,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PerfilEnum } from '../../../common/enums';

export class CreateUsuarioDto {
  @ApiProperty({
    example: 'Maria Silva',
    description: 'Nome completo do usuário',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 200)
  nome_completo: string;

  @ApiProperty({
    example: 'maria@example.com',
    description: 'Email do usuário',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'senha123',
    description: 'Senha do usuário',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 4,
    enum: PerfilEnum,
    description:
      'Perfil do usuário (1=Admin, 2=Gestor, 3=Financeiro, 4=Encarregado)',
  })
  @IsEnum(PerfilEnum)
  @IsNotEmpty()
  id_perfil: PerfilEnum;

  @ApiProperty({
    example: true,
    description: 'Se o usuário está ativo',
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  ativo?: boolean;

  @ApiProperty({
    example: false,
    description: 'Se o MFA está habilitado',
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  mfa_habilitado?: boolean;
}
