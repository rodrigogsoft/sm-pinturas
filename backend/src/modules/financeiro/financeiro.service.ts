import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, SelectQueryBuilder } from 'typeorm';
import { LotePagamento, StatusLoteEnum } from './entities/lote-pagamento.entity';
import { Medicao } from '../medicoes/entities/medicao.entity';
import { TabelaPreco, StatusAprovacaoEnum } from '../precos/entities/tabela-preco.entity';
import { AlocacaoTarefa } from '../alocacoes/entities/alocacao-tarefa.entity';
import { Ambiente } from '../pavimentos/entities/pavimento.entity';
import { CreateLotePagamentoDto } from './dto/create-lote-pagamento.dto';
import { ProcessarPagamentoDto } from './dto/processar-pagamento.dto';
import { AprovarLoteDto } from './dto/aprovar-lote.dto';
import { StatusPagamentoEnum } from '../../common/enums';
import { FecharPeriodoFolhaDto } from './dto/fechar-periodo-folha.dto';
import { ReabrirPeriodoFolhaDto } from './dto/reabrir-periodo-folha.dto';
import { ConsultarFolhaIndividualDto } from './dto/consultar-folha-individual.dto';
import { ProcessarFolhaIndividualPagamentoDto } from './dto/processar-folha-individual-pagamento.dto';
import { ConsultarApropriacaoDetalhadaDto } from './dto/consultar-apropriacao-detalhada.dto';
import { MedicaoColaborador } from '../medicoes-colaborador/entities/medicao-colaborador.entity';
import { ValeAdiantamento, StatusValeAdiantamentoEnum } from '../vale-adiantamento/entities/vale-adiantamento.entity';
import { ValeAdiantamentoParcela } from '../vale-adiantamento/entities/vale-adiantamento-parcela.entity';
import { StatusParcelaValeEnum } from '../vale-adiantamento/entities/vale-adiantamento-parcela.entity';
import { NotificacoesService } from '../notificacoes/notificacoes.service';
import { Usuario } from '../auth/entities/usuario.entity';
import { PrioridadeEnum, TipoNotificacaoEnum } from '../notificacoes/entities/notificacao.entity';
import { PerfilEnum } from '../../common/enums';

@Injectable()
export class FinanceiroService {
  private readonly logger = new Logger(FinanceiroService.name);

  constructor(
    @InjectRepository(LotePagamento)
    private loteRepository: Repository<LotePagamento>,
    @InjectRepository(Medicao)
    private medicaoRepository: Repository<Medicao>,
    @InjectRepository(TabelaPreco)
    private precoRepository: Repository<TabelaPreco>,
    @InjectRepository(AlocacaoTarefa)
    private alocacaoRepository: Repository<AlocacaoTarefa>,
    @InjectRepository(Ambiente)
    private ambienteRepository: Repository<Ambiente>,
    @InjectRepository(MedicaoColaborador)
    private medicaoColaboradorRepository: Repository<MedicaoColaborador>,
    @InjectRepository(ValeAdiantamento)
    private valesRepository: Repository<ValeAdiantamento>,
    @InjectRepository(ValeAdiantamentoParcela)
    private parcelasRepository: Repository<ValeAdiantamentoParcela>,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    private notificacoesService: NotificacoesService,
  ) {}

  /**
   * Criar novo lote de pagamento
   */
  async createLote(
    createLoteDto: CreateLotePagamentoDto, 
    isAdmin: boolean = false
  ): Promise<LotePagamento> {
    const { medicoes_ids, justificativa_bypass_admin, ...loteData } = createLoteDto;

    // Buscar medições com relacionamentos
    const medicoes = await this.medicaoRepository.find({
      where: {
        id: In(medicoes_ids),
        deletado: false,
      },
      relations: ['alocacao', 'alocacao.ambiente', 'alocacao.ambiente.pavimento'],
    });

    if (medicoes.length !== medicoes_ids.length) {
      throw new BadRequestException('Uma ou mais medições não foram encontradas');
    }

    // Validar que todas as medições estão com status ABERTO
    const medicoesInvalidas = medicoes.filter(
      m => m.status_pagamento !== StatusPagamentoEnum.ABERTO
    );

    if (medicoesInvalidas.length > 0) {
      throw new BadRequestException({
        message: 'Existem medições com status inválido para inclusão no lote',
        medicoes_invalidas: medicoesInvalidas.map(m => ({
          id: m.id,
          status: m.status_pagamento,
        })),
      });
    }

    // ============= RN02: BLOQUEIO DE FATURAMENTO =============
    // Extrair IDs de obras das medições
    const ambienteIds = [...new Set(medicoes.map(m => m.alocacao?.ambiente?.id).filter(Boolean))];
    let obraIds: string[] = [];
    
    if (ambienteIds.length > 0) {
      // Buscar pavimentos dos ambientes
      const ambientes = await this.ambienteRepository.find({
        where: { id: In(ambienteIds as string[]) },
        relations: ['pavimento'],
      });

      obraIds = [...new Set(ambientes.map(a => a.pavimento?.id_obra).filter(Boolean))] as string[];

      if (obraIds.length > 0) {
        // Verificar se existem preços PENDENTES para essas obras
        const precosPendentes = await this.precoRepository.find({
          where: {
            id_obra: In(obraIds as string[]),
            status_aprovacao: StatusAprovacaoEnum.PENDENTE,
            deletado: false,
          },
          relations: ['obra', 'servico'],
        });

        if (precosPendentes.length > 0) {
          // Se houver preços pendentes, verificar se é Admin com justificativa
          if (!isAdmin || !justificativa_bypass_admin) {
            throw new ForbiddenException({
              message: 'RN02: Não é possível gerar lote de pagamento com preços pendentes de aprovação',
              codigo: 'PRECOS_PENDENTES_BLOQUEIO',
              precos_pendentes: precosPendentes.map(p => ({
                id: p.id,
                obra: p.obra?.nome || 'N/A',
                servico: p.servico?.nome || 'N/A',
                preco_venda: p.preco_venda,
                margem_percentual: p.margem_percentual,
              })),
              instrucao: isAdmin 
                ? 'Forneça uma justificativa no campo "justificativa_bypass_admin" para prosseguir'
                : 'Contate o Gestor para aprovar os preços pendentes ou o Administrador para forçar a geração',
            });
          }

          // Admin com justificativa: registrar no log (no futuro, criar registro de auditoria)
          this.logger.warn(`Bypass RN02 aplicado por admin. Quantidade de preços pendentes ignorados: ${precosPendentes.length}`);
        }
      }
    }
    // =============== FIM RN02 ===============

    // Calcular valor total seguindo ERS 4.1: area medida (qtd_executada) x preco_venda
    const chavePreco = (idObra: string | null | undefined, idServico: number | null | undefined) =>
      `${idObra || 'sem-obra'}:${idServico || 0}`;

    const servicosUtilizados = [
      ...new Set(
        medicoes
          .map((m) => m.alocacao?.id_servico_catalogo)
          .filter((id): id is number => id !== null && id !== undefined),
      ),
    ];

    const precosAprovados = obraIds.length && servicosUtilizados.length
      ? await this.precoRepository.find({
          where: {
            id_obra: In(obraIds as string[]),
            id_servico_catalogo: In(servicosUtilizados),
            status_aprovacao: StatusAprovacaoEnum.APROVADO,
            deletado: false,
          },
        })
      : [];

    const mapaPrecos = new Map<string, TabelaPreco>();
    for (const preco of precosAprovados) {
      mapaPrecos.set(chavePreco(preco.id_obra, preco.id_servico_catalogo), preco);
    }

    const valorTotal = medicoes.reduce((sum, m) => {
      const idObraMedicao = m.alocacao?.ambiente?.pavimento?.id_obra;
      const idServicoMedicao = m.alocacao?.id_servico_catalogo;
      const preco = mapaPrecos.get(chavePreco(idObraMedicao, idServicoMedicao));

      if (!preco) {
        return sum;
      }

      return sum + Number(m.qtd_executada) * Number(preco.preco_venda);
    }, 0);

    // Criar lote
    const lote = this.loteRepository.create({
      ...loteData,
      valor_total: valorTotal,
      qtd_medicoes: medicoes.length,
    });

    const savedLote = await this.loteRepository.save(lote);

    // Atualizar status das medições
    await this.medicaoRepository.update(
      { id: In(medicoes_ids) },
      {
        status_pagamento: StatusPagamentoEnum.ABERTO,
        id_lote_pagamento: savedLote.id,
      }
    );

    await this.notificacoesService.publicarEventoDominio({
      event_type: 'CONTA_PAGAR_ABERTA',
      source_module: 'financeiro',
      entity_type: 'lote_pagamento',
      entity_id: savedLote.id,
      payload: {
        id_lote: savedLote.id,
        valor_total: Number(savedLote.valor_total),
        qtd_medicoes: savedLote.qtd_medicoes,
      },
    });

    return savedLote;
  }

