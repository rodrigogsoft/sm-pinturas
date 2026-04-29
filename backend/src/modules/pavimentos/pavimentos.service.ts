import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pavimento } from './entities/pavimento.entity';
import { CreatePavimentoDto } from './dto/create-pavimento.dto';
import { UpdatePavimentoDto } from './dto/update-pavimento.dto';
import { CreatePavimentosLoteDto } from './dto/create-pavimentos-lote.dto';
import { Obra } from '../obras/entities/obra.entity';

@Injectable()
export class PavimentosService {
  constructor(
    @InjectRepository(Pavimento)
    private pavimentosRepository: Repository<Pavimento>,
    @InjectRepository(Obra)
    private obrasRepository: Repository<Obra>,
  ) {}

  async create(createPavimentoDto: CreatePavimentoDto): Promise<Pavimento> {
    // Validar se obra existe
    const obra = await this.obrasRepository.findOne({
      where: { id: createPavimentoDto.id_obra, deletado: false },
    });

    if (!obra) {
      throw new NotFoundException(
        `Obra com ID ${createPavimentoDto.id_obra} não encontrada`,
      );
    }

    const pavimento = this.pavimentosRepository.create(createPavimentoDto);
    return this.pavimentosRepository.save(pavimento);
  }

  async findAll(): Promise<Pavimento[]> {
    return this.pavimentosRepository.find({
      where: { deletado: false },
      relations: ['obra', 'ambientes'],
      order: { ordem: 'ASC' },
    });
  }

  async findByObra(id_obra: string): Promise<Pavimento[]> {
    // Validar se obra existe
    const obra = await this.obrasRepository.findOne({
      where: { id: id_obra, deletado: false },
    });

    if (!obra) {
      throw new NotFoundException(`Obra com ID ${id_obra} não encontrada`);
    }

    return this.pavimentosRepository.find({
      where: { id_obra, deletado: false },
      relations: ['ambientes'],
      order: { ordem: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Pavimento> {
    const pavimento = await this.pavimentosRepository.findOne({
      where: { id, deletado: false },
      relations: ['obra', 'ambientes'],
    });

    if (!pavimento) {
      throw new NotFoundException(`Pavimento com ID ${id} não encontrado`);
    }

    return pavimento;
  }

  async update(
    id: string,
    updatePavimentoDto: UpdatePavimentoDto,
  ): Promise<Pavimento> {
    const pavimento = await this.findOne(id);

    if (updatePavimentoDto.nome !== undefined) {
      pavimento.nome = updatePavimentoDto.nome;
    }

    if (updatePavimentoDto.ordem !== undefined) {
      pavimento.ordem = updatePavimentoDto.ordem;
    }

    return this.pavimentosRepository.save(pavimento);
  }

  async remove(id: string): Promise<{ message: string }> {
    const pavimento = await this.findOne(id);
    pavimento.deletado = true;
    await this.pavimentosRepository.save(pavimento);
    return { message: `Pavimento ${id} deletado com sucesso` };
  }

  // Método auxiliar para verificar se pavimento existe
  async verifyPavimentoExists(id: string): Promise<Pavimento> {
    const pavimento = await this.pavimentosRepository.findOne({
      where: { id, deletado: false },
    });

    if (!pavimento) {
      throw new NotFoundException(`Pavimento com ID ${id} não encontrado`);
    }

    return pavimento;
  }

  async createLote(dto: CreatePavimentosLoteDto): Promise<Pavimento[]> {
    const obra = await this.obrasRepository.findOne({
      where: { id: dto.obraId, deletado: false },
    });
    if (!obra) throw new NotFoundException(`Obra com ID ${dto.obraId} não encontrada`);

    // temSubsolo força temTerreo
    const temTerreo = dto.temSubsolo ? true : dto.temTerreo;
    const { temCobertura, qtdPavimentosAcima } = dto;

    if (dto.temSubsolo && (!dto.qtdSubsolos || dto.qtdSubsolos < 1)) {
      throw new BadRequestException('qtdSubsolos deve ser >= 1 quando temSubsolo = true');
    }

    if (temTerreo && temCobertura && qtdPavimentosAcima < 2) {
      throw new BadRequestException(
        'qtdPavimentosAcima deve ser >= 2 quando há térreo E cobertura',
      );
    }

    const middleCount =
      qtdPavimentosAcima - (temTerreo ? 1 : 0) - (temCobertura ? 1 : 0);

    if (middleCount < 0) {
      throw new BadRequestException(
        `qtdPavimentosAcima (${qtdPavimentosAcima}) é insuficiente para acomodar térreo e cobertura`,
      );
    }

    const itens: Partial<Pavimento>[] = [];
    let ordem = 1;

    // Subsolos: de baixo para cima — "Nº Subsolo" ... "1º Subsolo"
    if (dto.temSubsolo && dto.qtdSubsolos) {
      for (let n = dto.qtdSubsolos; n >= 1; n--) {
        itens.push({
          id_obra: dto.obraId,
          nome: `${n}\u00ba Subsolo`,
          nivel: -n,
          is_cobertura: false,
          ordem: ordem++,
        });
      }
    }

    // Térreo
    if (temTerreo) {
      itens.push({
        id_obra: dto.obraId,
        nome: 'T\u00e9rreo',
        nivel: 0,
        is_cobertura: false,
        ordem: ordem++,
      });
    }

    // Andares intermediários
    for (let a = 1; a <= middleCount; a++) {
      itens.push({
        id_obra: dto.obraId,
        nome: `${a}\u00ba Andar`,
        nivel: a,
        is_cobertura: false,
        ordem: ordem++,
      });
    }

    // Cobertura
    if (temCobertura) {
      itens.push({
        id_obra: dto.obraId,
        nome: 'Cobertura',
        nivel: middleCount + 1,
        is_cobertura: true,
        ordem: ordem++,
      });
    }

    const entities = this.pavimentosRepository.create(itens as Pavimento[]);
    return this.pavimentosRepository.save(entities);
  }
}
