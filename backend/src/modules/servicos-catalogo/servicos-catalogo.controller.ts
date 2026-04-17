import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ServicosCatalogoService } from './servicos-catalogo.service';
import { CreateServicoCatalogoDto } from './dto/create-servico-catalogo.dto';
import { UpdateServicoCatalogoDto } from './dto/update-servico-catalogo.dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';
import { PerfilEnum } from '../../common/enums';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('servicos-catalogo')
export class ServicosCatalogoController {
  constructor(private readonly servicosService: ServicosCatalogoService) {}

  @Post()
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR)
  criar(@Body() dto: CreateServicoCatalogoDto) {
    return this.servicosService.criar(dto);
  }

  @Get()
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ENCARREGADO)
  listar() {
    return this.servicosService.listar();
  }

  @Get(':id')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ENCARREGADO)
  buscarPorId(@Param('id', ParseIntPipe) id: number) {
    return this.servicosService.buscarPorId(id);
  }

  @Put(':id')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO)
  atualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateServicoCatalogoDto) {
    return this.servicosService.atualizar(id, dto);
  }

  @Delete(':id')
  @Roles(PerfilEnum.ADMIN)
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.servicosService.remover(id);
  }
}
