import { IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EncerrarSessaoDto {
  @ApiProperty({
    description: 'Hora de fim da sessão (definida automaticamente pelo servidor)',
    example: '2026-02-07T18:00:00Z',
    required: false,
  })
  @IsOptional()
  hora_fim?: Date;

  @ApiPropertyOptional({ description: 'URL da assinatura digital do cliente/responsável' })
  @IsOptional()
  @IsString()
  assinatura_url?: string;

  @ApiPropertyOptional({ description: 'Observações finais da sessão' })
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiPropertyOptional({ description: 'Justificativa obrigatória para encerramento', minLength: 15 })
  @IsString()
  @MinLength(15, { message: 'A justificativa deve ter pelo menos 15 caracteres.' })
  justificativa: string;

  @ApiPropertyOptional({ description: 'Nome do responsável que conferiu o fechamento da OS' })
  @IsOptional()
  @IsString()
  nome_assinante?: string;

  @ApiPropertyOptional({ description: 'CPF do responsável que conferiu o fechamento da OS' })
  @IsOptional()
  @IsString()
  cpf_assinante?: string;
}
