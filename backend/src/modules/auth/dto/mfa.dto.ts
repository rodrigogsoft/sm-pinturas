import { IsString, IsNotEmpty, Length, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para solicitar setup de MFA (iniciar)
 */
export class SetupMfaRequestDto {
  // Nenhum parâmetro necessário, usa usuário do JWT
}

/**
 * DTO com resposta do setup MFA
 */
export class SetupMfaResponseDto {
  @ApiProperty({
    example: 'JBSWY3DPEBLW64TMMQQ5GU3DJN3Q64TMMQ5GU3DJN3Q64TMMQQ=',
    description: 'Secret TOTP codificado em base32',
  })
  secret: string;

  @ApiProperty({
    example: 'otpauth://totp/user%40example.com?secret=...',
    description: 'URL otpauth para escanear com Google Authenticator',
  })
  otpauth_url: string;

  @ApiProperty({
    example: 'data:image/png;base64,...',
    description: 'QR code em formato DataURL',
  })
  qr_code: string;

  @ApiProperty({
    example: ['1234', '5678', '9012', '3456', '7890', '1234', '5678', '9012'],
    description: 'Códigos de backup (9 caracteres cada) para recuperação',
    isArray: true,
  })
  backup_codes: string[];

  @ApiProperty({
    example: 'Escaneie o QR code com o Google Authenticator e insira o código 6-digit para confirmar',
    description: 'Instruções para o usuário',
  })
  instructions: string;
}

/**
 * DTO para confirmar setup MFA
 */
export class ConfirmMfaSetupDto {
  @ApiProperty({
    example: '123456',
    description: 'Código 6-digit do Google Authenticator',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Se true, desabilita MFA para este usuário',
  })
  @IsOptional()
  disable: boolean;
}

/**
 * DTO para verificação de MFA no login
 */
export class VerifyMfaCodeDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Token pré-MFA recebido do login (access_token quando mfa_required=true)',
  })
  @IsString()
  @IsNotEmpty()
  mfa_token: string;

  @ApiProperty({
    example: '123456',
    description: 'Código 6-digit do Google Authenticator',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;

  @ApiPropertyOptional({
    example: '1234-5678',
    description: 'Código de backup (opcional se usar Google Authenticator)',
  })
  @IsOptional()
  @IsString()
  backup_code?: string;
}

/**
 * DTO de resposta da verificação MFA
 */
export class VerifyMfaResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Token de acesso para sessão autenticada',
  })
  access_token: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Token para renovação de sessão',
  })
  refresh_token: string;

  @ApiProperty({
    example: 'MFA validado com sucesso',
    description: 'Mensagem de resposta',
  })
  message: string;

  @ApiProperty()
  user: {
    id: string;
    nome_completo: string;
    email: string;
    id_perfil: number;
  };
}

/**
 * DTO para regenerar códigos de backup
 */
export class RegenerateMfaBackupCodesDto {
  @ApiProperty({
    example: '123456',
    description: 'Código 6-digit para confirmar operação',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;
}

/**
 * DTO de resposta com novos códigos de backup
 */
export class MfaBackupCodesResponseDto {
  @ApiProperty({
    example: ['1234', '5678', '9012', '3456', '7890', '1234', '5678', '9012'],
    description: 'Codigos de backup regenerados',
    isArray: true,
  })
  backup_codes: string[];

  @ApiProperty({
    example: 'Novos códigos de backup gerados. Configure-os em local seguro.',
    description: 'Mensagem informativa',
  })
  message: string;
}

/**
 * DTO com status MFA do usuário
 */
export class MfaStatusDto {
  @ApiProperty({
    example: true,
    description: 'Se MFA está ativo para o usuário',
  })
  mfa_enabled: boolean;

  @ApiProperty({
    example: '2025-02-07T10:30:00Z',
    description: 'Data quando MFA foi configurado',
    nullable: true,
  })
  mfa_configured_at: string | null;

  @ApiProperty({
    example: 5,
    description: 'Quantidade de códigos de backup restantes',
  })
  backup_codes_remaining: number;

  @ApiProperty({
    example: 'JBSWY3DPEBLW64TMMQQ5GU3DJN3Q64TMMQ5GU3DJN3Q64TMMQQ=',
    description: 'Secret (primeiros 8 caracteres mostrados para referência)',
  })
  secret_preview: string | null;
}
