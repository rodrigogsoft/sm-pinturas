import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

// Services
import { VerificacaoPrazosService } from '../services/verificacao-prazos.service';

@Processor('verificacao-prazos')
export class VerificacaoPrazosProcessor extends WorkerHost {
  private readonly logger = new Logger(VerificacaoPrazosProcessor.name);

  constructor(private readonly verificacaoPrazosService: VerificacaoPrazosService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processando job: ${job.name} (ID: ${job.id})`);

    try {
      switch (job.name) {
        case 'verificar-obras-atrasadas':
          await this.verificacaoPrazosService.verificarObrasAtrasadas();
          break;

        default:
          this.logger.warn(`Job desconhecido: ${job.name}`);
      }

      this.logger.log(`Job ${job.name} concluído com sucesso`);
    } catch (error) {
      this.logger.error(`Erro ao processar job ${job.name}:`, error.stack);
      throw error; // Permite retry do BullMQ
    }
  }
}
