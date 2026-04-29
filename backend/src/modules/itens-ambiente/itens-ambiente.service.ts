import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, QueryFailedError, Repository } from 'typeorm';
import { ItemAmbiente } from './entities/item-ambiente.entity';
import { CreateItemAmbienteDto } from './dto/create-item-ambiente.dto';
import { CreateItensAmbienteLoteDto } from './dto/create-itens-ambiente-lote.dto';
import { UpdateItemAmbienteDto } from './dto/update-item-ambiente.dto';
import { Ambiente } from '../pavimentos/entities/pavimento.entity';
import { TabelaPreco } from '../precos/entities/tabela-preco.entity';

@Injectable()
export class ItensAmbienteService {
  constructor(
    @InjectRepository(ItemAmbiente)
    private itensAmbienteRepository: Repository<ItemAmbiente>,
    @InjectRepository(Ambiente)
    private ambientesRepository: Repository<Ambiente>,
    @InjectRepository(TabelaPreco)
    private tabelaPrecosRepository: Repository<TabelaPreco>,
  ) {}

  private handleSchemaDriftError(error: unknown): never {
    if (error instanceof QueryFailedError) {
      const message = String((error as any)?.message || '').toLowerCase();
      const isIdTabelaPrecoNotNullError =
        message.includes('id_tabela_preco') &&
        (message.includes('not-null') || message.includes('null value in column'));

      if (isIdTabelaPrecoNotNullError) {
        throw new BadRequestException(
          'Banco desatualizado para ERS 4.1: a coluna tb_itens_ambiente.id_tabela_preco ainda está NOT NULL. Execute a migration que torna essa coluna opcional e tente novamente.',
        );
      }
    }

    throw error;
  }

  async create(createItemAmbienteDto: CreateItemAmbienteDto): Promise<ItemAmbiente> {
    const ambiente = await this.ambientesRepository.findOne({
      where: { id: createItemAmbienteDto.id_ambiente, deletado: false },
    });

    if (!ambiente) {
      throw new NotFoundException(
        `Ambiente com ID ${createItemAmbienteDto.id_ambiente} não encontrado`,
      );
    }

    // id_tabela_preco é opcional no ERS 4.1 (tipo de serviço definido na alocação)
    if (createItemAmbienteDto.id_tabela_preco) {
      const tabelaPreco = await this.tabelaPrecosRepository.findOne({
        where: { id: createItemAmbienteDto.id_tabela_preco, deletado: false },
      });

      if (!tabelaPreco) {
        throw new NotFoundException(
          `Tabela de preço com ID ${createItemAmbienteDto.id_tabela_preco} não encontrada`,
        );
      }
    }

    const itemAmbiente = this.itensAmbienteRepository.create(createItemAmbienteDto);

    try {
      return await this.itensAmbienteRepository.save(itemAmbiente);
    } catch (error) {
      this.handleSchemaDriftError(error);
    }
  }

  // RF21: Criação em lote de elementos de serviço sem tipo de serviço (ERS 4.1)
  async createLote(dto: CreateItensAmbienteLoteDto): Promise<{ criados: ItemAmbiente[]; erros: string[] }> {
    const ambienteBase = await this.ambientesRepository.findOne({
      where: { id: dto.id_ambiente, deletado: false },
      relations: ['pavimento'],
    });

    if (!ambienteBase) {
      throw new NotFoundException(`Ambiente com ID ${dto.id_ambiente} não encontrado`);
    }

    const idsAmbientesAlvo = [...new Set([dto.id_ambiente, ...(dto.id_ambientes ?? [])])];
    const ambientesAlvo = await this.ambientesRepository.find({
      where: { id: In(idsAmbientesAlvo), deletado: false },
      relations: ['pavimento'],
    });

    if (ambientesAlvo.length !== idsAmbientesAlvo.length) {
      const encontrados = new Set(ambientesAlvo.map((ambiente) => ambiente.id));
      const faltantes = idsAmbientesAlvo.filter((id) => !encontrados.has(id));
      throw new NotFoundException(`Ambiente(s) não encontrado(s): ${faltantes.join(', ')}`);
    }

    const mesmaObra = ambientesAlvo.every(
      (ambiente) => ambiente.pavimento?.id_obra === ambienteBase.pavimento?.id_obra,
    );
    if (!mesmaObra) {
      throw new BadRequestException(
        'Todos os ambientes do lote devem pertencer à mesma obra do ambiente selecionado.',
      );
    }

    // Verificar duplicidade de nomes dentro do lote
    const nomesNoLote = dto.itens.map((i) => i.nome_elemento.trim().toLowerCase());
    const duplicatasNoLote = nomesNoLote.filter((n, idx) => nomesNoLote.indexOf(n) !== idx);
    if (duplicatasNoLote.length > 0) {
      throw new BadRequestException(
        `Nomes duplicados no lote: ${[...new Set(duplicatasNoLote)].join(', ')}`,
      );
    }

    const erros: string[] = [];
    const existentes = await this.itensAmbienteRepository.find({
      where: { id_ambiente: In(idsAmbientesAlvo), deletado: false },
    });
    const nomesExistentesPorAmbiente = new Map<string, Set<string>>();

    for (const existente of existentes) {
      if (!existente.nome_elemento) {
        continue;
      }

      const nomeNormalizado = existente.nome_elemento.trim().toLowerCase();
      if (!nomesExistentesPorAmbiente.has(existente.id_ambiente)) {
        nomesExistentesPorAmbiente.set(existente.id_ambiente, new Set<string>());
      }
      nomesExistentesPorAmbiente.get(existente.id_ambiente)!.add(nomeNormalizado);
    }

    const entidades = ambientesAlvo.flatMap((ambiente) => {
      const nomesExistentes = nomesExistentesPorAmbiente.get(ambiente.id) ?? new Set<string>();
      return dto.itens.flatMap((item) => {
        const nomeTrimado = item.nome_elemento.trim();
        const nomeNormalizado = nomeTrimado.toLowerCase();

        if (nomesExistentes.has(nomeNormalizado)) {
          erros.push(`"${nomeTrimado}" já existe no ambiente ${ambiente.nome}`);
          return [];
        }

        nomesExistentes.add(nomeNormalizado);
        nomesExistentesPorAmbiente.set(ambiente.id, nomesExistentes);

        return this.itensAmbienteRepository.create({
          id_ambiente: ambiente.id,
          nome_elemento: nomeTrimado,
          area_planejada: item.area_planejada,
        });
      });
    });

    if (entidades.length === 0) {
      throw new BadRequestException(
        `Nenhum elemento pode ser criado: ${erros.join('; ')}`,
      );
    }

    try {
      const criados = await this.itensAmbienteRepository.save(entidades);
      return { criados, erros };
    } catch (error) {
      this.handleSchemaDriftError(error);
    }
  }