  /**
   * Listar lotes com filtros
   */
  async findAll(filters?: {
    status?: StatusLoteEnum;
    data_inicio?: Date;
    data_fim?: Date;
  }): Promise<LotePagamento[]> {
    const query = this.loteRepository
      .createQueryBuilder('lote')
      .where('lote.deletado = :deletado', { deletado: false });

    if (filters?.status) {
      query.andWhere('lote.status = :status', { status: filters.status });
    }

    if (filters?.data_inicio) {
      query.andWhere('lote.data_competencia >= :data_inicio', {
        data_inicio: filters.data_inicio,
      });
    }

    if (filters?.data_fim) {
      query.andWhere('lote.data_competencia <= :data_fim', {
        data_fim: filters.data_fim,
      });
    }

    return await query
      .orderBy('lote.data_competencia', 'DESC')
      .addOrderBy('lote.created_at', 'DESC')
      .getMany();
  }

  /**
   * Buscar lote por ID
   */
  async findOne(id: string): Promise<LotePagamento> {
    const lote = await this.loteRepository.findOne({
      where: { id, deletado: false },
    });

    if (!lote) {
      throw new NotFoundException(`Lote com ID ${id} não encontrado`);
    }

    return lote;
  }

  /**
   * Buscar medições do lote
   */
  async getMedicoesDoLote(id_lote: string): Promise<Medicao[]> {
    const lote = await this.findOne(id_lote);

    return await this.medicaoRepository.find({
      where: {
        id_lote_pagamento: lote.id,
        deletado: false,
      },
      relations: [
        'alocacao',
        'alocacao.colaborador',
        'alocacao.ambiente',
        'alocacao.item_ambiente',
        'alocacao.item_ambiente.tabelaPreco',
      ],
    });
  }

  /**
   * Aprovar lote (RF04 - Gestor aprova)
   */
  async aprovarLote(
    id: string,
    aprovarDto: AprovarLoteDto,
    idUsuarioAprovador: string,
  ): Promise<LotePagamento> {
    const lote = await this.findOne(id);

    if (lote.status !== StatusLoteEnum.ABERTO) {
      throw new BadRequestException('Lote não pode ser aprovado neste status');
    }

    lote.status = StatusLoteEnum.ABERTO;
    lote.id_aprovado_por = idUsuarioAprovador;

    return await this.loteRepository.save(lote);
  }

  /**
   * Processar pagamento (Financeiro executa)
   */
  async processarPagamento(
    id: string,
    processarDto: ProcessarPagamentoDto,
    idUsuarioProcessador: string,
  ): Promise<LotePagamento> {
    const lote = await this.findOne(id);

    if (lote.status !== StatusLoteEnum.ABERTO) {
      throw new BadRequestException('Apenas lotes em aberto podem ser pagos');
    }

    if (!lote.id_aprovado_por) {
      throw new BadRequestException(
        'Lote precisa ser aprovado por um gestor antes do processamento do pagamento',
      );
    }

    lote.status = StatusLoteEnum.PAGO;
    lote.data_pagamento = new Date(processarDto.data_pagamento);
    lote.tipo_pagamento = processarDto.tipo_pagamento;
    
    if (processarDto.observacoes) {
      lote.observacoes = processarDto.observacoes;
    }

    this.logger.log(`Lote ${id} processado por usuário autenticado ${idUsuarioProcessador}`);

    const savedLote = await this.loteRepository.save(lote);

    // Atualizar medições para PAGO
    const updateMedicaoResult = await this.medicaoRepository.update(
      { id_lote_pagamento: lote.id },
      { status_pagamento: StatusPagamentoEnum.PAGO }
    );

    // Atualizar medições individuais para PAGO
    const updateMedicaoColaboradorResult = await this.medicaoColaboradorRepository.update(
      { id_lote_pagamento: lote.id },
      { status_pagamento: StatusPagamentoEnum.PAGO },
    );

    await this.aplicarDescontosValesNoLote(
      lote.id,
      processarDto.data_pagamento ? new Date(processarDto.data_pagamento) : new Date(),
    );

    const totalPagasNoLote =
      Number(updateMedicaoResult.affected || 0) +
      Number(updateMedicaoColaboradorResult.affected || 0);

    await this.notificarPerfisFinanceiros({
      titulo: 'Pagamento de lote concluido',
      mensagem: `Lote ${savedLote.descricao || savedLote.id} foi processado com ${totalPagasNoLote} medicao(oes) paga(s).`,
      dados_extras: {
        id_lote: savedLote.id,
        descricao: savedLote.descricao,
        total_pagamentos: totalPagasNoLote,
        tipo_pagamento: savedLote.tipo_pagamento,
        data_pagamento: savedLote.data_pagamento,
      },
      id_entidade_relacionada: savedLote.id,
      tipo_entidade: 'lote_pagamento',
    });

    return savedLote;
  }

  private async aplicarDescontosValesNoLote(
    idLotePagamento: string,
    dataPagamento: Date,
  ): Promise<void> {
    const valoresPorColaborador = await this.medicaoColaboradorRepository
      .createQueryBuilder('mc')
      .leftJoin('mc.item_ambiente', 'item')
      .leftJoin('item.tabelaPreco', 'tabela_preco')
      .select('mc.id_colaborador', 'id_colaborador')
      .addSelect(
        'COALESCE(SUM(mc.qtd_executada * COALESCE(tabela_preco.preco_venda, 0)), 0)',
        'valor_disponivel',
      )
      .where('mc.id_lote_pagamento = :idLotePagamento', { idLotePagamento })
      .andWhere('mc.deletado = false')
      .groupBy('mc.id_colaborador')
      .getRawMany<{ id_colaborador: string; valor_disponivel: string }>();

    for (const item of valoresPorColaborador) {
      const valorDisponivel = Number(item.valor_disponivel || 0);

      if (!item.id_colaborador || valorDisponivel <= 0) {
        continue;
      }

      await this.aplicarDescontoValesPorColaborador(
        item.id_colaborador,
        valorDisponivel,
        idLotePagamento,
        dataPagamento,
      );
    }
  }

