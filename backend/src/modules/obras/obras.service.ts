import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Obra } from './entities/obra.entity';
import { Pavimento, Ambiente } from '../pavimentos/entities/pavimento.entity';
import { CreateObraDto } from './dto/create-obra.dto';
import { UpdateObraDto } from './dto/update-obra.dto';

@Injectable()
export class ObrasService {
  constructor(
    @InjectRepository(Obra)
    private obraRepository: Repository<Obra>,
    @InjectRepository(Pavimento)
    private pavimentoRepository: Repository<Pavimento>,
    @InjectRepository(Ambiente)
    private ambienteRepository: Repository<Ambiente>,
  ) {}

  async create(createObraDto: CreateObraDto): Promise<Obra> {
    const { pavimentos, ...obraData } = createObraDto;

    // Criar obra
    const obra = this.obraRepository.create(obraData);
    const savedObra = await this.obraRepository.save(obra);

    // Criar pavimentos se fornecidos
    if (pavimentos && pavimentos.length > 0) {
      for (const pavimentoDto of pavimentos) {
        const { ambientes, ...pavimentoData } = pavimentoDto;
        
        const pavimento = this.pavimentoRepository.create({
          ...pavimentoData,
          id_obra: savedObra.id,
        });
        const savedPavimento = await this.pavimentoRepository.save(pavimento);

        // Criar ambientes se fornecidos
        if (ambientes && ambientes.length > 0) {
          const ambientesEntities = ambientes.map((ambienteDto) =>
            this.ambienteRepository.create({
              ...ambienteDto,
              id_pavimento: savedPavimento.id,
            }),
          );
          await this.ambienteRepository.save(ambientesEntities);
        }
      }
    }

    return this.findOne(savedObra.id);
  }

  async findAll(): Promise<Obra[]> {
    return this.obraRepository.find({
      where: { deletado: false },
      relations: ['cliente', 'pavimentos', 'pavimentos.ambientes'],
      order: {
        created_at: 'DESC',
        pavimentos: {
          ordem: 'ASC',
          ambientes: {
            nome: 'ASC',
          },
        },
      },
    });
  }

  async findOne(id: string): Promise<Obra> {
    const obra = await this.obraRepository.findOne({
      where: { id, deletado: false },
      relations: ['cliente', 'pavimentos', 'pavimentos.ambientes'],
      order: {
        pavimentos: {
          ordem: 'ASC',
          ambientes: {
            nome: 'ASC',
          },
        },
      },
    });

    if (!obra) {
      throw new NotFoundException(`Obra com ID ${id} não encontrada`);
    }

    return obra;
  }

  async update(id: string, updateObraDto: UpdateObraDto): Promise<Obra> {
    const obra = await this.findOne(id);
    
    const { pavimentos, ...obraData } = updateObraDto;
    Object.assign(obra, obraData);
    await this.obraRepository.save(obra);

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const obra = await this.findOne(id);
    obra.deletado = true;
    await this.obraRepository.save(obra);
  }

  async addPavimento(
    obraId: string,
    nome: string,
    ordem: number,
  ): Promise<Pavimento> {
    await this.findOne(obraId); // Verificar se obra existe

    const pavimento = this.pavimentoRepository.create({
      id_obra: obraId,
      nome,
      ordem,
    });

    return this.pavimentoRepository.save(pavimento);
  }

  async addAmbiente(
    pavimentoId: string,
    nome: string,
    area_m2?: number,
    descricao?: string,
  ): Promise<Ambiente> {
    const pavimento = await this.pavimentoRepository.findOne({
      where: { id: pavimentoId, deletado: false },
    });

    if (!pavimento) {
      throw new NotFoundException(
        `Pavimento com ID ${pavimentoId} não encontrado`,
      );
    }

    const ambiente = this.ambienteRepository.create({
      id_pavimento: pavimentoId,
      nome,
      area_m2,
      descricao,
    });

    return this.ambienteRepository.save(ambiente);
  }
}
