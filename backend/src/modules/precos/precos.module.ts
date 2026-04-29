import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrecosService } from './precos.service';
import { PrecosController } from './precos.controller';
import { TabelaPreco } from './entities/tabela-preco.entity';
import { Obra } from '../obras/entities/obra.entity';
import { ObrasModule } from '../obras/obras.module';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';

@Module({
  imports: [TypeOrmModule.forFeature([TabelaPreco, Obra]), ObrasModule, NotificacoesModule],
  controllers: [PrecosController],
  providers: [PrecosService],
  exports: [PrecosService],
})
export class PrecosModule {}
