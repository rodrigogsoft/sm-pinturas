import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ColaboradoresService } from './colaboradores.service';
import { ColaboradoresController } from './colaboradores.controller';
import { Colaborador } from './entities/colaborador.entity';
import { CryptoService } from '../../common/crypto/crypto.service';

@Module({
  imports: [TypeOrmModule.forFeature([Colaborador])],
  controllers: [ColaboradoresController],
  providers: [ColaboradoresService, CryptoService],
  exports: [ColaboradoresService],
})
export class ColaboradoresModule {}
