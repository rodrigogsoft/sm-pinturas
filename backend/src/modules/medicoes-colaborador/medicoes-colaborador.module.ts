import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MedicoesColaboradorController } from './medicoes-colaborador.controller';
import { MedicoesColaboradorService } from './medicoes-colaborador.service';
import { MedicaoColaborador } from './entities/medicao-colaborador.entity';
import { AlocacaoItem } from '../alocacoes-itens/entities/alocacao-item.entity';
import { Colaborador } from '../colaboradores/entities/colaborador.entity';
import { ItemAmbiente } from '../itens-ambiente/entities/item-ambiente.entity';
import { Medicao } from '../medicoes/entities/medicao.entity';
import { Ambiente, Pavimento } from '../pavimentos/entities/pavimento.entity';
import { Obra } from '../obras/entities/obra.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MedicaoColaborador,
      AlocacaoItem,
      Colaborador,
      ItemAmbiente,
      Medicao,
      Ambiente,
      Pavimento,
      Obra,
    ]),
  ],
  controllers: [MedicoesColaboradorController],
  providers: [MedicoesColaboradorService],
  exports: [MedicoesColaboradorService],
})
export class MedicoesColaboradorModule {}
