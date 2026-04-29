import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { CreateAlocacaoItemDto } from './dto/create-alocacao-item.dto';
import { ConcluirAlocacaoItemDto } from './dto/concluir-alocacao-item.dto';
import { AlocacoesItensService } from './alocacoes-itens.service';

@ApiTags('alocacoes-itens')
@Controller({ path: 'alocacoes-itens', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AlocacoesItensController {
  constructor(private readonly alocacoesItensService: AlocacoesItensService) {}

  @Post()
  @Roles(PerfilEnum.ENCARREGADO, PerfilEnum.GESTOR, PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Criar alocacao por item de ambiente' })
  @ApiResponse({ status: 201, description: 'Alocacao por item criada com sucesso' })
  create(@Body() createDto: CreateAlocacaoItemDto) {
    return this.alocacoesItensService.create(createDto);
  }

  @Get()
  @Roles(PerfilEnum.ENCARREGADO, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Listar alocacoes por item' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso' })
  findAll() {
    return this.alocacoesItensService.findAll();
  }

  @Get('sessao/:id_sessao')
  @Roles(PerfilEnum.ENCARREGADO, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Listar alocacoes por item de uma sessao' })
  findBySessao(@Param('id_sessao', ParseUUIDPipe) id_sessao: string) {
    return this.alocacoesItensService.findBySessao(id_sessao);
  }

  @Get('item/:id_item_ambiente')
  @Roles(PerfilEnum.ENCARREGADO, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Listar alocacoes por item de ambiente' })
  findByItem(@Param('id_item_ambiente', ParseUUIDPipe) id_item_ambiente: string) {
    return this.alocacoesItensService.findByItem(id_item_ambiente);
  }

  @Get(':id')
  @Roles(PerfilEnum.ENCARREGADO, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Buscar alocacao por item pelo ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.alocacoesItensService.findOne(id);
  }

  @Patch(':id/concluir')
  @Roles(PerfilEnum.ENCARREGADO, PerfilEnum.GESTOR, PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Concluir alocacao por item' })
  concluir(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConcluirAlocacaoItemDto,
  ) {
    return this.alocacoesItensService.concluir(id, dto);
  }

  @Delete(':id')
  @Roles(PerfilEnum.GESTOR, PerfilEnum.ADMIN)
  @HttpCode(204)
  @ApiOperation({ summary: 'Remover (soft delete) alocacao por item' })
  @ApiResponse({ status: 204, description: 'Removido com sucesso' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.alocacoesItensService.remove(id);
  }
}
