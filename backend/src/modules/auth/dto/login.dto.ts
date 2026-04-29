import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
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
}

export class LoginResponseDto {
  @ApiProperty()
  access_token: string;

  @ApiProperty({ required: false, nullable: true })
  refresh_token?: string | null;

  @ApiProperty({ required: false })
  mfa_required?: boolean;

  @ApiProperty({ required: false })
  message?: string;

  @ApiProperty()
  user: {
    id: string;
    nome_completo: string;
    email: string;
    id_perfil: number;
    permissoes_modulos?: Record<string, any> | null;
  };
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}
