import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PerfilEnum } from '../../../common/enums';

export class RegisterDto {
  @ApiProperty({
    example: 'João Silva',
    description: 'Nome completo do usuário',
  })
  @IsString()
  @IsNotEmpty()
  nome_completo: string;

  @ApiProperty({
    example: 'joao@example.com',
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
    description: 'Perfil do usuário (1=Admin, 2=Gestor, 3=Financeiro, 4=Encarregado)',
  })
  @IsEnum(PerfilEnum)
  @IsNotEmpty()
  id_perfil: PerfilEnum;
}
