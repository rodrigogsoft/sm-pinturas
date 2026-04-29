import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from '../clientes/entities/cliente.entity';
import { Medicao } from '../medicoes/entities/medicao.entity';
import { Notificacao, TipoNotificacaoEnum, PrioridadeEnum } from '../notificacoes/entities/notificacao.entity';
import { PushNotificationService } from '../push/push-notification.service';
import { Usuario } from '../auth/entities/usuario.entity';
import { PerfilEnum, StatusPagamentoEnum } from '../../common/enums';
import { NotificacoesService } from '../notificacoes/notificacoes.service';

/**
 * Serviço de Jobs Agendados para Financeiro
 * 
 * Responsável por:
 * - RF10: Verificar ciclos de faturamento próximos
 * - Alertar FINANCEIRO e GESTOR sobre vencimentos
 * - Listar medições pendentes para cada cliente
 */
@Injectable()
export class FinanceiroJobsService {
  private readonly logger = new Logger(FinanceiroJobsService.name);

  constructor(
    @InjectRepository(Cliente)
    private clientesRepository: Repository<Cliente>,

    @InjectRepository(Medicao)
    private medicoesRepository: Repository<Medicao>,

    @InjectRepository(Notificacao)
    private notificacoesRepository: Repository<Notificacao>,

    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,

    private pushService: PushNotificationService,
    private notificacoesService: NotificacoesService,
  ) {}

  /**
   * Job diário: Verificar ciclos de faturamento próximos (2 dias antes)
   * Executa diariamente às 08:00 (data_hora_brasilia)
   * RF10: Aviso de ciclo de faturamento próximo
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async verificarCiclosFaturamento() {
    this.logger.log('Iniciando verificação de ciclos de faturamento...');

    try {
      const hoje = new Date();
      const dia_atual = hoje.getDate();

      // Buscar clientes ativos com dia_corte definido
      const clientes = await this.clientesRepository.find({
        where: { deletado: false },
      });

      for (const cliente of clientes) {
        if (!cliente.dia_corte) continue;

        // Verificar se é 2 dias antes do corte
        // Próximo corte será: dia_corte do próximo mês
        const proxmoCorte = dia_atual < cliente.dia_corte 
          ? new Date(hoje.getFullYear(), hoje.getMonth(), cliente.dia_corte)
          : new Date(hoje.getFullYear(), hoje.getMonth() + 1, cliente.dia_corte);

        const diasAteCorte = Math.ceil(
          (proxmoCorte.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Se faltam exatamente 2 dias
        if (diasAteCorte === 2) {
          await this.notificarCicloFaturamento(cliente, diasAteCorte);
        }
      }

      this.logger.log('Verificação de ciclos de faturamento concluída');
    } catch (err) {
      this.logger.error('Erro ao verificar ciclos de faturamento:', err);
    }
  }

  /**
   * Job diário: Verificar medições pendentes > 3 dias
   * Executa diariamente às 09:00
   * RF09: Notificar sobre medições pendentes
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async verificarMedicoesPendentes() {
    this.logger.log('Iniciando verificação de medições pendentes...');

    try {
      const hoje = new Date();
      const trezDiasAtras = new Date(hoje.getTime() - 3 * 24 * 60 * 60 * 1000);

      // Buscar medições abertas (não pagas) criadas há mais de 3 dias
      const medicoesPendentes = await this.medicoesRepository
        .createQueryBuilder('medicao')
        .where('medicao.status_pagamento = :status', {
          status: StatusPagamentoEnum.ABERTO,
        })
        .andWhere('medicao.deletado = :deletado', { deletado: false })
        .andWhere('medicao.created_at <= :trezDiasAtras', {
          trezDiasAtras,
        })
        .leftJoinAndSelect('medicao.alocacao', 'alocacao')
        .leftJoinAndSelect('alocacao.colaborador', 'colaborador')
        .take(100)
        .getMany();

      for (const medicao of medicoesPendentes) {
        if (medicao.alocacao?.colaborador?.id) {
          const diasPendente = Math.ceil(
            (hoje.getTime() - new Date(medicao.created_at).getTime()) / (1000 * 60 * 60 * 24)
          );

          // Notificar ENCARREGADO
          this.pushService
            .enviarParaUsuario(medicao.alocacao.colaborador.id, {
              titulo: '⏰ Medição Pendente há ' + diasPendente + ' dias',
              mensagem: `Sua medição criada em ${new Date(medicao.created_at).toLocaleDateString(
                'pt-BR'
              )} ainda não foi processada.`,
              tipo: 'medicao_pendente',
              id_entidade: medicao.id,
              prioridade: 'normal',
            })
            .catch(err => {
              this.logger.warn(`Erro ao notificar medição pendente ${medicao.id}:`, err);
            });
        }
      }

      this.logger.log(`Verificação de medições pendentes concluída: ${medicoesPendentes.length} notificadas`);
    } catch (err) {
      this.logger.error('Erro ao verificar medições pendentes:', err);
    }
  }

  /**
   * Notifica FINANCEIRO e GESTOR sobre ciclo de faturamento próximo
   */
  private async notificarCicloFaturamento(cliente: any, diasAteCorte: number) {
    // Buscar usuários com perfil FINANCEIRO e GESTOR
    const usuariosParaNotificar = await this.usuariosRepository.find({
      where: [
        { id_perfil: PerfilEnum.FINANCEIRO, ativo: true, deletado: false },
        { id_perfil: PerfilEnum.GESTOR, ativo: true, deletado: false },
      ],
    });

    if (usuariosParaNotificar.length === 0) {
      this.logger.warn('Nenhum usuário FINANCEIRO/GESTOR para notificar');
      return;
    }

    const ids_usuarios = usuariosParaNotificar.map(u => u.id);

    // Contar medicões pendentes
    const medicoesPendentes = await this.medicoesRepository.count({
      where: {
        status_pagamento: StatusPagamentoEnum.ABERTO,
        deletado: false,
      },
    });

    // Enviar notificação
    this.pushService
      .enviarParaUsuarios(ids_usuarios, {
        titulo: '💰 Ciclo de Faturamento Próximo',
        mensagem: `Faturamento de ${cliente.nome} vence em ${diasAteCorte} dia(s). ${medicoesPendentes} medições pendentes.`,
        tipo: 'ciclo_faturamento',
        id_entidade: cliente.id,
        prioridade: 'alta',
        dados_extras: {
          dias_restantes: diasAteCorte.toString(),
          medicoes_pendentes: medicoesPendentes.toString(),
        },
      })
      .catch(err => {
        this.logger.error(`Erro ao notificar ciclo faturamento para ${cliente.nome}:`, err);
      });

    await this.notificacoesService.publicarEventoDominio({
      event_type: 'CONTA_RECEBER_ABERTA',
      source_module: 'financeiro-jobs',
      entity_type: 'cliente',
      entity_id: cliente.id,
      payload: {
        id_cliente: cliente.id,
        cliente_nome: cliente.razao_social || cliente.nome,
        dias_ate_corte: diasAteCorte,
        medicoes_pendentes: medicoesPendentes,
      },
    });

    // Registrar notificação no banco de dados
    await this.criarNotificacaoBancoDados(
      cliente,
      ids_usuarios,
      TipoNotificacaoEnum.CICLO_FATURAMENTO,
      `Faturamento próximo: ${diasAteCorte} dias`,
      medicoesPendentes
    );
  }

