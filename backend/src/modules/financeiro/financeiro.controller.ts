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
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { FinanceiroService } from './financeiro.service';
import { CreateLotePagamentoDto } from './dto/create-lote-pagamento.dto';
import { ProcessarPagamentoDto } from './dto/processar-pagamento.dto';
import { AprovarLoteDto } from './dto/aprovar-lote.dto';
import { FecharPeriodoFolhaDto } from './dto/fechar-periodo-folha.dto';
import { ReabrirPeriodoFolhaDto } from './dto/reabrir-periodo-folha.dto';
import { ConsultarFolhaIndividualDto } from './dto/consultar-folha-individual.dto';
import { ProcessarFolhaIndividualPagamentoDto } from './dto/processar-folha-individual-pagamento.dto';
import { ConsultarApropriacaoDetalhadaDto } from './dto/consultar-apropriacao-detalhada.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import { PerfilEnum } from '../../common/enums';
import { FinanceiroJobsService } from './financeiro-jobs.service';
import { StatusLoteEnum } from './entities/lote-pagamento.entity';

@ApiTags('Financeiro')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'financeiro', version: '1' })
export class FinanceiroController {
  constructor(
    private readonly financeiroService: FinanceiroService,
    private readonly jobsService: FinanceiroJobsService,
  ) {}

