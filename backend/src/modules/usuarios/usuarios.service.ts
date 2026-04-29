import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../auth/entities/usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
  ) {}

  async create(
    createUsuarioDto: CreateUsuarioDto,
    idCriador?: string,
  ): Promise<Usuario> {
    const { email, password, ...rest } = createUsuarioDto;

    // Verificar se email já existe
    const existing = await this.usuarioRepository.findOne({
      where: { email },
    });

    if (existing) {
      throw new ConflictException('Email já cadastrado');
    }

    // Hash da senha
    const saltRounds = 12;
    const senha_hash = await bcrypt.hash(password, saltRounds);

    const usuario = this.usuarioRepository.create({
      ...rest,
      email,
      senha_hash,
      id_criado_por: idCriador || null,
    });

    return this.usuarioRepository.save(usuario);
  }

  async findAll(): Promise<Usuario[]> {
    return this.usuarioRepository.find({
      where: { deletado: false },
      relations: ['criador'],
      order: { nome_completo: 'ASC' },
      select: {
        id: true,
        nome_completo: true,
        email: true,
        id_perfil: true,
        ativo: true,
        mfa_habilitado: true,
        ultimo_acesso: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  async findOne(id: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id, deletado: false },
      relations: ['criador'],
      select: {
        id: true,
        nome_completo: true,
        email: true,
        id_perfil: true,
        ativo: true,
        mfa_habilitado: true,
        ultimo_acesso: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }

    return usuario;
  }

  async update(id: string, updateUsuarioDto: UpdateUsuarioDto): Promise<Usuario> {
    const usuario = await this.findOne(id);
    const { password, ...rest } = updateUsuarioDto;

    // Se alterando email, verificar duplicação
    if (rest.email && rest.email !== usuario.email) {
      const existing = await this.usuarioRepository.findOne({
        where: { email: rest.email, deletado: false },
      });

      if (existing) {
        throw new ConflictException('Email já cadastrado');
      }
    }

    Object.assign(usuario, rest);

    if (password && password.trim()) {
      const saltRounds = 12;
      usuario.senha_hash = await bcrypt.hash(password, saltRounds);
    }

    return this.usuarioRepository.save(usuario);
  }

  async remove(id: string): Promise<void> {
    const usuario = await this.findOne(id);
    usuario.deletado = true;
    await this.usuarioRepository.save(usuario);
  }

  async changePassword(
    id: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id, deletado: false },
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar senha antiga
    const isPasswordValid = await bcrypt.compare(oldPassword, usuario.senha_hash);

    if (!isPasswordValid) {
      throw new ConflictException('Senha atual incorreta');
    }

    // Hash da nova senha
    const saltRounds = 12;
    usuario.senha_hash = await bcrypt.hash(newPassword, saltRounds);

    await this.usuarioRepository.save(usuario);
  }
}
