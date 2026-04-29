import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PerfilEnum } from '../../common/enums';
import { ApropriacoesFinanceirasService } from './apropriacoes-financeiras.service';
import { AprovarApropriacaoDto } from './dto/aprovar-apropriacao.dto';
import { StatusApropriacao } from './entities/apropriacao-financeira.entity';

@ApiTags('apropriacoes-financeiras')
@Controller({ path: 'apropriacoes-financeiras', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ApropriacoesFinanceirasController {
  constructor(private readonly service: ApropriacoesFinanceirasService) {}

  /**
   * RF13 — Gera apropriações pendentes para todas as medições de uma obra
   * que ainda não possuem apropriação criada.
   */
  @Post('gerar/:id_obra')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO)
  @ApiOperation({ summary: 'Gerar apropriações financeiras para a obra' })
  gerarParaObra(
    @Param('id_obra', ParseUUIDPipe) id_obra: string,
    @Query('competencia') competencia: string,
  ) {
    const comp = competencia ?? new Date().toISOString().slice(0, 10);
    return this.service.gerarParaObra(id_obra, comp);
  }

  /** Listar apropriações de uma obra, com filtro opcional por status */
  @Get('obra/:id_obra')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO)
  @ApiOperation({ summary: 'Listar apropriações por obra' })
  findByObra(
    @Param('id_obra', ParseUUIDPipe) id_obra: string,
    @Query('status') status?: StatusApropriacao,
  ) {
    return this.service.findByObra(id_obra, status);
  }

  /** Listar apropriações de um colaborador */
  @Get('colaborador/:id_colaborador')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO)
  @ApiOperation({ summary: 'Listar apropriações por colaborador' })
  findByColaborador(@Param('id_colaborador', ParseUUIDPipe) id_colaborador: string) {
    return this.service.findByColaborador(id_colaborador);
  }

  /** Resumo financeiro agrupado por colaborador (para folha de pagamento) */
  @Get('resumo/:id_obra')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO)
  @ApiOperation({ summary: 'Resumo financeiro por colaborador' })
  resumoPorColaborador(
    @Param('id_obra', ParseUUIDPipe) id_obra: string,
    @Query('competencia') competencia: string,
  ) {
    const comp = competencia ?? new Date().toISOString().slice(0, 10);
    return this.service.resumoPorColaborador(id_obra, comp);
  }

  @Get(':id')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  /** RF13 — Aprovar apropriação */
  @Patch(':id/aprovar')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR)
  @ApiOperation({ summary: 'Aprovar apropriação financeira individual' })
  aprovar(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.service.aprovar(id, req.user.id);
  }

  /** RF13 — Rejeitar apropriação */
  @Patch(':id/rejeitar')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR)
  @ApiOperation({ summary: 'Rejeitar apropriação financeira individual' })
  rejeitar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AprovarApropriacaoDto,
    @Request() req: any,
  ) {
    return this.service.rejeitar(id, req.user.id, dto);
  }
}
