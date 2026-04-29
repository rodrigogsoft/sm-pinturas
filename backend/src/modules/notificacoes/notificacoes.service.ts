import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { createHash } from 'crypto';
import { Between, In, IsNull, Repository } from 'typeorm';
import { PerfilEnum } from '../../common/enums';
import { Usuario } from '../auth/entities/usuario.entity';
import { Notificacao, TipoNotificacaoEnum, PrioridadeEnum } from './entities/notificacao.entity';
import { CreateNotificacaoDto } from './dto/create-notificacao.dto';
import { PushNotificationService } from '../push/push-notification.service';
import {
  NotificationEvent,
  NotificationEventStatusEnum,
} from './entities/notification-event.entity';
import { NotificationRule } from './entities/notification-rule.entity';
import {
  NotificationChannelEnum,
  NotificationTemplate,
} from './entities/notification-template.entity';
import {
  NotificationDelivery,
  NotificationDeliveryStatusEnum,
} from './entities/notification-delivery.entity';
import { UserNotificationPreference } from './entities/user-notification-preference.entity';
import { PublishDomainEventDto } from './dto/publish-domain-event.dto';
import { FindMinhasNotificacoesDto } from './dto/find-minhas-notificacoes.dto';
import { UpsertPreferenceDto } from './dto/upsert-preference.dto';
import { AdminCreateNotificationRuleDto } from './dto/admin-create-notification-rule.dto';
import { AdminUpdateNotificationRuleDto } from './dto/admin-update-notification-rule.dto';
import { AdminCreateNotificationTemplateDto } from './dto/admin-create-notification-template.dto';
import { AdminUpdateNotificationTemplateDto } from './dto/admin-update-notification-template.dto';

@Injectable()
export class NotificacoesService {
  private readonly logger = new Logger(NotificacoesService.name);
  private readonly retryDelaysMs = [60_000, 300_000, 900_000, 3_600_000];

  constructor(
    @InjectRepository(Notificacao)
    private notificacaoRepository: Repository<Notificacao>,
    @InjectRepository(NotificationEvent)
    private notificationEventRepository: Repository<NotificationEvent>,
    @InjectRepository(NotificationRule)
    private notificationRuleRepository: Repository<NotificationRule>,
    @InjectRepository(NotificationTemplate)
    private notificationTemplateRepository: Repository<NotificationTemplate>,
    @InjectRepository(NotificationDelivery)
    private notificationDeliveryRepository: Repository<NotificationDelivery>,
    @InjectRepository(UserNotificationPreference)
    private notificationPreferenceRepository: Repository<UserNotificationPreference>,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    @InjectQueue('notification-delivery')
    private notificationQueue: Queue<{ deliveryId: string }>,
    private pushService: PushNotificationService,
  ) {}

  /**
   * Criar nova notificação
   * Envia push notification se o usuário tiver token FCM registrado
   */
  async create(createNotificacaoDto: CreateNotificacaoDto): Promise<Notificacao> {
    const notificacao = this.notificacaoRepository.create(createNotificacaoDto);
    const saved = await this.notificacaoRepository.save(notificacao);

    await this.criarEntrega(saved, NotificationChannelEnum.IN_APP, true);

    const podeEnviarPush = await this.usuarioPodeReceberCanal(
      saved.id_usuario_destinatario,
      NotificationChannelEnum.PUSH,
      saved.tipo,
    );

    if (podeEnviarPush) {
      await this.criarEntrega(saved, NotificationChannelEnum.PUSH);
    }

    return saved;
  }

