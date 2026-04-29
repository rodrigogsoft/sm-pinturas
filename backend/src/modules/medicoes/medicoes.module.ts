import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicoesController } from './medicoes.controller';
import { MedicoesService } from './medicoes.service';
import { Medicao } from './entities/medicao.entity';
import { TabelaPreco } from '../precos/entities/tabela-preco.entity';
import { AlocacaoTarefa } from '../alocacoes/entities/alocacao-tarefa.entity';
import { ItemAmbiente } from '../itens-ambiente/entities/item-ambiente.entity';
import { PrecosModule } from '../precos/precos.module';
import { AlocacoesModule } from '../alocacoes/alocacoes.module';
import { ItensAmbienteModule } from '../itens-ambiente/itens-ambiente.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { PushModule } from '../push/push.module';
import { MedicoesColaboradorModule } from '../medicoes-colaborador/medicoes-colaborador.module';
import { Usuario } from '../auth/entities/usuario.entity';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Medicao, TabelaPreco, AlocacaoTarefa, ItemAmbiente, Usuario]),
    PrecosModule,
    AlocacoesModule,
    ItensAmbienteModule,
    AuditoriaModule,
    PushModule,
    MedicoesColaboradorModule,
    NotificacoesModule,
  ],
  controllers: [MedicoesController],
  providers: [MedicoesService],
  exports: [MedicoesService],
})
export class MedicoesModule {}
