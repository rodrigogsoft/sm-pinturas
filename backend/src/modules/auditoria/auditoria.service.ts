import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AuditLog, AcaoAuditoriaEnum } from './entities/audit-log.entity';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';

@Injectable()
export class AuditoriaService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Criar registro de auditoria
   * Importante: Logs de auditoria são IMUTÁVEIS - não há update ou delete
   */
  async create(createAuditLogDto: CreateAuditLogDto): Promise<AuditLog> {
    const log = this.auditLogRepository.create(createAuditLogDto);
    return await this.auditLogRepository.save(log);
  }

  /**
   * Buscar logs com filtros
   */
  async findAll(filtros?: {
    id_usuario?: string;
    tabela_afetada?: string;
    acao?: AcaoAuditoriaEnum;
    data_inicio?: Date;
    data_fim?: Date;
    id_registro?: string;
  }): Promise<AuditLog[]> {
    const query = this.auditLogRepository
      .createQueryBuilder('audit')
      .leftJoinAndSelect('audit.usuario', 'usuario');

    if (filtros?.id_usuario) {
      query.andWhere('audit.id_usuario = :id_usuario', {
        id_usuario: filtros.id_usuario,
      });
    }

    if (filtros?.tabela_afetada) {
      query.andWhere('audit.tabela_afetada = :tabela_afetada', {
        tabela_afetada: filtros.tabela_afetada,
      });
    }

    if (filtros?.acao) {
      query.andWhere('audit.acao = :acao', {
        acao: filtros.acao,
      });
    }

    if (filtros?.id_registro) {
      query.andWhere('audit.id_registro = :id_registro', {
        id_registro: filtros.id_registro,
      });
    }

    if (filtros?.data_inicio && filtros?.data_fim) {
      query.andWhere('audit.momento BETWEEN :data_inicio AND :data_fim', {
        data_inicio: filtros.data_inicio,
        data_fim: filtros.data_fim,
      });
    } else if (filtros?.data_inicio) {
      query.andWhere('audit.momento >= :data_inicio', {
        data_inicio: filtros.data_inicio,
      });
    } else if (filtros?.data_fim) {
      query.andWhere('audit.momento <= :data_fim', {
        data_fim: filtros.data_fim,
      });
    }

    return await query
      .orderBy('audit.momento', 'DESC')
      .limit(1000) // Limite para performance
      .getMany();
  }

  /**
   * Buscar log por ID
   */
  async findOne(id: string): Promise<AuditLog> {
    const log = await this.auditLogRepository.findOne({
      where: { id },
      relations: ['usuario'],
    });

    if (!log) {
      throw new NotFoundException(`Log de auditoria com ID ${id} não encontrado`);
    }

    return log;
  }

  /**
   * Buscar histórico de um registro específico
   */
  async historicoRegistro(
    tabela_afetada: string,
    id_registro: string,
  ): Promise<AuditLog[]> {
    return await this.auditLogRepository.find({
      where: {
        tabela_afetada,
        id_registro,
      },
      relations: ['usuario'],
      order: {
        momento: 'ASC',
      },
    });
  }

  /**
   * Atividade do usuário (para análise de comportamento)
   */
  async atividadeUsuario(
    id_usuario: string,
    data_inicio?: Date,
    data_fim?: Date,
  ): Promise<AuditLog[]> {
    const query = this.auditLogRepository
      .createQueryBuilder('audit')
      .where('audit.id_usuario = :id_usuario', { id_usuario });

    if (data_inicio && data_fim) {
      query.andWhere('audit.momento BETWEEN :data_inicio AND :data_fim', {
        data_inicio,
        data_fim,
      });
    }

    return await query
      .orderBy('audit.momento', 'DESC')
      .limit(500)
      .getMany();
  }

  /**
   * Relatório de ações críticas (aprovações, rejeições)
   */
  async acoesCriticas(data_inicio: Date, data_fim: Date): Promise<AuditLog[]> {
    return await this.auditLogRepository.find({
      where: {
        acao: Between(AcaoAuditoriaEnum.APPROVE, AcaoAuditoriaEnum.REJECT),
        momento: Between(data_inicio, data_fim),
      },
      relations: ['usuario'],
      order: {
        momento: 'DESC',
      },
    });
  }

  /**
   * Estatísticas de auditoria
   */
  async estatisticas(data_inicio?: Date, data_fim?: Date) {
    const query = this.auditLogRepository.createQueryBuilder('audit');

    if (data_inicio && data_fim) {
      query.where('audit.momento BETWEEN :data_inicio AND :data_fim', {
        data_inicio,
        data_fim,
      });
    }

    const logs = await query.getMany();

    // Agrupar por ação
    const porAcao = logs.reduce((acc, log) => {
      if (!acc[log.acao]) {
        acc[log.acao] = 0;
      }
      acc[log.acao]++;
      return acc;
    }, {} as Record<string, number>);

    // Agrupar por tabela
    const porTabela = logs.reduce((acc, log) => {
      if (!acc[log.tabela_afetada]) {
        acc[log.tabela_afetada] = 0;
      }
      acc[log.tabela_afetada]++;
      return acc;
    }, {} as Record<string, number>);

    // Top usuários mais ativos
    const porUsuario = logs.reduce((acc, log) => {
      if (!acc[log.id_usuario]) {
        acc[log.id_usuario] = 0;
      }
      acc[log.id_usuario]++;
      return acc;
    }, {} as Record<string, number>);

    return {
      total_logs: logs.length,
      por_acao: porAcao,
      por_tabela: porTabela,
      top_usuarios: Object.entries(porUsuario)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([id_usuario, count]) => ({ id_usuario, count })),
    };
  }

  /**
   * Helper: Criar log de aprovação (usado por outros módulos)
   */
  async logAprovacao(
    id_usuario: string,
    tabela: string,
    id_registro: string,
    dados_antes: any,
    dados_depois: any,
    justificativa?: string,
  ): Promise<AuditLog> {
    return await this.create({
      id_usuario,
      tabela_afetada: tabela,
      id_registro,
      acao: AcaoAuditoriaEnum.APPROVE,
      dados_antes,
      dados_depois,
      justificativa,
    });
  }

  /**
   * Helper: Criar log de login
   */
  async logLogin(
    id_usuario: string,
    ip_origem?: string,
    user_agent?: string,
  ): Promise<AuditLog> {
    return await this.create({
      id_usuario,
      tabela_afetada: 'tb_usuarios',
      id_registro: id_usuario,
      acao: AcaoAuditoriaEnum.LOGIN,
      ip_origem,
      user_agent,
    });
  }

  /**
   * Helper: Criar log de export (para LGPD/compliance)
   */
  async logExport(
    id_usuario: string,
    tabela: string,
    justificativa: string,
  ): Promise<AuditLog> {
    return await this.create({
      id_usuario,
      tabela_afetada: tabela,
      acao: AcaoAuditoriaEnum.EXPORT,
      justificativa,
    });
  }
}
