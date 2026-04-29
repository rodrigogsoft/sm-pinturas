import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { StatusProgressoEnum } from '../../common/enums';
import { MedicaoColaborador } from './entities/medicao-colaborador.entity';
import { CreateMedicaoColaboradorDto } from './dto/create-medicao-colaborador.dto';
import { AlocacaoItem } from '../alocacoes-itens/entities/alocacao-item.entity';
import { StatusAlocacaoItemEnum } from '../alocacoes-itens/entities/alocacao-item.entity';
import { Colaborador } from '../colaboradores/entities/colaborador.entity';
import { ItemAmbiente } from '../itens-ambiente/entities/item-ambiente.entity';
import { Medicao } from '../medicoes/entities/medicao.entity';
import { Ambiente, Pavimento } from '../pavimentos/entities/pavimento.entity';
import { Obra } from '../obras/entities/obra.entity';

@Injectable()
export class MedicoesColaboradorService {
  constructor(
    @InjectRepository(MedicaoColaborador)
    private readonly medicoesColaboradorRepository: Repository<MedicaoColaborador>,
    @InjectRepository(AlocacaoItem)
    private readonly alocacoesItensRepository: Repository<AlocacaoItem>,
    @InjectRepository(Colaborador)
    private readonly colaboradoresRepository: Repository<Colaborador>,
    @InjectRepository(ItemAmbiente)
    private readonly itensAmbienteRepository: Repository<ItemAmbiente>,
    @InjectRepository(Medicao)
    private readonly medicoesLegadoRepository: Repository<Medicao>,
    @InjectRepository(Ambiente)
    private readonly ambientesRepository: Repository<Ambiente>,
    @InjectRepository(Pavimento)
    private readonly pavimentosRepository: Repository<Pavimento>,
    @InjectRepository(Obra)
    private readonly obrasRepository: Repository<Obra>,
  ) {}

  async create(createDto: CreateMedicaoColaboradorDto): Promise<MedicaoColaborador> {
    const [alocacaoItem, colaborador, itemAmbiente, medicaoLegado] = await Promise.all([
      this.alocacoesItensRepository.findOne({
        where: { id: createDto.id_alocacao_item, deletado: false },
      }),
      this.colaboradoresRepository.findOne({
        where: { id: createDto.id_colaborador, deletado: false },
      }),
      this.itensAmbienteRepository.findOne({
        where: { id: createDto.id_item_ambiente, deletado: false },
      }),
      createDto.id_medicao_legado
        ? this.medicoesLegadoRepository.findOne({ where: { id: createDto.id_medicao_legado } })
        : Promise.resolve(null),
    ]);

    if (!alocacaoItem) {
      throw new NotFoundException(`Alocacao por item ${createDto.id_alocacao_item} nao encontrada`);
    }

    if (!colaborador) {
      throw new NotFoundException(`Colaborador ${createDto.id_colaborador} nao encontrado`);
    }

    if (!itemAmbiente) {
      throw new NotFoundException(`Item de ambiente ${createDto.id_item_ambiente} nao encontrado`);
    }

    if (createDto.id_medicao_legado && !medicaoLegado) {
      throw new NotFoundException(`Medicao legado ${createDto.id_medicao_legado} nao encontrada`);
    }

    if (alocacaoItem.id_colaborador !== createDto.id_colaborador) {
      throw new BadRequestException('Colaborador informado difere da alocacao por item');
    }

    if (alocacaoItem.id_item_ambiente !== createDto.id_item_ambiente) {
      throw new BadRequestException('Item informado difere da alocacao por item');
    }

    if (alocacaoItem.status !== StatusAlocacaoItemEnum.EM_ANDAMENTO) {
      throw new BadRequestException('A medicao individual exige uma alocacao por item em andamento');
    }

    const areaPlanejada = Number(createDto.area_planejada ?? (itemAmbiente as any).area_planejada ?? 0);
    const excedente = areaPlanejada > 0 && Number(createDto.qtd_executada) > areaPlanejada;

    if (excedente && (!createDto.justificativa || !createDto.foto_evidencia_url)) {
      throw new BadRequestException('Excedente requer justificativa e foto de evidencia');
    }

    const entidade = this.medicoesColaboradorRepository.create({
      ...createDto,
      area_planejada: areaPlanejada || null,
      data_medicao: createDto.data_medicao ? new Date(createDto.data_medicao) : new Date(),
      flag_excedente: excedente,
    });

    const salvo = await this.medicoesColaboradorRepository.save(entidade);

    // RF17 + RF18: recalcular progresso em cascata após nova medição
    await this.recalcularProgressoItem(createDto.id_item_ambiente);

    return salvo;
  }

