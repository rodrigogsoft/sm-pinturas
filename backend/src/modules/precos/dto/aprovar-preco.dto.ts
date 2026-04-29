import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatusAprovacaoEnum } from '../entities/tabela-preco.entity';

export class AprovarPrecoDto {
  @ApiProperty({
    enum: StatusAprovacaoEnum,
    example: StatusAprovacaoEnum.APROVADO,
    description: 'Status da aprovação (APROVADO ou REJEITADO)',
  })
  @IsEnum(StatusAprovacaoEnum)
  status: StatusAprovacaoEnum.APROVADO | StatusAprovacaoEnum.REJEITADO;

  @ApiProperty({
    example: 'Preço adequado para o mercado',
    description: 'Justificativa da aprovação/rejeição',
    required: false,
  })
  @IsString()
  @IsOptional()
  observacoes?: string;
}