  private async aplicarDescontoValesPorColaborador(
    idColaborador: string,
    valorDisponivelDesconto: number,
    idLotePagamento: string,
    dataPagamento: Date,
  ): Promise<void> {
    const statusElegiveis: StatusValeAdiantamentoEnum[] = [
      StatusValeAdiantamentoEnum.APROVADO,
      StatusValeAdiantamentoEnum.PAGO,
      StatusValeAdiantamentoEnum.PARCIALMENTE_COMPENSADO,
    ];

    const vales = await this.valesRepository.find({
      where: {
        id_colaborador: idColaborador,
        deletado: false,
        status: In(statusElegiveis),
      },
      relations: ['parcelas'],
      order: {
        data_solicitacao: 'ASC',
        created_at: 'ASC',
      },
    });

    let saldoParaDesconto = valorDisponivelDesconto;

    for (const vale of vales) {
      if (saldoParaDesconto <= 0) {
        break;
      }

      const parcelasPendentes = (vale.parcelas || [])
        .filter((p) => !p.deletado && p.status === StatusParcelaValeEnum.PENDENTE)
        .sort((a, b) => a.numero_parcela - b.numero_parcela);

      if (parcelasPendentes.length === 0) {
        await this.atualizarStatusValePorParcelas(vale.id);
        continue;
      }

      for (const parcela of parcelasPendentes) {
        if (saldoParaDesconto <= 0) {
          break;
        }

        const valorParcela = Number(parcela.valor_parcela || 0);
        if (valorParcela <= 0) {
          continue;
        }

        if (saldoParaDesconto >= valorParcela) {
          parcela.status = StatusParcelaValeEnum.DESCONTADO;
          parcela.data_desconto_realizado = dataPagamento;
          parcela.id_lote_pagamento = idLotePagamento;
          await this.parcelasRepository.save(parcela);

          saldoParaDesconto -= valorParcela;
          continue;
        }

        const descontoParcial = Number(saldoParaDesconto.toFixed(2));
        const saldoResidual = Number((valorParcela - descontoParcial).toFixed(2));

        if (descontoParcial > 0) {
          parcela.valor_parcela = descontoParcial;
          parcela.status = StatusParcelaValeEnum.DESCONTADO;
          parcela.data_desconto_realizado = dataPagamento;
          parcela.id_lote_pagamento = idLotePagamento;
          parcela.observacoes = [parcela.observacoes, 'Desconto parcial automatico via lote de pagamento']
            .filter(Boolean)
            .join(' | ');
          await this.parcelasRepository.save(parcela);

          const maxNumeroParcela = (vale.parcelas || [])
            .filter((p) => !p.deletado)
            .reduce((max, p) => Math.max(max, p.numero_parcela), 0);

          const novaParcelaResidual = this.parcelasRepository.create({
            id_vale_adiantamento: vale.id,
            numero_parcela: maxNumeroParcela + 1,
            valor_parcela: saldoResidual,
            data_prevista_desconto: dataPagamento,
            status: StatusParcelaValeEnum.PENDENTE,
            observacoes: 'Parcela residual gerada automaticamente apos desconto parcial',
          });

          await this.parcelasRepository.save(novaParcelaResidual);
          vale.parcelas = [...(vale.parcelas || []), novaParcelaResidual];
        }

        saldoParaDesconto = 0;
      }

      await this.atualizarStatusValePorParcelas(vale.id);
    }
  }

  private async atualizarStatusValePorParcelas(idVale: string): Promise<void> {
    const vale = await this.valesRepository.findOne({
      where: { id: idVale, deletado: false },
      relations: ['parcelas'],
    });

    if (!vale) {
      return;
    }

    if (
      vale.status === StatusValeAdiantamentoEnum.CANCELADO ||
      vale.status === StatusValeAdiantamentoEnum.SOLICITADO
    ) {
      return;
    }

    const parcelasAtivas = (vale.parcelas || []).filter((p) => !p.deletado);
    const totalDescontado = parcelasAtivas
      .filter((p) => p.status === StatusParcelaValeEnum.DESCONTADO)
      .reduce((sum, p) => sum + Number(p.valor_parcela || 0), 0);

    const totalPendente = parcelasAtivas
      .filter((p) => p.status === StatusParcelaValeEnum.PENDENTE)
      .reduce((sum, p) => sum + Number(p.valor_parcela || 0), 0);

    const valorBase = Number(vale.valor_aprovado ?? vale.valor_solicitado ?? 0);

    if (totalDescontado > 0 && (totalPendente <= 0 || totalDescontado >= valorBase)) {
      vale.status = StatusValeAdiantamentoEnum.COMPENSADO;
    } else if (totalDescontado > 0) {
      vale.status = StatusValeAdiantamentoEnum.PARCIALMENTE_COMPENSADO;
    } else if (vale.status !== StatusValeAdiantamentoEnum.APROVADO) {
      vale.status = StatusValeAdiantamentoEnum.PAGO;
    }

    await this.valesRepository.save(vale);
  }

  /**
   * Enviar lote para aprovação
   */
  async enviarParaAprovacao(id: string): Promise<LotePagamento> {
    const lote = await this.findOne(id);

    if (lote.status !== StatusLoteEnum.ABERTO) {
      throw new BadRequestException('Apenas lotes em aberto podem ser enviados para aprovação');
    }

    lote.status = StatusLoteEnum.ABERTO;
    return await this.loteRepository.save(lote);
  }

  /**
   * Cancelar lote
   */
  async cancelarLote(id: string): Promise<LotePagamento> {
    const lote = await this.findOne(id);

    if (lote.status === StatusLoteEnum.PAGO) {
      throw new BadRequestException('Não é possível cancelar lote já pago');
    }

    lote.status = StatusLoteEnum.CANCELADO;
    const savedLote = await this.loteRepository.save(lote);

    // Liberar medições de volta para ABERTO
    await this.medicaoRepository.update(
      { id_lote_pagamento: lote.id },
      { 
        status_pagamento: StatusPagamentoEnum.ABERTO,
        id_lote_pagamento: null,
      }
    );

    // Liberar medições individuais do lote
    await this.medicaoColaboradorRepository.update(
      { id_lote_pagamento: lote.id },
      {
        status_pagamento: StatusPagamentoEnum.ABERTO,
        id_lote_pagamento: null,
      },
    );

    return savedLote;
  }

  /**
   * Soft delete de lote
   */
  async remove(id: string): Promise<void> {
    const lote = await this.findOne(id);

    if (lote.status === StatusLoteEnum.PAGO) {
      throw new BadRequestException('Não é possível deletar lote já pago');
    }

    lote.deletado = true;
    await this.loteRepository.save(lote);

    // Liberar medições
    await this.medicaoRepository.update(
      { id_lote_pagamento: lote.id },
      { 
        status_pagamento: StatusPagamentoEnum.ABERTO,
        id_lote_pagamento: null,
      }
    );

    // Liberar medições individuais
    await this.medicaoColaboradorRepository.update(
      { id_lote_pagamento: lote.id },
      {
        status_pagamento: StatusPagamentoEnum.ABERTO,
        id_lote_pagamento: null,
      },
    );
  }

  /**
   * Dashboard financeiro
   */
  async dashboard(data_inicio?: Date, data_fim?: Date) {
    const query = this.loteRepository
      .createQueryBuilder('lote')
      .where('lote.deletado = :deletado', { deletado: false });

    if (data_inicio) {
      query.andWhere('lote.data_competencia >= :data_inicio', { data_inicio });
    }

    if (data_fim) {
      query.andWhere('lote.data_competencia <= :data_fim', { data_fim });
    }

    const lotes = await query.getMany();

    const totalPago = lotes
      .filter(l => l.status === StatusLoteEnum.PAGO)
      .reduce((sum, l) => sum + Number(l.valor_total), 0);

    const totalPendente = lotes
      .filter(l => l.status !== StatusLoteEnum.PAGO && l.status !== StatusLoteEnum.CANCELADO)
      .reduce((sum, l) => sum + Number(l.valor_total), 0);

    return {
      total_lotes: lotes.length,
      total_pago: totalPago,
      total_pendente: totalPendente,
      por_status: {
        aberto: lotes.filter(l => l.status === StatusLoteEnum.ABERTO).length,
        pago: lotes.filter(l => l.status === StatusLoteEnum.PAGO).length,
        cancelado: lotes.filter(l => l.status === StatusLoteEnum.CANCELADO).length,
      },
    };
  }

