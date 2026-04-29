import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { NotificationChannelEnum } from '../entities/notification-template.entity';

export class AdminCreateNotificationTemplateDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  codigo: string;

  @ApiProperty({ enum: NotificationChannelEnum })
  @IsEnum(NotificationChannelEnum)
  canal: NotificationChannelEnum;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  titulo_template: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  mensagem_template: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @ApiPropertyOptional({ default: 1 })
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
