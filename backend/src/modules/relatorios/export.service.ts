import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

@Injectable()
export class ExportService {
  /**
   * Exporta dados para formato CSV
   */
  toCsv(data: any[], headers: string[]): string {
    if (data.length === 0) return '';

    const csvRows = [];

    // Cabeçalho
    csvRows.push(headers.join(','));

    // Dados
    for (const row of data) {
      const values = headers.map((header) => {
        const value = row[header] ?? '';
        // Escapar vírgulas e aspas
        const escaped = String(value).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  /**
   * Exporta dados para formato Excel (XLSX)
   */
  async toExcel(
    data: any[],
    headers: { key: string; header: string; width?: number }[],
    sheetName = 'Dados',
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Definir colunas
    worksheet.columns = headers.map((h) => ({
      header: h.header,
      key: h.key,
      width: h.width || 15,
    }));

    // Estilo do cabeçalho
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Adicionar dados
    worksheet.addRows(data);

    // Retornar buffer
    const buffer = (await workbook.xlsx.writeBuffer()) as any;
    return buffer;
  }

  /**
   * Exporta dashboard financeiro para Excel com múltiplas sheets
   */
  async dashboardFinanceiroToExcel(dashboardData: any): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();

    // Sheet 1: Métricas Gerais
    const sheetMetricas = workbook.addWorksheet('Métricas Gerais');
    sheetMetricas.columns = [
      { header: 'Métrica', key: 'metrica', width: 30 },
      { header: 'Valor', key: 'valor', width: 20 },
    ];

    sheetMetricas.addRows([
      { metrica: 'Obras Ativas', valor: dashboardData.metricas.obras_ativas },
      {
        metrica: 'Total de Medições',
        valor: dashboardData.metricas.total_medicoes,
      },
      {
        metrica: 'Custo Total (R$)',
        valor: dashboardData.metricas.custo_total,
      },
      {
        metrica: 'Receita Total (R$)',
        valor: dashboardData.metricas.receita_total,
      },
      {
        metrica: 'Lucro Bruto (R$)',
        valor: dashboardData.metricas.lucro_bruto,
      },
      {
        metrica: 'Margem (%)',
        valor: dashboardData.metricas.margem_percentual,
      },
    ]);

    // Estilo do cabeçalho
    sheetMetricas.getRow(1).font = { bold: true };
    sheetMetricas.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    sheetMetricas.getRow(1).font = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };

    // Sheet 2: Por Obra
    const sheetObras = workbook.addWorksheet('Por Obra');
    sheetObras.columns = [
      { header: 'Obra', key: 'obra_nome', width: 30 },
      { header: 'Medições', key: 'medicoes', width: 12 },
      { header: 'Custo (R$)', key: 'custo', width: 15 },
      { header: 'Receita (R$)', key: 'receita', width: 15 },
      { header: 'Lucro (R$)', key: 'lucro', width: 15 },
      { header: 'Margem (%)', key: 'margem', width: 12 },
    ];

    sheetObras.addRows(dashboardData.por_obra);

    // Estilo do cabeçalho
    sheetObras.getRow(1).font = { bold: true };
    sheetObras.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    sheetObras.getRow(1).font = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };

    const buffer = (await workbook.xlsx.writeBuffer()) as any;
    return buffer;
  }

  /**
   * Exporta dashboard financeiro para PDF
   */
  async dashboardFinanceiroToPdf(dashboardData: any): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];

    return new Promise((resolve) => {
      doc.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.fontSize(18).text('Dashboard Financeiro', { align: 'left' });
      doc.moveDown(0.3);
      doc
        .fontSize(10)
        .text(
          `Periodo: ${dashboardData?.periodo?.inicio ?? '-'} a ${dashboardData?.periodo?.fim ?? '-'}`,
        );

      doc.moveDown();
      doc.fontSize(13).text('Metricas Gerais');
      doc.moveDown(0.5);

      const metricas = [
        ['Obras Ativas', dashboardData?.metricas?.obras_ativas ?? 0],
        ['Total de Medicoes', dashboardData?.metricas?.total_medicoes ?? 0],
        ['Custo Total (R$)', dashboardData?.metricas?.custo_total ?? 0],
        ['Receita Total (R$)', dashboardData?.metricas?.receita_total ?? 0],
        ['Lucro Bruto (R$)', dashboardData?.metricas?.lucro_bruto ?? 0],
        ['Margem (%)', dashboardData?.metricas?.margem_percentual ?? 0],
      ];

      metricas.forEach(([label, value]) => {
        doc.fontSize(10).text(`${label}: ${value}`);
      });

      doc.moveDown();
      doc.fontSize(13).text('Resumo por Obra');
      doc.moveDown(0.5);

      const obras = Array.isArray(dashboardData?.por_obra)
        ? dashboardData.por_obra
        : [];

      if (obras.length === 0) {
        doc.fontSize(10).text('Nenhum registro encontrado para o periodo informado.');
      } else {
        obras.forEach((obra: any, index: number) => {
          doc.fontSize(10).text(
            `${index + 1}. ${obra.obra_nome} | Medicoes: ${obra.medicoes} | Custo: R$ ${obra.custo} | Receita: R$ ${obra.receita} | Lucro: R$ ${obra.lucro} | Margem: ${obra.margem}%`,
          );
        });
      }

      doc.end();
    });
  }
}
