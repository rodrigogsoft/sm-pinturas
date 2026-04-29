import { IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConcluirAlocacaoDto {
  @ApiProperty({ description: 'Hora de fim da alocação', example: '2026-02-07T17:00:00Z' })
  @IsDateString()
  hora_fim: Date;

  @ApiPropertyOptional({ description: 'Observações finais' })
  @IsOptional()
  @IsString()
  observacoes?: string;
}
