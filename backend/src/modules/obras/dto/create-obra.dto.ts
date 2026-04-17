import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateObraDto {
  @IsNotEmpty()
  @IsString()
  descricao: string;

  @IsOptional()
  @IsString()
  endereco?: string;

  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataPrevisaoFim?: string;

  @IsOptional()
  @IsUUID()
  clienteId?: string;
}
