import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MedicoesService } from './medicoes.service';
import { CreateMedicaoDto } from './dto/create-medicao.dto';
import { UpdateMedicaoDto } from './dto/update-medicao.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PerfilEnum, StatusPagamentoEnum } from '../../common/enums';

@ApiTags('Medições')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'medicoes', version: '1' })
export class MedicoesController {
  constructor(private readonly medicoesService: MedicoesService) {}

  @Post()
  @Roles(PerfilEnum.ADMIN, PerfilEnum.ENCARREGADO)
  @ApiOperation({
    summary: 'Criar nova medição (RF08 + RN02)',
    description: 'Registra produção executada. Valida excedentes exigindo justificativa e foto. RN02: Bloqueia se preço não aprovado',
  })
  @ApiResponse({ status: 201, description: 'Medição criada com sucesso' })
  @ApiResponse({
    status: 400,
    description: 'Erro de validação: excedente sem justificativa/foto ou preço não aprovado',
    schema: {
      example: {
        message: 'Não é possível criar medição: tabela de preços não aprovada',
        codigo: 'PRECO_NAOAPROVADO',
        status_atual: 'PENDENTE',
        detalhes: 'O preço de venda para este serviço deve ser aprovado pelo GESTOR',
      },
    },
  })
  async create(
    @Body() createMedicaoDto: CreateMedicaoDto,
    @Request() req: any,
  ) {
    return await this.medicoesService.create(createMedicaoDto, req.user);
  }

  @Get()
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ENCARREGADO)
  @ApiOperation({ summary: 'Listar medições com filtros' })
  @ApiQuery({ name: 'id_sessao', required: false })
  @ApiQuery({ name: 'id_alocacao', required: false })
  @ApiQuery({ name: 'data_inicio', required: false, description: 'Data inicial (YYYY-MM-DD)' })
  @ApiQuery({ name: 'data_fim', required: false, description: 'Data final (YYYY-MM-DD)' })
  @ApiQuery({ name: 'status_pagamento', required: false, enum: StatusPagamentoEnum })
  @ApiQuery({ name: 'flag_excedente', required: false, type: Boolean })
  async findAll(
    @Query('id_sessao') id_sessao?: string,
    @Query('id_alocacao') id_alocacao?: string,
    @Query('data_inicio') data_inicio?: string,
    @Query('data_fim') data_fim?: string,
    @Query('status_pagamento') status_pagamento?: StatusPagamentoEnum,
    @Query('flag_excedente') flag_excedente?: string,
  ) {
    const filters: any = {};

    if (id_sessao) filters.id_sessao = id_sessao;
    if (id_alocacao) filters.id_alocacao = id_alocacao;
    if (data_inicio) filters.data_inicio = new Date(data_inicio);
    if (data_fim) filters.data_fim = new Date(data_fim);
    if (status_pagamento) filters.status_pagamento = status_pagamento;
    if (flag_excedente !== undefined) {
      filters.flag_excedente = flag_excedente === 'true';
    }

    const medicoes = await this.medicoesService.findAll(filters);
    return medicoes.map((m) => {
      const tabelaPreco = (m.alocacao as any)?.item_ambiente?.tabelaPreco;
      const qtd = Number(m.qtd_executada) || 0;
      const valorCalc = Number(m.valor_calculado) || 0;
      const precoCusto = tabelaPreco?.preco_custo != null
        ? Number(tabelaPreco.preco_custo)
        : (qtd > 0 ? valorCalc / qtd : 0);
      return { ...m, preco_custo: precoCusto };
    });
  }

  @Get('excedentes')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR)
  @ApiOperation({
    summary: 'Listar medições excedentes',
    description: 'Retorna todas as medições que ultrapassaram a área planejada',
  })
  async findExcedentes() {
    return await this.medicoesService.findExcedentes();
  }

  @Get('pendentes-pagamento')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO)
  @ApiOperation({
    summary: 'Listar medições pendentes de pagamento',
    description: 'Retorna medições com status ABERTO',
  })
  async findPendentesPagamento() {
    return await this.medicoesService.findPendentesPagamento();
  }

  @Get('relatorio/producao')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR)
  @ApiOperation({
    summary: 'Relatório de produtividade',
    description: 'Agrega produção por colaborador em período',
  })
  @ApiQuery({ name: 'data_inicio', required: true, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'data_fim', required: true, description: 'YYYY-MM-DD' })
  async relatorioProducao(
    @Query('data_inicio') data_inicio: string,
    @Query('data_fim') data_fim: string,
  ) {
    return await this.medicoesService.relatorioProducao(
      new Date(data_inicio),
      new Date(data_fim),
    );
  }

  @Get('colaborador/:id_colaborador/total')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR)
  @ApiOperation({
    summary: 'Total executado por colaborador',
    description: 'Calcula soma de quantidade executada por colaborador',
  })
  @ApiQuery({ name: 'data_inicio', required: false })
  @ApiQuery({ name: 'data_fim', required: false })
  async calcularTotalPorColaborador(
    @Param('id_colaborador') id_colaborador: string,
    @Query('data_inicio') data_inicio?: string,
    @Query('data_fim') data_fim?: string,
  ) {
    return await this.medicoesService.calcularTotalPorColaborador(
      id_colaborador,
      data_inicio ? new Date(data_inicio) : undefined,
      data_fim ? new Date(data_fim) : undefined,
    );
  }

  @Get(':id')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ENCARREGADO)
  @ApiOperation({ summary: 'Buscar medição por ID' })
  async findOne(@Param('id') id: string) {
    return await this.medicoesService.findOne(id);
  }

  @Patch(':id')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR)
  @ApiOperation({ summary: 'Atualizar medição' })
  @ApiResponse({ status: 400, description: 'Não é possível modificar medição paga' })
  async update(@Param('id') id: string, @Body() updateMedicaoDto: UpdateMedicaoDto) {
    return await this.medicoesService.update(id, updateMedicaoDto);
  }

  @Delete(':id')
  @Roles(PerfilEnum.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar medição (apenas Admin)' })
  @ApiResponse({ status: 400, description: 'Não é possível deletar medição paga' })
  async remove(@Param('id') id: string) {
    await this.medicoesService.remove(id);
  }
}
