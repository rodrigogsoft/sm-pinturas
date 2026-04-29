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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ItensAmbienteService } from './itens-ambiente.service';
import { CreateItemAmbienteDto } from './dto/create-item-ambiente.dto';
import { CreateItensAmbienteLoteDto } from './dto/create-itens-ambiente-lote.dto';
import { UpdateItemAmbienteDto } from './dto/update-item-ambiente.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PerfilEnum } from '../../common/enums';

@ApiTags('itens-ambiente')
@Controller({ path: 'itens-ambiente', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ItensAmbienteController {
  constructor(private readonly itensAmbienteService: ItensAmbienteService) {}

  @Post()
  @Roles(PerfilEnum.ENCARREGADO, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Criar novo elemento de serviço (ERS 4.1: tipo de serviço definido na alocação)' })
  @ApiResponse({ status: 201, description: 'Elemento de serviço criado com sucesso' })
  @ApiResponse({ status: 404, description: 'Ambiente ou Tabela de Preço não encontrada' })
  create(@Body() createItemAmbienteDto: CreateItemAmbienteDto) {
    return this.itensAmbienteService.create(createItemAmbienteDto);
  }

  // RF21 – Cadastro em lote de elementos de serviço
  @Post('lote')
  @Roles(PerfilEnum.ENCARREGADO, PerfilEnum.GESTOR, PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'RF21 – Cadastrar múltiplos elementos de serviço de uma vez (nome + área planejada)' })
  @ApiResponse({ status: 201, description: 'Lote criado; retorna elementos criados e eventuais erros de duplicidade' })
  @ApiResponse({ status: 400, description: 'Nomes duplicados no lote ou todos já existem' })
  @ApiResponse({ status: 404, description: 'Ambiente não encontrado' })
  createLote(@Body() dto: CreateItensAmbienteLoteDto) {
    return this.itensAmbienteService.createLote(dto);
  }

  @Get()
  @Roles(
    PerfilEnum.ENCARREGADO,
    PerfilEnum.GESTOR,
    PerfilEnum.FINANCEIRO,
    PerfilEnum.ADMIN,
  )
  @ApiOperation({ summary: 'Listar todos os itens de ambiente' })
  @ApiResponse({ status: 200, description: 'Lista de itens de ambiente' })
  findAll() {
    return this.itensAmbienteService.findAll();
  }

  @Get('ambiente/:id_ambiente')
  @Roles(
    PerfilEnum.ENCARREGADO,
    PerfilEnum.GESTOR,
    PerfilEnum.FINANCEIRO,
    PerfilEnum.ADMIN,
  )
  @ApiOperation({ summary: 'Listar itens de um ambiente específico' })
  @ApiResponse({ status: 200, description: 'Lista de itens do ambiente' })
  @ApiResponse({ status: 404, description: 'Ambiente não encontrado' })
  findByAmbiente(@Param('id_ambiente', ParseUUIDPipe) id_ambiente: string) {
    return this.itensAmbienteService.findByAmbiente(id_ambiente);
  }

  @Get('obra/:id_obra')
  @Roles(
    PerfilEnum.ENCARREGADO,
    PerfilEnum.GESTOR,
    PerfilEnum.FINANCEIRO,
    PerfilEnum.ADMIN,
  )
  @ApiOperation({ summary: 'Listar itens de uma obra específica' })
  @ApiResponse({ status: 200, description: 'Lista de itens da obra' })
  @ApiResponse({ status: 404, description: 'Obra não encontrada' })
  findByObra(@Param('id_obra', ParseUUIDPipe) id_obra: string) {
    return this.itensAmbienteService.findByObra(id_obra);
  }

  @Get('pavimento/:id_pavimento')
  @Roles(
    PerfilEnum.ENCARREGADO,
    PerfilEnum.GESTOR,
    PerfilEnum.FINANCEIRO,
    PerfilEnum.ADMIN,
  )
  @ApiOperation({ summary: 'Listar itens de um pavimento específico' })
  @ApiResponse({ status: 200, description: 'Lista de itens do pavimento' })
  @ApiResponse({ status: 404, description: 'Pavimento não encontrado' })
  findByPavimento(@Param('id_pavimento', ParseUUIDPipe) id_pavimento: string) {
    return this.itensAmbienteService.findByPavimento(id_pavimento);
  }

  @Get(':id')
  @Roles(
    PerfilEnum.ENCARREGADO,
    PerfilEnum.GESTOR,
    PerfilEnum.FINANCEIRO,
    PerfilEnum.ADMIN,
  )
  @ApiOperation({ summary: 'Buscar item de ambiente por ID' })
  @ApiResponse({ status: 200, description: 'Dados do item de ambiente' })
  @ApiResponse({ status: 404, description: 'Item de ambiente não encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.itensAmbienteService.findOne(id);
  }

  @Patch(':id')
  @Roles(PerfilEnum.ENCARREGADO, PerfilEnum.FINANCEIRO, PerfilEnum.GESTOR, PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Atualizar item de ambiente' })
  @ApiResponse({ status: 200, description: 'Item de ambiente atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Item de ambiente não encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateItemAmbienteDto: UpdateItemAmbienteDto,
  ) {
    return this.itensAmbienteService.update(id, updateItemAmbienteDto);
  }

  @Delete(':id')
  @Roles(PerfilEnum.ENCARREGADO, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Deletar item de ambiente (soft delete)' })
  @ApiResponse({ status: 200, description: 'Item de ambiente deletado com sucesso' })
  @ApiResponse({ status: 404, description: 'Item de ambiente não encontrado' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.itensAmbienteService.remove(id);
  }
}
