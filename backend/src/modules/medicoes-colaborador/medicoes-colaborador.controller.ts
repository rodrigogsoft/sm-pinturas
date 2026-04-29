import {
  Query,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
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
import { PerfilEnum } from '../../common/enums';
import { CreateMedicaoColaboradorDto } from './dto/create-medicao-colaborador.dto';
import { MedicoesColaboradorService } from './medicoes-colaborador.service';

@ApiTags('medicoes-colaborador')
@Controller({ path: 'medicoes-colaborador', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MedicoesColaboradorController {
  constructor(private readonly medicoesColaboradorService: MedicoesColaboradorService) {}

  @Post()
  @Roles(PerfilEnum.ENCARREGADO, PerfilEnum.GESTOR, PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Registrar medicao individual por colaborador' })
  @ApiResponse({ status: 201, description: 'Medicao individual criada com sucesso' })
  create(@Body() createDto: CreateMedicaoColaboradorDto) {
    return this.medicoesColaboradorService.create(createDto);
  }

  @Get()
  @Roles(PerfilEnum.ENCARREGADO, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Listar medicoes individuais' })
  findAll() {
    return this.medicoesColaboradorService.findAll();
  }

  @Get('item/:id_item_ambiente')
  @Roles(PerfilEnum.ENCARREGADO, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Listar medicoes individuais por item' })
  findByItem(@Param('id_item_ambiente', ParseUUIDPipe) id_item_ambiente: string) {
    return this.medicoesColaboradorService.findByItem(id_item_ambiente);
  }

  @Get('item/:id_item_ambiente/resumo-producao')
  @Roles(PerfilEnum.ENCARREGADO, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ADMIN)
  @ApiOperation({
    summary: 'Resumo de producao por item de ambiente',
    description: 'Consolida progresso total do item e distribuicao individual por colaborador',
  })
  getResumoProducaoByItem(
    @Param('id_item_ambiente', ParseUUIDPipe) id_item_ambiente: string,
    @Query('data_inicio') data_inicio?: string,
    @Query('data_fim') data_fim?: string,
  ) {
    return this.medicoesColaboradorService.getResumoProducaoByItem(
      id_item_ambiente,
      data_inicio,
      data_fim,
    );
  }

  @Get('colaborador/:id_colaborador')
  @Roles(PerfilEnum.ENCARREGADO, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Listar medicoes individuais por colaborador' })
  findByColaborador(@Param('id_colaborador', ParseUUIDPipe) id_colaborador: string) {
    return this.medicoesColaboradorService.findByColaborador(id_colaborador);
  }

  @Get(':id')
  @Roles(PerfilEnum.ENCARREGADO, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Buscar medicao individual pelo ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.medicoesColaboradorService.findOne(id);
  }

  @Delete(':id')
  @Roles(PerfilEnum.GESTOR, PerfilEnum.ADMIN)
  @HttpCode(204)
  @ApiOperation({ summary: 'Remover (soft delete) medicao individual' })
  @ApiResponse({ status: 204, description: 'Removido com sucesso' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.medicoesColaboradorService.remove(id);
  }
}
