import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AmbientesService } from './ambientes.service';
import { AmbientesController } from './ambientes.controller';
import { Ambiente, Pavimento } from '../pavimentos/entities/pavimento.entity';
import { PavimentosModule } from '../pavimentos/pavimentos.module';

@Module({
  imports: [TypeOrmModule.forFeature([Ambiente, Pavimento]), PavimentosModule],
  controllers: [AmbientesController],
  providers: [AmbientesService],
  exports: [AmbientesService],
})
export class AmbientesModule {}
