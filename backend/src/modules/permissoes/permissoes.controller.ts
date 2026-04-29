import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  ParseIntPipe,
  Request,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PermissoesService } from './permissoes.service';
import { UpdatePermissoesDto } from './dto/update-permissoes.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PerfilEnum } from '../../common/enums';

@ApiTags('permissoes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('permissoes')
export class PermissoesController {
  constructor(private readonly permissoesService: PermissoesService) {}

  @Get('perfis')
  @Roles(PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Lista todos os perfis com suas permissões' })
  listarPerfis() {
    return this.permissoesService.listarPerfis();
  }

  @Get('perfis/:id')
  @Roles(PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Retorna um perfil com suas permissões' })
  buscarPorId(@Param('id', ParseIntPipe) id: number) {
    return this.permissoesService.buscarPorId(id);
  }

  @Patch('perfis/:id')
  @Roles(PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Atualiza permissões de um perfil (ADMIN apenas)' })
  atualizarPermissoes(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePermissoesDto,
    @Request() req: any,
  ) {
    const ip = req.ip || req.connection?.remoteAddress;
    const idUsuario = req.user?.id || req.user?.sub;

    if (!idUsuario) {
      throw new UnauthorizedException('Usuário autenticado inválido');
    }

    return this.permissoesService.atualizarPermissoes(id, dto, idUsuario, ip);
  }

  @Get('meu-perfil')
  @ApiOperation({ summary: 'Retorna as permissões do perfil do usuário logado' })
  meuPerfil(@Request() req: any) {
    return this.permissoesService.buscarPorId(req.user.perfil);
  }
}
