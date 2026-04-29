import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Medicao } from '../medicoes/entities/medicao.entity';
import { TabelaPreco, StatusAprovacaoEnum } from '../precos/entities/tabela-preco.entity';
import { Obra } from '../obras/entities/obra.entity';
import { AlocacaoTarefa } from '../alocacoes/entities/alocacao-tarefa.entity';
import { Colaborador } from '../colaboradores/entities/colaborador.entity';
import { PeriodoEnum } from './dto/relatorio.dto';
import { MedicaoColaborador } from '../medicoes-colaborador/entities/medicao-colaborador.entity';
import { ValeAdiantamento, StatusValeAdiantamentoEnum } from '../vale-adiantamento/entities/vale-adiantamento.entity';
import { StatusPagamentoEnum } from '../../common/enums';
import { ItemAmbiente } from '../itens-ambiente/entities/item-ambiente.entity';

export enum GranularidadeEnum {
  DIARIA = 'DIARIA',
  SEMANAL = 'SEMANAL',
  MENSAL = 'MENSAL',
}

export enum MetricaEnum {
  RECEITA = 'RECEITA',
  CUSTO = 'CUSTO',
  MARGEM = 'MARGEM',
  LUCRO = 'LUCRO',
}

export enum MetricaRankingEnum {
  MARGEM = 'MARGEM',
  RECEITA = 'RECEITA',
  LUCRO = 'LUCRO',
  PRODUTIVIDADE = 'PRODUTIVIDADE',
}

@Injectable()
export class RelatoriosService {
  constructor(
    @InjectRepository(Medicao)
    private medicaoRepository: Repository<Medicao>,
    @InjectRepository(TabelaPreco)
    private precoRepository: Repository<TabelaPreco>,
    @InjectRepository(Obra)
    private obraRepository: Repository<Obra>,
    @InjectRepository(AlocacaoTarefa)
    private alocacaoRepository: Repository<AlocacaoTarefa>,
    @InjectRepository(Colaborador)
    private colaboradorRepository: Repository<Colaborador>,
    @InjectRepository(MedicaoColaborador)
    private medicaoColaboradorRepository: Repository<MedicaoColaborador>,
    @InjectRepository(ValeAdiantamento)
    private valeAdiantamentoRepository: Repository<ValeAdiantamento>,
    @InjectRepository(ItemAmbiente)
    private itemAmbienteRepository: Repository<ItemAmbiente>,
  ) {}

  /**
   * Obter período de datas baseado no tipo de período
   */
  private obterPeriodo(periodo: PeriodoEnum): [Date, Date] {
    const hoje = new Date();
    let dataInicio: Date;
    let dataFim = new Date(hoje);

    switch (periodo) {
      case PeriodoEnum.DIA:
        dataInicio = new Date(hoje);
        dataInicio.setHours(0, 0, 0, 0);
        dataFim.setHours(23, 59, 59, 999);
        break;

      case PeriodoEnum.SEMANA:
        const primeiroDiaSemana = new Date(hoje);
        primeiroDiaSemana.setDate(hoje.getDate() - hoje.getDay());
        primeiroDiaSemana.setHours(0, 0, 0, 0);
        dataInicio = primeiroDiaSemana;
        dataFim.setHours(23, 59, 59, 999);
        break;

      case PeriodoEnum.MES:
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        dataInicio.setHours(0, 0, 0, 0);
        dataFim.setHours(23, 59, 59, 999);
        break;

      case PeriodoEnum.ANO:
        dataInicio = new Date(hoje.getFullYear(), 0, 1);
        dataInicio.setHours(0, 0, 0, 0);
        dataFim.setHours(23, 59, 59, 999);
        break;

      default:
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        dataFim.setHours(23, 59, 59, 999);
    }

    return [dataInicio, dataFim];
  }

  private obterPeriodoComOverride(
    periodo: PeriodoEnum,
    dataInicio?: string,
    dataFim?: string,
  ): [Date, Date] {
    let [inicio, fim] = this.obterPeriodo(periodo);

    if (dataInicio) {
      inicio = new Date(`${dataInicio}T00:00:00.000Z`);
    }

    if (dataFim) {
      fim = new Date(`${dataFim}T23:59:59.999Z`);
    }

    return [inicio, fim];
  }

