import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsInt,
  Min,
  Max,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClienteDto {
  @ApiProperty({
    example: 'Construtora ABC Ltda',
    description: 'Razão social do cliente',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 200)
  razao_social: string;

  @ApiProperty({
    example: '12345678000199',
    description: 'CNPJ ou NIF do cliente',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  cnpj_nif: string;

  @ApiProperty({
    example: 'contato@abc.com.br',
    description: 'Email do cliente',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    example: '(11) 98765-4321',
    description: 'Telefone do cliente',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Length(1, 20)
  telefone?: string;

  @ApiProperty({
    example: 'Rua das Flores, 123 - São Paulo/SP',
    description: 'Endereço completo do cliente',
    required: false,
  })
  @IsString()
  @IsOptional()
  endereco?: string;

  @ApiProperty({
    example: 15,
    description: 'Dia de corte para faturamento (1-28)',
    minimum: 1,
    maximum: 28,
  })
  @IsInt()
  @Min(1)
  @Max(28)
  dia_corte: number;
}