  /**
   * Simulacao de descontos de vales no lote sem persistir alteracoes
   */
  async simularDescontosValesNoLote(id_lote: string): Promise<{
    id_lote: string;
    colaboradores: Array<{
      id_colaborador: string;
      valor_disponivel_lote: number;
      valor_desconto_simulado: number;
      saldo_nao_utilizado_lote: number;
      vales: Array<{
        id_vale: string;
        status_atual: StatusValeAdiantamentoEnum;
        valor_base: number;
        valor_pendente_parcelas: number;
        valor_descontado_simulado: number;
        saldo_devedor_estimado: number;
      }>;
    }>;
  }> {
    await this.findOne(id_lote);

    const valoresPorColaborador = await this.medicaoColaboradorRepository
      .createQueryBuilder('mc')
      .leftJoin('mc.item_ambiente', 'item')
      .leftJoin('item.tabelaPreco', 'tabela_preco')
      .select('mc.id_colaborador', 'id_colaborador')
      .addSelect(
        'COALESCE(SUM(mc.qtd_executada * COALESCE(tabela_preco.preco_venda, 0)), 0)',
        'valor_disponivel',
      )
      .where('mc.id_lote_pagamento = :id_lote', { id_lote })
      .andWhere('mc.deletado = false')
      .groupBy('mc.id_colaborador')
      .getRawMany<{ id_colaborador: string; valor_disponivel: string }>();

    const statusElegiveis: StatusValeAdiantamentoEnum[] = [
      StatusValeAdiantamentoEnum.APROVADO,
      StatusValeAdiantamentoEnum.PAGO,
      StatusValeAdiantamentoEnum.PARCIALMENTE_COMPENSADO,
    ];

    const colaboradores = [] as Array<{
      id_colaborador: string;
      valor_disponivel_lote: number;
      valor_desconto_simulado: number;
      saldo_nao_utilizado_lote: number;
      vales: Array<{
        id_vale: string;
        status_atual: StatusValeAdiantamentoEnum;
        valor_base: number;
        valor_pendente_parcelas: number;
        valor_descontado_simulado: number;
        saldo_devedor_estimado: number;
      }>;
    }>;

    for (const item of valoresPorColaborador) {
      const valorDisponivel = Number(item.valor_disponivel || 0);
      let saldoSimulacao = valorDisponivel;

      const vales = await this.valesRepository.find({
        where: {
          id_colaborador: item.id_colaborador,
          deletado: false,
          status: In(statusElegiveis),
        },
        relations: ['parcelas'],
        order: {
          data_solicitacao: 'ASC',
          created_at: 'ASC',
        },
      });

      const valesSimulados = vales.map((vale) => {
        const valorBase = Number(vale.valor_aprovado ?? vale.valor_solicitado ?? 0);
        const valorPendente = (vale.parcelas || [])
          .filter((p) => !p.deletado && p.status === StatusParcelaValeEnum.PENDENTE)
          .reduce((sum, p) => sum + Number(p.valor_parcela || 0), 0);

        const valorDescontado = Math.min(saldoSimulacao, Math.max(valorPendente, 0));
        saldoSimulacao = Number((saldoSimulacao - valorDescontado).toFixed(2));

        return {
          id_vale: vale.id,
          status_atual: vale.status,
          valor_base: Number(valorBase.toFixed(2)),
          valor_pendente_parcelas: Number(valorPendente.toFixed(2)),
          valor_descontado_simulado: Number(valorDescontado.toFixed(2)),
          saldo_devedor_estimado: Number(Math.max(valorPendente - valorDescontado, 0).toFixed(2)),
        };
      });

      const totalDescontado = valesSimulados.reduce(
        (sum, v) => sum + Number(v.valor_descontado_simulado || 0),
        0,
      );

      colaboradores.push({
        id_colaborador: item.id_colaborador,
        valor_disponivel_lote: Number(valorDisponivel.toFixed(2)),
        valor_desconto_simulado: Number(totalDescontado.toFixed(2)),
        saldo_nao_utilizado_lote: Number(Math.max(saldoSimulacao, 0).toFixed(2)),
        vales: valesSimulados,
      });
    }

    return {
      id_lote: id_lote,
      colaboradores,
    };
  }

  /**
   * ERS 4.1 — Medições individuais por colaborador prontas para lote
   * Retorna tb_medicoes_colaborador com status ABERTO, opcionalmente filtrado por colaborador e obra
   */
  async getMedicoesColaboradorParaLote(
    id_colaborador?: string,
    id_obra?: string,
  ): Promise<{ medicoes: MedicaoColaborador[]; valor_total_calculado: number }> {
    const query = this.medicaoColaboradorRepository
      .createQueryBuilder('mc')
      .leftJoinAndSelect('mc.colaborador', 'colaborador')
      .leftJoinAndSelect('mc.item_ambiente', 'item')
      .leftJoinAndSelect('item.ambiente', 'ambiente')
      .leftJoinAndSelect('ambiente.pavimento', 'pavimento')
      .leftJoinAndSelect('pavimento.obra', 'obra')
      .leftJoinAndSelect('item.tabelaPreco', 'tabela_preco')
      .where('mc.status_pagamento = :status', { status: StatusPagamentoEnum.ABERTO })
      .andWhere('mc.id_lote_pagamento IS NULL')
      .andWhere('mc.deletado = false');

    if (id_colaborador) {
      query.andWhere('mc.id_colaborador = :id_colaborador', { id_colaborador });
    }

    if (id_obra) {
      query.andWhere('obra.id = :id_obra', { id_obra });
    }

    const medicoes = await query.orderBy('colaborador.nome_completo', 'ASC').getMany();

    // Calcula valor estimado: qtd_executada x preco_venda
    let valorTotal = 0;
    medicoes.forEach((m) => {
      const tabela = (m.item_ambiente as any)?.tabelaPreco;
      if (tabela?.preco_venda) {
        valorTotal += Number(m.qtd_executada) * Number(tabela.preco_venda);
      }
    });

    return {
      medicoes,
      valor_total_calculado: parseFloat(valorTotal.toFixed(2)),
    };
  }

