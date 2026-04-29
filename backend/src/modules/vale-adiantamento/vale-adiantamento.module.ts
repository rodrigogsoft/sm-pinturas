import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ValeAdiantamentoController } from './vale-adiantamento.controller';
import { ValeAdiantamentoService } from './vale-adiantamento.service';
import { ValeAdiantamento } from './entities/vale-adiantamento.entity';
import { ValeAdiantamentoParcela } from './entities/vale-adiantamento-parcela.entity';
import { Colaborador } from '../colaboradores/entities/colaborador.entity';
import { Obra } from '../obras/entities/obra.entity';
import { Usuario } from '../auth/entities/usuario.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ValeAdiantamento,
      ValeAdiantamentoParcela,
      Colaborador,
      Obra,
      Usuario,
    ]),
  ],
  controllers: [ValeAdiantamentoController],
  providers: [ValeAdiantamentoService],
  exports: [ValeAdiantamentoService],
})
export class ValeAdiantamentoModule {}
