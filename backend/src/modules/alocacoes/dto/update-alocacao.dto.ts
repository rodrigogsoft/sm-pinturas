import { PartialType } from '@nestjs/swagger';
import { CreateAlocacaoDto } from './create-alocacao.dto';
import { IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StatusAlocacaoEnum } from '../entities/alocacao-tarefa.entity';

export class UpdateAlocacaoDto extends PartialType(CreateAlocacaoDto) {
  @ApiPropertyOptional({ description: 'Status da alocação', enum: StatusAlocacaoEnum })
  @IsOptional()
  @IsEnum(StatusAlocacaoEnum)
  status?: StatusAlocacaoEnum;

  @ApiPropertyOptional({ description: 'Hora de fim da alocação', example: '2026-02-07T12:00:00Z' })
  @IsOptional()
  @IsDateString()
  hora_fim?: Date;
}
