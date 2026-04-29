import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TipoConfiguracaoEnum } from '../entities/configuracao.entity';

export class UpdateConfiguracaoDto {
  @ApiPropertyOptional({ description: 'Novo valor da configuração' })
  @IsOptional()
  @IsString()
  valor?: string;

  @ApiPropertyOptional({ description: 'Se a regra está ativa' })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @ApiPropertyOptional({ description: 'Descrição da regra' })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiPropertyOptional({ enum: TipoConfiguracaoEnum })
  @IsOptional()
  @IsEnum(TipoConfiguracaoEnum)
  tipo?: TipoConfiguracaoEnum;
}
