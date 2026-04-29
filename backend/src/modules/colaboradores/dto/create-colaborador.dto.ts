import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsDateString,
  IsBoolean,
  Length,
  IsObject,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateColaboradorDto {
  @ApiProperty({
    example: 'Pedro Santos',
    description: 'Nome completo do colaborador',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 200)
  nome_completo: string;

  @ApiProperty({
    example: '12345678900',
    description: 'CPF ou NIF do colaborador',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  cpf_nif: string;

  @ApiProperty({
    example: 'pedro@example.com',
    description: 'Email do colaborador',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    example: '(11) 98765-4321',
    description: 'Telefone do colaborador',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Length(1, 20)
  telefone?: string;

  @ApiProperty({
    example: '1990-05-15',
    description: 'Data de nascimento',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  data_nascimento?: string;

  @ApiProperty({
    example: 'Rua das Palmeiras, 456',
    description: 'Endereço completo',
    required: false,
  })
  @IsString()
  @IsOptional()
  endereco?: string;

  @ApiProperty({
    example: {
      banco: 'Banco do Brasil',
      agencia: '1234',
      conta: '123456-7',
      tipo_conta: 'corrente',
    },
    description:
      'Dados bancários (RN04: criptografados com AES-256 em repouso)',
    required: false,
  })
  @IsObject()
  @IsOptional()
  dados_bancarios?: {
    banco: string;
    agencia: string;
    conta: string;
    tipo_conta: string;
  };

  @ApiProperty({
    example: true,
    description: 'Se o colaborador está ativo',
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
