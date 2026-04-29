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
  Version,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PavimentosService } from './pavimentos.service';
import { CreatePavimentoDto } from './dto/create-pavimento.dto';
import { UpdatePavimentoDto } from './dto/update-pavimento.dto';
import { CreatePavimentosLoteDto } from './dto/create-pavimentos-lote.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PerfilEnum } from '../../common/enums';

@ApiTags('pavimentos')
@Controller({ path: 'pavimentos', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PavimentosController {
  constructor(private readonly pavimentosService: PavimentosService) {}

  @Post()
  @Roles(PerfilEnum.ENCARREGADO, PerfilEnum.GESTOR, PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Criar novo pavimento' })
  @ApiResponse({ status: 201, description: 'Pavimento criado com sucesso' })
  @ApiResponse({ status: 404, description: 'Obra não encontrada' })
  create(@Body() createPavimentoDto: CreatePavimentoDto) {
    return this.pavimentosService.create(createPavimentoDto);
  }

  @Post('lote')
  @Roles(PerfilEnum.ENCARREGADO, PerfilEnum.GESTOR, PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Criar pavimentos em lote para uma obra' })
  @ApiResponse({ status: 201, description: 'Pavimentos criados com sucesso' })
  @ApiResponse({ status: 400, description: 'Par\u00e2metros inv\u00e1lidos' })
  @ApiResponse({ status: 404, description: 'Obra n\u00e3o encontrada' })
  createLote(@Body() dto: CreatePavimentosLoteDto) {
    return this.pavimentosService.createLote(dto);
  }

  @Get()
  @Roles(
    PerfilEnum.ENCARREGADO,
    PerfilEnum.GESTOR,
    PerfilEnum.FINANCEIRO,
    PerfilEnum.ADMIN,
  )
  @ApiOperation({ summary: 'Listar todos os pavimentos' })
  @ApiResponse({ status: 200, description: 'Lista de pavimentos' })
  findAll() {
    return this.pavimentosService.findAll();
  }

  @Get('obra/:id_obra')
  @Roles(
    PerfilEnum.ENCARREGADO,
    PerfilEnum.GESTOR,
    PerfilEnum.FINANCEIRO,
    PerfilEnum.ADMIN,
  )
  @ApiOperation({ summary: 'Listar pavimentos de uma obra específica' })
  @ApiResponse({ status: 200, description: 'Lista de pavimentos da obra' })
  @ApiResponse({ status: 404, description: 'Obra não encontrada' })
  findByObra(@Param('id_obra', ParseUUIDPipe) id_obra: string) {
    return this.pavimentosService.findByObra(id_obra);
  }

  @Get(':id')
  @Roles(
    PerfilEnum.ENCARREGADO,
    PerfilEnum.GESTOR,
    PerfilEnum.FINANCEIRO,
    PerfilEnum.ADMIN,
  )
  @ApiOperation({ summary: 'Buscar pavimento por ID' })
  @ApiResponse({ status: 200, description: 'Dados do pavimento' })
  @ApiResponse({ status: 404, description: 'Pavimento não encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.pavimentosService.findOne(id);
  }

  @Patch(':id')
  @Roles(PerfilEnum.GESTOR, PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Atualizar pavimento' })
  @ApiResponse({ status: 200, description: 'Pavimento atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Pavimento não encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePavimentoDto: UpdatePavimentoDto,
  ) {
    return this.pavimentosService.update(id, updatePavimentoDto);
  }

  @Delete(':id')
  @Roles(PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Deletar pavimento (soft delete)' })
  @ApiResponse({
    status: 200,
    description: 'Pavimento deletado com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Pavimento não encontrado' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.pavimentosService.remove(id);
  }
}
