import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

import { RelatoriosService } from '../../relatorios/relatorios.service';
import { PeriodoEnum } from '../../relatorios/dto/relatorio.dto';

@Injectable()
export class ConsolidacaoDashboardService {
  private readonly logger = new Logger(ConsolidacaoDashboardService.name);

  constructor(
    @InjectQueue('consolidacao-dashboard')
    private readonly consolidacaoQueue: Queue,
    private readonly relatoriosService: RelatoriosService,
    private readonly configService: ConfigService,
  ) {}

  async agendarConsolidacaoHoraria(): Promise<void> {
    await this.consolidacaoQueue.add(
      'consolidar-dashboard-financeiro',
      {},
      {
        repeat: {
          pattern: '0 * * * *',
        },
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );

    this.logger.log('Job de consolidacao de dashboard agendado para rodar de hora em hora');
  }

  async consolidarDashboardFinanceiro(): Promise<void> {
    this.logger.log('Iniciando consolidacao de dashboard financeiro...');

    const periodos: PeriodoEnum[] = [
      PeriodoEnum.DIA,
      PeriodoEnum.SEMANA,
      PeriodoEnum.MES,
      PeriodoEnum.ANO,
    ];

    const cache: Record<string, unknown> = {};

    for (const periodo of periodos) {
      cache[periodo] = await this.relatoriosService.getDashboardFinanceiro(periodo);
    }

    const host = this.configService.get<string>('REDIS_HOST') || 'localhost';
    const port = Number(this.configService.get<string>('REDIS_PORT') || '6379');
    const password = this.configService.get<string>('REDIS_PASSWORD');
    const db = Number(this.configService.get<string>('REDIS_DB') || '0');

    const redisClient = createClient({
      socket: { host, port },
      password: password || undefined,
      database: db,
    });

    try {
      await redisClient.connect();
      await redisClient.setEx(
        'dashboard:financeiro:consolidado',
        300,
        JSON.stringify({
          atualizado_em: new Date().toISOString(),
          periodos: cache,
        }),
      );
      this.logger.log('Consolidacao de dashboard concluida e salva no Redis');
    } finally {
      if (redisClient.isOpen) {
        await redisClient.quit();
      }
    }
  }
}
