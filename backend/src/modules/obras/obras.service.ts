import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Obra } from './entities/obra.entity';
import { CreateObraDto } from './dto/create-obra.dto';
import { UpdateObraDto } from './dto/update-obra.dto';

@Injectable()
export class ObrasService {
  constructor(
    @InjectRepository(Obra)
    private readonly obrasRepository: Repository<Obra>,
  ) {}

  async criar(dto: CreateObraDto): Promise<Obra> {
    const obra = this.obrasRepository.create(dto);
    return this.obrasRepository.save(obra);
  }

  async listar(): Promise<Obra[]> {
    return this.obrasRepository
      .createQueryBuilder('obra')
      .leftJoinAndSelect('obra.cliente', 'cliente')
      .where('obra.deletado = :deletado', { deletado: false })
      .getMany();
  }

  async buscarPorId(id: string): Promise<Obra> {
    const obra = await this.obrasRepository
      .createQueryBuilder('obra')
      .leftJoinAndSelect('obra.cliente', 'cliente')
      .where('obra.id = :id', { id })
      .andWhere('obra.deletado = :deletado', { deletado: false })
      .getOne();
    if (!obra) throw new NotFoundException('Obra não encontrada');
    return obra;
  }

  async atualizar(id: string, dto: UpdateObraDto): Promise<Obra> {
    const obra = await this.buscarPorId(id);
    Object.assign(obra, dto);
    return this.obrasRepository.save(obra);
  }

  async remover(id: string): Promise<void> {
    const obra = await this.buscarPorId(id);
    obra.deletado = true;
    await this.obrasRepository.save(obra);
  }
}
