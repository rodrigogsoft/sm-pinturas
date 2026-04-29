import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PerfilEnum } from '../../common/enums';
import { CreateValeAdiantamentoDto } from './dto/create-vale-adiantamento.dto';
import { AprovarValeAdiantamentoDto } from './dto/aprovar-vale-adiantamento.dto';
import { DescontarValeAdiantamentoDto } from './dto/descontar-vale-adiantamento.dto';
import { ValeAdiantamentoService } from './vale-adiantamento.service';

@ApiTags('vale-adiantamento')
@Controller({ path: 'vale-adiantamento', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ValeAdiantamentoController {
  constructor(private readonly valeAdiantamentoService: ValeAdiantamentoService) {}

  @Post()
  @Roles(PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Criar solicitacao de vale adiantamento' })
  @ApiResponse({ status: 201, description: 'Vale adiantamento criado com sucesso' })
  create(@Body() createDto: CreateValeAdiantamentoDto) {
    return this.valeAdiantamentoService.create(createDto);
  }

  @Get()
  @Roles(PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Listar vales adiantamento' })
  findAll() {
    return this.valeAdiantamentoService.findAll();
  }

  @Get('colaborador/:id_colaborador')
  @Roles(PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Listar vales por colaborador' })
  findByColaborador(@Param('id_colaborador', ParseUUIDPipe) id_colaborador: string) {
    return this.valeAdiantamentoService.findByColaborador(id_colaborador);
  }

  @Get('colaborador/:id_colaborador/saldo-devedor')
  @Roles(PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Consultar saldo devedor de vales por colaborador (RN08)' })
  getSaldoDevedor(@Param('id_colaborador', ParseUUIDPipe) id_colaborador: string) {
    return this.valeAdiantamentoService.getSaldoDevedorByColaborador(id_colaborador);
  }

  @Get(':id')
  @Roles(PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Buscar vale adiantamento pelo ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.valeAdiantamentoService.findOne(id);
  }

  @Get(':id/resumo')
  @Roles(PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Consultar resumo financeiro do vale adiantamento' })
  getResumo(@Param('id', ParseUUIDPipe) id: string) {
    return this.valeAdiantamentoService.getResumoByVale(id);
  }

  @Patch(':id/aprovar')
  @Roles(PerfilEnum.GESTOR, PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Aprovar vale adiantamento' })
  aprovar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AprovarValeAdiantamentoDto,
    @CurrentUser('id') idAprovador: string,
  ) {
    return this.valeAdiantamentoService.aprovar(id, {
      ...dto,
      id_aprovado_por: idAprovador,
    });
  }

  @Patch(':id/lancar')
  @Roles(PerfilEnum.FINANCEIRO, PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Lancar vale adiantamento para desconto em folha' })
  lancar(@Param('id', ParseUUIDPipe) id: string) {
    return this.valeAdiantamentoService.lancar(id);
  }

  @Patch(':id/descontar')
  @Roles(PerfilEnum.FINANCEIRO, PerfilEnum.ADMIN)
  @ApiOperation({
    summary: 'Aplicar desconto manual (integral ou parcial) no vale adiantamento',
  })
  descontar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DescontarValeAdiantamentoDto,
  ) {
    return this.valeAdiantamentoService.descontar(id, dto);
  }

  @Patch(':id/cancelar')
  @Roles(PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ADMIN)
  @HttpCode(200)
  @ApiOperation({ summary: 'Cancelar vale adiantamento' })
  cancelar(@Param('id', ParseUUIDPipe) id: string) {
    return this.valeAdiantamentoService.cancelar(id);
  }

  @Delete(':id')
  @Roles(PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ADMIN)
  @HttpCode(200)
  @ApiOperation({ summary: 'Apagar vale adiantamento (soft delete)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.valeAdiantamentoService.remove(id);
  }
}
