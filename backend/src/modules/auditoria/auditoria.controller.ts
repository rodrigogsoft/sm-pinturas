import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditoriaService } from './auditoria.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PerfilEnum } from '../../common/enums';
import { AcaoAuditoriaEnum } from './entities/audit-log.entity';

@ApiTags('Auditoria')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'auditoria', version: '1' })
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Post('logs')
  @Roles(PerfilEnum.ADMIN)
  @ApiOperation({
    summary: 'Criar log de auditoria manual',
    description: 'Criar registro de auditoria (normalmente feito automaticamente pelo sistema)',
  })
  async create(@Body() createAuditLogDto: CreateAuditLogDto) {
    return await this.auditoriaService.create(createAuditLogDto);
  }

  @Get('logs')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR)
  @ApiOperation({
    summary: 'Listar logs de auditoria',
    description: 'Buscar logs com filtros. Limitado a 1000 registros por consulta.',
  })
  @ApiQuery({ name: 'id_usuario', required: false })
  @ApiQuery({ name: 'tabela_afetada', required: false })
  @ApiQuery({ name: 'acao', required: false, enum: AcaoAuditoriaEnum })
  @ApiQuery({ name: 'id_registro', required: false })
  @ApiQuery({ name: 'data_inicio', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'data_fim', required: false, description: 'YYYY-MM-DD' })
  async findAll(
    @Query('id_usuario') id_usuario?: string,
    @Query('tabela_afetada') tabela_afetada?: string,
    @Query('acao') acao?: AcaoAuditoriaEnum,
    @Query('id_registro') id_registro?: string,
    @Query('data_inicio') data_inicio?: string,
    @Query('data_fim') data_fim?: string,
  ) {
    const filtros: any = {};

    if (id_usuario) filtros.id_usuario = id_usuario;
    if (tabela_afetada) filtros.tabela_afetada = tabela_afetada;
    if (acao) filtros.acao = acao;
    if (id_registro) filtros.id_registro = id_registro;
    if (data_inicio) filtros.data_inicio = new Date(data_inicio);
    if (data_fim) filtros.data_fim = new Date(data_fim);

    return await this.auditoriaService.findAll(filtros);
  }

  @Get('logs/:id')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR)
  @ApiOperation({ summary: 'Buscar log por ID' })
  async findOne(@Param('id') id: string) {
    return await this.auditoriaService.findOne(id);
  }

  @Get('historico/:tabela/:id_registro')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR)
  @ApiOperation({
    summary: 'Histórico de um registro',
    description: 'Retorna todos os logs de auditoria de um registro específico',
  })
  @ApiResponse({
    status: 200,
    description: 'Histórico ordenado cronologicamente',
  })
  async historicoRegistro(
    @Param('tabela') tabela: string,
    @Param('id_registro') id_registro: string,
  ) {
    return await this.auditoriaService.historicoRegistro(tabela, id_registro);
  }

  @Get('usuario/:id_usuario/atividade')
  @Roles(PerfilEnum.ADMIN)
  @ApiOperation({
    summary: 'Atividade do usuário',
    description: 'Analisa comportamento e ações do usuário. Limitado a 500 registros.',
  })
  @ApiQuery({ name: 'data_inicio', required: false })
  @ApiQuery({ name: 'data_fim', required: false })
  async atividadeUsuario(
    @Param('id_usuario') id_usuario: string,
    @Query('data_inicio') data_inicio?: string,
    @Query('data_fim') data_fim?: string,
  ) {
    return await this.auditoriaService.atividadeUsuario(
      id_usuario,
      data_inicio ? new Date(data_inicio) : undefined,
      data_fim ? new Date(data_fim) : undefined,
    );
  }

  @Get('relatorios/acoes-criticas')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR)
  @ApiOperation({
    summary: 'Relatório de ações críticas',
    description: 'Lista aprovações e rejeições em período',
  })
  @ApiQuery({ name: 'data_inicio', required: true })
  @ApiQuery({ name: 'data_fim', required: true })
  async acoesCriticas(
    @Query('data_inicio') data_inicio: string,
    @Query('data_fim') data_fim: string,
  ) {
    return await this.auditoriaService.acoesCriticas(
      new Date(data_inicio),
      new Date(data_fim),
    );
  }

  @Get('estatisticas')
  @Roles(PerfilEnum.ADMIN)
  @ApiOperation({
    summary: 'Estatísticas de auditoria',
    description: 'Análise agregada: ações, tabelas, top usuários',
  })
  @ApiQuery({ name: 'data_inicio', required: false })
  @ApiQuery({ name: 'data_fim', required: false })
  async estatisticas(
    @Query('data_inicio') data_inicio?: string,
    @Query('data_fim') data_fim?: string,
  ) {
    return await this.auditoriaService.estatisticas(
      data_inicio ? new Date(data_inicio) : undefined,
      data_fim ? new Date(data_fim) : undefined,
    );
  }
}
