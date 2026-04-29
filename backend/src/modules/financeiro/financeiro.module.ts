import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceiroController } from './financeiro.controller';
import { FinanceiroService } from './financeiro.service';
import { LotePagamento } from './entities/lote-pagamento.entity';
import { Medicao } from '../medicoes/entities/medicao.entity';
import { TabelaPreco } from '../precos/entities/tabela-preco.entity';
import { AlocacaoTarefa } from '../alocacoes/entities/alocacao-tarefa.entity';
import { Ambiente } from '../pavimentos/entities/pavimento.entity';
import { Cliente } from '../clientes/entities/cliente.entity';
import { Notificacao } from '../notificacoes/entities/notificacao.entity';
import { Usuario } from '../auth/entities/usuario.entity';
import { MedicoesModule } from '../medicoes/medicoes.module';
import { PrecosModule } from '../precos/precos.module';
import { AlocacoesModule } from '../alocacoes/alocacoes.module';
import { PavimentosModule } from '../pavimentos/pavimentos.module';
import { PushModule } from '../push/push.module';
import { FinanceiroJobsService } from './financeiro-jobs.service';
import { MedicaoColaborador } from '../medicoes-colaborador/entities/medicao-colaborador.entity';
import { ValeAdiantamento } from '../vale-adiantamento/entities/vale-adiantamento.entity';
import { ValeAdiantamentoParcela } from '../vale-adiantamento/entities/vale-adiantamento-parcela.entity';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LotePagamento,
      Medicao,
      TabelaPreco,
      AlocacaoTarefa,
      Ambiente,
      Cliente,
      Notificacao,
      Usuario,
      MedicaoColaborador,
      ValeAdiantamento,
      ValeAdiantamentoParcela,
    ]),
    MedicoesModule,
    PrecosModule,
    AlocacoesModule,
    PavimentosModule,
    PushModule,
    NotificacoesModule,
  ],
  controllers: [FinanceiroController],
  providers: [FinanceiroService, FinanceiroJobsService],
  exports: [FinanceiroService, FinanceiroJobsService],
})
export class FinanceiroModule {}
