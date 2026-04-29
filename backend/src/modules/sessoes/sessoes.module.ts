import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessoesController } from './sessoes.controller';
import { SessoesService } from './sessoes.service';
import { SessaoDiaria } from './entities/sessao-diaria.entity';
import { Obra } from '../obras/entities/obra.entity';
import { ObrasModule } from '../obras/obras.module';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';

@Module({
  imports: [TypeOrmModule.forFeature([SessaoDiaria, Obra]), ObrasModule, NotificacoesModule],
  controllers: [SessoesController],
  providers: [SessoesService],
  exports: [SessoesService],
})
export class SessoesModule {}
