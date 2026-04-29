import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

// Entities
import { Medicao } from '../../medicoes/entities/medicao.entity';
import { Usuario } from '../../auth/entities/usuario.entity';
import { AlocacaoTarefa } from '../../alocacoes/entities/alocacao-tarefa.entity';

// Services
import { NotificacoesService } from '../../notificacoes/notificacoes.service';

// Enums
import { PerfilEnum } from '../../../common/enums';
import { TipoNotificacaoEnum, PrioridadeEnum } from '../../notificacoes/entities/notificacao.entity';

@Injectable()
export class MedicoesPendentesService {
  private readonly logger = new Logger(MedicoesPendentesService.name);

  constructor(
    @InjectRepository(AlocacaoTarefa)
    private readonly alocacaoRepository: Repository<AlocacaoTarefa>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectQueue('medicoes-pendentes')
    private readonly medicoesQueue: Queue,
    private readonly notificacoesService: NotificacoesService,
  ) {}

  /**
   * Agenda o job de verificação de medições pendentes para rodar diariamente às 8h
   * RF09: "Push para Encarregado sobre medições pendentes"
   */
  async agendarVerificacaoDiaria(): Promise<void> {
    await this.medicoesQueue.add(
      'verificar-medicoes-pendentes',
      {},
      {
        repeat: {
          pattern: '0 8 * * *', // Cron: diariamente às 8h
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
    this.logger.log('Job de medições pendentes agendado para rodar diariamente às 8h');
  }

  /**
   * Verifica alocações concluídas há mais de 3 dias sem medição registrada
   * Envia notificação para o encarregado responsável
   */
  async verificarMedicoesPendentes(): Promise<void> {
    this.logger.log('Iniciando verificação de medições pendentes...');

    try {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - 3); // 3 dias atrás
      dataLimite.setHours(23, 59, 59, 999);

      // Busca alocações concluídas sem medição há mais de 3 dias
      const alocacoesPendentes = await this.alocacaoRepository
        .createQueryBuilder('alocacao')
        .leftJoinAndSelect('alocacao.sessao', 'sessao')
        .leftJoinAndSelect('sessao.encarregado', 'encarregado')
        .leftJoinAndSelect('alocacao.itemAmbiente', 'itemAmbiente')
        .leftJoinAndSelect('itemAmbiente.ambiente', 'ambiente')
        .leftJoinAndSelect('ambiente.pavimento', 'pavimento')
        .leftJoinAndSelect('pavimento.obra', 'obra')
        .leftJoinAndSelect('alocacao.medicoes', 'medicao')
        .where('alocacao.status = :status', { status: 'CONCLUIDO' })
        .andWhere('alocacao.data_fim < :dataLimite', { dataLimite })
        .andWhere('alocacao.deletado = :deletado', { deletado: false })
        .andWhere('medicao.id IS NULL') // Sem medição registrada
        .getMany();

      this.logger.log(`Encontradas ${alocacoesPendentes.length} alocações sem medição há mais de 3 dias`);

      // Agrupa por encarregado
      const alocacoesPorEncarregado = this.agruparPorEncarregado(alocacoesPendentes);

      // Cria notificações
      for (const [idEncarregado, alocacoes] of alocacoesPorEncarregado) {
        await this.criarAlertaMedicoesPendentes(idEncarregado, alocacoes);
      }

      this.logger.log('Verificação de medições pendentes concluída com sucesso');
    } catch (error) {
      this.logger.error('Erro ao verificar medições pendentes', error.stack);
      throw error;
    }
  }

  /**
   * Agrupa alocações por encarregado
   */
  private agruparPorEncarregado(
    alocacoes: AlocacaoTarefa[],
  ): Map<string, AlocacaoTarefa[]> {
    const mapa = new Map<string, AlocacaoTarefa[]>();

    for (const alocacao of alocacoes) {
      const idEncarregado = alocacao.sessao?.id_encarregado;
      if (!idEncarregado) continue;

      if (!mapa.has(idEncarregado)) {
        mapa.set(idEncarregado, []);
      }
      mapa.get(idEncarregado)!.push(alocacao);
    }

    return mapa;
  }

  /**
   * Cria alerta de medições pendentes para um encarregado
   */
  private async criarAlertaMedicoesPendentes(
    idEncarregado: string,
    alocacoes: AlocacaoTarefa[],
  ): Promise<void> {
    try {
      const encarregado = await this.usuarioRepository.findOne({
        where: { id: idEncarregado, ativo: true, deletado: false },
      });

      if (!encarregado) {
        this.logger.warn(`Encarregado ${idEncarregado} não encontrado ou inativo`);
        return;
      }

      const quantidade = alocacoes.length;
      const mensagem = this.construirMensagemAlerta(quantidade, alocacoes);

      await this.notificacoesService.create({
        id_usuario_destinatario: idEncarregado,
        titulo: '📋 Medições Pendentes',
        mensagem,
        tipo: TipoNotificacaoEnum.MEDICAO_PENDENTE,
        prioridade: quantidade >= 5 ? PrioridadeEnum.ALTA : PrioridadeEnum.MEDIA,
        dados_extras: {
          quantidade_pendente: quantidade,
          ids_alocacoes: alocacoes.map(a => a.id),
        },
        id_entidade_relacionada: undefined,
        tipo_entidade: 'alocacao',
      });

      this.logger.log(
        `Alerta de medições pendentes enviado para ${encarregado.nome_completo} (${quantidade} pendências)`,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao criar alerta para encarregado ${idEncarregado}`,
        error.stack,
      );
    }
  }

  /**
   * Constrói mensagem personalizada do alerta
   */
  private construirMensagemAlerta(
    quantidade: number,
    alocacoes: AlocacaoTarefa[],
  ): string {
    if (quantidade === 1) {
      const obra = alocacoes[0]?.item_ambiente?.ambiente?.pavimento?.obra?.nome || 'Obra não identificada';
      return `Você tem 1 tarefa concluída há mais de 3 dias sem medição registrada na obra "${obra}". Por favor, registre a medição.`;
    } else {
      // Listar até 3 obras diferentes
      const obrasUnicas = new Set<string>();
      for (const alocacao of alocacoes) {
        const obraNome = alocacao?.item_ambiente?.ambiente?.pavimento?.obra?.nome;
        if (obraNome) obrasUnicas.add(obraNome);
        if (obrasUnicas.size >= 3) break;
      }

      const obrasTexto = Array.from(obrasUnicas).join(', ');
      return `Você tem ${quantidade} tarefas concluídas há mais de 3 dias sem medição registrada. Obras: ${obrasTexto}. Por favor, registre as medições.`;
    }
  }

  /**
   * Enviar notificação imediata sobre medição pendente (chamada manual)
   */
  async notificarMedicaoPendenteImediata(
    idEncarregado: string,
    idAlocacao: string,
    obraNome: string,
  ): Promise<void> {
    try {
      await this.notificacoesService.create({
        id_usuario_destinatario: idEncarregado,
        titulo: '⏰ Lembrete: Medição Pendente',
        mensagem: `A tarefa na obra "${obraNome}" foi concluída. Por favor, registre a medição.`,
        tipo: TipoNotificacaoEnum.MEDICAO_PENDENTE,
        prioridade: PrioridadeEnum.MEDIA,
        dados_extras: {
          id_alocacao: idAlocacao,
        },
        id_entidade_relacionada: idAlocacao,
        tipo_entidade: 'alocacao',
      });

      this.logger.log(`Notificação imediata de medição pendente enviada para encarregado ${idEncarregado}`);
    } catch (error) {
      this.logger.error('Erro ao enviar notificação imediata', error.stack);
    }
  }
}
