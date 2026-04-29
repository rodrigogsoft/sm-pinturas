import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

// Entities
import { Obra, StatusObraEnum } from '../../obras/entities/obra.entity';
import { Usuario } from '../../auth/entities/usuario.entity';

// Services
import { NotificacoesService } from '../../notificacoes/notificacoes.service';

// Enums
import { PerfilEnum } from '../../../common/enums';
import { TipoNotificacaoEnum, PrioridadeEnum } from '../../notificacoes/entities/notificacao.entity';

@Injectable()
export class VerificacaoPrazosService {
  private readonly logger = new Logger(VerificacaoPrazosService.name);

  constructor(
    @InjectRepository(Obra)
    private readonly obraRepository: Repository<Obra>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectQueue('verificacao-prazos')
    private readonly verificacaoQueue: Queue,
    private readonly notificacoesService: NotificacoesService,
  ) {}

  /**
   * Agenda o job de verificação de prazos para rodar diariamente às 6h
   * Conforme ERS 4.0: "Verificação de Prazos: Diariamente às 06:00 AM"
   */
  async agendarVerificacaoDiaria(): Promise<void> {
    await this.verificacaoQueue.add(
      'verificar-obras-atrasadas',
      {},
      {
        repeat: {
          pattern: '0 6 * * *', // Cron: diariamente às 6h
        },
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3, // Tenta 3 vezes em caso de falha
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );
    this.logger.log('Job de verificação de prazos agendado para rodar diariamente às 6h');
  }

  /**
   * Verifica obras que estão atrasadas (data_previsao_fim < hoje)
   * Envia notificações para Admin, Gestor e Encarregado responsável
   */
  async verificarObrasAtrasadas(): Promise<void> {
    this.logger.log('Iniciando verificação de obras atrasadas...');

    try {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      // Busca obras ativas que estão atrasadas
      const obrasAtrasadas = await this.obraRepository.find({
        where: {
          status: StatusObraEnum.ATIVA,
          data_previsao_fim: LessThan(hoje),
          deletado: false,
        },
        relations: ['cliente', 'usuario_criador'],
      });

      this.logger.log(`Encontradas ${obrasAtrasadas.length} obras atrasadas`);

      // Para cada obra atrasada, criar alertas
      for (const obra of obrasAtrasadas) {
        await this.criarAlertasObraAtrasada(obra);
      }

      this.logger.log('Verificação de obras atrasadas concluída com sucesso');
    } catch (error) {
      this.logger.error('Erro ao verificar obras atrasadas', error.stack);
      throw error;
    }
  }

  /**
   * Cria alertas para usuários relevantes sobre obra atrasada
   */
  private async criarAlertasObraAtrasada(obra: Obra): Promise<void> {
    if (!obra.data_previsao_fim) {
      this.logger.warn(`Obra ${obra.id} sem data_previsao_fim. Pulando alerta.`);
      return;
    }

    const diasAtraso = this.calcularDiasAtraso(obra.data_previsao_fim);
    const mensagem = this.construirMensagemAlerta(obra, diasAtraso);

    // Busca usuários Admin e Gestor
    const usuariosNotificar = await this.usuarioRepository.find({
      where: [
        { id_perfil: PerfilEnum.ADMIN, ativo: true, deletado: false },
        { id_perfil: PerfilEnum.GESTOR, ativo: true, deletado: false },
      ],
    });

    // Adiciona o encarregado responsável pela obra
    if (obra.id_usuario_criador) {
      const encarregado = await this.usuarioRepository.findOne({
        where: { id: obra.id_usuario_criador, ativo: true, deletado: false },
      });
      if (encarregado) {
        usuariosNotificar.push(encarregado);
      }
    }

    // Remove duplicatas
    const usuariosUnicos = Array.from(
      new Map(usuariosNotificar.map(u => [u.id, u])).values()
    );

    // Cria notificação para cada usuário
    for (const usuario of usuariosUnicos) {
      try {
        await this.notificacoesService.create({
          id_usuario_destinatario: usuario.id,
          titulo: '⚠️ Obra Atrasada',
          mensagem,
          tipo: TipoNotificacaoEnum.OBRA_ATRASO,
          prioridade: diasAtraso >= 7 ? PrioridadeEnum.CRITICA : PrioridadeEnum.ALTA,
          dados_extras: {
            id_obra: obra.id,
            dias_atraso: diasAtraso,
            data_previsao_fim: obra.data_previsao_fim,
          },
          id_entidade_relacionada: obra.id,
          tipo_entidade: 'obra',
        });

        this.logger.log(
          `Alerta de atraso criado para usuário ${usuario.nome_completo} - Obra ${obra.nome}`,
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
   * Calcula dias de atraso
   */
  private calcularDiasAtraso(dataPrevisaoFim: Date): number {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const previsao = new Date(dataPrevisaoFim);
    previsao.setHours(0, 0, 0, 0);

    const diffMs = hoje.getTime() - previsao.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  /**
   * Constrói mensagem personalizada do alerta
   */
  private construirMensagemAlerta(obra: Obra, diasAtraso: number): string {
    const clienteNome = obra.cliente?.razao_social || 'Cliente não identificado';
    const dataFormatada = obra.data_previsao_fim ? this.formatarData(obra.data_previsao_fim) : 'Data não definida';

    if (diasAtraso === 1) {
      return `A obra "${obra.nome}" (${clienteNome}) está atrasada há 1 dia. Prazo original: ${dataFormatada}.`;
    } else {
      return `A obra "${obra.nome}" (${clienteNome}) está atrasada há ${diasAtraso} dias. Prazo original: ${dataFormatada}.`;
    }
  }

  /**
   * Formata data para exibição (DD/MM/YYYY)
   */
  private formatarData(data: Date): string {
    const d = new Date(data);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }
}