  /**
   * ERS 4.1 — Fechar periodo e gerar folha individual por colaborador
   */
  async fecharPeriodoFolhaIndividual(dto: FecharPeriodoFolhaDto): Promise<{
    periodo: { data_inicio: string; data_fim: string };
    lotes_gerados: Array<{
      id_lote: string;
      id_colaborador: string;
      nome_colaborador: string;
      qtd_medicoes: number;
      valor_total: number;
    }>;
    total_medicoes_fechadas: number;
  }> {
    const dataInicio = new Date(dto.data_inicio);
    const dataFim = new Date(dto.data_fim);

    if (dataFim < dataInicio) {
      throw new BadRequestException('data_fim deve ser maior ou igual a data_inicio');
    }

    const query = this.medicaoColaboradorRepository
      .createQueryBuilder('mc')
      .leftJoinAndSelect('mc.colaborador', 'colaborador')
      .leftJoinAndSelect('mc.item_ambiente', 'item')
      .leftJoinAndSelect('item.tabelaPreco', 'tabela_preco')
      .leftJoinAndSelect('tabela_preco.servico', 'servico_catalogo')
      .leftJoinAndSelect('item.ambiente', 'ambiente')
      .leftJoinAndSelect('ambiente.pavimento', 'pavimento')
      .leftJoinAndSelect('pavimento.obra', 'obra')
      .where('mc.status_pagamento = :status', { status: StatusPagamentoEnum.ABERTO })
      .andWhere('mc.id_lote_pagamento IS NULL')
      .andWhere('mc.deletado = false')
      .andWhere('mc.data_medicao >= :data_inicio', { data_inicio: dto.data_inicio })
      .andWhere('mc.data_medicao <= :data_fim', { data_fim: dto.data_fim });

    if (dto.id_colaborador) {
      query.andWhere('mc.id_colaborador = :id_colaborador', {
        id_colaborador: dto.id_colaborador,
      });
    }

    if (dto.id_obra) {
      query.andWhere('obra.id = :id_obra', { id_obra: dto.id_obra });
    }

    const medicoes = await query.getMany();
    if (medicoes.length === 0) {
      throw new BadRequestException('Nenhuma medicao aberta encontrada para o periodo informado');
    }

    const porColaborador = new Map<string, MedicaoColaborador[]>();
    for (const medicao of medicoes) {
      const key = medicao.id_colaborador;
      if (!porColaborador.has(key)) {
        porColaborador.set(key, []);
      }
      porColaborador.get(key)?.push(medicao);
    }

    const lotesGerados: Array<{
      id_lote: string;
      id_colaborador: string;
      nome_colaborador: string;
      qtd_medicoes: number;
      valor_total: number;
    }> = [];

    for (const [idColaborador, medicoesColaborador] of porColaborador.entries()) {
      const nomeColaborador = medicoesColaborador[0]?.colaborador?.nome_completo || 'N/A';
      const valorTotal = medicoesColaborador.reduce((sum, m) => {
        const tabela = (m.item_ambiente as any)?.tabelaPreco;
        const precoVenda = Number(tabela?.preco_venda || 0);
        return sum + Number(m.qtd_executada) * precoVenda;
      }, 0);

      const lote = this.loteRepository.create({
        descricao: `Folha Individual ${nomeColaborador} (${dto.data_inicio} a ${dto.data_fim})`,
        data_competencia: dataFim,
        valor_total: parseFloat(valorTotal.toFixed(2)),
        qtd_medicoes: medicoesColaborador.length,
        status: StatusLoteEnum.ABERTO,
        id_criado_por: dto.id_criado_por,
        observacoes: dto.observacoes || null,
      });

      const loteSalvo = await this.loteRepository.save(lote);

      await this.medicaoColaboradorRepository.update(
        { id: In(medicoesColaborador.map((m) => m.id)) },
        {
          status_pagamento: StatusPagamentoEnum.ABERTO,
          id_lote_pagamento: loteSalvo.id,
        },
      );

      lotesGerados.push({
        id_lote: loteSalvo.id,
        id_colaborador: idColaborador,
        nome_colaborador: nomeColaborador,
        qtd_medicoes: medicoesColaborador.length,
        valor_total: parseFloat(valorTotal.toFixed(2)),
      });
    }

    return {
      periodo: {
        data_inicio: dto.data_inicio,
        data_fim: dto.data_fim,
      },
      lotes_gerados: lotesGerados,
      total_medicoes_fechadas: medicoes.length,
    };
  }

  /**
   * ERS 4.1 — Reabrir periodo para correcoes operacionais
   */
  async reabrirPeriodoFolhaIndividual(dto: ReabrirPeriodoFolhaDto): Promise<{
    periodo: { data_inicio: string; data_fim: string };
    total_medicoes_reabertas: number;
  }> {
    const dataInicio = new Date(dto.data_inicio);
    const dataFim = new Date(dto.data_fim);

    if (dataFim < dataInicio) {
      throw new BadRequestException('data_fim deve ser maior ou igual a data_inicio');
    }

    const query = this.medicaoColaboradorRepository
      .createQueryBuilder('mc')
      .leftJoin('mc.item_ambiente', 'item')
      .leftJoin('item.ambiente', 'ambiente')
      .leftJoin('ambiente.pavimento', 'pavimento')
      .leftJoin('pavimento.obra', 'obra')
      .where('mc.status_pagamento = :status', { status: StatusPagamentoEnum.ABERTO })
      .andWhere('mc.id_lote_pagamento IS NOT NULL')
      .andWhere('mc.deletado = false')
      .andWhere('mc.data_medicao >= :data_inicio', { data_inicio: dto.data_inicio })
      .andWhere('mc.data_medicao <= :data_fim', { data_fim: dto.data_fim });

    if (dto.id_colaborador) {
      query.andWhere('mc.id_colaborador = :id_colaborador', {
        id_colaborador: dto.id_colaborador,
      });
    }

    if (dto.id_obra) {
      query.andWhere('obra.id = :id_obra', { id_obra: dto.id_obra });
    }

    const medicoes = await query.getMany();
    if (medicoes.length === 0) {
      throw new BadRequestException('Nenhuma medicao encontrada para reabertura no periodo informado');
    }

    await this.medicaoColaboradorRepository.update(
      { id: In(medicoes.map((m) => m.id)) },
      {
        status_pagamento: StatusPagamentoEnum.ABERTO,
        id_lote_pagamento: null,
      },
    );

    return {
      periodo: {
        data_inicio: dto.data_inicio,
        data_fim: dto.data_fim,
      },
      total_medicoes_reabertas: medicoes.length,
    };
  }

  async consultarFolhaIndividual(queryDto: ConsultarFolhaIndividualDto): Promise<{
    filtros: ConsultarFolhaIndividualDto;
    paginacao: {
      page: number;
      limit: number;
      total_registros: number;
      total_paginas: number;
    };
    totais: {
      total_a_pagar: number;
      total_pago: number;
      colaboradores_no_periodo: number;
    };
    itens: Array<{
      chave: string;
      id_colaborador: string;
      nome_colaborador: string;
      competencia: string;
      servicos: string[];
      medicao: number;
      valor: number;
      status: 'ABERTO' | 'PAGO' | 'CANCELADO';
      medicoes_ids: string[];
    }>;
  }> {
    const page = queryDto.page || 1;
    const limit = queryDto.limit || 50;

    const aggregateQuery = await this.buildFolhaIndividualAggregatedQueryWithFallback(queryDto);
    const aggregateSql = aggregateQuery.getQuery();
    const aggregateParams = aggregateQuery.getParameters();

    const totalRaw = await this.medicaoColaboradorRepository.manager
      .createQueryBuilder()
      .select('COUNT(*)', 'total_registros')
      .from(`(${aggregateSql})`, 'f')
      .setParameters(aggregateParams)
      .getRawOne<{ total_registros: string }>();

    const totaisRaw = await this.medicaoColaboradorRepository.manager
      .createQueryBuilder()
      .select('COALESCE(SUM(f.valor), 0)', 'total_geral')
      .addSelect("COALESCE(SUM(CASE WHEN f.status = 'ABERTO' THEN f.valor ELSE 0 END), 0)", 'total_a_pagar')
      .addSelect("COALESCE(SUM(CASE WHEN f.status = 'PAGO' THEN f.valor ELSE 0 END), 0)", 'total_pago')
      .addSelect('COUNT(DISTINCT f.id_colaborador)', 'colaboradores_no_periodo')
      .from(`(${aggregateSql})`, 'f')
      .setParameters(aggregateParams)
      .getRawOne<{
        total_geral: string;
        total_a_pagar: string;
        total_pago: string;
        colaboradores_no_periodo: string;
      }>();

    const rows = await aggregateQuery
      .clone()
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany<{
        chave: string;
        id_colaborador: string;
        nome_colaborador: string;
        competencia: string;
        servicos: string;
        medicao: string;
        valor: string;
        status: 'ABERTO' | 'PAGO' | 'CANCELADO';
        medicoes_ids: string[] | string;
      }>();

    const totalRegistros = Number(totalRaw?.total_registros || 0);
    const itens = rows.map((row) => {
      const servicos = typeof row.servicos === 'string' && row.servicos.length > 0
        ? row.servicos.split(' | ')
        : [];

      const medicoesIds = Array.isArray(row.medicoes_ids)
        ? row.medicoes_ids
        : String(row.medicoes_ids || '')
            .replace(/[{}]/g, '')
            .split(',')
            .map((id) => id.trim())
            .filter((id) => id.length > 0);

      return {
        chave: row.chave,
        id_colaborador: row.id_colaborador,
        nome_colaborador: row.nome_colaborador,
        competencia: row.competencia,
        servicos,
        medicao: Number(Number(row.medicao || 0).toFixed(2)),
        valor: Number(Number(row.valor || 0).toFixed(2)),
        status: row.status,
        medicoes_ids: medicoesIds,
      };
    });

    return {
      filtros: queryDto,
      paginacao: {
        page,
        limit,
        total_registros: totalRegistros,
        total_paginas: totalRegistros > 0 ? Math.ceil(totalRegistros / limit) : 0,
      },
      totais: {
        total_a_pagar: Number(Number(totaisRaw?.total_a_pagar || 0).toFixed(2)),
        total_pago: Number(Number(totaisRaw?.total_pago || 0).toFixed(2)),
        colaboradores_no_periodo: Number(totaisRaw?.colaboradores_no_periodo || 0),
      },
      itens,
    };
  }

