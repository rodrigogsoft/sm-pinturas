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
import { AmbientesService } from './ambientes.service';
import { CreateAmbienteDto } from './dto/create-ambiente.dto';
import { UpdateAmbienteDto } from './dto/update-ambiente.dto';
import { CreateAmbientesLoteDto } from './dto/create-ambientes-lote.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PerfilEnum } from '../../common/enums';

@ApiTags('ambientes')
@Controller({ path: 'ambientes', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AmbientesController {
  constructor(private readonly ambientesService: AmbientesService) {}

  @Post()
  @Roles(PerfilEnum.ENCARREGADO, PerfilEnum.GESTOR, PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Criar novo ambiente' })
  @ApiResponse({ status: 201, description: 'Ambiente criado com sucesso' })
  @ApiResponse({ status: 404, description: 'Pavimento não encontrado' })
  create(@Body() createAmbienteDto: CreateAmbienteDto) {
    return this.ambientesService.create(createAmbienteDto);
  }

  @Post('lote')
  @Roles(PerfilEnum.ENCARREGADO, PerfilEnum.GESTOR, PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Criar ambientes em lote para múltiplos pavimentos' })
  @ApiResponse({ status: 201, description: 'Resumo: criados, pulados, conflitos' })
  @ApiResponse({ status: 400, description: 'Parâmetros inválidos' })
  @ApiResponse({ status: 404, description: 'Pavimento não encontrado ou não pertence à obra' })
  @ApiResponse({ status: 409, description: 'Conflito de nome (modoConflito=FAIL)' })
  createLote(@Body() dto: CreateAmbientesLoteDto) {
    return this.ambientesService.createLote(dto);
  }

  @Get()
  @Roles(
    PerfilEnum.ENCARREGADO,
    PerfilEnum.GESTOR,
    PerfilEnum.FINANCEIRO,
    PerfilEnum.ADMIN,
  )
  @ApiOperation({ summary: 'Listar todos os ambientes' })
  @ApiResponse({ status: 200, description: 'Lista de ambientes' })
  findAll() {
    return this.ambientesService.findAll();
  }

  @Get('pavimento/:id_pavimento')
  @Roles(
    PerfilEnum.ENCARREGADO,
    PerfilEnum.GESTOR,
    PerfilEnum.FINANCEIRO,
    PerfilEnum.ADMIN,
  )
  @ApiOperation({ summary: 'Listar ambientes de um pavimento específico' })
  @ApiResponse({ status: 200, description: 'Lista de ambientes do pavimento' })
  @ApiResponse({ status: 404, description: 'Pavimento não encontrado' })
  findByPavimento(@Param('id_pavimento', ParseUUIDPipe) id_pavimento: string) {
    return this.ambientesService.findByPavimento(id_pavimento);
  }

  @Get('obra/:id_obra')
  @Roles(
    PerfilEnum.ENCARREGADO,
    PerfilEnum.GESTOR,
    PerfilEnum.FINANCEIRO,
    PerfilEnum.ADMIN,
  )
  @ApiOperation({ summary: 'Listar ambientes de uma obra específica' })
  @ApiResponse({ status: 200, description: 'Lista de ambientes da obra' })
  @ApiResponse({ status: 404, description: 'Obra não encontrada' })
  findByObra(@Param('id_obra', ParseUUIDPipe) id_obra: string) {
    return this.ambientesService.findByObra(id_obra);
  }

  @Get(':id')
  @Roles(
    PerfilEnum.ENCARREGADO,
    PerfilEnum.GESTOR,
    PerfilEnum.FINANCEIRO,
    PerfilEnum.ADMIN,
  )
  @ApiOperation({ summary: 'Buscar ambiente por ID' })
  @ApiResponse({ status: 200, description: 'Dados do ambiente' })
  @ApiResponse({ status: 404, description: 'Ambiente não encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ambientesService.findOne(id);
  }

  @Patch(':id')
  @Roles(PerfilEnum.ENCARREGADO, PerfilEnum.GESTOR, PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Atualizar ambiente' })
  @ApiResponse({ status: 200, description: 'Ambiente atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Ambiente não encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAmbienteDto: UpdateAmbienteDto,
  ) {
    return this.ambientesService.update(id, updateAmbienteDto);
  }

  @Delete(':id')
  @Roles(PerfilEnum.ENCARREGADO, PerfilEnum.GESTOR, PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Deletar ambiente (soft delete)' })
  @ApiResponse({ status: 200, description: 'Ambiente deletado com sucesso' })
  @ApiResponse({ status: 404, description: 'Ambiente não encontrado' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.ambientesService.remove(id);
  }
}
