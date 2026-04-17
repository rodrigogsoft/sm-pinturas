import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { ColaboradoresService } from './colaboradores.service';
import { CreateColaboradorDto } from './dto/create-colaborador.dto';
import { UpdateColaboradorDto } from './dto/update-colaborador.dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';
import { PerfilEnum } from '../../common/enums';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('colaboradores')
export class ColaboradoresController {
  constructor(private readonly colaboradoresService: ColaboradoresService) {}

  @Post()
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR)
  criar(@Body() dto: CreateColaboradorDto) {
    return this.colaboradoresService.criar(dto);
  }

  @Get()
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO)
  listar() {
    return this.colaboradoresService.listar();
  }

  @Get(':id')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO)
  buscarPorId(@Param('id') id: string) {
    return this.colaboradoresService.buscarPorId(id);
  }

  @Put(':id')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR)
  atualizar(@Param('id') id: string, @Body() dto: UpdateColaboradorDto) {
    return this.colaboradoresService.atualizar(id, dto);
  }

  @Delete(':id')
  @Roles(PerfilEnum.ADMIN)
  remover(@Param('id') id: string) {
    return this.colaboradoresService.remover(id);
  }
}
