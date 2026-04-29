import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AlocacaoItem, StatusAlocacaoItemEnum } from './entities/alocacao-item.entity';
import { CreateAlocacaoItemDto } from './dto/create-alocacao-item.dto';
import { ConcluirAlocacaoItemDto } from './dto/concluir-alocacao-item.dto';
import { SessaoDiaria } from '../sessoes/entities/sessao-diaria.entity';
import { Ambiente } from '../pavimentos/entities/pavimento.entity';
import { ItemAmbiente } from '../itens-ambiente/entities/item-ambiente.entity';
import { Colaborador } from '../colaboradores/entities/colaborador.entity';
import { AlocacaoTarefa } from '../alocacoes/entities/alocacao-tarefa.entity';

@Injectable()
export class AlocacoesItensService {
  constructor(
    @InjectRepository(AlocacaoItem)
    private readonly alocacoesItensRepository: Repository<AlocacaoItem>,
    @InjectRepository(SessaoDiaria)
    private readonly sessoesRepository: Repository<SessaoDiaria>,
    @InjectRepository(Ambiente)
    private readonly ambientesRepository: Repository<Ambiente>,
    @InjectRepository(ItemAmbiente)
    private readonly itensAmbienteRepository: Repository<ItemAmbiente>,
    @InjectRepository(Colaborador)
    private readonly colaboradoresRepository: Repository<Colaborador>,
    @InjectRepository(AlocacaoTarefa)
    private readonly alocacoesLegadoRepository: Repository<AlocacaoTarefa>,
  ) {}

  async create(createDto: CreateAlocacaoItemDto): Promise<AlocacaoItem> {
    const [sessao, ambiente, itemAmbiente, colaborador, alocacaoLegado] = await Promise.all([
      this.sessoesRepository.findOne({ where: { id: createDto.id_sessao, deletado: false } }),
      this.ambientesRepository.findOne({ where: { id: createDto.id_ambiente, deletado: false } }),
      this.itensAmbienteRepository.findOne({ where: { id: createDto.id_item_ambiente, deletado: false } }),
      this.colaboradoresRepository.findOne({ where: { id: createDto.id_colaborador, deletado: false } }),
      createDto.id_alocacao_legado
        ? this.alocacoesLegadoRepository.findOne({ where: { id: createDto.id_alocacao_legado, deletado: false } })
        : Promise.resolve(null),
    ]);

    if (!sessao) {
      throw new NotFoundException(`Sessao ${createDto.id_sessao} nao encontrada`);
    }

    if (!ambiente) {
      throw new NotFoundException(`Ambiente ${createDto.id_ambiente} nao encontrado`);
    }

    if (!itemAmbiente) {
      throw new NotFoundException(`Item de ambiente ${createDto.id_item_ambiente} nao encontrado`);
    }

    if (!colaborador) {
      throw new NotFoundException(`Colaborador ${createDto.id_colaborador} nao encontrado`);
    }

    if (itemAmbiente.id_ambiente !== createDto.id_ambiente) {
      throw new BadRequestException('Item de ambiente nao pertence ao ambiente informado');
    }

    if (createDto.id_alocacao_legado && !alocacaoLegado) {
      throw new NotFoundException(`Alocacao legado ${createDto.id_alocacao_legado} nao encontrada`);
    }

    const alocacaoAtivaMesmoColaborador = await this.alocacoesItensRepository.findOne({
      where: {
        id_colaborador: createDto.id_colaborador,
        status: StatusAlocacaoItemEnum.EM_ANDAMENTO,
        deletado: false,
      },
      relations: ['item_ambiente', 'ambiente'],
    });

    if (alocacaoAtivaMesmoColaborador) {
      throw new ConflictException({
        message: 'Colaborador ja possui alocacao por item em andamento',
        codigo: 'COLABORADOR_EM_CONFLITO_OPERACIONAL',
        alocacao_ativa: {
          id: alocacaoAtivaMesmoColaborador.id,
          id_item_ambiente: alocacaoAtivaMesmoColaborador.id_item_ambiente,
          id_ambiente: alocacaoAtivaMesmoColaborador.id_ambiente,
        },
      });
    }

    const alocacaoAtivaLegadoMesmoColaborador = await this.alocacoesLegadoRepository.findOne({
      where: {
        id_colaborador: createDto.id_colaborador,
        status: 'EM_ANDAMENTO' as any,
        deletado: false,
      },
    });

    if (alocacaoAtivaLegadoMesmoColaborador) {
      throw new ConflictException({
        message: 'Colaborador ja possui alocacao legado em andamento',
        codigo: 'COLABORADOR_EM_CONFLITO_OPERACIONAL',
        alocacao_legado_ativa: {
          id: alocacaoAtivaLegadoMesmoColaborador.id,
          id_ambiente: alocacaoAtivaLegadoMesmoColaborador.id_ambiente,
          id_item_ambiente: alocacaoAtivaLegadoMesmoColaborador.id_item_ambiente,
        },
      });
    }

    const entidade = this.alocacoesItensRepository.create({
      ...createDto,
      hora_inicio: createDto.hora_inicio ? new Date(createDto.hora_inicio) : new Date(),
    });

    return this.alocacoesItensRepository.save(entidade);
  }

  async findAll(): Promise<AlocacaoItem[]> {
    return this.alocacoesItensRepository.find({
      where: { deletado: false },
      relations: ['sessao', 'ambiente', 'item_ambiente', 'colaborador', 'alocacao_legado'],
      order: { created_at: 'DESC' },
    });
  }

  async findBySessao(id_sessao: string): Promise<AlocacaoItem[]> {
    return this.alocacoesItensRepository.find({
      where: { id_sessao, deletado: false },
      relations: ['ambiente', 'item_ambiente', 'colaborador'],
      order: { created_at: 'DESC' },
    });
  }

  async findByItem(id_item_ambiente: string): Promise<AlocacaoItem[]> {
    return this.alocacoesItensRepository.find({
      where: { id_item_ambiente, deletado: false },
      relations: ['sessao', 'colaborador'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<AlocacaoItem> {
    const record = await this.alocacoesItensRepository.findOne({
      where: { id, deletado: false },
      relations: ['sessao', 'ambiente', 'item_ambiente', 'colaborador', 'alocacao_legado'],
    });
    if (!record) {
      throw new NotFoundException(`Alocacao por item ${id} nao encontrada`);
    }
    return record;
  }

  async concluir(id: string, dto: ConcluirAlocacaoItemDto): Promise<AlocacaoItem> {
    const record = await this.findOne(id);
    if (record.status === StatusAlocacaoItemEnum.CONCLUIDO) {
      throw new BadRequestException('Alocacao por item ja esta concluida');
    }
    record.status = StatusAlocacaoItemEnum.CONCLUIDO;
    record.hora_fim = dto.hora_fim ? new Date(dto.hora_fim) : new Date();
    if (dto.observacoes) {
      record.observacoes = dto.observacoes;
    }
    return this.alocacoesItensRepository.save(record);
  }

  async remove(id: string): Promise<void> {
    const record = await this.findOne(id);
    record.deletado = true;
    await this.alocacoesItensRepository.save(record);
  }
}
