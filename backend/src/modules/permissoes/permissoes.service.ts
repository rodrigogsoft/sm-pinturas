import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Perfil } from './entities/perfil.entity';
import { UpdatePermissoesDto } from './dto/update-permissoes.dto';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { AcaoAuditoriaEnum } from '../../common/enums';

@Injectable()
export class PermissoesService {
  constructor(
    @InjectRepository(Perfil)
    private perfilRepository: Repository<Perfil>,
    private auditoriaService: AuditoriaService,
  ) {}

  async listarPerfis(): Promise<Perfil[]> {
    return this.perfilRepository.find({ order: { id: 'ASC' } });
  }

  async buscarPorId(id: number): Promise<Perfil> {
    const perfil = await this.perfilRepository.findOne({ where: { id } });
    if (!perfil) {
      throw new NotFoundException(`Perfil ${id} não encontrado`);
    }
    return perfil;
  }

  async atualizarPermissoes(
    idPerfil: number,
    dto: UpdatePermissoesDto,
    idAdminUsuario: string,
    ipOrigem?: string,
  ): Promise<Perfil> {
    const perfil = await this.buscarPorId(idPerfil);

    const dadosAntes = { permissoes_modulos: perfil.permissoes_modulos };

    perfil.permissoes_modulos = dto.permissoes_modulos;
    const atualizado = await this.perfilRepository.save(perfil);

    // RN15: Auditoria de alterações de permissão
    await this.auditoriaService.create({
      id_usuario: idAdminUsuario,
      tabela_afetada: 'tb_perfis',
      acao: AcaoAuditoriaEnum.UPDATE,
      dados_antes: dadosAntes,
      dados_depois: { permissoes_modulos: dto.permissoes_modulos },
      ip_origem: ipOrigem || undefined,
      justificativa: `Permissões do perfil "${perfil.nome}" (id=${idPerfil}) alteradas pelo administrador`,
    });

    return atualizado;
  }
}
