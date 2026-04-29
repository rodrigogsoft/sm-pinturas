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
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ColaboradoresService } from './colaboradores.service';
import { CreateColaboradorDto } from './dto/create-colaborador.dto';
import { UpdateColaboradorDto } from './dto/update-colaborador.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PerfilEnum } from '../../common/enums';

@ApiTags('colaboradores')
@Controller('colaboradores')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ColaboradoresController {
  constructor(
    private readonly colaboradoresService: ColaboradoresService,
  ) {}

  @Post()
  @Roles(PerfilEnum.ENCARREGADO, PerfilEnum.GESTOR, PerfilEnum.ADMIN)
  @ApiOperation({
    summary: 'Criar novo colaborador',
    description:
      'RN04: Dados bancários são automaticamente criptografados com AES-256-GCM',
  })
  @ApiResponse({
    status: 201,
    description: 'Colaborador criado com sucesso (dados sensíveis encriptados)',
  })
  @ApiResponse({ status: 409, description: 'CPF/NIF já cadastrado' })
  create(@Body() createColaboradorDto: CreateColaboradorDto) {
    return this.colaboradoresService.create(createColaboradorDto);
  }

  @Get()
  @Roles(
    PerfilEnum.ENCARREGADO,
    PerfilEnum.GESTOR,
    PerfilEnum.FINANCEIRO,
    PerfilEnum.ADMIN,
  )
  @ApiOperation({ summary: 'Listar todos os colaboradores' })
  @ApiQuery({
    name: 'apenasAtivos',
    required: false,
    type: Boolean,
    description: 'Filtrar apenas colaboradores ativos',
  })
  @ApiResponse({ status: 200, description: 'Lista de colaboradores' })
  findAll(@Query('apenasAtivos') apenasAtivos?: string) {
    return this.colaboradoresService.findAll(apenasAtivos === 'true');
  }

  @Get(':id')
  @Roles(
    PerfilEnum.ENCARREGADO,
    PerfilEnum.GESTOR,
    PerfilEnum.FINANCEIRO,
    PerfilEnum.ADMIN,
  )
  @ApiOperation({ summary: 'Buscar colaborador por ID' })
  @ApiResponse({ status: 200, description: 'Dados do colaborador' })
  @ApiResponse({ status: 404, description: 'Colaborador não encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.colaboradoresService.findOne(id);
  }

  @Patch(':id')
  @Roles(PerfilEnum.ENCARREGADO, PerfilEnum.GESTOR, PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Atualizar colaborador' })
  @ApiResponse({
    status: 200,
    description: 'Colaborador atualizado com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Colaborador não encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateColaboradorDto: UpdateColaboradorDto,
  ) {
    return this.colaboradoresService.update(id, updateColaboradorDto);
  }

  @Delete(':id')
  @Roles(PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Deletar colaborador (soft delete)' })
  @ApiResponse({
    status: 200,
    description: 'Colaborador deletado com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Colaborador não encontrado' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.colaboradoresService.remove(id);
  }
}
