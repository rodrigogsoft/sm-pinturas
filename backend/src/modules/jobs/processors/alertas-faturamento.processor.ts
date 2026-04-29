import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

// Services
import { AlertasFaturamentoService } from '../services/alertas-faturamento.service';

@Processor('alertas-faturamento')
export class AlertasFaturamentoProcessor extends WorkerHost {
  private readonly logger = new Logger(AlertasFaturamentoProcessor.name);

  constructor(private readonly alertasFaturamentoService: AlertasFaturamentoService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processando job: ${job.name} (ID: ${job.id})`);

    try {
      switch (job.name) {
        case 'verificar-prazos-faturamento':
          await this.alertasFaturamentoService.verificarPrazosFaturamento();
          break;

        default:
          this.logger.warn(`Job desconhecido: ${job.name}`);
      }

      this.logger.log(`Job ${job.name} concluído com sucesso`);
    } catch (error) {
      this.logger.error(`Erro ao processar job ${job.name}:`, error.stack);
      throw error;
    }
  }
}