  /**
   * Dashboard Financeiro - Resumo de Custo x Receita
   */
  async getDashboardFinanceiro(periodo: PeriodoEnum = PeriodoEnum.MES, idObra?: string) {
    const [dataInicio, dataFim] = this.obterPeriodo(periodo);

    const areasPlanejadasRaw = await this.itemAmbienteRepository
      .createQueryBuilder('item')
      .leftJoin('item.ambiente', 'ambiente')
      .leftJoin('ambiente.pavimento', 'pavimento')
      .leftJoin('pavimento.obra', 'obra')
      .select('obra.id', 'obra_id')
      .addSelect('COALESCE(SUM(item.area_planejada), 0)', 'area_planejada_total')
      .where('item.deletado = false')
      .andWhere('ambiente.deletado = false')
      .andWhere('pavimento.deletado = false')
      .andWhere('obra.deletado = false')
      .andWhere(idObra ? 'obra.id = :idObra' : '1=1', { idObra })
      .groupBy('obra.id')
      .getRawMany<{ obra_id: string; area_planejada_total: string }>();

    const areaPlanejadaPorObra = new Map<string, number>(
      areasPlanejadasRaw.map((item) => [item.obra_id, Number(item.area_planejada_total || 0)]),
    );

    // Buscar medições no período com JOINs completos até a tabela de preço
    const medicoesQuery = this.medicaoRepository
      .createQueryBuilder('medicao')
      .innerJoinAndSelect('medicao.alocacao', 'alocacao')
      .leftJoinAndSelect('alocacao.item_ambiente', 'item_ambiente')
      .leftJoinAndSelect('item_ambiente.tabelaPreco', 'tabelaPreco')
      .innerJoinAndSelect('alocacao.ambiente', 'ambiente')
      .innerJoinAndSelect('ambiente.pavimento', 'pavimento')
      .innerJoinAndSelect('pavimento.obra', 'obra')
      .where('medicao.created_at BETWEEN :inicio AND :fim', {
        inicio: dataInicio,
        fim: dataFim,
      })
      .andWhere('medicao.deletado = :deletado', { deletado: false });

    if (idObra) {
      medicoesQuery.andWhere('obra.id = :idObra', { idObra });
    }

    const medicoes = await medicoesQuery.getMany();

    // Calcular totais por obra
    const totalsPorObra: Record<
      string,
      {
        obraId: string;
        obraNome: string;
        custo: number;
        receita: number;
        lucro: number;
        margem: number;
        medicoes: number;
        areaMedidaTotal: number;
      }
    > = {};

    medicoes.forEach((medicao) => {
      const obraId = medicao.alocacao.ambiente.pavimento.obra.id;
      const obraNome = medicao.alocacao.ambiente.pavimento.obra.nome;

      if (!totalsPorObra[obraId]) {
        totalsPorObra[obraId] = {
          obraId,
          obraNome,
          custo: 0,
          receita: 0,
          lucro: 0,
          margem: 0,
          medicoes: 0,
          areaMedidaTotal: 0,
        };
      }

      // Buscar preço correspondente via item_ambiente → tabelaPreco
      const tabelaPreco = medicao.alocacao.item_ambiente?.tabelaPreco;

      if (tabelaPreco && tabelaPreco.status_aprovacao === StatusAprovacaoEnum.APROVADO) {
        const custoParcial = tabelaPreco.preco_custo * Number(medicao.qtd_executada || 0);
        const receitaParcial = tabelaPreco.preco_venda * Number(medicao.qtd_executada || 0);

        totalsPorObra[obraId].custo += custoParcial;
        totalsPorObra[obraId].receita += receitaParcial;
      }

      totalsPorObra[obraId].medicoes += 1;
      totalsPorObra[obraId].areaMedidaTotal += Number(medicao.qtd_executada || 0);
    });

    for (const [obraId, areaPlanejada] of areaPlanejadaPorObra.entries()) {
      if (!totalsPorObra[obraId]) {
        const obra = await this.obraRepository.findOne({ where: { id: obraId, deletado: false } });
        if (!obra) {
          continue;
        }
        totalsPorObra[obraId] = {
          obraId,
          obraNome: obra.nome,
          custo: 0,
          receita: 0,
          lucro: 0,
          margem: 0,
          medicoes: 0,
          areaMedidaTotal: 0,
        };
      }
    }

    // Calcular lucro e margem
    Object.keys(totalsPorObra).forEach((obraId) => {
      const total = totalsPorObra[obraId];
      total.lucro = total.receita - total.custo;
      total.margem =
        total.receita > 0 ? (total.lucro / total.receita) * 100 : 0;
    });

    // Totais gerais
    const custoTotal = Object.values(totalsPorObra).reduce(
      (sum, t) => sum + t.custo,
      0,
    );
    const receitaTotal = Object.values(totalsPorObra).reduce(
      (sum, t) => sum + t.receita,
      0,
    );
    const lucroTotal = receitaTotal - custoTotal;
    const margemTotal = receitaTotal > 0 ? (lucroTotal / receitaTotal) * 100 : 0;
    const areaMedidaTotal = Object.values(totalsPorObra).reduce(
      (sum, t) => sum + t.areaMedidaTotal,
      0,
    );

    const obrasAtivasQuery = this.obraRepository
      .createQueryBuilder('obra')
      .where('obra.status = :status', { status: 'ATIVA' })
      .andWhere('obra.deletado = :deletado', { deletado: false });

    if (idObra) {
      obrasAtivasQuery.andWhere('obra.id = :idObra', { idObra });
    }

    const obrasAtivas = await obrasAtivasQuery.getCount();

    return {
      periodo: {
        tipo: periodo,
        inicio: dataInicio.toISOString().split('T')[0],
        fim: dataFim.toISOString().split('T')[0],
      },
      metricas: {
        obras_ativas: obrasAtivas,
        total_medicoes: medicoes.length,
        custo_total: parseFloat(custoTotal.toFixed(2)),
        receita_total: parseFloat(receitaTotal.toFixed(2)),
        lucro_bruto: parseFloat(lucroTotal.toFixed(2)),
        margem_percentual: parseFloat(margemTotal.toFixed(2)),
        area_medida_total: parseFloat(areaMedidaTotal.toFixed(2)),
      },
      por_obra: Object.values(totalsPorObra).map((t) => ({
        area_planejada_total: parseFloat((areaPlanejadaPorObra.get(t.obraId) || 0).toFixed(2)),
        progresso_percentual: parseFloat(
          (
            (areaPlanejadaPorObra.get(t.obraId) || 0) > 0
              ? (t.areaMedidaTotal / (areaPlanejadaPorObra.get(t.obraId) || 1)) * 100
              : 0
          ).toFixed(2),
        ),
        obra_id: t.obraId,
        obra_nome: t.obraNome,
        custo: parseFloat(t.custo.toFixed(2)),
        receita: parseFloat(t.receita.toFixed(2)),
        lucro: parseFloat(t.lucro.toFixed(2)),
        margem: parseFloat(t.margem.toFixed(2)),
        medicoes: t.medicoes,
        area_medida_total: parseFloat(t.areaMedidaTotal.toFixed(2)),
      })),
    };
  }

