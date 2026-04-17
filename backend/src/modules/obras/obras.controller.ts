import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { ObrasService } from './obras.service';
import { CreateObraDto } from './dto/create-obra.dto';
import { UpdateObraDto } from './dto/update-obra.dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';
import { PerfilEnum } from '../../common/enums';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('obras')
export class ObrasController {
  constructor(private readonly obrasService: ObrasService) {}

  @Post()
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR)
  criar(@Body() dto: CreateObraDto) {
    return this.obrasService.criar(dto);
  }

  @Get()
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.ENCARREGADO, PerfilEnum.FINANCEIRO)
  listar() {
    return this.obrasService.listar();
  }

  @Get(':id')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.ENCARREGADO, PerfilEnum.FINANCEIRO)
  buscarPorId(@Param('id') id: string) {
    return this.obrasService.buscarPorId(id);
  }

  @Put(':id')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR)
  atualizar(@Param('id') id: string, @Body() dto: UpdateObraDto) {
    return this.obrasService.atualizar(id, dto);
  }

  @Delete(':id')
  @Roles(PerfilEnum.ADMIN)
  remover(@Param('id') id: string) {
    return this.obrasService.remover(id);
  }
}
