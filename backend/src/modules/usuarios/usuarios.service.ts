import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from './entities/usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuariosRepository: Repository<Usuario>,
  ) {}

  async criar(dto: CreateUsuarioDto): Promise<Usuario> {
    const senhaHash = await bcrypt.hash(dto.senha, 10);
    const usuario = this.usuariosRepository.create({ ...dto, senha: senhaHash });
    return this.usuariosRepository.save(usuario);
  }

  async listar(): Promise<Usuario[]> {
    return this.usuariosRepository.find({ where: { deletado: false } });
  }

  async buscarPorId(id: string): Promise<Usuario> {
    const usuario = await this.usuariosRepository.findOne({ where: { id, deletado: false } });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');
    return usuario;
  }

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    return this.usuariosRepository.findOne({ where: { email, deletado: false } });
  }

  async atualizar(id: string, dto: UpdateUsuarioDto): Promise<Usuario> {
    const usuario = await this.buscarPorId(id);
    if (dto.senha) {
      dto.senha = await bcrypt.hash(dto.senha, 10);
    }
    Object.assign(usuario, dto);
    return this.usuariosRepository.save(usuario);
  }

  async remover(id: string): Promise<void> {
    const usuario = await this.buscarPorId(id);
    usuario.deletado = true;
    await this.usuariosRepository.save(usuario);
  }
}
