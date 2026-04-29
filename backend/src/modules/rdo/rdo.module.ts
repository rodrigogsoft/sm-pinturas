import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RdoService } from './rdo.service';
import { RdoController } from './rdo.controller';
import { Rdo } from './rdo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Rdo])],
  providers: [RdoService],
  controllers: [RdoController],
  exports: [RdoService],
})
export class RdoModule {}