  /**
   * Cria registro de notificação no banco de dados
   */
  private async criarNotificacaoBancoDados(
    cliente: any,
    usuariosIds: string[],
    tipo: TipoNotificacaoEnum,
    mensagem: string,
    medicoesPendentes: number,
  ) {
    for (const id_usuario of usuariosIds) {
      try {
        // Buscar usuário para verificar se existe
        const usuario = await this.usuariosRepository.findOne({
          where: { id: id_usuario },
        });

        if (!usuario) {
          continue;
        }

        // Criar notificação com estrutura correta
        const notificacao = this.notificacoesRepository.create({
          id_usuario_destinatario: id_usuario,
          tipo,
          titulo: `Ciclo de faturamento do cliente ${cliente.razao_social}`,
          mensagem: `${mensagem} - ${medicoesPendentes} medições aguardando processamento`,
          prioridade: PrioridadeEnum.ALTA,
          id_entidade_relacionada: cliente.id,
          tipo_entidade: 'Cliente',
        });

        await this.notificacoesRepository.save(notificacao);
      } catch (err) {
        this.logger.error(`Erro ao criar notificação para ${id_usuario}:`, err);
      }
    }
  }

  /**
   * Obter lista de medições pendentes por cliente
   * Endpoint: GET /relatorios/medicoes-pendentes/:id_cliente
   */
  async obterMedicoesPendentes(id_cliente: string) {
    const medicoesPendentes = await this.medicoesRepository
      .createQueryBuilder('medicao')
      .leftJoinAndSelect('medicao.alocacao', 'alocacao')
      .leftJoinAndSelect('alocacao.colaborador', 'colaborador')
      .leftJoinAndSelect('alocacao.ambiente', 'ambiente')
      .leftJoinAndSelect('ambiente.pavimento', 'pavimento')
      .leftJoinAndSelect('pavimento.obra', 'obra')
      .where('medicao.status_pagamento = :status', {
        status: StatusPagamentoEnum.ABERTO,
      })
      .andWhere('medicao.deletado = false')
      .andWhere('obra.id_cliente = :id_cliente', { id_cliente })
      .orderBy('medicao.created_at', 'DESC')
      .take(1000)
      .getMany();

    // Filtrar por cliente se implementar relacionamento
    const agrupadas = {
      total: medicoesPendentes.length,
      valor_total: medicoesPendentes.reduce((sum, m) => sum + (m.valor_calculado || 0), 0),
      medicoes: medicoesPendentes.map(m => ({
        id: m.id,
        colaborador: m.alocacao?.colaborador?.nome_completo,
        ambiente: m.alocacao?.ambiente?.nome,
        data_medicao: m.data_medicao,
        valor_calculado: m.valor_calculado,
        dias_pendente: Math.ceil(
          (new Date().getTime() - new Date(m.created_at).getTime()) / (1000 * 60 * 60 * 24)
        ),
      })),
    };

    return agrupadas;
  }
}
