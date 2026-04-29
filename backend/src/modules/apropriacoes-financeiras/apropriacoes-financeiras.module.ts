import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ApropriacoesFinanceirasController } from './apropriacoes-financeiras.controller';
import { ApropriacoesFinanceirasService } from './apropriacoes-financeiras.service';
import { ApropriacaoFinanceira } from './entities/apropriacao-financeira.entity';
import { MedicaoColaborador } from '../medicoes-colaborador/entities/medicao-colaborador.entity';
import { ItemAmbiente } from '../itens-ambiente/entities/item-ambiente.entity';
import { TabelaPreco } from '../precos/entities/tabela-preco.entity';
import { Ambiente, Pavimento } from '../pavimentos/entities/pavimento.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApropriacaoFinanceira,
      MedicaoColaborador,
      ItemAmbiente,
      TabelaPreco,
      Ambiente,
      Pavimento,
    ]),
  ],
  controllers: [ApropriacoesFinanceirasController],
  providers: [ApropriacoesFinanceirasService],
  exports: [ApropriacoesFinanceirasService],
})
export class ApropriacoesFinanceirasModule {}
