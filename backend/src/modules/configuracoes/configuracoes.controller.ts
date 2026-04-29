import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ConfiguracoesService } from './configuracoes.service';
import { UpdateConfiguracaoDto } from './dto/update-configuracao.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PerfilEnum } from '../../common/enums';

@ApiTags('configuracoes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('configuracoes')
export class ConfiguracoesController {
  constructor(private readonly configuracoesService: ConfiguracoesService) {}

  @Get()
  @Roles(PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Lista todas as configurações do sistema' })
  findAll() {
    return this.configuracoesService.findAll();
  }

  @Get(':chave')
  @Roles(PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Busca uma configuração pela chave' })
  findOne(@Param('chave') chave: string) {
    return this.configuracoesService.findByChave(chave);
  }

  @Patch(':chave')
  @Roles(PerfilEnum.ADMIN)
  @ApiOperation({ summary: 'Atualiza o valor ou status de uma configuração' })
  update(
    @Param('chave') chave: string,
    @Body() dto: UpdateConfiguracaoDto,
  ) {
    return this.configuracoesService.update(chave, dto);
  }
}
