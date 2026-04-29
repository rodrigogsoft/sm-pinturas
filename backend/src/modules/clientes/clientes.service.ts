import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from './entities/cliente.entity';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
  ) {}

  async create(createClienteDto: CreateClienteDto): Promise<Cliente> {
    // Verificar se CNPJ já existe
    const existing = await this.clienteRepository.findOne({
      where: { cnpj_nif: createClienteDto.cnpj_nif, deletado: false },
    });

    if (existing) {
      throw new ConflictException('CNPJ/NIF já cadastrado');
    }

    const cliente = this.clienteRepository.create(createClienteDto);
    return this.clienteRepository.save(cliente);
  }

  async findAll(): Promise<Cliente[]> {
    return this.clienteRepository.find({
      where: { deletado: false },
      order: { razao_social: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Cliente> {
    const cliente = await this.clienteRepository.findOne({
      where: { id, deletado: false },
    });

    if (!cliente) {
      throw new NotFoundException(`Cliente com ID ${id} não encontrado`);
    }

    return cliente;
  }

  async update(
    id: string,
    updateClienteDto: UpdateClienteDto,
  ): Promise<Cliente> {
    const cliente = await this.findOne(id);

    // Se alterando CNPJ, verificar duplicação
    if (
      updateClienteDto.cnpj_nif &&
      updateClienteDto.cnpj_nif !== cliente.cnpj_nif
    ) {
      const existing = await this.clienteRepository.findOne({
        where: { cnpj_nif: updateClienteDto.cnpj_nif, deletado: false },
      });

      if (existing) {
        throw new ConflictException('CNPJ/NIF já cadastrado');
      }
    }

    Object.assign(cliente, updateClienteDto);
    return this.clienteRepository.save(cliente);
  }

  async remove(id: string): Promise<void> {
    const cliente = await this.findOne(id);
    cliente.deletado = true;
    await this.clienteRepository.save(cliente);
  }
}