  // RF17 — recalcula progresso acumulativo do elemento de serviço (ItemAmbiente)
  // Agrega medições dos dois fluxos: tb_medicoes_colaborador (novo) + tb_medicoes via tb_alocacoes_tarefa (legado)
  async recalcularProgressoItem(id_item_ambiente: string): Promise<void> {
    const item = await this.itensAmbienteRepository.findOne({
      where: { id: id_item_ambiente, deletado: false },
    });
    if (!item) return;

    const [medicoesNovo, legadoResult] = await Promise.all([
      this.medicoesColaboradorRepository.find({
        where: { id_item_ambiente, deletado: false },
      }),
      // Soma medições do fluxo legado (tb_medicoes via tb_alocacoes_tarefa)
      this.medicoesLegadoRepository
        .createQueryBuilder('m')
        .innerJoin(
          'tb_alocacoes_tarefa',
          'at',
          'at.id = m.id_alocacao AND at.id_item_ambiente = :id',
          { id: id_item_ambiente },
        )
        .where('m.deletado = false')
        .select('COALESCE(SUM(m.qtd_executada), 0)', 'total')
        .getRawOne(),
    ]);

    const totalNovo = medicoesNovo.reduce(
      (soma, m) => soma + Number(m.qtd_executada || 0),
      0,
    );
    const totalLegado = Number(legadoResult?.total || 0);
    const areaMedidaTotal = totalNovo + totalLegado;
    const areaPlanejada = Number(item.area_planejada || 0);
    const progresso =
      areaPlanejada > 0
        ? Math.min(Number(((areaMedidaTotal / areaPlanejada) * 100).toFixed(2)), 100)
        : 0;

    item.area_medida_total = Number(areaMedidaTotal.toFixed(2));
    item.progresso = progresso;
    item.status =
      progresso >= 100
        ? StatusProgressoEnum.CONCLUIDO
        : progresso > 0
          ? StatusProgressoEnum.EM_PROGRESSO
          : StatusProgressoEnum.ABERTO;

    await this.itensAmbienteRepository.save(item);

    // RF18: propagar para o ambiente pai
    await this.recalcularProgressoAmbiente(item.id_ambiente);
  }

  // RF18 — recalcula progresso do ambiente com base em seus itens
  private async recalcularProgressoAmbiente(id_ambiente: string): Promise<void> {
    const ambiente = await this.ambientesRepository.findOne({
      where: { id: id_ambiente, deletado: false },
    });
    if (!ambiente) return;

    const itens = await this.itensAmbienteRepository.find({
      where: { id_ambiente, deletado: false },
    });
    if (itens.length === 0) return;

    // Progresso ponderado pela área planejada; sem área usa média simples
    let totalPlanejado = 0;
    let totalMedido = 0;
    for (const it of itens) {
      const planejado = Number(it.area_planejada || 0);
      const medido = Number(it.area_medida_total || 0);
      totalPlanejado += planejado;
      totalMedido += medido;
    }

    const progresso =
      totalPlanejado > 0
        ? Math.min(Number(((totalMedido / totalPlanejado) * 100).toFixed(2)), 100)
        : Number(
            (
              itens.reduce((s, it) => s + Number(it.progresso || 0), 0) /
              itens.length
            ).toFixed(2),
          );

    ambiente.progresso = progresso;
    ambiente.status_progresso =
      progresso >= 100
        ? StatusProgressoEnum.CONCLUIDO
        : progresso > 0
          ? StatusProgressoEnum.EM_PROGRESSO
          : StatusProgressoEnum.ABERTO;

    await this.ambientesRepository.save(ambiente);

    // Propagar para o pavimento pai
    await this.recalcularProgressoPavimento(ambiente.id_pavimento);
  }

  // RF18 — recalcula progresso do pavimento com base em seus ambientes
  private async recalcularProgressoPavimento(id_pavimento: string): Promise<void> {
    const pavimento = await this.pavimentosRepository.findOne({
      where: { id: id_pavimento, deletado: false },
    });
    if (!pavimento) return;

    const ambientes = await this.ambientesRepository.find({
      where: { id_pavimento, deletado: false },
    });
    if (ambientes.length === 0) return;

    const progresso = Number(
      (
        ambientes.reduce((s, a) => s + Number(a.progresso || 0), 0) /
        ambientes.length
      ).toFixed(2),
    );

    pavimento.progresso = progresso;
    pavimento.status_progresso =
      progresso >= 100
        ? StatusProgressoEnum.CONCLUIDO
        : progresso > 0
          ? StatusProgressoEnum.EM_PROGRESSO
          : StatusProgressoEnum.ABERTO;

    await this.pavimentosRepository.save(pavimento);

    // Propagar para a obra pai
    await this.recalcularProgressoObra(pavimento.id_obra);
  }