  /**
   * Relatório de Medições
   */
  async getRelatorioMedicoes(
    periodo: PeriodoEnum = PeriodoEnum.MES,
    dataInicio?: string,
    dataFim?: string,
    idObra?: string,
    statusPagamento?: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const [inicioPeriodo, fimPeriodo] = this.obterPeriodoComOverride(
      periodo,
      dataInicio,
      dataFim,
    );
    const skipValue = (page - 1) * limit;

    const query = this.medicaoRepository
      .createQueryBuilder('medicao')
      .leftJoinAndSelect('medicao.alocacao', 'alocacao')
      .leftJoinAndSelect('alocacao.colaborador', 'colaborador')
      .leftJoinAndSelect('alocacao.sessao', 'sessao')
      .leftJoinAndSelect('sessao.encarregado', 'usuario_encarregado')
      .leftJoinAndSelect('alocacao.ambiente', 'ambiente')
      .leftJoinAndSelect('alocacao.item_ambiente', 'item_ambiente')
      .leftJoinAndSelect('item_ambiente.tabelaPreco', 'tabela_preco')
      .leftJoinAndSelect('tabela_preco.servico', 'servico_catalogo')
      .leftJoinAndSelect('ambiente.pavimento', 'pavimento')
      .leftJoinAndSelect('pavimento.obra', 'obra')
      .leftJoinAndSelect('obra.cliente', 'cliente')
      .where('medicao.deletado = :deletado', { deletado: false })
      .andWhere('medicao.created_at BETWEEN :inicio AND :fim', {
        inicio: inicioPeriodo,
        fim: fimPeriodo,
      })
      .orderBy('medicao.created_at', 'DESC')
      .skip(skipValue)
      .take(limit);

    if (idObra) {
      query.andWhere('obra.id = :idObra', { idObra });
    }

    if (statusPagamento) {
      query.andWhere('medicao.status_pagamento = :status', { status: statusPagamento });
    }

    const [medicoes, total] = await query.getManyAndCount();

    const obraIds = [
      ...new Set(
        medicoes
          .map((m) => m.alocacao?.ambiente?.pavimento?.obra?.id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const servicoIds = [
      ...new Set(
        medicoes
          .map((m) => m.alocacao?.id_servico_catalogo)
          .filter((id): id is number => id !== null && id !== undefined),
      ),
    ];

    const precosFallback = obraIds.length > 0 && servicoIds.length > 0
      ? await this.precoRepository.find({
          where: {
            id_obra: In(obraIds),
            id_servico_catalogo: In(servicoIds),
            status_aprovacao: StatusAprovacaoEnum.APROVADO,
            deletado: false,
          },
        })
      : [];

    const precoPorObraServico = new Map<string, number>();
    const chaveObraServico = (idObra?: string | null, idServico?: number | null) =>
      `${idObra || 'sem-obra'}:${idServico || 0}`;

    for (const preco of precosFallback) {
      precoPorObraServico.set(
        chaveObraServico(preco.id_obra, preco.id_servico_catalogo),
        Number(preco.preco_venda || 0),
      );
    }

    return {
      data: medicoes.map((m) => {
        const precoDireto = Number((m.alocacao as any)?.item_ambiente?.tabelaPreco?.preco_venda || 0);
        const precoFallback = precoPorObraServico.get(
          chaveObraServico(
            m.alocacao?.ambiente?.pavimento?.obra?.id,
            m.alocacao?.id_servico_catalogo,
          ),
        ) || 0;
        const precoUnitario = precoDireto > 0 ? precoDireto : precoFallback;
        const quantidade = Number(m.qtd_executada || 0);
        const nomeEncarregadoSessao = (m.alocacao as any)?.sessao?.nome_assinante;
        const nomeUsuarioEncarregado = (m.alocacao as any)?.sessao?.encarregado?.nome_completo;
        const nomeExecutorAlocacao = m.alocacao?.colaborador?.nome_completo;
        const encarregado = nomeEncarregadoSessao || nomeUsuarioEncarregado || nomeExecutorAlocacao || 'N/A';
        const nomeServico =
          (m.alocacao as any)?.item_ambiente?.tabelaPreco?.servico?.nome ||
          (m.alocacao as any)?.item_ambiente?.tabela_preco?.servico?.nome ||
          (m.alocacao?.id_servico_catalogo ? `Serviço ${m.alocacao.id_servico_catalogo}` : 'N/A');

        return {
          id: m.id,
          data: m.created_at.toISOString().split('T')[0],
          cliente: m.alocacao?.ambiente?.pavimento?.obra?.cliente?.razao_social || 'N/A',
          obra: m.alocacao.ambiente.pavimento.obra.nome,
          colaborador: nomeExecutorAlocacao || 'N/A',
          encarregado,
          servico: nomeServico,
          quantidade: m.qtd_executada,
          valor_total: Number((quantidade * precoUnitario).toFixed(2)),
          status: m.status_pagamento,
          excedente: m.flag_excedente,
        };
      }),
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Relatório de Produtividade por Colaborador
   */
  async getRelatorioProdutividade(
    periodo: PeriodoEnum = PeriodoEnum.MES,
    idObra?: string,
    dataInicio?: string,
    dataFim?: string,
  ) {
    const [inicioPeriodo, fimPeriodo] = this.obterPeriodoComOverride(
      periodo,
      dataInicio,
      dataFim,
    );

    const medicoesQuery = this.medicaoRepository
      .createQueryBuilder('medicao')
      .leftJoinAndSelect('medicao.alocacao', 'alocacao')
      .leftJoinAndSelect('alocacao.colaborador', 'colaborador')
      .leftJoinAndSelect('alocacao.ambiente', 'ambiente')
      .leftJoinAndSelect('ambiente.pavimento', 'pavimento')
      .leftJoinAndSelect('pavimento.obra', 'obra')
      .where('medicao.deletado = :deletado', { deletado: false })
      .andWhere('COALESCE(medicao.data_medicao, medicao.created_at) BETWEEN :inicio AND :fim', {
        inicio: inicioPeriodo,
        fim: fimPeriodo,
      });

    if (idObra) {
      medicoesQuery.andWhere('obra.id = :idObra', { idObra });
    }

    const medicoes = await medicoesQuery.getMany();

    // Agrupar por colaborador
    const produtividadePorColaborador: Record<
      string,
      {
        colaboradorId: string;
        colaboradorNome: string;
        totalMedicoes: number;
        totalUnidades: number;
        obras: Set<string>;
      }
    > = {};

    medicoes.forEach((medicao) => {
      const colabId = medicao.alocacao?.colaborador?.id;
      const colabNome = medicao.alocacao?.colaborador?.nome_completo;
      const obraNome = medicao.alocacao?.ambiente?.pavimento?.obra?.nome;

      if (!colabId || !colabNome) {
        return;
      }

      if (!produtividadePorColaborador[colabId]) {
        produtividadePorColaborador[colabId] = {
          colaboradorId: colabId,
          colaboradorNome: colabNome,
          totalMedicoes: 0,
          totalUnidades: 0,
          obras: new Set(),
        };
      }

      produtividadePorColaborador[colabId].totalMedicoes += 1;
      produtividadePorColaborador[colabId].totalUnidades += Number(
        medicao.qtd_executada || 0,
      );
      if (obraNome) {
        produtividadePorColaborador[colabId].obras.add(obraNome);
      }
    });

    const resultado = Object.values(produtividadePorColaborador)
      .map((p) => ({
        colaborador_id: p.colaboradorId,
        colaborador_nome: p.colaboradorNome,
        total_medicoes: p.totalMedicoes,
        total_unidades: parseFloat(p.totalUnidades.toFixed(2)),
        obras: Array.from(p.obras),
        media_por_medicao: parseFloat(
          (p.totalUnidades / p.totalMedicoes).toFixed(2),
        ),
      }))
      .sort((a, b) => b.total_unidades - a.total_unidades);

    return {
      periodo: {
        tipo: periodo,
        inicio: inicioPeriodo.toISOString().split('T')[0],
        fim: fimPeriodo.toISOString().split('T')[0],
      },
      colaboradores: resultado,
      total_colaboradores: resultado.length,
      unidades_totais: parseFloat(
        resultado
          .reduce((sum, c) => sum + c.total_unidades, 0)
          .toFixed(2),
      ),
    };
  }

  async getRelatorioMargem(
    periodo: PeriodoEnum = PeriodoEnum.MES,
    dataInicio?: string,
    dataFim?: string,
    idObra?: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const [inicioPeriodo, fimPeriodo] = this.obterPeriodoComOverride(
      periodo,
      dataInicio,
      dataFim,
    );

    const resultado = await this.getRelatorioMargemBase(idObra, page, limit, inicioPeriodo, fimPeriodo);
    return resultado;
  }

  private async getRelatorioMargemBase(
    idObra: string | undefined,
    page: number,
    limit: number,
    inicioPeriodo: Date,
    fimPeriodo: Date,
  ) {
    const toNumber = (value: unknown): number => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const skipValue = (page - 1) * limit;

    if (idObra) {
      const obraExiste = await this.obraRepository.exist({
        where: { id: idObra, deletado: false },
      });

      if (!obraExiste) {
        return {
          data: [],
          meta: {
            page,
            limit,
            total: 0,
            pages: 0,
            margem_media: 0,
          },
          periodo: {
            inicio: inicioPeriodo.toISOString().split('T')[0],
            fim: fimPeriodo.toISOString().split('T')[0],
          },
        };
      }
    }

    const query = this.precoRepository
      .createQueryBuilder('preco')
      .innerJoinAndSelect('preco.obra', 'obra', 'obra.deletado = false')
      .leftJoinAndSelect('preco.servico', 'servico')
      .andWhere('preco.deletado = false')
      .andWhere('preco.status_aprovacao = :status', {
        status: StatusAprovacaoEnum.APROVADO,
      });

    if (idObra) {
      query.andWhere('obra.id = :idObra', { idObra });
    }

    const [precos, total] = await query
      .orderBy('preco.margem_percentual', 'ASC')
      .skip(skipValue)
      .take(limit)
      .getManyAndCount();

    const medicoesCount: Record<string, number> = {};
    for (const preco of precos) {
      const count = await this.medicaoRepository
        .createQueryBuilder('medicao')
        .innerJoin('medicao.alocacao', 'alocacao')
        .innerJoin('alocacao.ambiente', 'ambiente')
        .innerJoin('ambiente.pavimento', 'pavimento')
        .innerJoin('pavimento.obra', 'obra')
        .innerJoin('alocacao.item_ambiente', 'item_ambiente')
        .where('item_ambiente.id_tabela_preco = :idTabelaPreco', {
          idTabelaPreco: preco.id,
        })
        .andWhere('medicao.deletado = false')
        .andWhere('obra.deletado = false')
        .andWhere('COALESCE(medicao.data_medicao, medicao.created_at) BETWEEN :inicio AND :fim', {
          inicio: inicioPeriodo,
          fim: fimPeriodo,
        });

      if (idObra) {
        count.andWhere('obra.id = :idObra', { idObra });
      }

      medicoesCount[preco.id] = await count.getCount();
    }

    return {
      data: precos.map((p) => ({
        id: p.id,
        obra: p.obra.nome,
        servico: p.servico?.nome || 'N/A',
        preco_custo: parseFloat(toNumber(p.preco_custo).toFixed(2)),
        preco_venda: parseFloat(toNumber(p.preco_venda).toFixed(2)),
        margem_percentual: parseFloat(toNumber(p.margem_percentual).toFixed(2)),
        status: p.status_aprovacao,
        vezes_utilizado: medicoesCount[p.id] || 0,
        atende_minimo: toNumber(p.margem_percentual) >= 20,
      })),
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        margem_media: precos.length
          ? parseFloat(
              (
                precos.reduce((sum, p) => sum + toNumber(p.margem_percentual), 0) /
                precos.length
              ).toFixed(2),
            )
          : 0,
      },
      periodo: {
        inicio: inicioPeriodo.toISOString().split('T')[0],
        fim: fimPeriodo.toISOString().split('T')[0],
      },
    };
  }

  /**
   * Dashboard Financeiro com Comparativo de Período Anterior
   */
  async getDashboardFinanceiroComComparativo(
    periodo: PeriodoEnum = PeriodoEnum.MES,
    idObra?: string,
  ) {
    const dashboardAtual = await this.getDashboardFinanceiro(periodo, idObra);
    const [dataInicio, dataFim] = this.obterPeriodo(periodo);
    const diffMs = dataFim.getTime() - dataInicio.getTime();
    const dataInicioPrevio = new Date(dataInicio.getTime() - diffMs);
    const dataFimPrevio = new Date(dataInicio.getTime() - 1);

    const medicoesQuery = this.medicaoRepository
      .createQueryBuilder('medicao')
      .leftJoinAndSelect('medicao.alocacao', 'alocacao')
      .leftJoinAndSelect('alocacao.ambiente', 'ambiente')
      .leftJoinAndSelect('ambiente.pavimento', 'pavimento')
      .leftJoinAndSelect('pavimento.obra', 'obra')
      .where('medicao.created_at BETWEEN :inicio AND :fim', {
        inicio: dataInicioPrevio,
        fim: dataFimPrevio,
      });

    if (idObra) {
      medicoesQuery.andWhere('obra.id = :idObra', { idObra });
    }

    const medicoesPrevias = await medicoesQuery.getMany();
    const precos = await this.precoRepository.find({
      relations: ['obra'],
      where: { status_aprovacao: StatusAprovacaoEnum.APROVADO },
    });

    let custoPrevio = 0;
    let receitaPrevia = 0;

    medicoesPrevias.forEach((medicao) => {
      const obraId = medicao.alocacao.ambiente.pavimento.obra.id;
      const servicoId = medicao.alocacao.id_servico_catalogo
        ? Number(medicao.alocacao.id_servico_catalogo)
        : null;
      const precio = precos.find(
        (p) =>
          p.id_obra === obraId &&
          servicoId &&
          p.id_servico_catalogo === servicoId,
      );

      if (precio) {
        custoPrevio += precio.preco_custo * medicao.qtd_executada;
        receitaPrevia += precio.preco_venda * medicao.qtd_executada;
      }
    });

    const lucroPrevio = receitaPrevia - custoPrevio;
    const margemPrevia =
      receitaPrevia > 0 ? (lucroPrevio / receitaPrevia) * 100 : 0;

    const variacaoReceita =
      receitaPrevia > 0
        ? ((dashboardAtual.metricas.receita_total - receitaPrevia) / receitaPrevia) * 100
        : 0;
    const variacaoCusto =
      custoPrevio > 0
        ? ((dashboardAtual.metricas.custo_total - custoPrevio) / custoPrevio) * 100
        : 0;
    const variacaoLucro =
      lucroPrevio > 0
        ? ((dashboardAtual.metricas.lucro_bruto - lucroPrevio) / lucroPrevio) * 100
        : 0;
    const variacaoMargem = dashboardAtual.metricas.margem_percentual - margemPrevia;

    return {
      ...dashboardAtual,
      periodo_anterior: {
        tipo: periodo,
        inicio: dataInicioPrevio.toISOString().split('T')[0],
        fim: dataFimPrevio.toISOString().split('T')[0],
        metricas: {
          total_medicoes: medicoesPrevias.length,
          custo_total: parseFloat(custoPrevio.toFixed(2)),
          receita_total: parseFloat(receitaPrevia.toFixed(2)),
          lucro_bruto: parseFloat(lucroPrevio.toFixed(2)),
          margem_percentual: parseFloat(margemPrevia.toFixed(2)),
        },
      },
      variacao: {
        receita_percentual: parseFloat(variacaoReceita.toFixed(2)),
        custo_percentual: parseFloat(variacaoCusto.toFixed(2)),
        lucro_percentual: parseFloat(variacaoLucro.toFixed(2)),
        margem_pontos: parseFloat(variacaoMargem.toFixed(2)),
      },
    };
  }

  /**
   * Relatório de Excedentes
   */
  async getRelatorioExcedentes(periodo: PeriodoEnum = PeriodoEnum.MES, idObra?: string) {
    const [dataInicio, dataFim] = this.obterPeriodo(periodo);

    const medicoesQuery = this.medicaoRepository
      .createQueryBuilder('medicao')
      .leftJoinAndSelect('medicao.alocacao', 'alocacao')
      .leftJoinAndSelect('alocacao.colaborador', 'colaborador')
      .leftJoinAndSelect('alocacao.ambiente', 'ambiente')
      .leftJoinAndSelect('ambiente.pavimento', 'pavimento')
      .leftJoinAndSelect('pavimento.obra', 'obra')
      .where('medicao.flag_excedente = true')
      .andWhere('medicao.created_at BETWEEN :inicio AND :fim', {
        inicio: dataInicio,
        fim: dataFim,
      });

    if (idObra) {
      medicoesQuery.andWhere('obra.id = :idObra', { idObra });
    }

    const excedentes = await medicoesQuery.getMany();

    let areaExcedenteTotal = 0;
    let comJustificativa = 0;
    let comFoto = 0;
    let custoAdicional = 0;

    const porAmbiente: Record<
      string,
      { nome: string; obra: string; count: number; area: number }
    > = {};

    const porColaborador: Record<
      string,
      { nome: string; count: number; area: number }
    > = {};

    const precos = await this.precoRepository.find({
      where: { status_aprovacao: StatusAprovacaoEnum.APROVADO },
    });

    excedentes.forEach((medicao) => {
      const excedente =
        medicao.qtd_executada - (medicao.area_planejada || 0);
      if (excedente > 0) {
        areaExcedenteTotal += excedente;

        const servicoId = medicao.alocacao.id_servico_catalogo
          ? Number(medicao.alocacao.id_servico_catalogo)
          : null;
        const precio = precos.find(
          (p) =>
            p.id_obra === medicao.alocacao.ambiente.pavimento.obra.id &&
            servicoId &&
            p.id_servico_catalogo === servicoId,
        );
        if (precio) {
          custoAdicional += precio.preco_custo * excedente;
        }
      }

      if (medicao.justificativa) comJustificativa++;
      if (medicao.foto_evidencia_url) comFoto++;

      const ambienteKey = medicao.alocacao.ambiente.id;
      if (!porAmbiente[ambienteKey]) {
        porAmbiente[ambienteKey] = {
          nome: medicao.alocacao.ambiente.nome,
          obra: medicao.alocacao.ambiente.pavimento.obra.nome,
          count: 0,
          area: 0,
        };
      }
      porAmbiente[ambienteKey].count++;
      porAmbiente[ambienteKey].area += excedente;

      const colabKey = medicao.alocacao.colaborador.id;
      if (!porColaborador[colabKey]) {
        porColaborador[colabKey] = {
          nome: medicao.alocacao.colaborador.nome_completo,
          count: 0,
          area: 0,
        };
      }
      porColaborador[colabKey].count++;
      porColaborador[colabKey].area += excedente;
    });

    const topAmbientes = Object.values(porAmbiente)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topColaboradores = Object.values(porColaborador)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      periodo: {
        tipo: periodo,
        inicio: dataInicio.toISOString().split('T')[0],
        fim: dataFim.toISOString().split('T')[0],
      },
      resumo: {
        total_excedentes: excedentes.length,
        area_excedente_total: parseFloat(areaExcedenteTotal.toFixed(2)),
        percentual_com_justificativa:
          excedentes.length > 0
            ? parseFloat(
                ((comJustificativa / excedentes.length) * 100).toFixed(2),
              )
            : 0,
        percentual_com_foto:
          excedentes.length > 0
            ? parseFloat(((comFoto / excedentes.length) * 100).toFixed(2))
            : 0,
        custo_adicional: parseFloat(custoAdicional.toFixed(2)),
      },
      top_ambientes: topAmbientes.map((a) => ({
        ...a,
        area: parseFloat(a.area.toFixed(2)),
      })),
      top_colaboradores: topColaboradores.map((c) => ({
        ...c,
        area: parseFloat(c.area.toFixed(2)),
      })),
    };
  }

  /**
   * Evolução Temporal de Métricas
   */
  async getEvolucaoTemporal(
    granularidade: GranularidadeEnum = GranularidadeEnum.MENSAL,
    metrica: MetricaEnum = MetricaEnum.MARGEM,
    idObra?: string,
    periodoCompleto?: PeriodoEnum,
  ) {
    const [dataInicio, dataFim] = periodoCompleto
      ? this.obterPeriodo(periodoCompleto)
      : [new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), new Date()];

    const medicoesQuery = this.medicaoRepository
      .createQueryBuilder('medicao')
      .leftJoinAndSelect('medicao.alocacao', 'alocacao')
      .leftJoinAndSelect('alocacao.ambiente', 'ambiente')
      .leftJoinAndSelect('ambiente.pavimento', 'pavimento')
      .leftJoinAndSelect('pavimento.obra', 'obra')
      .where('medicao.data_medicao BETWEEN :inicio AND :fim', {
        inicio: dataInicio,
        fim: dataFim,
      });

    if (idObra) {
      medicoesQuery.andWhere('obra.id = :idObra', { idObra });
    }

    const medicoes = await medicoesQuery.getMany();

    const precos = await this.precoRepository.find({
      where: { status_aprovacao: StatusAprovacaoEnum.APROVADO },
    });

    const periodos: Record<
      string,
      { custo: number; receita: number; lucro: number; margem: number }
    > = {};

    medicoes.forEach((medicao) => {
      let chave: string;
      const dataMedicao = new Date(medicao.created_at);

      switch (granularidade) {
        case GranularidadeEnum.DIARIA:
          chave = dataMedicao.toISOString().split('T')[0];
          break;
        case GranularidadeEnum.SEMANAL:
          const domingo = new Date(dataMedicao);
          domingo.setDate(dataMedicao.getDate() - dataMedicao.getDay());
          chave = domingo.toISOString().split('T')[0];
          break;
        case GranularidadeEnum.MENSAL:
          chave = `${dataMedicao.getFullYear()}-${String(dataMedicao.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          chave = dataMedicao.toISOString().split('T')[0];
      }

      if (!periodos[chave]) {
        periodos[chave] = { custo: 0, receita: 0, lucro: 0, margem: 0 };
      }

      const obraId = medicao.alocacao.ambiente.pavimento.obra.id;
      const servicoId = medicao.alocacao.id_servico_catalogo
        ? Number(medicao.alocacao.id_servico_catalogo)
        : null;
      const precio = precos.find(
        (p) => p.id_obra === obraId && servicoId && p.id_servico_catalogo === servicoId,
      );

      if (precio) {
        periodos[chave].custo += precio.preco_custo * medicao.qtd_executada;
        periodos[chave].receita += precio.preco_venda * medicao.qtd_executada;
      }
    });

    Object.keys(periodos).forEach((chave) => {
      const p = periodos[chave];
      p.lucro = p.receita - p.custo;
      p.margem = p.receita > 0 ? (p.lucro / p.receita) * 100 : 0;
    });

    const serie = Object.keys(periodos)
      .sort()
      .map((chave) => {
        const p = periodos[chave];
        let valor: number;

        switch (metrica) {
          case MetricaEnum.RECEITA:
            valor = p.receita;
            break;
          case MetricaEnum.CUSTO:
            valor = p.custo;
            break;
          case MetricaEnum.LUCRO:
            valor = p.lucro;
            break;
          case MetricaEnum.MARGEM:
            valor = p.margem;
            break;
          default:
            valor = p.margem;
        }

        return {
          data: chave,
          valor: parseFloat(valor.toFixed(2)),
        };
      });

    return {
      granularidade,
      metrica,
      periodo: {
        inicio: dataInicio.toISOString().split('T')[0],
        fim: dataFim.toISOString().split('T')[0],
      },
      serie,
    };
  }

  /**
   * Ranking de Obras por Métrica
   */
  async getRankingObras(
    metrica: MetricaRankingEnum = MetricaRankingEnum.MARGEM,
    ordem: 'ASC' | 'DESC' = 'DESC',
    limit: number = 10,
    periodo: PeriodoEnum = PeriodoEnum.MES,
  ) {
    const [dataInicio, dataFim] = this.obterPeriodo(periodo);

    const medicoes = await this.medicaoRepository
      .createQueryBuilder('medicao')
      .leftJoinAndSelect('medicao.alocacao', 'alocacao')
      .leftJoinAndSelect('alocacao.ambiente', 'ambiente')
      .leftJoinAndSelect('ambiente.pavimento', 'pavimento')
      .leftJoinAndSelect('pavimento.obra', 'obra')
      .where('medicao.data_medicao BETWEEN :inicio AND :fim', {
        inicio: dataInicio,
        fim: dataFim,
      })
      .getMany();

    const precos = await this.precoRepository.find({
      relations: ['obra'],
      where: { status_aprovacao: StatusAprovacaoEnum.APROVADO },
    });

    const obraMetricas: Record<
      string,
      {
        id: string;
        nome: string;
        custo: number;
        receita: number;
        lucro: number;
        margem: number;
        total_medicoes: number;
        produtividade: number;
      }
    > = {};

    medicoes.forEach((medicao) => {
      const obraId = medicao.alocacao.ambiente.pavimento.obra.id;
      const obraNome = medicao.alocacao.ambiente.pavimento.obra.nome;

      if (!obraMetricas[obraId]) {
        obraMetricas[obraId] = {
          id: obraId,
          nome: obraNome,
          custo: 0,
          receita: 0,
          lucro: 0,
          margem: 0,
          total_medicoes: 0,
          produtividade: 0,
        };
      }

      const servicoId = medicao.alocacao.id_servico_catalogo
        ? Number(medicao.alocacao.id_servico_catalogo)
        : null;
      const precio = precos.find(
        (p) => p.id_obra === obraId && servicoId && p.id_servico_catalogo === servicoId,
      );

      if (precio) {
        obraMetricas[obraId].custo += precio.preco_custo * medicao.qtd_executada;
        obraMetricas[obraId].receita += precio.preco_venda * medicao.qtd_executada;
      }

      obraMetricas[obraId].total_medicoes++;
      obraMetricas[obraId].produtividade += medicao.qtd_executada;
    });

    Object.keys(obraMetricas).forEach((obraId) => {
      const m = obraMetricas[obraId];
      m.lucro = m.receita - m.custo;
      m.margem = m.receita > 0 ? (m.lucro / m.receita) * 100 : 0;
      m.produtividade = m.total_medicoes > 0 ? m.produtividade / m.total_medicoes : 0;
    });

    let rankingArray = Object.values(obraMetricas);

    switch (metrica) {
      case MetricaRankingEnum.MARGEM:
        rankingArray.sort((a, b) => (ordem === 'DESC' ? b.margem - a.margem : a.margem - b.margem));
        break;
      case MetricaRankingEnum.RECEITA:
        rankingArray.sort((a, b) =>
          ordem === 'DESC' ? b.receita - a.receita : a.receita - b.receita,
        );
        break;
      case MetricaRankingEnum.LUCRO:
        rankingArray.sort((a, b) => (ordem === 'DESC' ? b.lucro - a.lucro : a.lucro - b.lucro));
        break;
      case MetricaRankingEnum.PRODUTIVIDADE:
        rankingArray.sort((a, b) =>
          ordem === 'DESC' ? b.produtividade - a.produtividade : a.produtividade - b.produtividade,
        );
        break;
    }

    rankingArray = rankingArray.slice(0, limit);

    return {
      metrica,
      ordem,
      periodo: {
        tipo: periodo,
        inicio: dataInicio.toISOString().split('T')[0],
        fim: dataFim.toISOString().split('T')[0],
      },
      ranking: rankingArray.map((o, index) => ({
        posicao: index + 1,
        obra_id: o.id,
        obra_nome: o.nome,
        custo: parseFloat(o.custo.toFixed(2)),
        receita: parseFloat(o.receita.toFixed(2)),
        lucro: parseFloat(o.lucro.toFixed(2)),
        margem_percentual: parseFloat(o.margem.toFixed(2)),
        total_medicoes: o.total_medicoes,
        produtividade_media: parseFloat(o.produtividade.toFixed(2)),
      })),
    };
  }

  /**
   * Relatório de Produção Individual por Colaborador (ERS 4.1)
   * Usa tb_medicoes_colaborador como fonte de verdade
   */
  async getProducaoIndividualColaborador(
    id_colaborador: string,
    id_obra?: string,
    data_inicio?: string,
    data_fim?: string,
  ) {
    const colaborador = await this.colaboradorRepository.findOne({
      where: { id: id_colaborador, deletado: false },
    });
    if (!colaborador) {
      throw new NotFoundException(`Colaborador ${id_colaborador} nao encontrado`);
    }

    const query = this.medicaoColaboradorRepository
      .createQueryBuilder('mc')
      .leftJoinAndSelect('mc.colaborador', 'colaborador')
      .leftJoinAndSelect('mc.item_ambiente', 'item')
      .leftJoinAndSelect('item.ambiente', 'ambiente')
      .leftJoinAndSelect('ambiente.pavimento', 'pavimento')
      .leftJoinAndSelect('pavimento.obra', 'obra')
      .leftJoinAndSelect('mc.alocacao_item', 'alocacao_item')
      .where('mc.id_colaborador = :id', { id: id_colaborador })
      .andWhere('mc.deletado = false');

    if (id_obra) {
      query.andWhere('obra.id = :id_obra', { id_obra });
    }

    if (data_inicio) {
      query.andWhere('mc.data_medicao >= :data_inicio', { data_inicio });
    }

    if (data_fim) {
      query.andWhere('mc.data_medicao <= :data_fim', { data_fim });
    }

    const medicoes = await query.orderBy('mc.data_medicao', 'DESC').getMany();

    const totalQtd = medicoes.reduce((sum, m) => sum + Number(m.qtd_executada), 0);
    const excedentes = medicoes.filter((m) => m.flag_excedente).length;
    const abertas = medicoes.filter((m) => m.status_pagamento === StatusPagamentoEnum.ABERTO).length;
    const pagas = medicoes.filter((m) => m.status_pagamento === StatusPagamentoEnum.PAGO).length;

    return {
      colaborador: {
        id: colaborador.id,
        nome: colaborador.nome_completo,
      },
      periodo: { data_inicio: data_inicio ?? null, data_fim: data_fim ?? null },
      totais: {
        total_medicoes: medicoes.length,
        total_qtd_executada: parseFloat(totalQtd.toFixed(2)),
        total_excedentes: excedentes,
        medicoes_abertas: abertas,
        medicoes_pagas: pagas,
      },
      medicoes,
    };
  }

  /**
   * Relatório de Saldo de Vales Adiantamento (ERS 4.1)
   * Usa tb_vales_adiantamento como fonte
   */
  async getSaldoValesAdiantamento(id_colaborador?: string, id_obra?: string) {
    const query = this.valeAdiantamentoRepository
      .createQueryBuilder('va')
      .leftJoinAndSelect('va.colaborador', 'colaborador')
      .leftJoinAndSelect('va.obra', 'obra')
      .leftJoinAndSelect('va.aprovado_por', 'aprovado_por')
      .leftJoinAndSelect('va.parcelas', 'parcelas')
      .where('va.deletado = false');

    if (id_colaborador) {
      query.andWhere('va.id_colaborador = :id_colaborador', { id_colaborador });
    }

    if (id_obra) {
      query.andWhere('va.id_obra = :id_obra', { id_obra });
    }

    const vales = await query.orderBy('va.created_at', 'DESC').getMany();

    const statusAbertos = [
      StatusValeAdiantamentoEnum.APROVADO,
      StatusValeAdiantamentoEnum.PAGO,
      StatusValeAdiantamentoEnum.PARCIALMENTE_COMPENSADO,
    ];

    const totalSolicitado = vales.reduce((sum, v) => sum + Number(v.valor_solicitado), 0);
    const totalAprovado = vales
      .filter((v) => v.valor_aprovado)
      .reduce((sum, v) => sum + Number(v.valor_aprovado), 0);
    const saldoEmAberto = vales
      .filter((v) => statusAbertos.includes(v.status))
      .reduce((sum, v) => sum + Number(v.valor_aprovado ?? 0), 0);

    return {
      filtros: {
        id_colaborador: id_colaborador ?? null,
        id_obra: id_obra ?? null,
      },
      totais: {
        total_vales: vales.length,
        valor_total_solicitado: parseFloat(totalSolicitado.toFixed(2)),
        valor_total_aprovado: parseFloat(totalAprovado.toFixed(2)),
        saldo_em_aberto: parseFloat(saldoEmAberto.toFixed(2)),
      },
      por_status: Object.values(StatusValeAdiantamentoEnum).map((status) => ({
        status,
        quantidade: vales.filter((v) => v.status === status).length,
      })),
      vales,
    };
  }
}
