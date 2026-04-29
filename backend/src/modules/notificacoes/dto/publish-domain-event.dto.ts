import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class PublishDomainEventDto {
  @ApiProperty({ example: 'CONTA_PAGAR_ABERTA' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  event_type: string;

  @ApiProperty({ example: 'financeiro' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  source_module: string;

  @ApiPropertyOptional({ example: 'lote_pagamento' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  entity_type?: string;

  @ApiPropertyOptional({ example: 'uuid-da-entidade' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  entity_id?: string;

  @ApiProperty({ description: 'Payload estruturado do evento' })
  @IsObject()
  payload: Record<string, any>;

  @ApiPropertyOptional({ description: 'Chave de idempotencia externa' })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  idempotency_key?: string;
}
