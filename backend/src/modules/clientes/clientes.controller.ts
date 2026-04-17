import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';
import { PerfilEnum } from '../../common/enums';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Post()
  @Roles(PerfilEnum.ADMIN, PerfilEnum.FINANCEIRO)
  criar(@Body() dto: CreateClienteDto) {
    return this.clientesService.criar(dto);
  }

  @Get()
  @Roles(PerfilEnum.ADMIN, PerfilEnum.FINANCEIRO, PerfilEnum.GESTOR)
  listar() {
    return this.clientesService.listar();
  }

  @Get(':id')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.FINANCEIRO, PerfilEnum.GESTOR)
  buscarPorId(@Param('id') id: string) {
    return this.clientesService.buscarPorId(id);
  }

  @Put(':id')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.FINANCEIRO)
  atualizar(@Param('id') id: string, @Body() dto: UpdateClienteDto) {
    return this.clientesService.atualizar(id, dto);
  }

  @Delete(':id')
  @Roles(PerfilEnum.ADMIN)
  remover(@Param('id') id: string) {
    return this.clientesService.remover(id);
  }
}
