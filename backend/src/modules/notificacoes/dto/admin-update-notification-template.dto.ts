import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { NotificationChannelEnum } from '../entities/notification-template.entity';

export class AdminUpdateNotificationTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  codigo?: string;

  @ApiPropertyOptional({ enum: NotificationChannelEnum })
  @IsOptional()
  @IsEnum(NotificationChannelEnum)
  canal?: NotificationChannelEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  titulo_template?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mensagem_template?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  versao?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  variaveis?: string[];
}
