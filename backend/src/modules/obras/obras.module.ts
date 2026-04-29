import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ObrasService } from './obras.service';
import { ObrasController } from './obras.controller';
import { Obra } from './entities/obra.entity';
import { Pavimento, Ambiente } from '../pavimentos/entities/pavimento.entity';
import { PavimentosModule } from '../pavimentos/pavimentos.module';

@Module({
  imports: [TypeOrmModule.forFeature([Obra, Pavimento, Ambiente]), PavimentosModule],
  controllers: [ObrasController],
  providers: [ObrasService],
  exports: [ObrasService],
})
export class ObrasModule {}
