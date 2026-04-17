import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from './entities/cliente.entity';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private readonly clientesRepository: Repository<Cliente>,
  ) {}

  async criar(dto: CreateClienteDto): Promise<Cliente> {
    const cliente = this.clientesRepository.create(dto);
    return this.clientesRepository.save(cliente);
  }

  async listar(): Promise<Cliente[]> {
    return this.clientesRepository.find({ where: { deletado: false } });
  }

  async buscarPorId(id: string): Promise<Cliente> {
    const cliente = await this.clientesRepository.findOne({ where: { id, deletado: false } });
    if (!cliente) throw new NotFoundException('Cliente não encontrado');
    return cliente;
  }

  async atualizar(id: string, dto: UpdateClienteDto): Promise<Cliente> {
    const cliente = await this.buscarPorId(id);
    Object.assign(cliente, dto);
    return this.clientesRepository.save(cliente);
  }

  async remover(id: string): Promise<void> {
    const cliente = await this.buscarPorId(id);
    cliente.deletado = true;
    await this.clientesRepository.save(cliente);
  }
}
