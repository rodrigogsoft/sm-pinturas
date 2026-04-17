export type PeriodoFinanceiro = 'dia' | 'semana' | 'mes' | 'ano';

export interface FinanceiroFiltrosPeriodo {
  periodo: PeriodoFinanceiro;
  dataInicio?: string;
  dataFim?: string;
}
