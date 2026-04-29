import { IsEnum, IsString, IsOptional, IsObject } from 'class-validator';
import { IsLooseUuid } from '../../../common/decorators/is-loose-uuid.decorator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoNotificacaoEnum, PrioridadeEnum } from '../entities/notificacao.entity';

export class CreateNotificacaoDto {
  @ApiProperty({ description: 'ID do usuário destinatário' })
  @IsLooseUuid()
  id_usuario_destinatario: string;

  @ApiProperty({ description: 'Tipo da notificação', enum: TipoNotificacaoEnum })
  @IsEnum(TipoNotificacaoEnum)
  tipo: TipoNotificacaoEnum;

  @ApiProperty({ description: 'Título da notificação', example: 'Medição Pendente' })
  @IsString()
  titulo: string;

  @ApiProperty({ description: 'Mensagem da notificação' })
  @IsString()
  mensagem: string;

  @ApiPropertyOptional({ description: 'Prioridade', enum: PrioridadeEnum })
  @IsOptional()
  @IsEnum(PrioridadeEnum)
  prioridade?: PrioridadeEnum;

  @ApiPropertyOptional({ description: 'Dados extras em formato JSON' })
  @IsOptional()
  @IsObject()
  dados_extras?: any;

  @ApiPropertyOptional({ description: 'ID da entidade relacionada' })
  @IsOptional()
  @IsLooseUuid()
  id_entidade_relacionada?: string;

  @ApiPropertyOptional({ description: 'Tipo da entidade relacionada', example: 'medicao' })
  @IsOptional()
  @IsString()
  tipo_entidade?: string;
}