  async publicarEventoDominio(dto: PublishDomainEventDto): Promise<NotificationEvent> {
    const idempotencyKey =
      dto.idempotency_key ||
      this.gerarIdempotencyKey(dto.event_type, dto.entity_type, dto.entity_id, dto.payload);

    const existente = await this.notificationEventRepository.findOne({
      where: { idempotency_key: idempotencyKey },
    });

    if (existente) {
      return existente;
    }

    const evento = this.notificationEventRepository.create({
      event_type: dto.event_type,
      source_module: dto.source_module,
      entity_type: dto.entity_type || null,
      entity_id: dto.entity_id || null,
      payload: dto.payload,
      occurred_at: new Date(),
      idempotency_key: idempotencyKey,
      status: NotificationEventStatusEnum.RECEBIDO,
    });

    const eventoSalvo = await this.notificationEventRepository.save(evento);

    try {
      await this.processarEvento(eventoSalvo);
      if (eventoSalvo.status === NotificationEventStatusEnum.RECEBIDO) {
        eventoSalvo.status = NotificationEventStatusEnum.PROCESSADO;
      }
      eventoSalvo.erro = null;
    } catch (error) {
      eventoSalvo.status = NotificationEventStatusEnum.ERRO;
      eventoSalvo.erro = error instanceof Error ? error.message : 'Erro desconhecido';
    }

    return this.notificationEventRepository.save(eventoSalvo);
  }

  async processarEntrega(deliveryId: string): Promise<void> {
    const entrega = await this.notificationDeliveryRepository.findOne({
      where: { id: deliveryId },
    });

    if (!entrega) {
      throw new NotFoundException(`Entrega ${deliveryId} nao encontrada`);
    }

    const notificacao = await this.notificacaoRepository.findOne({
      where: { id: entrega.id_notificacao },
    });

    if (!notificacao) {
      throw new NotFoundException(`Notificacao ${entrega.id_notificacao} nao encontrada`);
    }

    try {
      if (entrega.canal === NotificationChannelEnum.PUSH) {
        await this.pushService.enviarParaUsuario(notificacao.id_usuario_destinatario, {
          titulo: notificacao.titulo,
          mensagem: notificacao.mensagem,
          tipo: notificacao.tipo,
          id_entidade: notificacao.id_entidade_relacionada ?? undefined,
          prioridade: this.mapPrioridade(notificacao.prioridade),
          dados_extras: notificacao.dados_extras,
        });
      }

      if (entrega.canal === NotificationChannelEnum.EMAIL) {
        this.logger.log(
          `Envio de email simulado para notificacao ${notificacao.id} (usuario ${notificacao.id_usuario_destinatario})`,
        );
      }

      entrega.status = NotificationDeliveryStatusEnum.SENT;
      entrega.tentativas += 1;
      entrega.enviado_em = new Date();
      entrega.erro_ultima_tentativa = null;
      entrega.provedor_resposta = { ok: true, canal: entrega.canal };
      entrega.proxima_tentativa_em = null;
      await this.notificationDeliveryRepository.save(entrega);
    } catch (error) {
      entrega.tentativas += 1;
      entrega.erro_ultima_tentativa =
        error instanceof Error ? error.message : 'Falha de entrega';

      if (entrega.tentativas < entrega.max_tentativas) {
        const idx = Math.min(entrega.tentativas - 1, this.retryDelaysMs.length - 1);
        const delay = this.retryDelaysMs[idx];
        entrega.status = NotificationDeliveryStatusEnum.RETRYING;
        entrega.proxima_tentativa_em = new Date(Date.now() + delay);
        await this.notificationDeliveryRepository.save(entrega);
        await this.notificationQueue.add(
          'notification-delivery',
          { deliveryId: entrega.id },
          {
            delay,
            removeOnComplete: true,
            removeOnFail: 500,
          },
        );
        return;
      }

      entrega.status = NotificationDeliveryStatusEnum.FAILED;
      entrega.proxima_tentativa_em = null;
      await this.notificationDeliveryRepository.save(entrega);
      throw error;
    }
  }

  private mapPrioridade(prioridade?: PrioridadeEnum): 'baixa' | 'normal' | 'alta' {
    if (!prioridade) return 'normal';
    
    switch (prioridade) {
      case PrioridadeEnum.BAIXA:
        return 'baixa';
      case PrioridadeEnum.ALTA:
        return 'alta';
      default:
        return 'normal';
    }
  }

  /**
   * Criar notificação em lote (para múltiplos usuários)
   */
  async createEmLote(
    ids_usuarios: string[],
    notificacaoBase: Omit<CreateNotificacaoDto, 'id_usuario_destinatario'>,
  ): Promise<Notificacao[]> {
    const notificacoesSalvas: Notificacao[] = [];

    for (const idUsuario of ids_usuarios) {
      const saved = await this.create({
        ...notificacaoBase,
        id_usuario_destinatario: idUsuario,
      });
      notificacoesSalvas.push(saved);
    }

    return notificacoesSalvas;
  }

