import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicosService } from './servicos.service';
import { ServicosController } from './servicos.controller';
import { ServicoCatalogo } from './entities/servico-catalogo.entity';
import { TabelaPreco } from '../precos/entities/tabela-preco.entity';
import { Medicao } from '../medicoes/entities/medicao.entity';
import { PrecosModule } from '../precos/precos.module';
import { MedicoesModule } from '../medicoes/medicoes.module';

@Module({
  imports: [TypeOrmModule.forFeature([ServicoCatalogo, TabelaPreco, Medicao]), PrecosModule, MedicoesModule],
  controllers: [ServicosController],
  providers: [ServicosService],
  exports: [ServicosService],
})
export class ServicosModule {}
