import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Colaborador } from './entities/colaborador.entity';
import { CreateColaboradorDto } from './dto/create-colaborador.dto';
import { UpdateColaboradorDto } from './dto/update-colaborador.dto';

@Injectable()
export class ColaboradoresService {
  constructor(
    @InjectRepository(Colaborador)
    private readonly colaboradoresRepository: Repository<Colaborador>,
  ) {}

  async criar(dto: CreateColaboradorDto): Promise<Colaborador> {
    const colaborador = this.colaboradoresRepository.create(dto);
    return this.colaboradoresRepository.save(colaborador);
  }

  async listar(): Promise<Colaborador[]> {
    return this.colaboradoresRepository.find({ where: { deletado: false } });
  }

  async buscarPorId(id: string): Promise<Colaborador> {
    const colaborador = await this.colaboradoresRepository.findOne({ where: { id, deletado: false } });
    if (!colaborador) throw new NotFoundException('Colaborador não encontrado');
    return colaborador;
  }

  async atualizar(id: string, dto: UpdateColaboradorDto): Promise<Colaborador> {
    const colaborador = await this.buscarPorId(id);
    Object.assign(colaborador, dto);
    return this.colaboradoresRepository.save(colaborador);
  }

  async remover(id: string): Promise<void> {
    const colaborador = await this.buscarPorId(id);
    colaborador.deletado = true;
    await this.colaboradoresRepository.save(colaborador);
  }
}
