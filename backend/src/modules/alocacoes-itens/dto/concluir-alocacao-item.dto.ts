import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class ConcluirAlocacaoItemDto {
  @ApiPropertyOptional({
    description: 'Data/hora de fim da alocacao por item',
    example: '2026-03-12T17:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  hora_fim?: string;

  @ApiPropertyOptional({ description: 'Observacoes finais' })
  @IsOptional()
  @IsString()
  observacoes?: string;
}
