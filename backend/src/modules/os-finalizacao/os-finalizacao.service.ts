import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  OsFinalizacao,
  StatusOsFinalizacaoEnum,
} from './entities/os-finalizacao.entity';
import { CreateOsFinalizacaoDto } from './dto/create-os-finalizacao.dto';
import { Obra } from '../obras/entities/obra.entity';
import { ItemAmbiente } from '../itens-ambiente/entities/item-ambiente.entity';
import { StatusProgressoEnum } from '../../common/enums';

@Injectable()
export class OsFinalizacaoService {
  constructor(
    @InjectRepository(OsFinalizacao)
    private readonly osFinalizacaoRepository: Repository<OsFinalizacao>,
    @InjectRepository(Obra)
    private readonly obrasRepository: Repository<Obra>,
    @InjectRepository(ItemAmbiente)
    private readonly itensAmbienteRepository: Repository<ItemAmbiente>,
  ) {}

  /**
   * Retorna os itens incompletos de uma obra para exibição no pop-up (RF19).
   * O frontend usa esse endpoint antes de abrir o formulário de finalização.
   */
  async verificarItensPendentes(id_obra: string): Promise<{
    pode_finalizar: boolean;
    itens_incompletos: Array<{
      id_item_ambiente: string;
      descricao: string;
      progresso: number;
    }>;
  }> {
    const obra = await this.obrasRepository.findOne({
      where: { id: id_obra, deletado: false },
    });
    if (!obra) throw new NotFoundException(`Obra ${id_obra} não encontrada`);

    // Busca todos os itens da obra via join com ambientes e pavimentos
    const itens = await this.itensAmbienteRepository
      .createQueryBuilder('ia')
      .leftJoinAndSelect('ia.tabelaPreco', 'tp')
      .leftJoin('ia.ambiente', 'amb')
      .leftJoin('amb.pavimento', 'pav')
      .where('pav.id_obra = :id_obra', { id_obra })
      .andWhere('ia.deletado = false')
      .getMany();

    const itensIncompletos = itens
      .filter((it) => it.status !== StatusProgressoEnum.CONCLUIDO)
      .map((it) => ({
        id_item_ambiente: it.id,
        descricao: (it.tabelaPreco as any)?.descricao ?? `Item ${it.id}`,
        progresso: Number(it.progresso || 0),
      }));

    return {
      pode_finalizar: itensIncompletos.length === 0,
      itens_incompletos: itensIncompletos,
    };
  }

  /** Finaliza a O.S. da obra com assinatura digital (RF19) */
  async finalizar(
    dto: CreateOsFinalizacaoDto,
    id_usuario_responsavel: string,
  ): Promise<OsFinalizacao> {
    const obra = await this.obrasRepository.findOne({
      where: { id: dto.id_obra, deletado: false },
    });
    if (!obra) throw new NotFoundException(`Obra ${dto.id_obra} não encontrada`);

    const { itens_incompletos } = await this.verificarItensPendentes(dto.id_obra);
    const temIncompletos = itens_incompletos.length > 0;

    if (temIncompletos && !dto.justificativa_incompletude?.trim()) {
      throw new BadRequestException(
        `Existem ${itens_incompletos.length} elemento(s) incompleto(s). ` +
          'Informe justificativa_incompletude para finalizar parcialmente.',
      );
    }

    const status = temIncompletos
      ? StatusOsFinalizacaoEnum.PARCIAL
      : StatusOsFinalizacaoEnum.CONCLUIDA;

    const finalizacao = this.osFinalizacaoRepository.create({
      id_obra: dto.id_obra,
      id_usuario_responsavel,
      nome_fiscalizador: dto.nome_fiscalizador,
      cpf_fiscalizador: dto.cpf_fiscalizador,
      assinatura_url: dto.assinatura_url,
      justificativa_incompletude: dto.justificativa_incompletude ?? null,
      itens_incompletos: temIncompletos ? itens_incompletos : null,
      status,
      progresso_no_momento: Number(obra.progresso || 0),
    });

    return this.osFinalizacaoRepository.save(finalizacao);
  }

  /** Histórico de finalizações de uma obra */
  async findByObra(id_obra: string): Promise<OsFinalizacao[]> {
    return this.osFinalizacaoRepository.find({
      where: { id_obra },
      relations: ['usuario_responsavel'],
      order: { data_finalizacao: 'DESC' },
    });
  }

  async findOne(id: string): Promise<OsFinalizacao> {
    const registro = await this.osFinalizacaoRepository.findOne({
      where: { id },
      relations: ['obra', 'usuario_responsavel'],
    });
    if (!registro) throw new NotFoundException(`Finalização ${id} não encontrada`);
    return registro;
  }
}
