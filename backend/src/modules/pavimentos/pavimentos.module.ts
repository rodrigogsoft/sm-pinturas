import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PavimentosService } from './pavimentos.service';
import { PavimentosController } from './pavimentos.controller';
import { Pavimento, Ambiente } from './entities/pavimento.entity';
import { Obra } from '../obras/entities/obra.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pavimento, Ambiente, Obra])],
  controllers: [PavimentosController],
  providers: [PavimentosService],
  exports: [PavimentosService],
})
export class PavimentosModule {}
