import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  ApropriacaoFinanceira,
  StatusApropriacao,
} from './entities/apropriacao-financeira.entity';
import { AprovarApropriacaoDto } from './dto/aprovar-apropriacao.dto';
import { MedicaoColaborador } from '../medicoes-colaborador/entities/medicao-colaborador.entity';
import { ItemAmbiente } from '../itens-ambiente/entities/item-ambiente.entity';
import { TabelaPreco } from '../precos/entities/tabela-preco.entity';
import { Pavimento, Ambiente } from '../pavimentos/entities/pavimento.entity';

@Injectable()
export class ApropriacoesFinanceirasService {
  constructor(
    @InjectRepository(ApropriacaoFinanceira)
    private readonly repo: Repository<ApropriacaoFinanceira>,
    @InjectRepository(MedicaoColaborador)
    private readonly medicoesRepo: Repository<MedicaoColaborador>,
    @InjectRepository(ItemAmbiente)
    private readonly itensRepo: Repository<ItemAmbiente>,
    @InjectRepository(TabelaPreco)
    private readonly precosRepo: Repository<TabelaPreco>,
    @InjectRepository(Ambiente)
    private readonly ambientesRepo: Repository<Ambiente>,
    @InjectRepository(Pavimento)
    private readonly pavimentosRepo: Repository<Pavimento>,
  ) {}

  /**
   * RF13 — Gera apropriações para todas as medições individuais de uma obra
   * que ainda não possuem apropriação criada.
   */
  async gerarParaObra(
    id_obra: string,
    competencia: string,
  ): Promise<{ geradas: number; ignoradas: number }> {
    // Busca medições da obra sem apropriação ainda
    const medicoes = await this.medicoesRepo
      .createQueryBuilder('mc')
      .leftJoin('mc.item_ambiente', 'ia')
      .leftJoin('ia.ambiente', 'amb')
      .leftJoin('amb.pavimento', 'pav')
      .where('pav.id_obra = :id_obra', { id_obra })
      .andWhere('mc.deletado = false')
      .andWhere(
        `NOT EXISTS (
          SELECT 1 FROM tb_apropriacoes_financeiras af
          WHERE af.id_medicao_colaborador = mc.id AND af.deletado = false
        )`,
      )
      .getMany();

    let geradas = 0;
    let ignoradas = 0;

    for (const medicao of medicoes) {
      const item = await this.itensRepo.findOne({
        where: { id: medicao.id_item_ambiente, deletado: false },
        relations: ['tabelaPreco'],
      });

      const precoVenda = Number((item?.tabelaPreco as any)?.preco_venda ?? 0);

      if (!precoVenda) {
        ignoradas++;
        continue;
      }

      const areaExecutada = Number(medicao.qtd_executada || 0);
      const valorCalculado = Number((areaExecutada * precoVenda).toFixed(2));

      const apropriacao = this.repo.create({
        id_medicao_colaborador: medicao.id,
        id_colaborador: medicao.id_colaborador,
        id_obra,
        preco_venda_unitario: precoVenda,
        area_executada: areaExecutada,
        valor_calculado: valorCalculado,
        competencia: new Date(competencia),
        status: StatusApropriacao.PENDENTE,
      });

      await this.repo.save(apropriacao);
      geradas++;
    }

    return { geradas, ignoradas };
  }

  async findByObra(
    id_obra: string,
    status?: StatusApropriacao,
  ): Promise<ApropriacaoFinanceira[]> {
    const query = this.repo
      .createQueryBuilder('af')
      .leftJoinAndSelect('af.colaborador', 'col')
      .leftJoinAndSelect('af.medicao_colaborador', 'mc')
      .leftJoinAndSelect('af.aprovado_por', 'aprovador')
      .where('af.id_obra = :id_obra', { id_obra })
      .andWhere('af.deletado = false')
      .orderBy('af.created_at', 'DESC');

    if (status) {
      query.andWhere('af.status = :status', { status });
    }

    return query.getMany();
  }

  async findByColaborador(id_colaborador: string): Promise<ApropriacaoFinanceira[]> {
    return this.repo.find({
      where: { id_colaborador, deletado: false },
      relations: ['obra', 'medicao_colaborador'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ApropriacaoFinanceira> {
    const registro = await this.repo.findOne({
      where: { id, deletado: false },
      relations: ['colaborador', 'obra', 'medicao_colaborador', 'aprovado_por'],
    });
    if (!registro) throw new NotFoundException(`Apropriação ${id} não encontrada`);
    return registro;
  }

  /** RF13 — Aprovar apropriação individual */
  async aprovar(id: string, id_usuario: string): Promise<ApropriacaoFinanceira> {
    const registro = await this.findOne(id);

    if (registro.status !== StatusApropriacao.PENDENTE) {
      throw new BadRequestException(
        `Apropriação já está com status "${registro.status}"`,
      );
    }

    registro.status = StatusApropriacao.APROVADO;
    registro.id_aprovado_por = id_usuario;
    registro.data_aprovacao = new Date();

    return this.repo.save(registro);
  }

  /** RF13 — Rejeitar apropriação individual */
  async rejeitar(
    id: string,
    id_usuario: string,
    dto: AprovarApropriacaoDto,
  ): Promise<ApropriacaoFinanceira> {
    const registro = await this.findOne(id);

    if (registro.status !== StatusApropriacao.PENDENTE) {
      throw new BadRequestException(
        `Apropriação já está com status "${registro.status}"`,
      );
    }

    if (!dto.justificativa_rejeicao?.trim()) {
      throw new BadRequestException('Justificativa de rejeição é obrigatória.');
    }

    registro.status = StatusApropriacao.REJEITADO;
    registro.id_aprovado_por = id_usuario;
    registro.data_aprovacao = new Date();
    registro.justificativa_rejeicao = dto.justificativa_rejeicao;

    return this.repo.save(registro);
  }

  /** Resumo financeiro por colaborador (para folha) */
  async resumoPorColaborador(id_obra: string, competencia: string) {
    const apropriacoes = await this.repo.find({
      where: { id_obra, status: StatusApropriacao.APROVADO, deletado: false },
      relations: ['colaborador'],
    });

    const mapa = new Map<
      string,
      { id_colaborador: string; nome: string; total_area: number; total_valor: number; qtd: number }
    >();

    for (const a of apropriacoes) {
      const atual = mapa.get(a.id_colaborador) ?? {
        id_colaborador: a.id_colaborador,
        nome: a.colaborador?.nome_completo ?? 'N/A',
        total_area: 0,
        total_valor: 0,
        qtd: 0,
      };
      atual.total_area += Number(a.area_executada);
      atual.total_valor += Number(a.valor_calculado);
      atual.qtd += 1;
      mapa.set(a.id_colaborador, atual);
    }

    return [...mapa.values()].map((item) => ({
      ...item,
      total_area: Number(item.total_area.toFixed(2)),
      total_valor: Number(item.total_valor.toFixed(2)),
    }));
  }
}
