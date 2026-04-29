import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OsFinalizacaoController } from './os-finalizacao.controller';
import { OsFinalizacaoService } from './os-finalizacao.service';
import { OsFinalizacao } from './entities/os-finalizacao.entity';
import { Obra } from '../obras/entities/obra.entity';
import { ItemAmbiente } from '../itens-ambiente/entities/item-ambiente.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OsFinalizacao, Obra, ItemAmbiente])],
  controllers: [OsFinalizacaoController],
  providers: [OsFinalizacaoService],
  exports: [OsFinalizacaoService],
})
export class OsFinalizacaoModule {}
