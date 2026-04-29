import { ApiProperty } from '@nestjs/swagger';

export class GetMargemPrecoDto {
  @ApiProperty({
    example: 'uuid-do-preco',
    description: 'ID do preço',
  })
  id: string;

  @ApiProperty({
    example: 50.0,
    description: 'Preço de custo',
  })
  preco_custo: number;

  @ApiProperty({
    example: 100.0,
    description: 'Preço de venda',
  })
  preco_venda: number;

  @ApiProperty({
    example: 100.0,
    description: 'Margem percentual calculada',
  })
  margem_percentual: number;

  @ApiProperty({
    example: 20.0,
    description: 'Margem mínima exigida pela empresa',
  })
  margem_minima_exigida: number;

  @ApiProperty({
    example: true,
    description: 'Indica se a margem atende a política mínima',
  })
  atende_margem_minima: boolean;

  @ApiProperty({
    example: 'PENDENTE',
    description: 'Status da aprovação (PENDENTE, APROVADO, REJEITADO)',
  })
  status_aprovacao: string;

  @ApiProperty({
    example: 'Preço válido para aprovação',
    description: 'Mensagem de validação',
    required: false,
  })
  mensagem_validacao?: string;
}
