import { IsString, IsEnum, IsOptional, IsObject, IsIP } from 'class-validator';
import { IsLooseUuid } from '../../../common/decorators/is-loose-uuid.decorator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AcaoAuditoriaEnum } from '../entities/audit-log.entity';

export class CreateAuditLogDto {
  @ApiProperty({ description: 'ID do usuário que executou a ação' })
  @IsLooseUuid()
  id_usuario: string;

  @ApiProperty({ description: 'Nome da tabela afetada', example: 'tb_tabela_precos' })
  @IsString()
  tabela_afetada: string;

  @ApiProperty({ description: 'Ação executada', enum: AcaoAuditoriaEnum })
  @IsEnum(AcaoAuditoriaEnum)
  acao: AcaoAuditoriaEnum;

  @ApiPropertyOptional({ description: 'ID do registro afetado' })
  @IsOptional()
  @IsLooseUuid()
  id_registro?: string;

  @ApiPropertyOptional({ description: 'Estado anterior dos dados (JSON)' })
  @IsOptional()
  @IsObject()
  dados_antes?: any;

  @ApiPropertyOptional({ description: 'Estado posterior dos dados (JSON)' })
  @IsOptional()
  @IsObject()
  dados_depois?: any;

  @ApiPropertyOptional({ description: 'IP de origem da requisição' })
  @IsOptional()
  @IsIP()
  ip_origem?: string;

  @ApiPropertyOptional({ description: 'User Agent do navegador/cliente' })
  @IsOptional()
  @IsString()
  user_agent?: string;

  @ApiPropertyOptional({ description: 'Justificativa para a ação (RN02 - exceções)' })
  @IsOptional()
  @IsString()
  justificativa?: string;
}
