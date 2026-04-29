import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThan, IsNull } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

// Entities
import { Medicao } from '../../medicoes/entities/medicao.entity';
import { Obra } from '../../obras/entities/obra.entity';
import { Usuario } from '../../auth/entities/usuario.entity';

// Services
import { NotificacoesService } from '../../notificacoes/notificacoes.service';

// Enums
import { PerfilEnum } from '../../../common/enums';
import { TipoNotificacaoEnum, PrioridadeEnum } from '../../notificacoes/entities/notificacao.entity';

@Injectable()
export class AlertasFaturamentoService {
  private readonly logger = new Logger(AlertasFaturamentoService.name);

  constructor(
    @InjectRepository(Medicao)
    private readonly medicaoRepository: Repository<Medicao>,
    @InjectRepository(Obra)
    private readonly obraRepository: Repository<Obra>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectQueue('alertas-faturamento')
    private readonly alertasQueue: Queue,
    private readonly notificacoesService: NotificacoesService,
  ) {}

  /**
   * Agenda o job de verificação de alertas para rodar diariamente às 9h
   */
  async agendarVerificacaoDiaria(): Promise<void> {
    await this.alertasQueue.add(
      'verificar-prazos-faturamento',
      {},
      {
        repeat: {
          pattern: '0 9 * * *', // Cron: diariamente às 9h
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
    this.logger.log('Job de alertas de faturamento agendado para rodar diariamente às 9h');
  }

  /**
   * Verifica medições com prazo de faturamento próximo (2 dias)
   * RF10: Alertas de Faturamento
   */
  async verificarPrazosFaturamento(): Promise<void> {
    this.logger.log('Iniciando verificação de prazos de faturamento...');

    try {
      // Data limite: 2 dias a partir de hoje
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const dataLimite = new Date(hoje);
      dataLimite.setDate(dataLimite.getDate() + 2);
      dataLimite.setHours(23, 59, 59, 999);

      // Busca medições com prazo próximo (ainda não faturadas)
      const medicoesProximas = await this.medicaoRepository.find({
        where: {
          data_prevista_faturamento: LessThanOrEqual(dataLimite),
          data_faturamento_realizado: IsNull(),
        },
        relations: ['obra', 'obra.cliente'],
      });

      this.logger.log(`Encontradas ${medicoesProximas.length} medições com prazo próximo`);

      // Para cada medição, criar alertas
      for (const medicao of medicoesProximas) {
        await this.criarAlertasFaturamento(medicao);
      }

      this.logger.log('Verificação de prazos concluída com sucesso');
    } catch (error) {
      this.logger.error('Erro ao verificar prazos de faturamento', error.stack);
      throw error;
    }
  }

  /**
   * Cria alertas para usuários relevantes sobre medição próxima ao prazo
   */
  private async criarAlertasFaturamento(medicao: Medicao): Promise<void> {
    // Verifica se tem data prevista de faturamento
    if (!medicao.data_prevista_faturamento) {
      this.logger.warn(`Medição ${medicao.id} sem data_prevista_faturamento. Pulando alerta.`);
      return;
    }

    const diasRestantes = this.calcularDiasRestantes(medicao.data_prevista_faturamento);

    // Busca usuários que devem ser notificados (Admin, Gestor, Financeiro)
    const usuariosNotificar = await this.usuarioRepository.find({
      where: [
        { id_perfil: PerfilEnum.ADMIN },
        { id_perfil: PerfilEnum.GESTOR },
        { id_perfil: PerfilEnum.FINANCEIRO },
      ],
    });

    const mensagem = this.construirMensagemAlerta(medicao, diasRestantes);

    // Cria notificação para cada usuário
    for (const usuario of usuariosNotificar) {
      try {
        await this.notificacoesService.create({
          id_usuario_destinatario: usuario.id,
          titulo: 'Alerta de Faturamento',
          mensagem,
          tipo: TipoNotificacaoEnum.CICLO_FATURAMENTO,
          prioridade: diasRestantes <= 1 ? PrioridadeEnum.ALTA : PrioridadeEnum.MEDIA,
          dados_extras: {
            id_medicao: medicao.id,
            id_obra: medicao.id_obra,
            data_prevista: medicao.data_prevista_faturamento,
            dias_restantes: diasRestantes,
          },
          id_entidade_relacionada: medicao.id,
          tipo_entidade: 'medicao',
        });

        this.logger.log(
          `Alerta criado para usuário ${usuario.nome_completo} (${usuario.email}) - Medição ${medicao.id}`,
        );
      } catch (error) {
        this.logger.error(
          `Erro ao criar alerta para usuário ${usuario.id}`,
          error.stack,
        );
      }
    }
  }

  /**
   * Calcula dias restantes até a data prevista
   */
  private calcularDiasRestantes(dataPrevista: Date): number {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const prevista = new Date(dataPrevista);
    prevista.setHours(0, 0, 0, 0);

    const diffMs = prevista.getTime() - hoje.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Constrói mensagem personalizada do alerta
   */
  private construirMensagemAlerta(medicao: Medicao, diasRestantes: number): string {
    const obraNome = medicao.obra?.nome || 'Obra não identificada';
    const clienteNome = medicao.obra?.cliente?.razao_social || 'Cliente não identificado';

    if (diasRestantes === 0) {
      return `⚠️ URGENTE: O prazo de faturamento da medição #${medicao.id} da obra "${obraNome}" (${clienteNome}) vence HOJE!`;
    } else if (diasRestantes === 1) {
      return `⏰ Atenção: O prazo de faturamento da medição #${medicao.id} da obra "${obraNome}" (${clienteNome}) vence AMANHÃ!`;
    } else {
      return `📅 Lembrete: O prazo de faturamento da medição #${medicao.id} da obra "${obraNome}" (${clienteNome}) vence em ${diasRestantes} dias.`;
    }
  }
}
