import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

// Services
import { MedicoesPendentesService } from '../services/medicoes-pendentes.service';

@Processor('medicoes-pendentes')
export class MedicoesPendentesProcessor extends WorkerHost {
  private readonly logger = new Logger(MedicoesPendentesProcessor.name);

  constructor(private readonly medicoesPendentesService: MedicoesPendentesService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processando job: ${job.name} (ID: ${job.id})`);

    try {
      switch (job.name) {
        case 'verificar-medicoes-pendentes':
          await this.medicoesPendentesService.verificarMedicoesPendentes();
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
