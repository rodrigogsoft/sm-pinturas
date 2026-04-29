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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ObrasService } from './obras.service';
import { CreateObraDto } from './dto/create-obra.dto';
import { UpdateObraDto } from './dto/update-obra.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PerfilEnum } from '../../common/enums';

@ApiTags('obras')
@Controller('obras')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ObrasController {
  constructor(private readonly obrasService: ObrasService) {}

  @Post()
  @Roles(PerfilEnum.ENCARREGADO, PerfilEnum.GESTOR, PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Criar nova obra' })
  @ApiResponse({ status: 201, description: 'Obra criada com sucesso' })
  create(@Body() createObraDto: CreateObraDto) {
    return this.obrasService.create(createObraDto);
  }

  @Get()
  @Roles(
    PerfilEnum.ENCARREGADO,
    PerfilEnum.GESTOR,
    PerfilEnum.FINANCEIRO,
    PerfilEnum.ADMIN,
  )
  @ApiOperation({ summary: 'Listar todas as obras' })
  @ApiResponse({ status: 200, description: 'Lista de obras' })
  findAll() {
    return this.obrasService.findAll();
  }

  @Get(':id')
  @Roles(
    PerfilEnum.ENCARREGADO,
    PerfilEnum.GESTOR,
    PerfilEnum.FINANCEIRO,
    PerfilEnum.ADMIN,
  )
  @ApiOperation({ summary: 'Buscar obra por ID' })
  @ApiResponse({ status: 200, description: 'Dados da obra' })
  @ApiResponse({ status: 404, description: 'Obra não encontrada' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.obrasService.findOne(id);
  }

  @Patch(':id')
  @Roles(PerfilEnum.GESTOR, PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Atualizar obra' })
  @ApiResponse({ status: 200, description: 'Obra atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Obra não encontrada' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateObraDto: UpdateObraDto,
  ) {
    return this.obrasService.update(id, updateObraDto);
  }

  @Delete(':id')
  @Roles(PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Deletar obra (soft delete)' })
  @ApiResponse({ status: 200, description: 'Obra deletada com sucesso' })
  @ApiResponse({ status: 404, description: 'Obra não encontrada' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.obrasService.remove(id);
  }
}
