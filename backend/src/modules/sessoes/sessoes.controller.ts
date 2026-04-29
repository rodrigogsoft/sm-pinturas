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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SessoesService } from './sessoes.service';
import { CreateSessaoDto } from './dto/create-sessao.dto';
import { UpdateSessaoDto } from './dto/update-sessao.dto';
import { EncerrarSessaoDto } from './dto/encerrar-sessao.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PerfilEnum } from '../../common/enums';
import { StatusSessaoEnum } from './entities/sessao-diaria.entity';

@ApiTags('Sessões (RDO Digital)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'sessoes', version: '1' })
export class SessoesController {
  constructor(private readonly sessoesService: SessoesService) {}

  @Post()
  @Roles(PerfilEnum.ADMIN, PerfilEnum.ENCARREGADO)
  @ApiOperation({ 
    summary: 'Criar nova sessão diária (Abrir RDO)',
    description: 'Encarregado abre uma nova sessão de trabalho com geolocalização'
  })
  @ApiResponse({ status: 201, description: 'Sessão criada com sucesso' })
  @ApiResponse({ status: 409, description: 'Já existe sessão aberta para este usuário' })
  async create(@Body() createSessaoDto: CreateSessaoDto, @Request() req: any) {
    createSessaoDto.id_encarregado = req.user.id;
    return await this.sessoesService.create(createSessaoDto);
  }

  @Get()
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.ENCARREGADO)
  @ApiOperation({ 
    summary: 'Listar sessões',
    description: 'Lista todas as sessões com filtros opcionais'
  })
  @ApiQuery({ name: 'id_encarregado', required: false, description: 'Filtrar por encarregado' })
  @ApiQuery({ name: 'id_obra', required: false, description: 'Filtrar por obra' })
  @ApiQuery({ name: 'data_inicio', required: false, description: 'Data inicial (YYYY-MM-DD)' })
  @ApiQuery({ name: 'data_fim', required: false, description: 'Data final (YYYY-MM-DD)' })
  @ApiQuery({ name: 'status', required: false, enum: StatusSessaoEnum, description: 'Filtrar por status' })
  async findAll(
    @Query('id_encarregado') id_encarregado?: string,
    @Query('id_obra') id_obra?: string,
    @Query('data_inicio') data_inicio?: string,
    @Query('data_fim') data_fim?: string,
    @Query('status') status?: StatusSessaoEnum,
  ) {
    const filters: any = {};
    
    if (id_encarregado) filters.id_encarregado = id_encarregado;
    if (id_obra) filters.id_obra = id_obra;
    if (data_inicio) filters.data_inicio = new Date(data_inicio);
    if (data_fim) filters.data_fim = new Date(data_fim);
    if (status) filters.status = status;

    return await this.sessoesService.findAll(filters);
  }

  @Get('aberta/:id_encarregado')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.ENCARREGADO)
  @ApiOperation({ 
    summary: 'Buscar sessão aberta do encarregado',
    description: 'Retorna a sessão atualmente aberta para o encarregado especificado'
  })
  @ApiResponse({ status: 200, description: 'Sessão encontrada' })
  @ApiResponse({ status: 404, description: 'Nenhuma sessão aberta encontrada' })
  async findSessaoAberta(@Param('id_encarregado') id_encarregado: string) {
    return await this.sessoesService.findSessaoAberta(id_encarregado);
  }

  @Get(':id')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.ENCARREGADO)
  @ApiOperation({ summary: 'Buscar sessão por ID' })
  @ApiResponse({ status: 200, description: 'Sessão encontrada' })
  @ApiResponse({ status: 404, description: 'Sessão não encontrada' })
  async findOne(@Param('id') id: string) {
    return await this.sessoesService.findOne(id);
  }

  @Get(':id/duracao')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.ENCARREGADO)
  @ApiOperation({ 
    summary: 'Calcular duração da sessão',
    description: 'Retorna a duração da sessão em horas (apenas para sessões encerradas)'
  })
  @ApiResponse({ status: 200, description: 'Duração calculada em horas' })
  @ApiResponse({ status: 400, description: 'Sessão ainda não foi encerrada' })
  async calcularDuracao(@Param('id') id: string) {
    const duracao = await this.sessoesService.calcularDuracao(id);
    return { duracao, unidade: 'horas' };
  }

  @Patch(':id')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.ENCARREGADO)
  @ApiOperation({ 
    summary: 'Atualizar sessão',
    description: 'Atualiza informações de uma sessão (não encerrada)'
  })
  @ApiResponse({ status: 200, description: 'Sessão atualizada com sucesso' })
  @ApiResponse({ status: 400, description: 'Não é possível modificar sessão encerrada' })
  async update(@Param('id') id: string, @Body() updateSessaoDto: UpdateSessaoDto) {
    return await this.sessoesService.update(id, updateSessaoDto);
  }

  @Post(':id/encerrar')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.ENCARREGADO)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Encerrar sessão (Fechar RDO)',
    description: 'Encerra uma sessão diária registrando automaticamente a hora de término no servidor e observações opcionais'
  })
  @ApiResponse({ status: 200, description: 'Sessão encerrada com sucesso' })
  @ApiResponse({ status: 400, description: 'Sessão já está encerrada ou dados inválidos' })
  async encerrar(@Param('id') id: string, @Body() encerrarDto: EncerrarSessaoDto) {
    return await this.sessoesService.encerrar(id, encerrarDto);
  }

  @Delete(':id')
  @Roles(PerfilEnum.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Deletar sessão',
    description: 'Soft delete de uma sessão (apenas Admin)'
  })
  @ApiResponse({ status: 204, description: 'Sessão deletada com sucesso' })
  async remove(@Param('id') id: string) {
    await this.sessoesService.remove(id);
  }
}