  /**
   * Listar notificações do usuário
   */
  async findByUsuario(
    id_usuario: string,
    filtros?: {
      lida?: boolean;
      tipo?: TipoNotificacaoEnum;
      prioridade?: PrioridadeEnum;
    },
  ): Promise<Notificacao[]> {
    const query = this.notificacaoRepository
      .createQueryBuilder('notificacao')
      .where('notificacao.id_usuario_destinatario = :id_usuario', { id_usuario })
      .andWhere('notificacao.deletado = :deletado', { deletado: false });

    if (filtros?.lida !== undefined) {
      query.andWhere('notificacao.lida = :lida', { lida: filtros.lida });
    }

    if (filtros?.tipo) {
      query.andWhere('notificacao.tipo = :tipo', { tipo: filtros.tipo });
    }

    if (filtros?.prioridade) {
      query.andWhere('notificacao.prioridade = :prioridade', {
        prioridade: filtros.prioridade,
      });
    }

    return await query
      .orderBy('notificacao.prioridade', 'DESC')
      .addOrderBy('notificacao.created_at', 'DESC')
      .getMany();
  }

  async findMinePaginado(idUsuario: string, filtros: FindMinhasNotificacoesDto) {
    const page = filtros.page || 1;
    const limit = Math.min(filtros.limit || 20, 100);
    const offset = (page - 1) * limit;

    const query = this.notificacaoRepository
      .createQueryBuilder('n')
      .where('n.id_usuario_destinatario = :idUsuario', { idUsuario })
      .andWhere('n.deletado = false');

    if (filtros.lida !== undefined) {
      query.andWhere('n.lida = :lida', { lida: filtros.lida });
    }
    if (filtros.tipo) {
      query.andWhere('n.tipo = :tipo', { tipo: filtros.tipo });
    }
    if (filtros.data_inicio) {
      query.andWhere('n.created_at >= :dataInicio', { dataInicio: filtros.data_inicio });
    }
    if (filtros.data_fim) {
      query.andWhere('n.created_at <= :dataFim', { dataFim: filtros.data_fim });
    }

    const [items, total] = await query
      .orderBy('n.created_at', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Buscar notificações não lidas do usuário
   */
  async countNaoLidas(id_usuario: string): Promise<number> {
    return await this.notificacaoRepository.count({
      where: {
        id_usuario_destinatario: id_usuario,
        lida: false,
        deletado: false,
      },
    });
  }

  /**
   * Buscar notificação por ID
   */
  async findOne(id: string): Promise<Notificacao> {
    const notificacao = await this.notificacaoRepository.findOne({
      where: { id, deletado: false },
      relations: ['destinatario'],
    });

    if (!notificacao) {
      throw new NotFoundException(`Notificação com ID ${id} não encontrada`);
    }

    return notificacao;
  }

  /**
   * Marcar como lida
   */
  async marcarComoLida(id: string): Promise<Notificacao> {
    const notificacao = await this.findOne(id);

    if (!notificacao.lida) {
      notificacao.lida = true;
      notificacao.lida_em = new Date();
      return await this.notificacaoRepository.save(notificacao);
    }

    return notificacao;
  }

  async marcarComoClicada(id: string): Promise<Notificacao> {
    const notificacao = await this.findOne(id);
    if (!notificacao.clicada) {
      notificacao.clicada = true;
      notificacao.clicada_em = new Date();
      return this.notificacaoRepository.save(notificacao);
    }
    return notificacao;
  }

  /**
   * Marcar todas como lidas (de um usuário)
   */
  async marcarTodasComoLidas(id_usuario: string): Promise<void> {
    await this.notificacaoRepository.update(
      {
        id_usuario_destinatario: id_usuario,
        lida: false,
        deletado: false,
      },
      {
        lida: true,
        lida_em: new Date(),
      }
    );
  }

  async getMetricasResumo() {
    const [totalEnviadas, totalLidas, totalClicadas, totalFalhas] = await Promise.all([
      this.notificationDeliveryRepository.count({
        where: { status: NotificationDeliveryStatusEnum.SENT },
      }),
      this.notificacaoRepository.count({ where: { lida: true, deletado: false } }),
      this.notificacaoRepository.count({ where: { clicada: true, deletado: false } }),
      this.notificationDeliveryRepository.count({
        where: { status: NotificationDeliveryStatusEnum.FAILED },
      }),
    ]);

    const taxaFalha = totalEnviadas + totalFalhas === 0
      ? 0
      : Number(((totalFalhas / (totalEnviadas + totalFalhas)) * 100).toFixed(2));

    return {
      total_enviadas: totalEnviadas,
      total_lidas: totalLidas,
      total_clicadas: totalClicadas,
      total_falhas: totalFalhas,
      taxa_falha_percentual: taxaFalha,
      alerta: taxaFalha >= 5 ? 'ALTO_INDICE_FALHA' : 'OK',
    };
  }

  /**
   * Soft delete
   */
  async remove(id: string): Promise<void> {
    const notificacao = await this.findOne(id);
    notificacao.deletado = true;
    await this.notificacaoRepository.save(notificacao);
  }

  async upsertPreferencia(idUsuario: string, dto: UpsertPreferenceDto) {
    await this.notificationPreferenceRepository.upsert(
      {
        id_usuario: idUsuario,
        canal: dto.canal,
        event_type: dto.event_type || null,
        habilitado: dto.habilitado,
        quiet_hours_inicio: dto.quiet_hours_inicio || null,
        quiet_hours_fim: dto.quiet_hours_fim || null,
      },
      ['id_usuario', 'canal', 'event_type'],
    );

    return this.notificationPreferenceRepository.find({
      where: { id_usuario: idUsuario },
      order: { created_at: 'DESC' },
    });
  }

  async listarPreferencias(idUsuario: string) {
    return this.notificationPreferenceRepository.find({
      where: { id_usuario: idUsuario },
      order: { created_at: 'DESC' },
    });
  }

  async listarRegrasAdmin(): Promise<NotificationRule[]> {
    return this.notificationRuleRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async criarRegraAdmin(dto: AdminCreateNotificationRuleDto): Promise<NotificationRule> {
    const regra = this.notificationRuleRepository.create({
      nome: dto.nome,
      event_type: dto.event_type,
      perfis_destino: dto.perfis_destino?.length ? dto.perfis_destino : null,
      ids_usuarios_destino: dto.ids_usuarios_destino?.length ? dto.ids_usuarios_destino : null,
      canais: dto.canais,
      prioridade: dto.prioridade || 'MEDIA',
      template_codigo: dto.template_codigo || null,
      ativo: dto.ativo ?? true,
      dedupe_window_seconds: dto.dedupe_window_seconds ?? 300,
    });

    return this.notificationRuleRepository.save(regra);
  }

  async atualizarRegraAdmin(id: string, dto: AdminUpdateNotificationRuleDto): Promise<NotificationRule> {
    const regra = await this.notificationRuleRepository.findOne({ where: { id } });
    if (!regra) {
      throw new NotFoundException(`Regra de notificacao com ID ${id} nao encontrada`);
    }

    if (dto.nome !== undefined) regra.nome = dto.nome;
    if (dto.event_type !== undefined) regra.event_type = dto.event_type;
    if (dto.perfis_destino !== undefined) {
      regra.perfis_destino = dto.perfis_destino.length ? dto.perfis_destino : null;
    }
    if (dto.ids_usuarios_destino !== undefined) {
      regra.ids_usuarios_destino = dto.ids_usuarios_destino.length ? dto.ids_usuarios_destino : null;
    }
    if (dto.canais !== undefined) regra.canais = dto.canais;
    if (dto.prioridade !== undefined) regra.prioridade = dto.prioridade;
    if (dto.template_codigo !== undefined) regra.template_codigo = dto.template_codigo || null;
    if (dto.ativo !== undefined) regra.ativo = dto.ativo;
    if (dto.dedupe_window_seconds !== undefined) {
      regra.dedupe_window_seconds = dto.dedupe_window_seconds;
    }

    return this.notificationRuleRepository.save(regra);
  }

  async removerRegraAdmin(id: string): Promise<void> {
    const regra = await this.notificationRuleRepository.findOne({ where: { id } });
    if (!regra) {
      throw new NotFoundException(`Regra de notificacao com ID ${id} nao encontrada`);
    }
    await this.notificationRuleRepository.remove(regra);
  }

  async listarTemplatesAdmin(): Promise<NotificationTemplate[]> {
    return this.notificationTemplateRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async criarTemplateAdmin(
    dto: AdminCreateNotificationTemplateDto,
  ): Promise<NotificationTemplate> {
    const template = this.notificationTemplateRepository.create({
      codigo: dto.codigo,
      canal: dto.canal,
      titulo_template: dto.titulo_template,
      mensagem_template: dto.mensagem_template,
      ativo: dto.ativo ?? true,
      versao: dto.versao ?? 1,
      variaveis: dto.variaveis || null,
    });

    return this.notificationTemplateRepository.save(template);
  }

  async atualizarTemplateAdmin(
    id: string,
    dto: AdminUpdateNotificationTemplateDto,
  ): Promise<NotificationTemplate> {
    const template = await this.notificationTemplateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException(`Template de notificacao com ID ${id} nao encontrado`);
    }

    if (dto.codigo !== undefined) template.codigo = dto.codigo;
    if (dto.canal !== undefined) template.canal = dto.canal;
    if (dto.titulo_template !== undefined) template.titulo_template = dto.titulo_template;
    if (dto.mensagem_template !== undefined) template.mensagem_template = dto.mensagem_template;
    if (dto.ativo !== undefined) template.ativo = dto.ativo;
    if (dto.versao !== undefined) template.versao = dto.versao;
    if (dto.variaveis !== undefined) template.variaveis = dto.variaveis;

    return this.notificationTemplateRepository.save(template);
  }

  async removerTemplateAdmin(id: string): Promise<void> {
    const template = await this.notificationTemplateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException(`Template de notificacao com ID ${id} nao encontrado`);
    }
    await this.notificationTemplateRepository.remove(template);
  }

  /**
   * RF09 - Alerta de medição pendente para Encarregado
   */
  async notificarMedicaoPendente(
    id_encarregado: string,
    id_sessao: string,
    detalhes: string,
  ): Promise<Notificacao> {
    return await this.create({
      id_usuario_destinatario: id_encarregado,
      tipo: TipoNotificacaoEnum.MEDICAO_PENDENTE,
      titulo: 'Medição Pendente',
      mensagem: `Você tem medições pendentes: ${detalhes}`,
      prioridade: PrioridadeEnum.ALTA,
      id_entidade_relacionada: id_sessao,
      tipo_entidade: 'sessao',
    });
  }

  /**
   * RF10 - Alerta de ciclo de faturamento próximo
   */
  async notificarCicloFaturamento(
    ids_financeiro: string[],
    data_corte: Date,
    qtd_medicoes_pendentes: number,
  ): Promise<Notificacao[]> {
    return await this.createEmLote(ids_financeiro, {
      tipo: TipoNotificacaoEnum.CICLO_FATURAMENTO,
      titulo: 'Ciclo de Faturamento Próximo',
      mensagem: `Data de corte: ${data_corte.toLocaleDateString('pt-BR')}. ${qtd_medicoes_pendentes} medições pendentes.`,
      prioridade: PrioridadeEnum.ALTA,
      dados_extras: {
        data_corte,
        qtd_medicoes_pendentes,
      },
    });
  }

  /**
   * Notificar lote aguardando aprovação (para Gestor)
   */
  async notificarLoteAprovacao(
    ids_gestores: string[],
    id_lote: string,
    valor_total: number,
  ): Promise<Notificacao[]> {
    return await this.createEmLote(ids_gestores, {
      tipo: TipoNotificacaoEnum.LOTE_APROVACAO,
      titulo: 'Lote Aguardando Aprovação',
      mensagem: `Novo lote de pagamento no valor de R$ ${valor_total.toFixed(2)} aguarda sua aprovação.`,
      prioridade: PrioridadeEnum.ALTA,
      id_entidade_relacionada: id_lote,
      tipo_entidade: 'lote_pagamento',
      dados_extras: { valor_total },
    });
  }

  /**
   * Notificar preço pendente de aprovação
   */
  async notificarPrecoAnalise(
    ids_gestores: string[],
    id_preco: string,
    margem: number,
  ): Promise<Notificacao[]> {
    return await this.createEmLote(ids_gestores, {
      tipo: TipoNotificacaoEnum.PRECO_PENDENTE,
      titulo: 'Preço Pendente de Aprovação',
      mensagem: `Novo preço de venda com margem de ${margem.toFixed(2)}% aguarda sua análise.`,
      prioridade: PrioridadeEnum.MEDIA,
      id_entidade_relacionada: id_preco,
      tipo_entidade: 'tabela_preco',
      dados_extras: { margem },
    });
  }

  /**
   * Registrar token FCM do usuário
   * 
   * RF09 - Push Notifications
   * Armazena o token FCM para envio de notificações push
   */
  async registrarTokenFCM(
    id_usuario: string | number,
    token: string,
    device?: string,
    device_version?: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.pushService.registrarToken(String(id_usuario), token);

      return {
        success: true,
        message: 'Token FCM registrado com sucesso',
      };
    } catch (error) {
      console.error('Erro ao registrar token FCM:', error);
      throw error;
    }
  }

  /**
   * Remover token FCM (ex: logout)
   */
  async removerTokenFCM(token: string): Promise<void> {
    try {
      await this.pushService.removerToken(token);
    } catch (error) {
      console.error('Erro ao remover token FCM:', error);
      throw error;
    }
  }

  validarAcessoUsuario(idSolicitante: string, perfilSolicitante: PerfilEnum, idAlvo: string): void {
    if (perfilSolicitante !== PerfilEnum.ADMIN && idSolicitante !== idAlvo) {
      throw new ForbiddenException('Acesso negado para notificacoes de outro usuario');
    }
  }

  private async processarEvento(evento: NotificationEvent): Promise<void> {
    const regras = await this.notificationRuleRepository.find({
      where: { event_type: evento.event_type, ativo: true },
      order: { created_at: 'ASC' },
    });

    if (!regras.length) {
      const totalFallback = await this.processarEventoFallback(evento);
      if (totalFallback === 0) {
        evento.status = NotificationEventStatusEnum.IGNORADO;
      }
      return;
    }

    for (const regra of regras) {
      const destinatarios = await this.resolverDestinatarios(regra);
      if (!destinatarios.length) {
        continue;
      }

      const template = regra.template_codigo
        ? await this.notificationTemplateRepository.findOne({
            where: { codigo: regra.template_codigo, ativo: true },
          })
        : null;

      for (const idUsuario of destinatarios) {
        const duplicada = await this.existeDuplicada(
          idUsuario,
          evento.event_type,
          evento.entity_id,
          regra.dedupe_window_seconds,
        );
        if (duplicada) {
          continue;
        }

        const titulo = template
          ? this.renderTemplate(template.titulo_template, evento.payload)
          : `${evento.event_type.replaceAll('_', ' ')}`;

        const mensagem = template
          ? this.renderTemplate(template.mensagem_template, evento.payload)
          : `Novo evento ${evento.event_type} registrado.`;

        const notificacao = await this.notificacaoRepository.save(
          this.notificacaoRepository.create({
            id_usuario_destinatario: idUsuario,
            tipo: this.mapEventTypeToLegacyTipo(evento.event_type),
            titulo,
            mensagem,
            prioridade: this.mapPrioridadeString(regra.prioridade),
            dados_extras: evento.payload,
            id_entidade_relacionada: evento.entity_id || null,
            tipo_entidade: evento.event_type,
            id_evento: evento.id,
          }),
        );

        for (const canal of regra.canais) {
          const canalEnum = this.parseCanal(canal);
          if (!canalEnum) {
            continue;
          }

          const permitido = await this.usuarioPodeReceberCanal(
            idUsuario,
            canalEnum,
            evento.event_type,
          );
          if (!permitido) {
            continue;
          }

          await this.criarEntrega(notificacao, canalEnum, canalEnum === NotificationChannelEnum.IN_APP);
        }
      }
    }
  }

  private async processarEventoFallback(evento: NotificationEvent): Promise<number> {
    const destinatarios = await this.resolverDestinatariosFallback(evento.event_type);
    if (!destinatarios.length) {
      return 0;
    }

    const conteudo = this.construirConteudoFallback(evento);
    let totalCriadas = 0;

    for (const idUsuario of destinatarios) {
      const duplicada = await this.existeDuplicada(
        idUsuario,
        evento.event_type,
        evento.entity_id,
        6 * 60 * 60,
      );

      if (duplicada) {
        continue;
      }

      await this.create({
        id_usuario_destinatario: idUsuario,
        tipo: this.mapEventTypeToLegacyTipo(evento.event_type),
        titulo: conteudo.titulo,
        mensagem: conteudo.mensagem,
        prioridade: conteudo.prioridade,
        dados_extras: evento.payload,
        id_entidade_relacionada: evento.entity_id || undefined,
        tipo_entidade: evento.event_type,
      });

      totalCriadas += 1;
    }

    return totalCriadas;
  }

  private async resolverDestinatariosFallback(eventType: string): Promise<string[]> {
    const perfisDestino = this.obterPerfisFallbackPorEvento(eventType);
    if (!perfisDestino.length) {
      return [];
    }

    const usuarios = await this.usuarioRepository.find({
      where: {
        ativo: true,
        deletado: false,
        id_perfil: In(perfisDestino),
      },
      select: ['id'],
    });

    return Array.from(new Set(usuarios.map((u) => u.id).filter(Boolean)));
  }

  private obterPerfisFallbackPorEvento(eventType: string): PerfilEnum[] {
    if (eventType.includes('CONTA_PAGAR') || eventType.includes('CONTA_RECEBER')) {
      return [PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO];
    }

    if (eventType.includes('PRECO')) {
      return [PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO];
    }

    if (eventType.includes('OS') || eventType.includes('SESSAO')) {
      return [PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.ENCARREGADO];
    }

    return [];
  }

  private construirConteudoFallback(evento: NotificationEvent): {
    titulo: string;
    mensagem: string;
    prioridade: PrioridadeEnum;
  } {
    const payload = evento.payload || {};

    if (evento.event_type.includes('CONTA_PAGAR')) {
      const valor = payload.valor_total ? ` Valor: R$ ${payload.valor_total}.` : '';
      return {
        titulo: 'Conta a pagar em aberto',
        mensagem: `Ha conta(s) a pagar em aberto no financeiro.${valor}`,
        prioridade: PrioridadeEnum.ALTA,
      };
    }

    if (evento.event_type.includes('CONTA_RECEBER')) {
      const pendencias = payload.medicoes_pendentes
        ? ` Medicoes pendentes: ${payload.medicoes_pendentes}.`
        : '';
      return {
        titulo: 'Conta a receber em aberto',
        mensagem: `Ha recebiveis pendentes para acompanhamento.${pendencias}`,
        prioridade: PrioridadeEnum.ALTA,
      };
    }

    return {
      titulo: evento.event_type.replaceAll('_', ' '),
      mensagem: `Novo evento ${evento.event_type} registrado.`,
      prioridade: PrioridadeEnum.MEDIA,
    };
  }

  private async resolverDestinatarios(regra: NotificationRule): Promise<string[]> {
    const ids = new Set<string>();

    if (regra.ids_usuarios_destino?.length) {
      regra.ids_usuarios_destino.filter(Boolean).forEach((id) => ids.add(id));
    }

    if (regra.perfis_destino?.length) {
      const perfisNumericos = regra.perfis_destino
        .map((p) => Number(p))
        .filter((p) => Number.isFinite(p));

      if (perfisNumericos.length) {
        const usuarios = await this.usuarioRepository.find({
          where: {
            ativo: true,
            deletado: false,
            id_perfil: In(perfisNumericos),
          },
          select: ['id'],
        });
        usuarios.forEach((u) => ids.add(u.id));
      }
    }

    return Array.from(ids);
  }

  private async criarEntrega(
    notificacao: Notificacao,
    canal: NotificationChannelEnum,
    sentImmediately = false,
  ): Promise<NotificationDelivery> {
    const entrega = this.notificationDeliveryRepository.create({
      id_notificacao: notificacao.id,
      canal,
      status: sentImmediately
        ? NotificationDeliveryStatusEnum.SENT
        : NotificationDeliveryStatusEnum.PENDING,
      tentativas: sentImmediately ? 1 : 0,
      enviado_em: sentImmediately ? new Date() : null,
      max_tentativas: 4,
      proxima_tentativa_em: null,
    });

    const saved = await this.notificationDeliveryRepository.save(entrega);

    if (!sentImmediately && (canal === NotificationChannelEnum.PUSH || canal === NotificationChannelEnum.EMAIL)) {
      await this.notificationQueue.add(
        'notification-delivery',
        { deliveryId: saved.id },
        {
          removeOnComplete: true,
          removeOnFail: 500,
        },
      );
    }

    return saved;
  }

  private async usuarioPodeReceberCanal(
    idUsuario: string,
    canal: NotificationChannelEnum,
    eventType: string,
  ): Promise<boolean> {
    const preferencias = await this.notificationPreferenceRepository.find({
      where: [
        { id_usuario: idUsuario, canal, event_type: eventType },
        { id_usuario: idUsuario, canal, event_type: IsNull() },
      ],
      order: { created_at: 'DESC' },
    });

    if (!preferencias.length) {
      return true;
    }

    return preferencias[0].habilitado;
  }

  private async existeDuplicada(
    idUsuario: string,
    eventType: string,
    entityId: string | null,
    dedupeWindowSeconds: number,
  ): Promise<boolean> {
    const inicioJanela = new Date(Date.now() - dedupeWindowSeconds * 1000);
    const whereBase = {
      id_usuario_destinatario: idUsuario,
      tipo_entidade: eventType,
      created_at: Between(inicioJanela, new Date()),
      deletado: false,
    };

    const total = await this.notificacaoRepository.count({
      where: entityId
        ? {
            ...whereBase,
            id_entidade_relacionada: entityId,
          }
        : {
            ...whereBase,
            id_entidade_relacionada: IsNull(),
          },
    });

    return total > 0;
  }

  private gerarIdempotencyKey(
    eventType: string,
    entityType: string | undefined,
    entityId: string | undefined,
    payload: Record<string, any>,
  ): string {
    const data = `${eventType}|${entityType || ''}|${entityId || ''}|${JSON.stringify(payload)}`;
    return createHash('sha256').update(data).digest('hex');
  }

  private renderTemplate(template: string, payload: Record<string, any>): string {
    return template.replace(/{{\s*([\w.]+)\s*}}/g, (_, token: string) => {
      const value = token.split('.').reduce<any>((acc, key) => {
        if (acc && key in acc) {
          return acc[key];
        }
        return undefined;
      }, payload);

      if (value === undefined || value === null) {
        return '';
      }
      return String(value);
    });
  }

  private mapEventTypeToLegacyTipo(eventType: string): TipoNotificacaoEnum {
    if (eventType.includes('PAGAR') || eventType.includes('RECEBER')) {
      return TipoNotificacaoEnum.CICLO_FATURAMENTO;
    }
    if (eventType.includes('PRECO')) {
      return TipoNotificacaoEnum.PRECO_PENDENTE;
    }
    if (eventType.includes('OS') || eventType.includes('SESSAO')) {
      return TipoNotificacaoEnum.SISTEMA;
    }
    return TipoNotificacaoEnum.SISTEMA;
  }

  private parseCanal(canal: string): NotificationChannelEnum | null {
    const normalizado = canal?.toUpperCase();
    if (normalizado === NotificationChannelEnum.IN_APP) return NotificationChannelEnum.IN_APP;
    if (normalizado === NotificationChannelEnum.PUSH) return NotificationChannelEnum.PUSH;
    if (normalizado === NotificationChannelEnum.EMAIL) return NotificationChannelEnum.EMAIL;
    return null;
  }

  private mapPrioridadeString(prioridade: string): PrioridadeEnum {
    if (prioridade === PrioridadeEnum.BAIXA) return PrioridadeEnum.BAIXA;
    if (prioridade === PrioridadeEnum.ALTA) return PrioridadeEnum.ALTA;
    if (prioridade === PrioridadeEnum.CRITICA) return PrioridadeEnum.CRITICA;
    return PrioridadeEnum.MEDIA;
  }
}