  async processarPagamentoFolhaIndividual(
    dto: ProcessarFolhaIndividualPagamentoDto,
    idUsuarioProcessador: string,
  ): Promise<{
    total_solicitadas: number;
    total_processadas: number;
    lotes_atualizados: number;
  }> {
    const idsValidos = Array.from(new Set(dto.medicoes_ids || [])).filter((id) => id);

    if (idsValidos.length === 0) {
      throw new BadRequestException('Informe ao menos uma medição para processar pagamento');
    }

    const medicoesColaborador = await this.medicaoColaboradorRepository.find({
      where: {
        id: In(idsValidos),
        deletado: false,
      },
    });

    const medicoesLegado = medicoesColaborador.length === 0
      ? await this.medicaoRepository.find({
          where: {
            id: In(idsValidos),
            deletado: false,
          },
        })
      : [];

    if (medicoesColaborador.length === 0 && medicoesLegado.length === 0) {
      throw new NotFoundException('Nenhuma medição encontrada para os IDs informados');
    }

    const usandoTabelaColaborador = medicoesColaborador.length > 0;
    const medicoes = usandoTabelaColaborador ? medicoesColaborador : medicoesLegado;

    const idsProcessaveis = medicoes
      .filter((m) => m.status_pagamento !== StatusPagamentoEnum.PAGO)
      .map((m) => m.id);

    if (idsProcessaveis.length > 0) {
      if (usandoTabelaColaborador) {
        await this.medicaoColaboradorRepository.update(
          { id: In(idsProcessaveis) },
          { status_pagamento: StatusPagamentoEnum.PAGO },
        );
      } else {
        await this.medicaoRepository.update(
          { id: In(idsProcessaveis) },
          { status_pagamento: StatusPagamentoEnum.PAGO },
        );
      }
    }

    const loteIds = Array.from(
      new Set(
        medicoes
          .map((m) => m.id_lote_pagamento)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    let lotesAtualizados = 0;
    for (const loteId of loteIds) {
      const pendentesNoLote = usandoTabelaColaborador
        ? await this.medicaoColaboradorRepository.count({
            where: {
              id_lote_pagamento: loteId,
              deletado: false,
              status_pagamento: StatusPagamentoEnum.ABERTO,
            },
          })
        : await this.medicaoRepository.count({
            where: {
              id_lote_pagamento: loteId,
              deletado: false,
              status_pagamento: StatusPagamentoEnum.ABERTO,
            },
          });

      if (pendentesNoLote === 0) {
        await this.loteRepository.update(
          { id: loteId },
          {
            status: StatusLoteEnum.PAGO,
            data_pagamento: new Date(dto.data_pagamento),
            tipo_pagamento: dto.tipo_pagamento,
            observacoes:
              dto.observacoes ||
              `Pagamento processado via folha individual por ${idUsuarioProcessador}`,
          },
        );
        lotesAtualizados += 1;
      }
    }

    await this.notificarPerfisFinanceiros({
      titulo: 'Pagamento de folha individual concluido',
      mensagem: `${idsProcessaveis.length} medicao(oes) de colaborador(es) foram marcadas como pagas.`,
      dados_extras: {
        total_solicitadas: idsValidos.length,
        total_processadas: idsProcessaveis.length,
        lotes_atualizados: lotesAtualizados,
        data_pagamento: dto.data_pagamento,
        tipo_pagamento: dto.tipo_pagamento,
        id_usuario_processador: idUsuarioProcessador,
      },
      tipo_entidade: 'folha_individual',
    });

    return {
      total_solicitadas: idsValidos.length,
      total_processadas: idsProcessaveis.length,
      lotes_atualizados: lotesAtualizados,
    };
  }

  private async notificarPerfisFinanceiros(params: {
    titulo: string;
    mensagem: string;
    dados_extras?: Record<string, any>;
    id_entidade_relacionada?: string;
    tipo_entidade: string;
  }): Promise<void> {
    try {
      const usuarios = await this.usuarioRepository.find({
        where: {
          ativo: true,
          deletado: false,
          id_perfil: In([PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO]),
        },
        select: ['id'],
      });

      const idsDestinatarios = Array.from(new Set(usuarios.map((u) => u.id).filter(Boolean)));
      if (idsDestinatarios.length === 0) {
        return;
      }

      await this.notificacoesService.createEmLote(idsDestinatarios, {
        tipo: TipoNotificacaoEnum.CICLO_FATURAMENTO,
        titulo: params.titulo,
        mensagem: params.mensagem,
        prioridade: PrioridadeEnum.MEDIA,
        dados_extras: params.dados_extras,
        id_entidade_relacionada: params.id_entidade_relacionada,
        tipo_entidade: params.tipo_entidade,
      });
    } catch (error) {
      this.logger.warn(
        `Falha ao gerar notificacao financeira: ${error instanceof Error ? error.message : 'erro desconhecido'}`,
      );
    }
  }

  async exportarFolhaIndividualCsv(queryDto: ConsultarFolhaIndividualDto): Promise<string> {
    const rows = await (await this.buildFolhaIndividualAggregatedQueryWithFallback(queryDto))
      .clone()
      .getRawMany<{
        nome_colaborador: string;
        competencia: string;
        servicos: string;
        medicao: string;
        valor: string;
        status: string;
      }>();

    const headers = [
      'colaborador',
      'competencia',
      'servicos',
      'medicao',
      'valor',
      'status',
    ];

    const escapeCsv = (value: string | number | null | undefined) => {
      const normalized = String(value ?? '').replace(/"/g, '""');
      return `"${normalized}"`;
    };

    const linhas = rows.map((item) => {
      return [
        escapeCsv(item.nome_colaborador || ''),
        escapeCsv(item.competencia || ''),
        escapeCsv(item.servicos || ''),
        escapeCsv(Number(item.medicao || 0).toFixed(2)),
        escapeCsv(Number(item.valor || 0).toFixed(2)),
        escapeCsv(item.status || ''),
      ].join(',');
    });

    return [headers.join(','), ...linhas].join('\n');
  }

  private async buildFolhaIndividualAggregatedQueryWithFallback(
    queryDto: ConsultarFolhaIndividualDto,
  ): Promise<SelectQueryBuilder<any>> {
    const hasColaboradorData = await this.hasMedicoesColaboradorData(queryDto);
    return hasColaboradorData
      ? this.buildFolhaIndividualAggregatedQuery(queryDto)
      : this.buildFolhaIndividualAggregatedLegacyQuery(queryDto);
  }

  private async hasMedicoesColaboradorData(
    queryDto: ConsultarFolhaIndividualDto,
  ): Promise<boolean> {
    const query = this.medicaoColaboradorRepository
      .createQueryBuilder('mc')
      .leftJoin('mc.lote_pagamento', 'lote')
      .leftJoin('mc.item_ambiente', 'item')
      .leftJoin('item.tabelaPreco', 'tabela_preco')
      .leftJoin('tabela_preco.servico', 'servico_catalogo')
      .leftJoin('mc.colaborador', 'colaborador')
      .where('mc.deletado = false');

    if (queryDto.data_inicio) {
      query.andWhere('COALESCE(mc.data_medicao, mc.created_at) >= :data_inicio', {
        data_inicio: queryDto.data_inicio,
      });
    }

    if (queryDto.data_fim) {
      query.andWhere('COALESCE(mc.data_medicao, mc.created_at) <= :data_fim', {
        data_fim: queryDto.data_fim,
      });
    }

    if (queryDto.id_colaborador) {
      query.andWhere('mc.id_colaborador = :id_colaborador', {
        id_colaborador: queryDto.id_colaborador,
      });
    }

    if (queryDto.id_obra) {
      query
        .leftJoin('item.ambiente', 'ambiente')
        .leftJoin('ambiente.pavimento', 'pavimento')
        .leftJoin('pavimento.obra', 'obra')
        .andWhere('obra.id = :id_obra', { id_obra: queryDto.id_obra });
    }

    if (queryDto.colaborador) {
      query.andWhere('colaborador.nome_completo ILIKE :colaborador', {
        colaborador: `%${queryDto.colaborador}%`,
      });
    }

    if (queryDto.servico) {
      query.andWhere('servico_catalogo.nome ILIKE :servico', {
        servico: `%${queryDto.servico}%`,
      });
    }

    if (queryDto.status === 'ABERTO' || queryDto.status === 'PAGO') {
      query.andWhere('mc.status_pagamento = :status_pagamento', {
        status_pagamento: queryDto.status,
      });
    }

    if (queryDto.status === 'CANCELADO') {
      query.andWhere('lote.status = :status_lote', {
        status_lote: StatusLoteEnum.CANCELADO,
      });
    }

    const total = await query.getCount();
    return total > 0;
  }

  async consultarApropriacaoDetalhada(
    queryDto: ConsultarApropriacaoDetalhadaDto,
  ): Promise<{
    filtros: ConsultarApropriacaoDetalhadaDto;
    paginacao: {
      page: number;
      limit: number;
      total_registros: number;
      total_paginas: number;
    };
    totais: {
      total_medicoes: number;
      total_qtd_executada: number;
      valor_total_apropriado: number;
      total_excedentes: number;
    };
    itens: Array<MedicaoColaborador & { valor_apropriado: number }>;
  }> {
    const page = queryDto.page || 1;
    const limit = queryDto.limit || 50;

    const query = this.medicaoColaboradorRepository
      .createQueryBuilder('mc')
      .leftJoinAndSelect('mc.colaborador', 'colaborador')
      .leftJoinAndSelect('mc.item_ambiente', 'item')
      .leftJoinAndSelect('item.tabelaPreco', 'tabela_preco')
      .leftJoinAndSelect('tabela_preco.servico', 'servico_catalogo')
      .leftJoinAndSelect('item.ambiente', 'ambiente')
      .leftJoinAndSelect('ambiente.pavimento', 'pavimento')
      .leftJoinAndSelect('pavimento.obra', 'obra')
      .leftJoinAndSelect('mc.lote_pagamento', 'lote')
      .where('mc.deletado = false');

    if (queryDto.data_inicio) {
      query.andWhere('COALESCE(mc.data_medicao, mc.created_at) >= :data_inicio', {
        data_inicio: queryDto.data_inicio,
      });
    }

    if (queryDto.data_fim) {
      query.andWhere('COALESCE(mc.data_medicao, mc.created_at) <= :data_fim', {
        data_fim: queryDto.data_fim,
      });
    }

    if (queryDto.id_colaborador) {
      query.andWhere('mc.id_colaborador = :id_colaborador', {
        id_colaborador: queryDto.id_colaborador,
      });
    }

    if (queryDto.id_obra) {
      query.andWhere('obra.id = :id_obra', { id_obra: queryDto.id_obra });
    }

    if (queryDto.id_item_ambiente) {
      query.andWhere('mc.id_item_ambiente = :id_item_ambiente', {
        id_item_ambiente: queryDto.id_item_ambiente,
      });
    }

    const totalRegistros = await query.clone().getCount();

    const totaisRaw = await query
      .clone()
      .select('COALESCE(SUM(mc.qtd_executada), 0)', 'total_qtd_executada')
      .addSelect(
        'COALESCE(SUM(mc.qtd_executada * COALESCE(tabela_preco.preco_venda, 0)), 0)',
        'valor_total_apropriado',
      )
      .addSelect('COALESCE(SUM(CASE WHEN mc.flag_excedente THEN 1 ELSE 0 END), 0)', 'total_excedentes')
      .getRawOne<{
        total_qtd_executada: string;
        valor_total_apropriado: string;
        total_excedentes: string;
      }>();

    const itensBase = await query
      .clone()
      .orderBy('mc.data_medicao', 'DESC')
      .addOrderBy('colaborador.nome_completo', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const itens = itensBase.map((item) => {
      const tabelaPreco = (item.item_ambiente as any)?.tabelaPreco;
      const precoVenda = Number(tabelaPreco?.preco_venda || 0);
      const valorApropriado = Number(item.qtd_executada) * precoVenda;

      return {
        ...item,
        valor_apropriado: Number(valorApropriado.toFixed(2)),
      };
    });

    return {
      filtros: queryDto,
      paginacao: {
        page,
        limit,
        total_registros: totalRegistros,
        total_paginas: totalRegistros > 0 ? Math.ceil(totalRegistros / limit) : 0,
      },
      totais: {
        total_medicoes: totalRegistros,
        total_qtd_executada: Number(Number(totaisRaw?.total_qtd_executada || 0).toFixed(2)),
        valor_total_apropriado: Number(Number(totaisRaw?.valor_total_apropriado || 0).toFixed(2)),
        total_excedentes: Number(totaisRaw?.total_excedentes || 0),
      },
      itens,
    };
  }

  private buildFolhaIndividualAggregatedQuery(
    queryDto: ConsultarFolhaIndividualDto,
  ): SelectQueryBuilder<MedicaoColaborador> {
    const statusExpression = `
      CASE
        WHEN SUM(CASE WHEN mc.status_pagamento = 'ABERTO' THEN 1 ELSE 0 END) > 0 THEN 'ABERTO'
        WHEN SUM(CASE WHEN lote.status = 'CANCELADO' THEN 1 ELSE 0 END) = COUNT(mc.id) THEN 'CANCELADO'
        WHEN SUM(CASE WHEN mc.status_pagamento = 'PAGO' THEN 1 ELSE 0 END) = COUNT(mc.id) THEN 'PAGO'
        ELSE 'ABERTO'
      END
    `;

    const query = this.medicaoColaboradorRepository
      .createQueryBuilder('mc')
      .leftJoin('mc.colaborador', 'colaborador')
      .leftJoin('mc.item_ambiente', 'item')
      .leftJoin('item.tabelaPreco', 'tabela_preco')
      .leftJoin('tabela_preco.servico', 'servico_catalogo')
      .leftJoin('item.ambiente', 'ambiente')
      .leftJoin('ambiente.pavimento', 'pavimento')
      .leftJoin('pavimento.obra', 'obra')
      .leftJoin('mc.lote_pagamento', 'lote')
      .select("CONCAT(mc.id_colaborador, '-', TO_CHAR(DATE_TRUNC('month', mc.data_medicao), 'YYYY-MM'))", 'chave')
      .addSelect('mc.id_colaborador', 'id_colaborador')
      .addSelect("COALESCE(colaborador.nome_completo, 'Colaborador não informado')", 'nome_colaborador')
      .addSelect("TO_CHAR(DATE_TRUNC('month', mc.data_medicao), 'MM/YYYY')", 'competencia')
      .addSelect(
        "COALESCE(STRING_AGG(DISTINCT COALESCE(servico_catalogo.nome, 'Serviço não informado'), ' | '), '')",
        'servicos',
      )
      .addSelect('COALESCE(SUM(mc.qtd_executada), 0)', 'medicao')
      .addSelect('COALESCE(SUM(mc.qtd_executada * COALESCE(tabela_preco.preco_venda, 0)), 0)', 'valor')
      .addSelect(statusExpression, 'status')
      .addSelect('ARRAY_AGG(DISTINCT mc.id)', 'medicoes_ids')
      .where('mc.deletado = false');

    if (queryDto.data_inicio) {
      query.andWhere('mc.data_medicao >= :data_inicio', { data_inicio: queryDto.data_inicio });
    }

    if (queryDto.data_fim) {
      query.andWhere('mc.data_medicao <= :data_fim', { data_fim: queryDto.data_fim });
    }

    if (queryDto.id_colaborador) {
      query.andWhere('mc.id_colaborador = :id_colaborador', {
        id_colaborador: queryDto.id_colaborador,
      });
    }

    if (queryDto.colaborador) {
      query.andWhere('colaborador.nome_completo ILIKE :colaborador', {
        colaborador: `%${queryDto.colaborador}%`,
      });
    }

    if (queryDto.id_lote_pagamento) {
      query.andWhere('mc.id_lote_pagamento = :id_lote_pagamento', {
        id_lote_pagamento: queryDto.id_lote_pagamento,
      });
    }

    if (queryDto.id_obra) {
      query.andWhere('obra.id = :id_obra', { id_obra: queryDto.id_obra });
    }

    if (queryDto.servico) {
      query.andWhere('servico_catalogo.nome ILIKE :servico', {
        servico: `%${queryDto.servico}%`,
      });
    }

    query
      .groupBy('mc.id_colaborador')
      .addGroupBy('DATE_TRUNC(\'month\', mc.data_medicao)')
      .addGroupBy('colaborador.nome_completo');

    if (queryDto.status) {
      query.having(`${statusExpression} = :status`, {
        status: queryDto.status,
      });
    }

    query
      .orderBy("DATE_TRUNC('month', mc.data_medicao)", 'DESC')
      .addOrderBy('colaborador.nome_completo', 'ASC');

    return query;
  }

  private buildFolhaIndividualAggregatedLegacyQuery(
    queryDto: ConsultarFolhaIndividualDto,
  ): SelectQueryBuilder<Medicao> {
    const statusExpression = `
      CASE
        WHEN SUM(CASE WHEN m.status_pagamento = 'ABERTO' THEN 1 ELSE 0 END) > 0 THEN 'ABERTO'
        WHEN SUM(CASE WHEN lote.status = 'CANCELADO' THEN 1 ELSE 0 END) = COUNT(m.id) THEN 'CANCELADO'
        WHEN SUM(CASE WHEN m.status_pagamento = 'PAGO' THEN 1 ELSE 0 END) = COUNT(m.id) THEN 'PAGO'
        ELSE 'ABERTO'
      END
    `;

    const query = this.medicaoRepository
      .createQueryBuilder('m')
      .leftJoin('m.alocacao', 'alocacao')
      .leftJoin('alocacao.colaborador', 'colaborador')
      .leftJoin('m.obra', 'obra')
      .leftJoin('tb_servicos_catalogo', 'servico_catalogo', 'servico_catalogo.id = alocacao.id_servico_catalogo')
      .leftJoin('tb_lotes_pagamento', 'lote', 'lote.id = m.id_lote_pagamento')
      .select("CONCAT(COALESCE(alocacao.id_colaborador::text, ''), '-', TO_CHAR(DATE_TRUNC('month', m.data_medicao), 'YYYY-MM'))", 'chave')
      .addSelect("COALESCE(alocacao.id_colaborador::text, '')", 'id_colaborador')
      .addSelect("COALESCE(colaborador.nome_completo, 'Colaborador não informado')", 'nome_colaborador')
      .addSelect("TO_CHAR(DATE_TRUNC('month', m.data_medicao), 'MM/YYYY')", 'competencia')
      .addSelect(
        "COALESCE(STRING_AGG(DISTINCT COALESCE(servico_catalogo.nome, 'Serviço não informado'), ' | '), '')",
        'servicos',
      )
      .addSelect('COALESCE(SUM(m.qtd_executada), 0)', 'medicao')
      .addSelect('COALESCE(SUM(COALESCE(m.valor_calculado, 0)), 0)', 'valor')
      .addSelect(statusExpression, 'status')
      .addSelect('ARRAY_AGG(DISTINCT m.id)', 'medicoes_ids')
      .where('m.deletado = false');

    if (queryDto.data_inicio) {
      query.andWhere('COALESCE(m.data_medicao, m.created_at) >= :data_inicio', {
        data_inicio: queryDto.data_inicio,
      });
    }

    if (queryDto.data_fim) {
      query.andWhere('COALESCE(m.data_medicao, m.created_at) <= :data_fim', {
        data_fim: queryDto.data_fim,
      });
    }

    if (queryDto.id_colaborador) {
      query.andWhere('alocacao.id_colaborador = :id_colaborador', {
        id_colaborador: queryDto.id_colaborador,
      });
    }

    if (queryDto.colaborador) {
      query.andWhere('colaborador.nome_completo ILIKE :colaborador', {
        colaborador: `%${queryDto.colaborador}%`,
      });
    }

    if (queryDto.id_lote_pagamento) {
      query.andWhere('m.id_lote_pagamento = :id_lote_pagamento', {
        id_lote_pagamento: queryDto.id_lote_pagamento,
      });
    }

    if (queryDto.id_obra) {
      query.andWhere('obra.id = :id_obra', { id_obra: queryDto.id_obra });
    }

    if (queryDto.servico) {
      query.andWhere('servico_catalogo.nome ILIKE :servico', {
        servico: `%${queryDto.servico}%`,
      });
    }

    query
      .groupBy('alocacao.id_colaborador')
      .addGroupBy('DATE_TRUNC(\'month\', m.data_medicao)')
      .addGroupBy('colaborador.nome_completo');

    if (queryDto.status) {
      query.having(`${statusExpression} = :status`, {
        status: queryDto.status,
      });
    }

    query
      .orderBy("DATE_TRUNC('month', m.data_medicao)", 'DESC')
      .addOrderBy('colaborador.nome_completo', 'ASC');

    return query;
  }
}
