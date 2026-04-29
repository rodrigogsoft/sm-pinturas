import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificacoesService } from './notificacoes.service';
import { CreateNotificacaoDto } from './dto/create-notificacao.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PerfilEnum } from '../../common/enums';
import { TipoNotificacaoEnum, PrioridadeEnum } from './entities/notificacao.entity';
import { PublishDomainEventDto } from './dto/publish-domain-event.dto';
import { FindMinhasNotificacoesDto } from './dto/find-minhas-notificacoes.dto';
import { UpsertPreferenceDto } from './dto/upsert-preference.dto';
import { AdminCreateNotificationRuleDto } from './dto/admin-create-notification-rule.dto';
import { AdminUpdateNotificationRuleDto } from './dto/admin-update-notification-rule.dto';
import { AdminCreateNotificationTemplateDto } from './dto/admin-create-notification-template.dto';
import { AdminUpdateNotificationTemplateDto } from './dto/admin-update-notification-template.dto';

@ApiTags('Notificações')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'notificacoes', version: '1' })
export class NotificacoesController {
  constructor(private readonly notificacoesService: NotificacoesService) {}

  @Post()
  @Roles(PerfilEnum.ADMIN)
  @ApiOperation({
    summary: 'Criar notificação',
    description: 'Criar notificação manualmente (normalmente feito pelo sistema)',
  })
  async create(@Body() createNotificacaoDto: CreateNotificacaoDto) {
    return await this.notificacoesService.create(createNotificacaoDto);
  }

