import { IsUUID, IsNumber, IsOptional, IsString, IsBoolean, IsDateString, Min, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMedicaoDto {
  @ApiProperty({ description: 'ID da alocação', example: 'uuid' })
  @IsString()
  id_alocacao: string;

  @ApiProperty({ description: 'Quantidade executada', example: 25.5 })
  @IsNumber()
  @Min(0)
  qtd_executada: number;

  @ApiPropertyOptional({ description: 'Área planejada para referência', example: 20.0 })
  @IsOptional()
  @IsNumber()
  area_planejada?: number;

  @ApiPropertyOptional({ description: 'Data da medição', example: '2026-02-07' })
  @IsOptional()
  @IsString()
  data_medicao?: Date;

  @ApiPropertyOptional({ 
    description: 'Justificativa para excedente (obrigatório se qtd_executada > area_planejada)' 
  })
  @IsOptional()
  @IsString()
  justificativa?: string;

  @ApiPropertyOptional({ 
    description: 'URL da foto de evidência (obrigatório se houver excedente)' 
  })
  @IsOptional()
  @IsString()
  foto_evidencia_url?: string;

  @ApiPropertyOptional({
    description: 'Justificativa de excecao para Admin criar medicao com preco nao aprovado',
    example: 'Medição urgente para fechamento do mês. Preço será aprovado retroativamente.'
  })
  @IsOptional()
  @IsString()
  @MinLength(20)
  justificativa_excecao_admin?: string;
}
