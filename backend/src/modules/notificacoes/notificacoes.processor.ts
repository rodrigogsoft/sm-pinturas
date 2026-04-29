import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { NotificacoesService } from './notificacoes.service';

@Processor('notification-delivery')
export class NotificacoesProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificacoesProcessor.name);

  constructor(private readonly notificacoesService: NotificacoesService) {
    super();
  }

  async process(job: Job<{ deliveryId: string }>): Promise<void> {
    try {
      await this.notificacoesService.processarEntrega(job.data.deliveryId);
    } catch (error) {
      this.logger.error(
        `Falha no processamento da entrega ${job.data.deliveryId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
