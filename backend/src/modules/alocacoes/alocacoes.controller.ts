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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AlocacoesService } from './alocacoes.service';
import { CreateAlocacaoDto } from './dto/create-alocacao.dto';
import { UpdateAlocacaoDto } from './dto/update-alocacao.dto';
import { ConcluirAlocacaoDto } from './dto/concluir-alocacao.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PerfilEnum } from '../../common/enums';
import { StatusAlocacaoEnum } from './entities/alocacao-tarefa.entity';

@ApiTags('Alocações (Controle 1:1)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'alocacoes', version: '1' })
export class AlocacoesController {
  constructor(private readonly alocacoesService: AlocacoesService) {}

  @Post()
  @Roles(PerfilEnum.ADMIN, PerfilEnum.ENCARREGADO)
  @ApiOperation({
    summary: 'Criar nova alocação (RF07)',
    description: 'Aloca colaborador em ambiente. Implementa regra 1:1: apenas um colaborador ativo por ambiente',
  })
  @ApiResponse({ status: 201, description: 'Alocação criada com sucesso' })
  @ApiResponse({ 
    status: 409, 
    description: 'Conflito: Ambiente já ocupado ou colaborador já alocado',
    schema: {
      example: {
        message: 'Ambiente em uso por João Silva. Encerre a tarefa anterior primeiro.',
        codigo: 'AMBIENTE_OCUPADO',
        colaborador_atual: { id: 'uuid', nome: 'João Silva' },
        alocacao_id: 'uuid'
      }
    }
  })
  async create(@Body() createAlocacaoDto: CreateAlocacaoDto) {
    return await this.alocacoesService.create(createAlocacaoDto);
  }

  @Get()
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.ENCARREGADO)
  @ApiOperation({
    summary: 'Listar alocações',
    description: 'Lista todas as alocações com filtros opcionais',
  })
  @ApiQuery({ name: 'id_sessao', required: false, description: 'Filtrar por sessão' })
  @ApiQuery({ name: 'id_obra', required: false, description: 'Filtrar por obra' })
  @ApiQuery({ name: 'id_ambiente', required: false, description: 'Filtrar por ambiente' })
  @ApiQuery({ name: 'id_colaborador', required: false, description: 'Filtrar por colaborador' })
  @ApiQuery({ name: 'status', required: false, enum: StatusAlocacaoEnum })
  async findAll(
    @Query('id_sessao') id_sessao?: string,
    @Query('id_obra') id_obra?: string,
    @Query('id_ambiente') id_ambiente?: string,
    @Query('id_colaborador') id_colaborador?: string,
    @Query('status') status?: StatusAlocacaoEnum,
  ) {
    const filters: any = {};

    if (id_sessao) filters.id_sessao = id_sessao;
    if (id_obra) filters.id_obra = id_obra;
    if (id_ambiente) filters.id_ambiente = id_ambiente;
    if (id_colaborador) filters.id_colaborador = id_colaborador;
    if (status) filters.status = status;

    return await this.alocacoesService.findAll(filters);
  }

  @Get('ativas')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.ENCARREGADO)
  @ApiOperation({
    summary: 'Listar alocações ativas',
    description: 'Retorna todas as alocações em andamento no momento',
  })
  async findAlocacoesAtivas() {
    return await this.alocacoesService.findAlocacoesAtivas();
  }

  @Get('ambiente/:id_ambiente/verificar')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.ENCARREGADO)
  @ApiOperation({
    summary: 'Verificar se ambiente está ocupado',
    description: 'Usado pela UI mobile para validação antes de permitir drag-and-drop',
  })
  @ApiResponse({
    status: 200,
    description: 'Status do ambiente',
    schema: {
      example: {
        ocupado: true,
        alocacao: {
          id: 'uuid',
          colaborador: { nome: 'João Silva' }
        }
      }
    }
  })
  async verificarAmbienteOcupado(@Param('id_ambiente') id_ambiente: string) {
    return await this.alocacoesService.verificarAmbienteOcupado(id_ambiente);
  }

  @Get(':id')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.ENCARREGADO)
  @ApiOperation({ summary: 'Buscar alocação por ID' })
  async findOne(@Param('id') id: string) {
    return await this.alocacoesService.findOne(id);
  }

  @Get(':id/duracao')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.ENCARREGADO)
  @ApiOperation({
    summary: 'Calcular duração da alocação',
    description: 'Retorna a duração em horas (apenas para alocações concluídas)',
  })
  async calcularDuracao(@Param('id') id: string) {
    const duracao = await this.alocacoesService.calcularDuracao(id);
    return { duracao, unidade: 'horas' };
  }

  @Patch(':id')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.ENCARREGADO)
  @ApiOperation({ summary: 'Atualizar alocação' })
  async update(@Param('id') id: string, @Body() updateAlocacaoDto: UpdateAlocacaoDto) {
    return await this.alocacoesService.update(id, updateAlocacaoDto);
  }

  @Post(':id/concluir')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.ENCARREGADO)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Concluir alocação',
    description: 'Finaliza a alocação liberando o ambiente e colaborador',
  })
  async concluir(@Param('id') id: string, @Body() concluirDto: ConcluirAlocacaoDto) {
    return await this.alocacoesService.concluir(id, concluirDto);
  }

  @Post(':id/pausar')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.ENCARREGADO)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Pausar alocação',
    description: 'Pausa temporariamente a alocação (ex: pausa para almoço)',
  })
  async pausar(@Param('id') id: string) {
    return await this.alocacoesService.pausar(id);
  }

  @Post(':id/retomar')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.ENCARREGADO)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retomar alocação pausada',
    description: 'Retoma uma alocação previamente pausada',
  })
  async retomar(@Param('id') id: string) {
    return await this.alocacoesService.retomar(id);
  }

  @Delete(':id')
  @Roles(PerfilEnum.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar alocação (apenas Admin)' })
  async remove(@Param('id') id: string) {
    await this.alocacoesService.remove(id);
  }
}
