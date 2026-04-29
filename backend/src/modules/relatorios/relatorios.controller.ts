import { Controller, Get, Query, UseGuards, Res, HttpStatus, Param, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { RelatoriosService, GranularidadeEnum, MetricaEnum, MetricaRankingEnum } from './relatorios.service';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PerfilEnum } from '../../common/enums';
import {
  GetDashboardFinanceiroDto,
  GetRelatorioMedicoesDto,
  GetRelatorioProdutividadeDto,
  GetRelatorioMargemDto,
  PeriodoEnum,
} from './dto/relatorio.dto';

@ApiTags('Relatórios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('relatorios')
export class RelatoriosController {
  constructor(
    private readonly relatoriosService: RelatoriosService,
    private readonly exportService: ExportService,
  ) {}

  @Get('dashboard-financeiro')
  @Roles(PerfilEnum.GESTOR, PerfilEnum.ADMIN)
  @ApiOperation({
    summary: 'Dashboard Financeiro',
    description: 'Retorna resumo de custo x receita por período e obra',
  })
  @ApiQuery({
    name: 'periodo',
    enum: PeriodoEnum,
    required: false,
    description: 'Período de análise',
  })
  @ApiQuery({
    name: 'periodo',
    enum: PeriodoEnum,
    required: false,
    description: 'Período de análise',
  })
  @ApiQuery({
    name: 'data_inicio',
    type: 'string',
    required: false,
    description: 'Data inicial (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'data_fim',
    type: 'string',
    required: false,
    description: 'Data final (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'id_obra',
    type: 'string',
    required: false,
    description: 'Filtrar por obra (UUID)',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard com métricas financeiras',
  })
  async getDashboardFinanceiro(
    @Query() query: GetDashboardFinanceiroDto,
  ) {
    return await this.relatoriosService.getDashboardFinanceiro(
      query.periodo,
      query.id_obra,
    );
  }

  @Get('medicoes')
  @Roles(
    PerfilEnum.GESTOR,
    PerfilEnum.FINANCEIRO,
    PerfilEnum.ENCARREGADO,
    PerfilEnum.ADMIN,
  )
  @ApiOperation({
    summary: 'Relatório de Medições',
    description: 'Lista todas as medições com filtros de obra e status',
  })
  @ApiQuery({
    name: 'id_obra',
    type: 'string',
    required: false,
    description: 'Filtrar por obra (UUID)',
  })
  @ApiQuery({
    name: 'status_pagamento',
    type: 'string',
    required: false,
    description: 'Filtrar por status de pagamento',
  })
  @ApiQuery({
    name: 'status',
    type: 'string',
    required: false,
    description: 'Filtrar por status (PENDENTE, APROVADA, REJEITADA)',
  })
  @ApiQuery({
    name: 'page',
    type: 'number',
    required: false,
    description: 'Número da página',
  })
  @ApiQuery({
    name: 'limit',
    type: 'number',
    required: false,
    description: 'Itens por página',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de medições com paginação',
  })
  async getRelatorioMedicoes(
    @Query() query: GetRelatorioMedicoesDto,
  ) {
    return await this.relatoriosService.getRelatorioMedicoes(
      query.periodo,
      query.data_inicio,
      query.data_fim,
      query.id_obra,
      query.status_pagamento || query.status,
      query.page,
      query.limit,
    );
  }

  @Get('produtividade')
  @Roles(PerfilEnum.GESTOR, PerfilEnum.ENCARREGADO, PerfilEnum.ADMIN)
  @ApiOperation({
    summary: 'Relatório de Produtividade',
    description: 'Análise de produtividade por colaborador',
  })
  @ApiQuery({
    name: 'periodo',
    enum: PeriodoEnum,
    required: false,
    description: 'Período de análise',
  })
  @ApiQuery({
    name: 'id_obra',
    type: 'string',
    required: false,
    description: 'Filtrar por obra (UUID)',
  })
  @ApiQuery({
    name: 'data_inicio',
    type: 'string',
    required: false,
    description: 'Data inicial (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'data_fim',
    type: 'string',
    required: false,
    description: 'Data final (YYYY-MM-DD)',
  })
  @ApiResponse({
    status: 200,
    description: 'Relatório de produtividade agrupado por colaborador',
  })
  async getRelatorioProdutividade(
    @Query() query: GetRelatorioProdutividadeDto,
  ) {
    return await this.relatoriosService.getRelatorioProdutividade(
      query.periodo,
      query.id_obra,
      query.data_inicio,
      query.data_fim,
    );
  }

  @Get('margem-lucro')
  @Roles(PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ADMIN)
  @ApiOperation({
    summary: 'Relatório de Margem de Lucro',
    description: 'Análise de margem de lucro por serviço',
  })
  @ApiQuery({
    name: 'periodo',
    enum: PeriodoEnum,
    required: false,
    description: 'Período de análise',
  })
  @ApiQuery({
    name: 'data_inicio',
    type: 'string',
    required: false,
    description: 'Data inicial (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'data_fim',
    type: 'string',
    required: false,
    description: 'Data final (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'id_obra',
    type: 'string',
    required: false,
    description: 'Filtrar por obra (UUID)',
  })
  @ApiQuery({
    name: 'page',
    type: 'number',
    required: false,
    description: 'Número da página',
  })
  @ApiQuery({
    name: 'limit',
    type: 'number',
    required: false,
    description: 'Itens por página',
  })
  @ApiResponse({
    status: 200,
    description: 'Relatório de margem com análise por serviço',
  })
  async getRelatorioMargem(
    @Query() query: GetRelatorioMargemDto,
  ) {
    return await this.relatoriosService.getRelatorioMargem(
      query.periodo,
      query.data_inicio,
      query.data_fim,
      query.id_obra,
      query.page,
      query.limit,
    );
  }

  @Get('dashboard-financeiro/comparativo')
  @Roles(PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ADMIN)
  @ApiOperation({
    summary: 'Dashboard Financeiro com Comparativo',
    description: 'Dashboard com comparação entre período atual e anterior, incluindo variações percentuais',
  })
  @ApiQuery({
    name: 'periodo',
    enum: PeriodoEnum,
    required: false,
    description: 'Período de análise (padrão: MES)',
  })
  @ApiQuery({
    name: 'id_obra',
    type: 'string',
    required: false,
    description: 'Filtrar por obra específica (UUID)',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard com comparativo e variações percentuais',
  })
  async getDashboardFinanceiroComComparativo(
    @Query('periodo') periodo?: PeriodoEnum,
    @Query('id_obra') idObra?: string,
  ) {
    return await this.relatoriosService.getDashboardFinanceiroComComparativo(
      periodo,
      idObra,
    );
  }

  @Get('dashboard-financeiro/export')
  @Roles(PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ADMIN)
  @ApiOperation({
    summary: 'Exportar Dashboard Financeiro',
    description: 'Exporta o dashboard financeiro em formato CSV ou Excel',
  })
  @ApiQuery({
    name: 'formato',
    enum: ['csv', 'excel', 'pdf'],
    required: true,
    description: 'Formato de exportação (csv, excel ou pdf)',
  })
  @ApiQuery({
    name: 'periodo',
    enum: PeriodoEnum,
    required: false,
    description: 'Período de análise (padrão: MES)',
  })
  @ApiQuery({
    name: 'id_obra',
    type: 'string',
    required: false,
    description: 'Filtrar por obra específica (UUID)',
  })
  @ApiResponse({
    status: 200,
    description: 'Arquivo CSV ou Excel baixado',
  })
  async exportDashboardFinanceiro(
    @Res() res: Response,
    @Query('formato') formato: 'csv' | 'excel' | 'pdf',
    @Query('periodo') periodo?: PeriodoEnum,
    @Query('id_obra') idObra?: string,
  ) {
    const dashboard = await this.relatoriosService.getDashboardFinanceiro(
      periodo,
      idObra,
    );

    if (formato === 'csv') {
      const headers = [
        'Obra',
        'Medições',
        'Custo',
        'Receita',
        'Lucro',
        'Margem %',
      ];
      const data = dashboard.por_obra.map((obra) => [
        obra.obra_nome,
        obra.medicoes.toString(),
        obra.custo.toFixed(2),
        obra.receita.toFixed(2),
        obra.lucro.toFixed(2),
        obra.margem.toFixed(2),
      ]);

      const csv = this.exportService.toCsv(data, headers);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="dashboard-financeiro-${new Date().toISOString().split('T')[0]}.csv"`,
      );
      return res.status(HttpStatus.OK).send(csv);
    } else if (formato === 'excel') {
      const buffer = await this.exportService.dashboardFinanceiroToExcel(dashboard);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="dashboard-financeiro-${new Date().toISOString().split('T')[0]}.xlsx"`,
      );
      return res.status(HttpStatus.OK).send(buffer);
    } else {
      const buffer = await this.exportService.dashboardFinanceiroToPdf(dashboard);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="dashboard-financeiro-${new Date().toISOString().split('T')[0]}.pdf"`,
      );
      return res.status(HttpStatus.OK).send(buffer);
    }
  }

  @Get('evolucao-temporal')
  @Roles(PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ADMIN)
  @ApiOperation({
    summary: 'Evolução Temporal de Métricas',
    description: 'Retorna série temporal de receita, custo, lucro ou margem com granularidade configurável',
  })
  @ApiQuery({
    name: 'granularidade',
    enum: GranularidadeEnum,
    required: true,
    description: 'DIARIA, SEMANAL ou MENSAL',
  })
  @ApiQuery({
    name: 'metrica',
    enum: MetricaEnum,
    required: true,
    description: 'RECEITA, CUSTO, LUCRO ou MARGEM',
  })
  @ApiQuery({
    name: 'id_obra',
    type: 'string',
    required: false,
    description: 'Filtrar por obra específica (UUID)',
  })
  @ApiQuery({
    name: 'periodo',
    enum: PeriodoEnum,
    required: false,
    description: 'Período completo (padrão: últimos 90 dias)',
  })
  @ApiResponse({
    status: 200,
    description: 'Série temporal com granularidade especificada',
  })
  async getEvolucaoTemporal(
    @Query('granularidade') granularidade: GranularidadeEnum,
    @Query('metrica') metrica: MetricaEnum,
    @Query('id_obra') idObra?: string,
    @Query('periodo') periodo?: PeriodoEnum,
  ) {
    return await this.relatoriosService.getEvolucaoTemporal(
      granularidade,
      metrica,
      idObra,
      periodo,
    );
  }

  @Get('excedentes')
  @Roles(PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ENCARREGADO, PerfilEnum.ADMIN)
  @ApiOperation({
    summary: 'Relatório de Excedentes',
    description: 'Análise detalhada de medições excedentes com top 10 ambientes e colaboradores',
  })
  @ApiQuery({
    name: 'periodo',
    enum: PeriodoEnum,
    required: false,
    description: 'Período de análise (padrão: MES)',
  })
  @ApiQuery({
    name: 'id_obra',
    type: 'string',
    required: false,
    description: 'Filtrar por obra específica (UUID)',
  })
  @ApiResponse({
    status: 200,
    description: 'Resumo de excedentes com rankings de ambientes e colaboradores',
  })
  async getRelatorioExcedentes(
    @Query('periodo') periodo?: PeriodoEnum,
    @Query('id_obra') idObra?: string,
  ) {
    return await this.relatoriosService.getRelatorioExcedentes(periodo, idObra);
  }

  @Get('ranking-obras')
  @Roles(PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ADMIN)
  @ApiOperation({
    summary: 'Ranking de Obras',
    description: 'Ranking de obras ordenadas por métrica (margem, receita, lucro ou produtividade)',
  })
  @ApiQuery({
    name: 'metrica',
    enum: MetricaRankingEnum,
    required: true,
    description: 'MARGEM, RECEITA, LUCRO ou PRODUTIVIDADE',
  })
  @ApiQuery({
    name: 'ordem',
    enum: ['ASC', 'DESC'],
    required: false,
    description: 'Ordem de classificação (padrão: DESC)',
  })
  @ApiQuery({
    name: 'limit',
    type: 'number',
    required: false,
    description: 'Número máximo de obras (padrão: 10)',
  })
  @ApiQuery({
    name: 'periodo',
    enum: PeriodoEnum,
    required: false,
    description: 'Período de análise (padrão: MES)',
  })
  @ApiResponse({
    status: 200,
    description: 'Ranking de obras com todas as métricas',
  })
  async getRankingObras(
    @Query('metrica') metrica: MetricaRankingEnum,
    @Query('ordem') ordem?: 'ASC' | 'DESC',
    @Query('limit') limit?: number,
    @Query('periodo') periodo?: PeriodoEnum,
  ) {
    return await this.relatoriosService.getRankingObras(
      metrica,
      ordem,
      limit ? Number(limit) : undefined,
      periodo,
    );
  }

  @Get('producao-colaborador/:id_colaborador')
  @Roles(PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ADMIN)
  @ApiOperation({
    summary: 'Produção individual por colaborador (ERS 4.1)',
    description: 'Relatório de produção individual usando tb_medicoes_colaborador',
  })
  @ApiQuery({ name: 'id_obra', type: 'string', required: false })
  @ApiQuery({ name: 'data_inicio', type: 'string', required: false, example: '2026-01-01' })
  @ApiQuery({ name: 'data_fim', type: 'string', required: false, example: '2026-03-31' })
  @ApiResponse({ status: 200, description: 'Relatorio de producao individual' })
  async getProducaoIndividualColaborador(
    @Param('id_colaborador', ParseUUIDPipe) id_colaborador: string,
    @Query('id_obra') id_obra?: string,
    @Query('data_inicio') data_inicio?: string,
    @Query('data_fim') data_fim?: string,
  ) {
    return this.relatoriosService.getProducaoIndividualColaborador(
      id_colaborador,
      id_obra,
      data_inicio,
      data_fim,
    );
  }

  @Get('vales-adiantamento')
  @Roles(PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO, PerfilEnum.ADMIN)
  @ApiOperation({
    summary: 'Saldo de vales adiantamento (ERS 4.1)',
    description: 'Relatorio de vales adiantamento com saldo em aberto',
  })
  @ApiQuery({ name: 'id_colaborador', type: 'string', required: false })
  @ApiQuery({ name: 'id_obra', type: 'string', required: false })
  @ApiResponse({ status: 200, description: 'Saldo de vales adiantamento' })
  async getSaldoValesAdiantamento(
    @Query('id_colaborador') id_colaborador?: string,
    @Query('id_obra') id_obra?: string,
  ) {
    return this.relatoriosService.getSaldoValesAdiantamento(id_colaborador, id_obra);
  }
}