  @Post('dominio-eventos')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO)
  @ApiOperation({ summary: 'Publicar evento de domínio para o motor de notificações' })
  async publicarEventoDominio(@Body() dto: PublishDomainEventDto) {
    return this.notificacoesService.publicarEventoDominio(dto);
  }

  @Get('admin/rules')
  @Roles(PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Listar regras de notificacao (admin)' })
  async listarRegrasAdmin() {
    return this.notificacoesService.listarRegrasAdmin();
  }

  @Post('admin/rules')
  @Roles(PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Criar regra de notificacao (admin)' })
  async criarRegraAdmin(@Body() dto: AdminCreateNotificationRuleDto) {
    return this.notificacoesService.criarRegraAdmin(dto);
  }

  @Patch('admin/rules/:id')
  @Roles(PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Atualizar regra de notificacao (admin)' })
  async atualizarRegraAdmin(
    @Param('id') id: string,
    @Body() dto: AdminUpdateNotificationRuleDto,
  ) {
    return this.notificacoesService.atualizarRegraAdmin(id, dto);
  }

  @Delete('admin/rules/:id')
  @Roles(PerfilEnum.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover regra de notificacao (admin)' })
  async removerRegraAdmin(@Param('id') id: string) {
    await this.notificacoesService.removerRegraAdmin(id);
  }

  @Get('admin/templates')
  @Roles(PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Listar templates de notificacao (admin)' })
  async listarTemplatesAdmin() {
    return this.notificacoesService.listarTemplatesAdmin();
  }

  @Post('admin/templates')
  @Roles(PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Criar template de notificacao (admin)' })
  async criarTemplateAdmin(@Body() dto: AdminCreateNotificationTemplateDto) {
    return this.notificacoesService.criarTemplateAdmin(dto);
  }

  @Patch('admin/templates/:id')
  @Roles(PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Atualizar template de notificacao (admin)' })
  async atualizarTemplateAdmin(
    @Param('id') id: string,
    @Body() dto: AdminUpdateNotificationTemplateDto,
  ) {
    return this.notificacoesService.atualizarTemplateAdmin(id, dto);
  }

  @Delete('admin/templates/:id')
  @Roles(PerfilEnum.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover template de notificacao (admin)' })
  async removerTemplateAdmin(@Param('id') id: string) {
    await this.notificacoesService.removerTemplateAdmin(id);
  }

  @Get('usuario/:id_usuario')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ENCARREGADO)
  @ApiOperation({
    summary: 'Listar notificações do usuário',
    description: 'Retorna as notificações do usuário especificado',
  })
  @ApiQuery({ name: 'lida', required: false, type: Boolean })
  @ApiQuery({ name: 'tipo', required: false, enum: TipoNotificacaoEnum })
  @ApiQuery({ name: 'prioridade', required: false, enum: PrioridadeEnum })
  async findByUsuario(
    @Request() req: any,
    @Param('id_usuario') id_usuario: string,
    @Query('lida') lida?: string,
    @Query('tipo') tipo?: TipoNotificacaoEnum,
    @Query('prioridade') prioridade?: PrioridadeEnum,
  ) {
    this.notificacoesService.validarAcessoUsuario(
      req.user.id,
      req.user.id_perfil,
      id_usuario,
    );

    const filtros: any = {};

    if (lida !== undefined) {
      filtros.lida = lida === 'true';
    }
    if (tipo) filtros.tipo = tipo;
    if (prioridade) filtros.prioridade = prioridade;

    return await this.notificacoesService.findByUsuario(id_usuario, filtros);
  }

  @Get('minhas')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ENCARREGADO)
  @ApiOperation({
    summary: 'Listar minhas notificações',
    description: 'Retorna as notificações do usuário autenticado',
  })
  @ApiQuery({ name: 'lida', required: false, type: Boolean })
  @ApiQuery({ name: 'tipo', required: false, enum: TipoNotificacaoEnum })
  @ApiQuery({ name: 'prioridade', required: false, enum: PrioridadeEnum })
  async findMine(
    @Request() req: any,
    @Query('lida') lida?: string,
    @Query('tipo') tipo?: TipoNotificacaoEnum,
    @Query('prioridade') prioridade?: PrioridadeEnum,
  ) {
    const filtros: any = {};

    if (lida !== undefined) {
      filtros.lida = lida === 'true';
    }
    if (tipo) filtros.tipo = tipo;
    if (prioridade) filtros.prioridade = prioridade;

    return await this.notificacoesService.findByUsuario(req.user.id, filtros);
  }

  @Get('minhas/paginado')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ENCARREGADO)
  @ApiOperation({ summary: 'Listar minhas notificações com paginação e filtros avançados' })
  async findMinePaginado(
    @Request() req: any,
    @Query() filtros: FindMinhasNotificacoesDto,
  ) {
    return this.notificacoesService.findMinePaginado(req.user.id, filtros);
  }

  @Get('usuario/:id_usuario/nao-lidas/count')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ENCARREGADO)
  @ApiOperation({
    summary: 'Contar notificações não lidas',
    description: 'Retorna o número de notificações não lidas do usuário',
  })
  async countNaoLidas(@Request() req: any, @Param('id_usuario') id_usuario: string) {
    this.notificacoesService.validarAcessoUsuario(
      req.user.id,
      req.user.id_perfil,
      id_usuario,
    );
    const count = await this.notificacoesService.countNaoLidas(id_usuario);
    return { count };
  }

  @Get('minhas/nao-lidas/count')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ENCARREGADO)
  @ApiOperation({
    summary: 'Contar minhas notificações não lidas',
    description: 'Retorna o número de notificações não lidas do usuário autenticado',
  })
  async countMinhasNaoLidas(@Request() req: any) {
    const count = await this.notificacoesService.countNaoLidas(req.user.id);
    return { count };
  }

  @Get(':id')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ENCARREGADO)
  @ApiOperation({ summary: 'Buscar notificação por ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.notificacoesService.findOne(id);
  }

  @Post(':id/marcar-lida')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ENCARREGADO)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Marcar notificação como lida',
    description: 'Marca uma notificação específica como lida',
  })
  async marcarComoLida(@Param('id', ParseUUIDPipe) id: string) {
    return await this.notificacoesService.marcarComoLida(id);
  }

  @Post(':id/clicar')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ENCARREGADO)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar notificação como clicada' })
  async marcarComoClicada(@Param('id', ParseUUIDPipe) id: string) {
    return await this.notificacoesService.marcarComoClicada(id);
  }

  @Post('usuario/:id_usuario/marcar-todas-lidas')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ENCARREGADO)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Marcar todas como lidas',
    description: 'Marca todas as notificações não lidas do usuário como lidas',
  })
  async marcarTodasComoLidas(@Request() req: any, @Param('id_usuario') id_usuario: string) {
    this.notificacoesService.validarAcessoUsuario(
      req.user.id,
      req.user.id_perfil,
      id_usuario,
    );
    await this.notificacoesService.marcarTodasComoLidas(id_usuario);
  }

  @Post('minhas/marcar-todas-lidas')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ENCARREGADO)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Marcar todas as minhas notificações como lidas',
    description: 'Marca todas as notificações não lidas do usuário autenticado como lidas',
  })
  async marcarMinhasComoLidas(@Request() req: any) {
    await this.notificacoesService.marcarTodasComoLidas(req.user.id);
  }

  @Delete(':id')
  @Roles(PerfilEnum.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar notificação' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.notificacoesService.remove(id);
  }

  @Post('registrar-token')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ENCARREGADO)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Registrar token FCM',
    description: 'Registra o token FCM do dispositivo móvel do usuário para receber push notifications',
  })
  async registrarToken(
    @Request() req: any,
    @Body() body: { token: string; device?: string; device_version?: string },
  ) {
    return await this.notificacoesService.registrarTokenFCM(
      req.user.id,
      body.token,
      body.device,
      body.device_version,
    );
  }

  @Post('remover-token')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ENCARREGADO)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover token FCM',
    description: 'Remove o token FCM do usuário (ex: ao fazer logout)',
  })
  async removerToken(@Body() body: { token: string }) {
    await this.notificacoesService.removerTokenFCM(body.token);
  }

  @Get('minhas/preferencias')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ENCARREGADO)
  @ApiOperation({ summary: 'Listar preferências de notificação do usuário autenticado' })
  async minhasPreferencias(@Request() req: any) {
    return this.notificacoesService.listarPreferencias(req.user.id);
  }

  @Post('minhas/preferencias')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ENCARREGADO)
  @ApiOperation({ summary: 'Criar/atualizar preferência de notificação do usuário autenticado' })
  async salvarPreferencia(@Request() req: any, @Body() dto: UpsertPreferenceDto) {
    return this.notificacoesService.upsertPreferencia(req.user.id, dto);
  }

  @Get('metricas/resumo')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR)
  @ApiOperation({ summary: 'Resumo de métricas de entrega e leitura de notificações' })
  async metricasResumo() {
    return this.notificacoesService.getMetricasResumo();
  }
}
