import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PrecosService } from './precos.service';
import { CreatePrecoDto } from './dto/create-preco.dto';
import { UpdatePrecoDto } from './dto/update-preco.dto';
import { AprovarPrecoDto } from './dto/aprovar-preco.dto';
import { GetMargemPrecoDto } from './dto/get-margem-preco.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import { PerfilEnum } from '../../common/enums';
import { SensitiveDataFilter } from '../../common/utils/sensitive-data.filter';

@ApiTags('precos')
@Controller('precos')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PrecosController {
  constructor(private readonly precosService: PrecosService) {}

  @Post()
  @Roles(PerfilEnum.FINANCEIRO, PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Criar novo preço na tabela' })
  @ApiResponse({ status: 201, description: 'Preço criado com sucesso' })
  @ApiResponse({
    status: 409,
    description: 'Preço já cadastrado para este serviço/obra',
  })
  create(@Body() createPrecoDto: CreatePrecoDto) {
    return this.precosService.create(createPrecoDto);
  }

  @Get()
  @Roles(
    PerfilEnum.ENCARREGADO,
    PerfilEnum.GESTOR,
    PerfilEnum.FINANCEIRO,
    PerfilEnum.ADMIN,
  )
  @ApiOperation({ summary: 'Listar todos os preços' })
  @ApiQuery({
    name: 'idObra',
    required: false,
    type: String,
    description: 'Filtrar por obra',
  })
  @ApiResponse({ status: 200, description: 'Lista de preços' })
  async findAll(
    @Query('idObra') idObra?: string,
    @Request() req?: any,
  ) {
    const precos = await this.precosService.findAll(idObra);

    // RN01: Aplicar cegueira financeira para Encarregado
    if (req?.user?.id_perfil === PerfilEnum.ENCARREGADO) {
      return SensitiveDataFilter.filterPrecosForPerfil(precos, PerfilEnum.ENCARREGADO);
    }

    return precos;
  }

  @Get('pendentes/aprovacao')
  @Roles(PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ADMIN)
  @ApiOperation({ 
    summary: 'Listar preços pendentes de aprovação',
    description: 'Retorna todos os preços com status PENDENTE aguardando aprovação'
  })
  @ApiResponse({ status: 200, description: 'Lista de preços pendentes' })
  async findPendentes() {
    return this.precosService.findPendentes();
  }

  @Get('estatisticas')
  @Roles(
    PerfilEnum.ENCARREGADO,
    PerfilEnum.GESTOR,
    PerfilEnum.FINANCEIRO,
    PerfilEnum.ADMIN,
  )
  @ApiOperation({ 
    summary: 'Obter estatísticas de preços',
    description: 'Retorna contadores por status de aprovação'
  })
  @ApiResponse({ status: 200, description: 'Estatísticas de preços' })
  async getEstatisticas() {
    return this.precosService.getEstatisticas();
  }

  @Get('obra/:idObra')
  @Roles(
    PerfilEnum.ENCARREGADO,
    PerfilEnum.GESTOR,
    PerfilEnum.FINANCEIRO,
    PerfilEnum.ADMIN,
  )
  @ApiOperation({ 
    summary: 'Listar preços de uma obra específica',
    description: 'RN01: Encarregado não vê preco_venda nem status_aprovacao'
  })
  @ApiResponse({ status: 200, description: 'Lista de preços da obra' })
  async findByObra(
    @Param('idObra', ParseUUIDPipe) idObra: string,
    @Request() req: any,
  ) {
    const precos = await this.precosService.findByObra(idObra);
    
    // RN01: Aplicar cegueira financeira para Encarregado
    if (req.user.id_perfil === PerfilEnum.ENCARREGADO) {
      return SensitiveDataFilter.filterPrecosForPerfil(precos, PerfilEnum.ENCARREGADO);
    }
    
    return precos;
  }

  @Get(':id')
  @Roles(
    PerfilEnum.GESTOR,
    PerfilEnum.FINANCEIRO,
    PerfilEnum.ADMIN,
  )
  @ApiOperation({ summary: 'Buscar preço por ID' })
  @ApiResponse({ status: 200, description: 'Dados do preço' })
  @ApiResponse({ status: 404, description: 'Preço não encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.precosService.findOne(id);
  }

  @Get(':id/margem')
  @Roles(
    PerfilEnum.GESTOR,
    PerfilEnum.FINANCEIRO,
    PerfilEnum.ADMIN,
  )
  @ApiOperation({ summary: 'Obter validação de margem para um preço' })
  @ApiResponse({ 
    status: 200, 
    description: 'Dados da margem e validação',
    type: GetMargemPrecoDto 
  })
  @ApiResponse({ status: 404, description: 'Preço não encontrado' })
  getMargemValidacao(@Param('id', ParseUUIDPipe) id: string) {
    return this.precosService.getMargemValidacao(id);
  }

  @Patch(':id/retornar-rascunho')
  @Roles(PerfilEnum.FINANCEIRO, PerfilEnum.ADMIN)
  @Audit('UPDATE', 'tb_tabela_precos', 'Retorno de preco para rascunho')
  @ApiOperation({ summary: 'Retornar preço para rascunho' })
  @ApiResponse({ status: 200, description: 'Preço retornado para rascunho com sucesso' })
  @ApiResponse({ status: 400, description: 'Status atual não permite retorno para rascunho' })
  retornarParaRascunho(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    return this.precosService.retornarParaRascunho(id, req.user.id);
  }

  @Patch(':id/submeter')
  @Roles(PerfilEnum.FINANCEIRO, PerfilEnum.ADMIN)
  @Audit('UPDATE', 'tb_tabela_precos', 'Submissao de preco para aprovacao')
  @ApiOperation({ summary: 'Submeter preco para aprovacao' })
  @ApiResponse({ status: 200, description: 'Preco submetido com sucesso' })
  @ApiResponse({ status: 400, description: 'Preco nao pode ser submetido' })
  submeter(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    return this.precosService.submeterParaAprovacao(id, req.user.id);
  }

  @Patch(':id/aprovar')
  @Roles(PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ADMIN)
  @Audit('APPROVE', 'tb_tabela_precos', 'Aprovação/Rejeição de Preço de Venda')
  @ApiOperation({ summary: 'Aprovar ou rejeitar preço' })
  @ApiResponse({ status: 200, description: 'Preço aprovado/rejeitado com sucesso' })
  @ApiResponse({ status: 404, description: 'Preço não encontrado' })
  @ApiResponse({
    status: 400,
    description: 'Apenas preços pendentes podem ser aprovados',
  })
  async aprovar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() aprovarPrecoDto: AprovarPrecoDto,
    @Request() req: any,
  ) {
    return this.precosService.aprovar(id, aprovarPrecoDto, req.user.id);
  }

  @Patch(':id')
  @Roles(PerfilEnum.FINANCEIRO, PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Atualizar preço' })
  @ApiResponse({ status: 200, description: 'Preço atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Preço não encontrado' })
  @ApiResponse({
    status: 400,
    description: 'Não é possível atualizar preço aprovado',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePrecoDto: UpdatePrecoDto,
  ) {
    return this.precosService.update(id, updatePrecoDto);
  }

  @Delete(':id')
  @Roles(PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Deletar preço (soft delete)' })
  @ApiResponse({ status: 200, description: 'Preço deletado com sucesso' })
  @ApiResponse({ status: 404, description: 'Preço não encontrado' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.precosService.remove(id);
  }
}
