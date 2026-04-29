import { PartialType } from '@nestjs/swagger';
import { CreateSessaoDto } from './create-sessao.dto';
import { IsOptional, IsDateString, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StatusSessaoEnum } from '../entities/sessao-diaria.entity';

export class UpdateSessaoDto extends PartialType(CreateSessaoDto) {
  @ApiPropertyOptional({ description: 'Hora de fim da sessão', example: '2026-02-07T18:00:00Z' })
  @IsOptional()
  @IsDateString()
  hora_fim?: Date;

  @ApiPropertyOptional({ description: 'URL da assinatura digital' })
  @IsOptional()
  @IsString()
  assinatura_url?: string;

  @ApiPropertyOptional({ 
    description: 'Status da sessão', 
    enum: StatusSessaoEnum 
  })
  @IsOptional()
  @IsEnum(StatusSessaoEnum)
  status?: StatusSessaoEnum;
}
