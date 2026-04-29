import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ServicosService } from './servicos.service';
import { CreateServicoDto } from './dto/create-servico.dto';
import { UpdateServicoDto } from './dto/update-servico.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PerfilEnum, CategoriaServicoEnum } from '../../common/enums';

@ApiTags('servicos')
@Controller('servicos')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ServicosController {
  constructor(private readonly servicosService: ServicosService) {}

  @Post()
  @Roles(
    PerfilEnum.ENCARREGADO,
    PerfilEnum.FINANCEIRO,
    PerfilEnum.GESTOR,
    PerfilEnum.ADMIN,
  )
  @ApiOperation({ summary: 'Criar novo serviço no catálogo' })
  @ApiResponse({ status: 201, description: 'Serviço criado com sucesso' })
  create(@Body() createServicoDto: CreateServicoDto) {
    return this.servicosService.create(createServicoDto);
  }

  @Get()
  @Roles(
    PerfilEnum.ENCARREGADO,
    PerfilEnum.GESTOR,
    PerfilEnum.FINANCEIRO,
    PerfilEnum.ADMIN,
  )
  @ApiOperation({ summary: 'Listar todos os serviços do catálogo com filtros' })
  @ApiResponse({ status: 200, description: 'Lista de serviços' })
  @ApiQuery({
    name: 'categoria',
    enum: CategoriaServicoEnum,
    required: false,
    description: 'Filtrar por categoria',
  })
  @ApiQuery({
    name: 'unidade',
    type: 'string',
    required: false,
    description: 'Filtrar por unidade de medida (M2, ML, UN, VB)',
  })
  @ApiQuery({
    name: 'search',
    type: 'string',
    required: false,
    description: 'Buscar por nome ou descrição',
  })
  @ApiQuery({
    name: 'orderBy',
    enum: ['nome', 'categoria', 'mais_usado'],
    required: false,
    description: 'Ordenar por: nome, categoria ou mais_usado',
  })
  findAll(
    @Query('categoria') categoria?: CategoriaServicoEnum,
    @Query('unidade') unidade?: string,
    @Query('search') search?: string,
    @Query('orderBy') orderBy?: 'nome' | 'categoria' | 'mais_usado',
  ) {
    return this.servicosService.findAll(categoria, unidade, search, orderBy);
  }

  @Get(':id')
  @Roles(
    PerfilEnum.ENCARREGADO,
    PerfilEnum.GESTOR,
    PerfilEnum.FINANCEIRO,
    PerfilEnum.ADMIN,
  )
  @ApiOperation({ summary: 'Buscar serviço por ID' })
  @ApiResponse({ status: 200, description: 'Dados do serviço' })
  @ApiResponse({ status: 404, description: 'Serviço não encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.servicosService.findOne(id);
  }

  @Get(':id/estatisticas')
  @Roles(PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Obter estatísticas de uso do serviço' })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas detalhadas do serviço',
  })
  @ApiResponse({ status: 404, description: 'Serviço não encontrado' })
  getEstatisticas(@Param('id', ParseIntPipe) id: number) {
    return this.servicosService.getEstatisticas(id);
  }

  @Patch(':id')
  @Roles(PerfilEnum.FINANCEIRO, PerfilEnum.GESTOR, PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Atualizar serviço' })
  @ApiResponse({ status: 200, description: 'Serviço atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Serviço não encontrado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateServicoDto: UpdateServicoDto,
  ) {
    return this.servicosService.update(id, updateServicoDto);
  }

  @Delete(':id')
  @Roles(PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Deletar serviço (soft delete)' })
  @ApiResponse({ status: 200, description: 'Serviço deletado com sucesso' })
  @ApiResponse({ status: 404, description: 'Serviço não encontrado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.servicosService.remove(id);
  }
}
