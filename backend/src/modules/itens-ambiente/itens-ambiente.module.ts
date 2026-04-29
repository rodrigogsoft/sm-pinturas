import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItensAmbienteService } from './itens-ambiente.service';
import { ItensAmbienteController } from './itens-ambiente.controller';
import { ItemAmbiente } from './entities/item-ambiente.entity';
import { Ambiente } from '../pavimentos/entities/pavimento.entity';
import { TabelaPreco } from '../precos/entities/tabela-preco.entity';
import { PavimentosModule } from '../pavimentos/pavimentos.module';
import { PrecosModule } from '../precos/precos.module';

@Module({
  imports: [TypeOrmModule.forFeature([ItemAmbiente, Ambiente, TabelaPreco]), PavimentosModule, PrecosModule],
  controllers: [ItensAmbienteController],
  providers: [ItensAmbienteService],
  exports: [ItensAmbienteService],
})
export class ItensAmbienteModule {}
