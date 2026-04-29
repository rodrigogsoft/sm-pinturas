import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { ConsolidacaoDashboardService } from '../services/consolidacao-dashboard.service';

@Processor('consolidacao-dashboard')
export class ConsolidacaoDashboardProcessor extends WorkerHost {
  private readonly logger = new Logger(ConsolidacaoDashboardProcessor.name);

  constructor(private readonly consolidacaoService: ConsolidacaoDashboardService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processando job: ${job.name} (ID: ${job.id})`);

    try {
      switch (job.name) {
        case 'consolidar-dashboard-financeiro':
          await this.consolidacaoService.consolidarDashboardFinanceiro();
          break;
        default:
          this.logger.warn(`Job desconhecido: ${job.name}`);
      }

      this.logger.log(`Job ${job.name} concluido com sucesso`);
    } catch (error) {
      this.logger.error(`Erro ao processar job ${job.name}:`, error.stack);
      throw error;
    }
  }
}
