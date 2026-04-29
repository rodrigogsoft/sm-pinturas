import { PartialType } from '@nestjs/swagger';
import { CreateMedicaoDto } from './create-medicao.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StatusPagamentoEnum } from '../../../common/enums';

export class UpdateMedicaoDto extends PartialType(CreateMedicaoDto) {
  @ApiPropertyOptional({ 
    description: 'Status do pagamento', 
    enum: StatusPagamentoEnum 
  })
  @IsOptional()
  @IsEnum(StatusPagamentoEnum)
  status_pagamento?: StatusPagamentoEnum;
}