  async findAll(): Promise<ItemAmbiente[]> {
    return this.itensAmbienteRepository.find({
      where: { deletado: false },
      relations: ['ambiente', 'ambiente.pavimento', 'tabelaPreco'],
    });
  }

  async findByAmbiente(id_ambiente: string): Promise<ItemAmbiente[]> {
    // Validar se ambiente existe
    const ambiente = await this.ambientesRepository.findOne({
      where: { id: id_ambiente, deletado: false },
    });

    if (!ambiente) {
      throw new NotFoundException(
        `Ambiente com ID ${id_ambiente} não encontrado`,
      );
    }

    return this.itensAmbienteRepository.find({
      where: { id_ambiente, deletado: false },
      relations: ['ambiente', 'ambiente.pavimento', 'tabelaPreco'],
    });
  }

  async findByObra(id_obra: string): Promise<ItemAmbiente[]> {
    // Buscar todos os ambientes da obra (via pavimentos)
    const query = this.itensAmbienteRepository
      .createQueryBuilder('ia')
      .leftJoinAndSelect('ia.ambiente', 'amb')
      .leftJoinAndSelect('amb.pavimento', 'pav')
      .leftJoinAndSelect('ia.tabelaPreco', 'tp')
      .where('pav.id_obra = :id_obra', { id_obra })
      .andWhere('ia.deletado = false');

    return query.getMany();
  }

  async findByPavimento(id_pavimento: string): Promise<ItemAmbiente[]> {
    // Buscar todos os ambientes de um pavimento
    const query = this.itensAmbienteRepository
      .createQueryBuilder('ia')
      .leftJoinAndSelect('ia.ambiente', 'amb')
      .leftJoinAndSelect('amb.pavimento', 'pav')
      .leftJoinAndSelect('ia.tabelaPreco', 'tp')
      .where('amb.id_pavimento = :id_pavimento', { id_pavimento })
      .andWhere('ia.deletado = false');

    return query.getMany();
  }

  async findOne(id: string): Promise<ItemAmbiente> {
    const itemAmbiente = await this.itensAmbienteRepository.findOne({
      where: { id, deletado: false },
      relations: ['ambiente', 'ambiente.pavimento', 'tabelaPreco'],
    });

    if (!itemAmbiente) {
      throw new NotFoundException(`Item de Ambiente com ID ${id} não encontrado`);
    }

    return itemAmbiente;
  }

  async update(
    id: string,
    updateItemAmbienteDto: UpdateItemAmbienteDto,
  ): Promise<ItemAmbiente> {
    const itemAmbiente = await this.findOne(id);

    if (updateItemAmbienteDto.nome_elemento !== undefined) {
      itemAmbiente.nome_elemento = updateItemAmbienteDto.nome_elemento;
    }

    if (updateItemAmbienteDto.area_planejada !== undefined) {
      itemAmbiente.area_planejada = updateItemAmbienteDto.area_planejada;
    }

    return this.itensAmbienteRepository.save(itemAmbiente);
  }

  async remove(id: string): Promise<{ message: string }> {
    const itemAmbiente = await this.findOne(id);
    itemAmbiente.deletado = true;
    await this.itensAmbienteRepository.save(itemAmbiente);
    return { message: `Item de Ambiente ${id} deletado com sucesso` };
  }

  async verifyExists(id: string): Promise<ItemAmbiente> {
    const itemAmbiente = await this.itensAmbienteRepository.findOne({
      where: { id, deletado: false },
    });

    if (!itemAmbiente) {
      throw new NotFoundException(`Item de Ambiente com ID ${id} não encontrado`);
    }

    return itemAmbiente;
  }
}