  @Post('lotes')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.FINANCEIRO)
  @ApiOperation({
    summary: 'Criar lote de pagamento',
    description: 'Agrupa medições abertas em um lote para processamento de pagamento. RN02: Bloqueado se houver preços pendentes (Admin pode forçar com justificativa)',
  })
  @ApiResponse({ status: 201, description: 'Lote criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Medições inválidas para o lote' })
  @ApiResponse({ status: 403, description: 'RN02: Preços pendentes bloqueiam a geração do lote' })
  async createLote(@Body() createLoteDto: CreateLotePagamentoDto, @Request() req: any) {
    const isAdmin = req.user?.perfil === PerfilEnum.ADMIN;
    return await this.financeiroService.createLote(createLoteDto, isAdmin);
  }

  @Get('lotes')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO)
  @ApiOperation({ summary: 'Listar lotes de pagamento' })
  @ApiQuery({ name: 'status', required: false, enum: StatusLoteEnum })
  @ApiQuery({ name: 'data_inicio', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'data_fim', required: false, description: 'YYYY-MM-DD' })
  async findAll(
    @Query('status') status?: StatusLoteEnum,
    @Query('data_inicio') data_inicio?: string,
    @Query('data_fim') data_fim?: string,
  ) {
    const filters: any = {};

    if (status) filters.status = status;
    if (data_inicio) filters.data_inicio = new Date(data_inicio);
    if (data_fim) filters.data_fim = new Date(data_fim);

    return await this.financeiroService.findAll(filters);
  }

  @Get('dashboard')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO)
  @ApiOperation({
    summary: 'Dashboard financeiro',
    description: 'Resumo de valores pagos/pendentes e status dos lotes',
  })
  @ApiQuery({ name: 'data_inicio', required: false })
  @ApiQuery({ name: 'data_fim', required: false })
  async dashboard(
    @Query('data_inicio') data_inicio?: string,
    @Query('data_fim') data_fim?: string,
  ) {
    return await this.financeiroService.dashboard(
      data_inicio ? new Date(data_inicio) : undefined,
      data_fim ? new Date(data_fim) : undefined,
    );
  }

  @Get('lotes/:id')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO)
  @ApiOperation({ summary: 'Buscar lote por ID' })
  async findOne(@Param('id') id: string) {
    return await this.financeiroService.findOne(id);
  }

  @Get('lotes/:id/medicoes')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO)
  @ApiOperation({
    summary: 'Listar medições do lote',
    description: 'Retorna todas as medições incluídas no lote',
  })
  async getMedicoesDoLote(@Param('id') id: string) {
    return await this.financeiroService.getMedicoesDoLote(id);
  }

  @Get('lotes/:id/preview-vales')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO)
  @ApiOperation({
    summary: 'Simular descontos de vales no lote',
    description: 'Retorna uma previa de compensacao de vales por colaborador sem persistir alteracoes',
  })
  async previewDescontosValesNoLote(@Param('id') id: string) {
    return await this.financeiroService.simularDescontosValesNoLote(id);
  }

  @Post('lotes/:id/enviar-aprovacao')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.FINANCEIRO)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enviar lote para aprovação',
    description: 'Mantém o lote em ABERTO para validação operacional antes do pagamento',
  })
  async enviarParaAprovacao(@Param('id') id: string) {
    return await this.financeiroService.enviarParaAprovacao(id);
  }

  @Post('lotes/:id/aprovar')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Aprovar lote (RF04)',
    description: 'Gestor valida e aprova o lote de pagamento',
  })
  async aprovarLote(@Param('id') id: string, @Body() aprovarDto: AprovarLoteDto, @Request() req: any) {
    return await this.financeiroService.aprovarLote(id, aprovarDto, req.user.id);
  }

  @Post('lotes/:id/processar-pagamento')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.FINANCEIRO)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Processar pagamento',
    description: 'Financeiro executa o pagamento do lote em aberto',
  })
  async processarPagamento(
    @Param('id') id: string,
    @Body() processarDto: ProcessarPagamentoDto,
    @Request() req: any,
  ) {
    return await this.financeiroService.processarPagamento(id, processarDto, req.user.id);
  }

  @Post('lotes/:id/cancelar')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancelar lote',
    description: 'Cancela o lote e libera as medições',
  })
  async cancelarLote(@Param('id') id: string) {
    return await this.financeiroService.cancelarLote(id);
  }

  @Delete('lotes/:id')
  @Roles(PerfilEnum.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar lote (apenas Admin)' })
  async remove(@Param('id') id: string) {
    await this.financeiroService.remove(id);
  }

  @Get('medicoes-pendentes/:id_cliente')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO)
  @ApiOperation({
    summary: 'Listar medições pendentes por cliente',
    description: 'RF10: Retorna medições com status ABERTO, útil para alertas de faturamento',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de medições pendentes com dias de atraso',
    schema: {
      example: {
        total: 5,
        valor_total: 1500.5,
        medicoes: [
          {
            id: 'uuid',
            colaborador: 'João da Silva',
            ambiente: 'Sala 101',
            data_medicao: '2026-02-01',
            valor_total: 300.1,
            dias_pendente: 5,
          },
        ],
      },
    },
  })
  async obterMedicoesPendentes(@Param('id_cliente') id_cliente: string) {
    return await this.jobsService.obterMedicoesPendentes(id_cliente);
  }

  @Get('medicoes-colaborador/para-lote')
  @Roles(PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ADMIN)
  @ApiOperation({
    summary: 'Medições individuais ERS 4.1 prontas para lote',
    description: 'Retorna tb_medicoes_colaborador com status ABERTO para montagem de lote de pagamento',
  })
  @ApiQuery({ name: 'id_colaborador', type: 'string', required: false })
  @ApiQuery({ name: 'id_obra', type: 'string', required: false })
  @ApiResponse({ status: 200, description: 'Medicoes abertas e valor total calculado' })
  async getMedicoesColaboradorParaLote(
    @Query('id_colaborador') id_colaborador?: string,
    @Query('id_obra') id_obra?: string,
  ) {
    return this.financeiroService.getMedicoesColaboradorParaLote(id_colaborador, id_obra);
  }

  @Get('apropriacao-detalhada')
  @Roles(PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ADMIN)
  @ApiOperation({
    summary: 'Consultar apropriação financeira detalhada (ERS 4.1)',
    description: 'Retorna medição individual com valor apropriado (qtd_executada x preco_venda) por colaborador/item/período',
  })
  @ApiQuery({ name: 'data_inicio', required: false, type: String })
  @ApiQuery({ name: 'data_fim', required: false, type: String })
  @ApiQuery({ name: 'id_colaborador', required: false, type: String })
  @ApiQuery({ name: 'id_obra', required: false, type: String })
  @ApiQuery({ name: 'id_item_ambiente', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Pagina (padrao: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por pagina (padrao: 50, max: 200)' })
  async consultarApropriacaoDetalhada(@Query() query: ConsultarApropriacaoDetalhadaDto) {
    return this.financeiroService.consultarApropriacaoDetalhada(query);
  }

  @Post('folha-individual/fechar-periodo')
  @Roles(PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ADMIN)
  @Audit('UPDATE', 'tb_medicoes_colaborador', 'Fechamento de periodo da folha individual')
  @ApiOperation({
    summary: 'Fechar periodo e gerar folha individual por colaborador (ERS 4.1)',
    description: 'Fecha a competencia de medicoes individuais abertas e gera lotes por colaborador',
  })
  @ApiResponse({ status: 201, description: 'Periodo fechado com lotes individuais gerados' })
  async fecharPeriodoFolhaIndividual(@Body() dto: FecharPeriodoFolhaDto) {
    return this.financeiroService.fecharPeriodoFolhaIndividual(dto);
  }

  @Patch('folha-individual/reabrir-periodo')
  @Roles(PerfilEnum.GESTOR, PerfilEnum.ADMIN)
  @Audit('UPDATE', 'tb_medicoes_colaborador', 'Reabertura de periodo da folha individual')
  @ApiOperation({
    summary: 'Reabrir periodo para correcoes (ERS 4.1)',
    description: 'Reabre medicoes individuais de um periodo para permitir correcoes operacionais',
  })
  @ApiResponse({ status: 200, description: 'Periodo reaberto com sucesso' })
  async reabrirPeriodoFolhaIndividual(@Body() dto: ReabrirPeriodoFolhaDto) {
    return this.financeiroService.reabrirPeriodoFolhaIndividual(dto);
  }

  @Get('folha-individual')
  @Roles(PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ADMIN)
  @ApiOperation({
    summary: 'Consultar folha individual agregada por colaborador/competencia',
    description: 'Consulta agregada da folha com filtros de periodo, colaborador, servico e status',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Pagina (padrao: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por pagina (padrao: 50, max: 200)' })
  @ApiResponse({ status: 200, description: 'Consulta de folha individual realizada com sucesso' })
  async consultarFolhaIndividual(@Query() query: ConsultarFolhaIndividualDto) {
    return this.financeiroService.consultarFolhaIndividual(query);
  }

  @Post('folha-individual/processar-pagamento')
  @Roles(PerfilEnum.ADMIN, PerfilEnum.FINANCEIRO)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Processar pagamento da folha individual (linha única ou lote selecionado)',
  })
  async processarPagamentoFolhaIndividual(
    @Body() dto: ProcessarFolhaIndividualPagamentoDto,
    @Request() req: any,
  ) {
    return this.financeiroService.processarPagamentoFolhaIndividual(dto, req.user.id);
  }

  @Get('folha-individual/export/csv')
  @Roles(PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ADMIN)
  @ApiOperation({
    summary: 'Exportar folha individual em CSV',
    description: 'Exporta medições individuais filtradas por periodo, colaborador, lote e obra',
  })
  @ApiResponse({ status: 200, description: 'Arquivo CSV gerado com sucesso' })
  async exportarFolhaIndividualCsv(
    @Res() res: Response,
    @Query() query: ConsultarFolhaIndividualDto,
  ) {
    const csv = await this.financeiroService.exportarFolhaIndividualCsv(query);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="folha-individual-${new Date().toISOString().split('T')[0]}.csv"`,
    );

    return res.status(HttpStatus.OK).send(csv);
  }
}
