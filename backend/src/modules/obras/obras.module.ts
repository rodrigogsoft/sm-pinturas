import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Obra } from './entities/obra.entity';
import { ObrasService } from './obras.service';
import { ObrasController } from './obras.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Obra])],
  providers: [ObrasService],
  controllers: [ObrasController],
  exports: [ObrasService],
})
export class ObrasModule {}
