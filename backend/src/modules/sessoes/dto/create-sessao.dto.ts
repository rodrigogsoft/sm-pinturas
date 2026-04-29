import { IsOptional, IsNumber, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSessaoDto {
  @ApiPropertyOptional({ description: 'ID do encarregado responsável (preenchido automaticamente via JWT)', example: 'uuid' })
  @IsOptional()
  @IsString()
  id_encarregado?: string;

  @ApiPropertyOptional({ description: 'ID da obra', example: 'uuid' })
  @IsOptional()
  @IsString()
  id_obra?: string;

  @ApiProperty({ description: 'Data da sessão', example: '2026-02-07' })
  @IsString()
  data_sessao: string;

  @ApiProperty({ description: 'Hora de início', example: '2026-02-07T08:00:00Z' })
  @IsString()
  hora_inicio: string;

  @ApiPropertyOptional({ description: 'Latitude GPS', example: -23.550520 })
  @IsOptional()
  @IsNumber()
  geo_lat?: number;

  @ApiPropertyOptional({ description: 'Longitude GPS', example: -46.633308 })
  @IsOptional()
  @IsNumber()
  geo_long?: number;

  @ApiProperty({ description: 'URL da assinatura digital' })
  @IsString()
  assinatura_url: string;

  @ApiPropertyOptional({ description: 'Nome de quem assinou' })
  @IsOptional()
  @IsString()
  nome_assinante?: string;

  @ApiPropertyOptional({ description: 'CPF de quem assinou (apenas dígitos ou formatado)' })
  @IsOptional()
  @IsString()
  cpf_assinante?: string;

  @ApiPropertyOptional({ description: 'Observações da sessão' })
  @IsOptional()
  @IsString()
  observacoes?: string;
}