  // RF18 — recalcula progresso geral da obra com base em seus pavimentos
  private async recalcularProgressoObra(id_obra: string): Promise<void> {
    const obra = await this.obrasRepository.findOne({
      where: { id: id_obra, deletado: false },
    });
    if (!obra) return;

    const pavimentos = await this.pavimentosRepository.find({
      where: { id_obra, deletado: false },
    });
    if (pavimentos.length === 0) return;

    obra.progresso = Number(
      (
        pavimentos.reduce((s, p) => s + Number(p.progresso || 0), 0) /
        pavimentos.length
      ).toFixed(2),
    );

    await this.obrasRepository.save(obra);
  }

  async findAll(): Promise<MedicaoColaborador[]> {
    return this.medicoesColaboradorRepository.find({
      where: { deletado: false },
      relations: ['alocacao_item', 'colaborador', 'item_ambiente', 'medicao_legado'],
      order: { created_at: 'DESC' },
    });
  }

  async findByItem(id_item_ambiente: string): Promise<MedicaoColaborador[]> {
    return this.medicoesColaboradorRepository.find({
      where: { id_item_ambiente, deletado: false },
      relations: ['colaborador', 'alocacao_item'],
      order: { created_at: 'DESC' },
    });
  }

  async findByColaborador(id_colaborador: string): Promise<MedicaoColaborador[]> {
    return this.medicoesColaboradorRepository.find({
      where: { id_colaborador, deletado: false },
      relations: ['item_ambiente', 'alocacao_item'],
      order: { created_at: 'DESC' },
    });
  }

  async getResumoProducaoByItem(
    id_item_ambiente: string,
    data_inicio?: string,
    data_fim?: string,
  ): Promise<{
    id_item_ambiente: string;
    total_medicoes: number;
    total_colaboradores: number;
    total_qtd_executada: number;
    percentual_conclusao_medio: number;
    por_colaborador: Array<{
      id_colaborador: string;
      nome_colaborador: string;
      total_medicoes: number;
      total_qtd_executada: number;
    }>;
  }> {
    const item = await this.itensAmbienteRepository.findOne({
      where: { id: id_item_ambiente, deletado: false },
    });

    if (!item) {
      throw new NotFoundException(`Item de ambiente ${id_item_ambiente} nao encontrado`);
    }

    const query = this.medicoesColaboradorRepository
      .createQueryBuilder('mc')
      .leftJoinAndSelect('mc.colaborador', 'colaborador')
      .where('mc.id_item_ambiente = :id_item_ambiente', { id_item_ambiente })
      .andWhere('mc.deletado = false');

    if (data_inicio) {
      query.andWhere('mc.data_medicao >= :data_inicio', { data_inicio });
    }

    if (data_fim) {
      query.andWhere('mc.data_medicao <= :data_fim', { data_fim });
    }

    const medicoes = await query.getMany();
    const totalQtd = medicoes.reduce((sum, m) => sum + Number(m.qtd_executada || 0), 0);
    const totalColaboradores = new Set(medicoes.map((m) => m.id_colaborador)).size;

    const porColaboradorMap = new Map<string, {
      id_colaborador: string;
      nome_colaborador: string;
      total_medicoes: number;
      total_qtd_executada: number;
    }>();

    for (const medicao of medicoes) {
      const atual = porColaboradorMap.get(medicao.id_colaborador) || {
        id_colaborador: medicao.id_colaborador,
        nome_colaborador: medicao.colaborador?.nome_completo || 'N/A',
        total_medicoes: 0,
        total_qtd_executada: 0,
      };

      atual.total_medicoes += 1;
      atual.total_qtd_executada += Number(medicao.qtd_executada || 0);
      porColaboradorMap.set(medicao.id_colaborador, atual);
    }

    const areaPlanejada = Number((item as any).area_planejada || 0);
    const percentualConclusao =
      areaPlanejada > 0 ? Number(((totalQtd / areaPlanejada) * 100).toFixed(2)) : 0;

    return {
      id_item_ambiente,
      total_medicoes: medicoes.length,
      total_colaboradores: totalColaboradores,
      total_qtd_executada: Number(totalQtd.toFixed(2)),
      percentual_conclusao_medio: percentualConclusao,
      por_colaborador: [...porColaboradorMap.values()].map((itemColab) => ({
        ...itemColab,
        total_qtd_executada: Number(itemColab.total_qtd_executada.toFixed(2)),
      })),
    };
  }

  async findOne(id: string): Promise<MedicaoColaborador> {
    const record = await this.medicoesColaboradorRepository.findOne({
      where: { id, deletado: false },
      relations: ['alocacao_item', 'colaborador', 'item_ambiente', 'medicao_legado'],
    });
    if (!record) {
      throw new NotFoundException(`Medicao individual ${id} nao encontrada`);
    }
    return record;
  }

  async remove(id: string): Promise<void> {
    const record = await this.findOne(id);
    record.deletado = true;
    await this.medicoesColaboradorRepository.save(record);
    // RF17 + RF18: recalcular progresso em cascata após remoção
    await this.recalcularProgressoItem(record.id_item_ambiente);
  }
}
