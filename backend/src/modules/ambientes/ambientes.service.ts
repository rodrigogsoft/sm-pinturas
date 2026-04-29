import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Ambiente, Pavimento } from '../pavimentos/entities/pavimento.entity';
import { CreateAmbienteDto } from './dto/create-ambiente.dto';
import { UpdateAmbienteDto } from './dto/update-ambiente.dto';
import {
  CreateAmbientesLoteDto,
  TipoAmbienteDto,
  CategoriaAmbienteEnum,
  ModoConflitoEnum,
} from './dto/create-ambientes-lote.dto';

@Injectable()
export class AmbientesService {
  constructor(
    @InjectRepository(Ambiente)
    private ambientesRepository: Repository<Ambiente>,
    @InjectRepository(Pavimento)
    private pavimentosRepository: Repository<Pavimento>,
  ) {}

  async create(createAmbienteDto: CreateAmbienteDto): Promise<Ambiente> {
    // Validar se pavimento existe
    const pavimento = await this.pavimentosRepository.findOne({
      where: { id: createAmbienteDto.id_pavimento, deletado: false },
    });

    if (!pavimento) {
      throw new NotFoundException(
        `Pavimento com ID ${createAmbienteDto.id_pavimento} não encontrado`,
      );
    }

    const ambiente = this.ambientesRepository.create(createAmbienteDto);
    return this.ambientesRepository.save(ambiente);
  }

  async findAll(): Promise<Ambiente[]> {
    return this.ambientesRepository.find({
      where: { deletado: false },
      relations: ['pavimento', 'pavimento.obra'],
      order: { nome: 'ASC' },
    });
  }

  async findByPavimento(id_pavimento: string): Promise<Ambiente[]> {
    // Validar se pavimento existe
    const pavimento = await this.pavimentosRepository.findOne({
      where: { id: id_pavimento, deletado: false },
    });

    if (!pavimento) {
      throw new NotFoundException(
        `Pavimento com ID ${id_pavimento} não encontrado`,
      );
    }

    return this.ambientesRepository.find({
      where: { id_pavimento, deletado: false },
      order: { nome: 'ASC' },
    });
  }

