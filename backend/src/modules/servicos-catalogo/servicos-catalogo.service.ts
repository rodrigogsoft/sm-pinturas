import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServicoCatalogo } from './entities/servico-catalogo.entity';
import { CreateServicoCatalogoDto } from './dto/create-servico-catalogo.dto';
import { UpdateServicoCatalogoDto } from './dto/update-servico-catalogo.dto';

@Injectable()
export class ServicosCatalogoService {
  constructor(
    @InjectRepository(ServicoCatalogo)
    private readonly servicosRepository: Repository<ServicoCatalogo>,
  ) {}

  async criar(dto: CreateServicoCatalogoDto): Promise<ServicoCatalogo> {
    const servico = this.servicosRepository.create(dto);
    return this.servicosRepository.save(servico);
  }

  async listar(): Promise<ServicoCatalogo[]> {
    return this.servicosRepository.find({ where: { deletado: false } });
  }

  async buscarPorId(id: number): Promise<ServicoCatalogo> {
    const servico = await this.servicosRepository.findOne({ where: { id, deletado: false } });
    if (!servico) throw new NotFoundException('Serviço não encontrado');
    return servico;
  }

  async atualizar(id: number, dto: UpdateServicoCatalogoDto): Promise<ServicoCatalogo> {
    const servico = await this.buscarPorId(id);
    Object.assign(servico, dto);
    return this.servicosRepository.save(servico);
  }

  async remover(id: number): Promise<void> {
    const servico = await this.buscarPorId(id);
    servico.deletado = true;
    await this.servicosRepository.save(servico);
  }
}
