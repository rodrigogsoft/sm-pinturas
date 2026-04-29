import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RelatoriosController } from './relatorios.controller';
import { RelatoriosService } from './relatorios.service';
import { ExportService } from './export.service';
import { Medicao } from '../medicoes/entities/medicao.entity';
import { TabelaPreco } from '../precos/entities/tabela-preco.entity';
import { Obra } from '../obras/entities/obra.entity';
import { AlocacaoTarefa } from '../alocacoes/entities/alocacao-tarefa.entity';
import { Colaborador } from '../colaboradores/entities/colaborador.entity';
import { MedicaoColaborador } from '../medicoes-colaborador/entities/medicao-colaborador.entity';
import { ValeAdiantamento } from '../vale-adiantamento/entities/vale-adiantamento.entity';
import { ItemAmbiente } from '../itens-ambiente/entities/item-ambiente.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Medicao,
      TabelaPreco,
      Obra,
      AlocacaoTarefa,
      Colaborador,
      MedicaoColaborador,
      ValeAdiantamento,
      ItemAmbiente,
    ]),
  ],
  controllers: [RelatoriosController],
  providers: [RelatoriosService, ExportService],
  exports: [RelatoriosService, ExportService],
})
export class RelatoriosModule {}