  async findByObra(id_obra: string): Promise<Ambiente[]> {
    // Buscar todos os pavimentos da obra
    const pavimentos = await this.pavimentosRepository.find({
      where: { id_obra, deletado: false },
    });

    // Se não houver pavimentos, retornar array vazio (não é erro)
    if (pavimentos.length === 0) {
      return [];
    }

    const pavimentoIds = pavimentos.map((p) => p.id);

    return this.ambientesRepository.find({
      where: pavimentoIds.map((id) => ({ id_pavimento: id, deletado: false })),
      relations: ['pavimento'],
      order: { nome: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Ambiente> {
    const ambiente = await this.ambientesRepository.findOne({
      where: { id, deletado: false },
      relations: ['pavimento', 'pavimento.obra'],
    });

    if (!ambiente) {
      throw new NotFoundException(`Ambiente com ID ${id} não encontrado`);
    }

    return ambiente;
  }

  async update(
    id: string,
    updateAmbienteDto: UpdateAmbienteDto,
  ): Promise<Ambiente> {
    const ambiente = await this.findOne(id);

    if (updateAmbienteDto.nome !== undefined) {
      ambiente.nome = updateAmbienteDto.nome;
    }

    if (updateAmbienteDto.area_m2 !== undefined) {
      ambiente.area_m2 = updateAmbienteDto.area_m2;
    }

    if (updateAmbienteDto.descricao !== undefined) {
      ambiente.descricao = updateAmbienteDto.descricao;
    }

    return this.ambientesRepository.save(ambiente);
  }

  async remove(id: string): Promise<{ message: string }> {
    const ambiente = await this.findOne(id);
    ambiente.deletado = true;
    await this.ambientesRepository.save(ambiente);
    return { message: `Ambiente ${id} deletado com sucesso` };
  }

  // Método auxiliar para verificar se ambiente existe
  async verifyAmbienteExists(id: string): Promise<Ambiente> {
    const ambiente = await this.ambientesRepository.findOne({
      where: { id, deletado: false },
    });

    if (!ambiente) {
      throw new NotFoundException(`Ambiente com ID ${id} não encontrado`);
    }

    return ambiente;
  }

  async createLote(
    dto: CreateAmbientesLoteDto,
  ): Promise<{ criados: number; pulados: number; conflitos: string[] }> {
    const { obraId, pavimentoIds, tipos, modoConflito = ModoConflitoEnum.SKIP } = dto;

    // Validar que tipos COMUM têm nomeBase
    for (const tipo of tipos) {
      if (
        tipo.categoria === CategoriaAmbienteEnum.COMUM &&
        !tipo.nomeBase?.trim()
      ) {
        throw new BadRequestException(
          'nomeBase é obrigatório para tipos COMUM',
        );
      }
    }

    // Carregar pavimentos validando que pertencem à obra
    const pavimentos = await this.pavimentosRepository.find({
      where: { id: In(pavimentoIds), id_obra: obraId, deletado: false },
    });

    if (pavimentos.length !== pavimentoIds.length) {
      const foundIds = new Set(pavimentos.map((p) => p.id));
      const invalidos = pavimentoIds.filter((id) => !foundIds.has(id));
      throw new NotFoundException(
        `Pavimentos não encontrados ou não pertencem à obra: ${invalidos.join(', ')}`,
      );
    }

    // Buscar ambientes já existentes em todos os pavimentos selecionados
    const existingAmbientes = await this.ambientesRepository.find({
      where: pavimentoIds.map((id) => ({ id_pavimento: id, deletado: false })),
      select: ['id_pavimento', 'nome'],
    });

    // Mapa: pavimentoId -> Set<nome em lower-case>
    const existingMap = new Map<string, Set<string>>();
    for (const a of existingAmbientes) {
      if (!existingMap.has(a.id_pavimento)) {
        existingMap.set(a.id_pavimento, new Set());
      }
      existingMap.get(a.id_pavimento)!.add(a.nome.toLowerCase());
    }
    // Garantir entrada no mapa para pavimentos sem ambientes ainda
    for (const pav of pavimentos) {
      if (!existingMap.has(pav.id)) {
        existingMap.set(pav.id, new Set());
      }
    }

    const toCreate: Partial<Ambiente>[] = [];
    const conflitos: string[] = [];
    let pulados = 0;

    for (const pav of pavimentos) {
      const existing = existingMap.get(pav.id)!;

      for (const tipo of tipos) {
        const nomes = this.gerarNomesAmbiente(tipo, pav);

        for (const { nome, areaM2 } of nomes) {
          const key = nome.toLowerCase();

          if (existing.has(key)) {
            if (modoConflito === ModoConflitoEnum.FAIL) {
              throw new ConflictException(
                `Ambiente "${nome}" já existe no pavimento "${pav.nome}"`,
              );
            }
            // SKIP
            conflitos.push(`${pav.nome} / ${nome}`);
            pulados++;
          } else {
            toCreate.push({
              id_pavimento: pav.id,
              nome,
              area_m2: areaM2,
              deletado: false,
            });
            // Previne duplicatas dentro do mesmo lote
            existing.add(key);
          }
        }
      }
    }

    if (toCreate.length > 0) {
      const entities = this.ambientesRepository.create(
        toCreate as Ambiente[],
      );
      await this.ambientesRepository.save(entities);
    }

    return { criados: toCreate.length, pulados, conflitos };
  }

  private gerarNomesAmbiente(
    tipo: TipoAmbienteDto,
    pav: Pavimento,
  ): Array<{ nome: string; areaM2: number }> {
    const result: Array<{ nome: string; areaM2: number }> = [];

    if (tipo.categoria === CategoriaAmbienteEnum.APARTAMENTO) {
      // Não gera em subsolo (nivel < 0) nem em cobertura
      if (pav.nivel === null || pav.nivel === undefined || pav.nivel < 0 || pav.is_cobertura) {
        return [];
      }
      for (let i = 1; i <= tipo.qtdPorPavimento; i++) {
        const suffix = String(i).padStart(2, '0');
        const codigo = `${pav.nivel}${suffix}`;
        result.push({ nome: `Apto ${codigo}`, areaM2: tipo.areaM2 });
      }
    } else {
      // COMUM — gera em qualquer pavimento selecionado
      // Append nome do pavimento ao nome base para identifiação única
      // Ex: "Hall" + "1º Andar" = "Hall 1º Andar"
      const base = tipo.nomeBase!;
      if (tipo.qtdPorPavimento === 1) {
        result.push({ nome: `${base} ${pav.nome}`, areaM2: tipo.areaM2 });
      } else {
        for (let i = 1; i <= tipo.qtdPorPavimento; i++) {
          result.push({ nome: `${base} ${i} ${pav.nome}`, areaM2: tipo.areaM2 });
        }
      }
    }

    return result;
  }
}
