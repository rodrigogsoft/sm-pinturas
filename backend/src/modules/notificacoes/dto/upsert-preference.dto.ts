import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { NotificationChannelEnum } from '../entities/notification-template.entity';

export class UpsertPreferenceDto {
  @ApiProperty({ enum: NotificationChannelEnum })
  @IsEnum(NotificationChannelEnum)
  canal: NotificationChannelEnum;

  @ApiProperty({ required: false, example: 'CONTA_PAGAR_ABERTA' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  event_type?: string;

  @ApiProperty({ default: true })
  @IsBoolean()
  habilitado: boolean;

  @ApiProperty({ required: false, example: '22:00' })
  @IsOptional()
  @IsString()
  @MaxLength(5)
  quiet_hours_inicio?: string;

  @ApiProperty({ required: false, example: '07:00' })
  @IsOptional()
  @IsString()
  @MaxLength(5)
  quiet_hours_fim?: string;
}
