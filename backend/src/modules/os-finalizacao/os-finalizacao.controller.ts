import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Request,
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
import { OsFinalizacaoService } from './os-finalizacao.service';
import { CreateOsFinalizacaoDto } from './dto/create-os-finalizacao.dto';

@ApiTags('os-finalizacao')
@Controller({ path: 'os-finalizacao', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class OsFinalizacaoController {
  constructor(private readonly osFinalizacaoService: OsFinalizacaoService) {}

  /**
   * RF19 — Verifica elementos incompletos antes de finalizar.
   * Usado pelo frontend para exibir o pop-up de alerta.
   */
  @Get('verificar/:id_obra')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO)
  @ApiOperation({ summary: 'Verificar itens incompletos antes de finalizar a O.S.' })
  verificarPendentes(@Param('id_obra', ParseUUIDPipe) id_obra: string) {
    return this.osFinalizacaoService.verificarItensPendentes(id_obra);
  }

  /**
   * RF19 — Finaliza a O.S. com assinatura digital, nome e CPF do fiscalizador.
   * Exige justificativa se houver elementos incompletos.
   */
  @Post()
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR)
  @ApiOperation({ summary: 'Finalizar O.S. com assinatura digital' })
  @ApiResponse({ status: 201, description: 'O.S. finalizada com sucesso' })
  finalizar(@Body() dto: CreateOsFinalizacaoDto, @Request() req: any) {
    return this.osFinalizacaoService.finalizar(dto, req.user.id);
  }

  /** Histórico de finalizações de uma obra */
  @Get('obra/:id_obra')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO)
  @ApiOperation({ summary: 'Listar finalizações de uma obra' })
  findByObra(@Param('id_obra', ParseUUIDPipe) id_obra: string) {
    return this.osFinalizacaoService.findByObra(id_obra);
  }

  @Get(':id')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO)
  @ApiOperation({ summary: 'Buscar finalização por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.osFinalizacaoService.findOne(id);
  }
}
