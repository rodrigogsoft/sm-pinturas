import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AlocacoesItensController } from './alocacoes-itens.controller';
import { AlocacoesItensService } from './alocacoes-itens.service';
import { AlocacaoItem } from './entities/alocacao-item.entity';
import { SessaoDiaria } from '../sessoes/entities/sessao-diaria.entity';
import { Ambiente } from '../pavimentos/entities/pavimento.entity';
import { ItemAmbiente } from '../itens-ambiente/entities/item-ambiente.entity';
import { Colaborador } from '../colaboradores/entities/colaborador.entity';
import { AlocacaoTarefa } from '../alocacoes/entities/alocacao-tarefa.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AlocacaoItem,
      SessaoDiaria,
      Ambiente,
      ItemAmbiente,
      Colaborador,
      AlocacaoTarefa,
    ]),
  ],
  controllers: [AlocacoesItensController],
  providers: [AlocacoesItensService],
  exports: [AlocacoesItensService],
})
export class AlocacoesItensModule {}
