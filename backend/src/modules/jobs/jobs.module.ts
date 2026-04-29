import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Medicao } from '../medicoes/entities/medicao.entity';
import { Obra } from '../obras/entities/obra.entity';
import { Usuario } from '../auth/entities/usuario.entity';
import { AlocacaoTarefa } from '../alocacoes/entities/alocacao-tarefa.entity';

// Modules
import { NotificacoesModule } from '../notificacoes/notificacoes.module';
import { MedicoesModule } from '../medicoes/medicoes.module';
import { ObrasModule } from '../obras/obras.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { AlocacoesModule } from '../alocacoes/alocacoes.module';

// Services & Processors
import { AlertasFaturamentoService } from './services/alertas-faturamento.service';
import { AlertasFaturamentoProcessor } from './processors/alertas-faturamento.processor';
import { VerificacaoPrazosService } from './services/verificacao-prazos.service';
import { VerificacaoPrazosProcessor } from './processors/verificacao-prazos.processor';
import { MedicoesPendentesService } from './services/medicoes-pendentes.service';
import { MedicoesPendentesProcessor } from './processors/medicoes-pendentes.processor';
import { ConsolidacaoDashboardService } from './services/consolidacao-dashboard.service';
import { ConsolidacaoDashboardProcessor } from './processors/consolidacao-dashboard.processor';
import { RelatoriosModule } from '../relatorios/relatorios.module';

@Module({
  imports: [
    // Registrar filas BullMQ
    BullModule.registerQueue(
      {
        name: 'alertas-faturamento',
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      },
      {
        name: 'verificacao-prazos',
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      },
      {
        name: 'medicoes-pendentes',
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      },
      {
        name: 'consolidacao-dashboard',
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      },
    ),
    TypeOrmModule.forFeature([Medicao, Obra, Usuario, AlocacaoTarefa]),
    NotificacoesModule,
    MedicoesModule,
    ObrasModule,
    UsuariosModule,
    AlocacoesModule,
    RelatoriosModule,
  ],
  providers: [
    AlertasFaturamentoService,
    AlertasFaturamentoProcessor,
    VerificacaoPrazosService,
    VerificacaoPrazosProcessor,
    MedicoesPendentesService,
    MedicoesPendentesProcessor,
    ConsolidacaoDashboardService,
    ConsolidacaoDashboardProcessor,
  ],
  exports: [
    AlertasFaturamentoService,
    VerificacaoPrazosService,
    MedicoesPendentesService,
    ConsolidacaoDashboardService,
  ],
})
export class JobsModule implements OnModuleInit {
  private readonly logger = new Logger(JobsModule.name);

  constructor(
    private readonly alertasFaturamentoService: AlertasFaturamentoService,
    private readonly verificacaoPrazosService: VerificacaoPrazosService,
    private readonly medicoesPendentesService: MedicoesPendentesService,
    private readonly consolidacaoDashboardService: ConsolidacaoDashboardService,
  ) {}

  async onModuleInit() {
    try {
      // Agendar job de alertas de faturamento (RF10) - Diariamente às 9h
      await this.alertasFaturamentoService.agendarVerificacaoDiaria();
      this.logger.log('✅ Job de alertas de faturamento agendado (9h diariamente)');

      // Agendar job de verificação de prazos de obras - Diariamente às 6h (Conforme ERS 4.0)
      await this.verificacaoPrazosService.agendarVerificacaoDiaria();
      this.logger.log('✅ Job de verificação de prazos agendado (6h diariamente)');

      // Agendar job de medições pendentes (RF09) - Diariamente às 8h
      await this.medicoesPendentesService.agendarVerificacaoDiaria();
      this.logger.log('✅ Job de medições pendentes agendado (8h diariamente)');

      // Agendar job de consolidação de dashboard - A cada 1 hora (Conforme ERS 4.0)
      await this.consolidacaoDashboardService.agendarConsolidacaoHoraria();
      this.logger.log('✅ Job de consolidação de dashboard agendado (de hora em hora)');

      this.logger.log('🎉 Todos os jobs BullMQ agendados com sucesso!');
    } catch (error) {
      this.logger.error('❌ Erro ao agendar jobs', error.stack);
    }
  }
}
