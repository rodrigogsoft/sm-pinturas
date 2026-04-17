import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateServicoCatalogoDto {
  @IsNotEmpty()
  @IsString()
  descricao: string;

  @IsOptional()
  @IsString()
  unidade?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  precoCusto?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  precoVenda?: number;
}
