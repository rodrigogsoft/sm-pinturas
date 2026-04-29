import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissoesController } from './permissoes.controller';
import { PermissoesService } from './permissoes.service';
import { Perfil } from './entities/perfil.entity';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Perfil]),
    AuditoriaModule,
  ],
  controllers: [PermissoesController],
  providers: [PermissoesService],
  exports: [PermissoesService],
})
export class PermissoesModule {}
