// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { RelatarioProdutividadePage } from '../pages/Financeiro/RelatarioProdutividadePage';
import { renderWithProviders } from './test-utils';

const getProdutividadeMock = vi.fn();

vi.mock('../services/api', () => ({
  relatoriosAPI: {
    getProdutividade: (...args: unknown[]) => getProdutividadeMock(...args),
  },
}));

describe('RelatarioProdutividadePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza o relatório usando o formato legado da API sem quebrar a tela', async () => {
    getProdutividadeMock.mockResolvedValue({
      data: {
        periodo: {
          inicio: '2026-03-01',
          fim: '2026-03-31',
        },
        colaboradores: [
          {
            colaborador_id: 'colab-1',
            colaborador_nome: 'Carlos Pintor',
            total_unidades: 180,
            media_por_medicao: 90,
            total_medicoes: 2,
          },
        ],
      },
    });

    renderWithProviders(<RelatarioProdutividadePage />, {
      route: '/financeiro/produtividade',
    });

    expect(await screen.findByText('Relatório de Produtividade')).toBeInTheDocument();
    expect(await screen.findByText('Carlos Pintor')).toBeInTheDocument();
    expect(screen.getAllByText('Medições Totais').length).toBeGreaterThan(0);
    expect(getProdutividadeMock).toHaveBeenCalled();
  });

  it('mantém a página funcional quando a API retorna campos numéricos ausentes', async () => {
    getProdutividadeMock.mockResolvedValue({
      data: {
        periodo: {
          inicio: '2026-03-01',
          fim: '2026-03-31',
        },
        colaboradores: [
          {
            colaborador_id: 'colab-2',
            colaborador_nome: 'Ana Acabadora',
            total_unidades: undefined,
            media_por_medicao: undefined,
            total_medicoes: undefined,
          },
        ],
      },
    });

    renderWithProviders(<RelatarioProdutividadePage />, {
      route: '/financeiro/produtividade',
    });

    expect(await screen.findByText('Ana Acabadora')).toBeInTheDocument();
    expect(screen.queryByText(/Erro ao carregar produtividade/i)).not.toBeInTheDocument();
  });
});
