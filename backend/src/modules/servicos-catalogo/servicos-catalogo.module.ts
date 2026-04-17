import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicoCatalogo } from './entities/servico-catalogo.entity';
import { ServicosCatalogoService } from './servicos-catalogo.service';
import { ServicosCatalogoController } from './servicos-catalogo.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ServicoCatalogo])],
  providers: [ServicosCatalogoService],
  controllers: [ServicosCatalogoController],
  exports: [ServicosCatalogoService],
})
export class ServicosCatalogoModule {}
