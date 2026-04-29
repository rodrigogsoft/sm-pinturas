import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlocacoesController } from './alocacoes.controller';
import { AlocacoesService } from './alocacoes.service';
import { AlocacaoTarefa } from './entities/alocacao-tarefa.entity';
import { AlocacaoItem } from '../alocacoes-itens/entities/alocacao-item.entity';
import { ItensAmbienteModule } from '../itens-ambiente/itens-ambiente.module';
import { ConfiguracoesModule } from '../configuracoes/configuracoes.module';
import { SessaoDiaria } from '../sessoes/entities/sessao-diaria.entity';
import { TabelaPreco } from '../precos/entities/tabela-preco.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AlocacaoTarefa, AlocacaoItem, SessaoDiaria, TabelaPreco]),
    ItensAmbienteModule,
    ConfiguracoesModule,
  ],
  controllers: [AlocacoesController],
  providers: [AlocacoesService],
  exports: [AlocacoesService],
})
export class AlocacoesModule {}
