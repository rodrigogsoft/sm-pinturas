// @vitest-environment jsdom
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FolhaIndividualPage } from '../pages/Financeiro/FolhaIndividualPage';
import financeiroService from '../services/financeiro.service';
import obrasService from '../services/obras.service';
import { colaboradoresAPI } from '../services/api';
import { PerfilEnum } from '../store/slices/authSlice';
import { makeUser, renderWithProviders } from './test-utils';

const showToast = vi.fn();

vi.mock('../components/Toast/ToastProvider', () => ({
  useToast: () => ({ showToast }),
}));

vi.mock('../services/obras.service', () => ({
  default: {
    listar: vi.fn(),
  },
}));

vi.mock('../services/financeiro.service', () => ({
  default: {
    consultarFolhaIndividual: vi.fn(),
    listarLotes: vi.fn(),
    exportarFolhaIndividualCsv: vi.fn(),
    previewDescontosValesNoLote: vi.fn(),
    fecharPeriodoFolhaIndividual: vi.fn(),
    reabrirPeriodoFolhaIndividual: vi.fn(),
  },
}));

vi.mock('../services/api', () => ({
  colaboradoresAPI: {
    getAll: vi.fn(),
  },
}));

describe('FolhaIndividualPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(obrasService.listar).mockResolvedValue([
      { id: 'obra-1', nome: 'Obra Centro' },
    ] as any);

    vi.mocked(colaboradoresAPI.getAll).mockResolvedValue({
      data: [{ id: 'col-1', nome_completo: 'Pintor Teste' }],
    } as any);

    vi.mocked(financeiroService.listarLotes).mockResolvedValue({
      data: [{ id: 'lote-1', descricao: 'Lote Março', status: 'ABERTO' }],
    } as any);

    vi.mocked(financeiroService.consultarFolhaIndividual).mockResolvedValue({
      data: {
        filtros: {},
        paginacao: {
          page: 1,
          limit: 20,
          total_registros: 1,
          total_paginas: 1,
        },
        totais: {
          total_medicoes: 1,
          total_lotes: 1,
          valor_total_calculado: 450,
        },
        itens: [
          {
            id: 'med-1',
            data_medicao: '2026-03-20',
            qtd_executada: 15,
            status_pagamento: 'ABERTO',
            id_lote_pagamento: 'lote-1',
            colaborador: {
              nome_completo: 'Pintor Teste',
            },
            item_ambiente: {
              tabelaPreco: {
                preco_venda: 30,
              },
              ambiente: {
                pavimento: {
                  obra: {
                    nome: 'Obra Centro',
                  },
                },
              },
            },
          },
        ],
      },
    } as any);
  });

  it('renderiza os totais e a tabela da folha individual sem quebrar', async () => {
    renderWithProviders(<FolhaIndividualPage />, {
      route: '/financeiro/folha-individual',
      user: makeUser(PerfilEnum.FINANCEIRO),
    });

    expect(await screen.findByText('Folha Individual')).toBeInTheDocument();
    expect(await screen.findByRole('cell', { name: 'Pintor Teste' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Obra Centro' })).toBeInTheDocument();
    expect(screen.getByText('Total de Medições')).toBeInTheDocument();
    expect(screen.getByText('Valor Total Calculado')).toBeInTheDocument();
    expect(screen.getAllByText(/R\$\s*450,00/)).toHaveLength(2);
    expect(screen.getByText('ABERTO')).toBeInTheDocument();

    expect(financeiroService.consultarFolhaIndividual).toHaveBeenCalled();
  });

  it('exibe aviso ao tentar fechar período sem informar datas', async () => {
    renderWithProviders(<FolhaIndividualPage />, {
      route: '/financeiro/folha-individual',
      user: makeUser(PerfilEnum.FINANCEIRO),
    });

    const botaoFecharPeriodo = await screen.findByRole('button', {
      name: /fechar período/i,
    });

    fireEvent.click(botaoFecharPeriodo);

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'warning',
          message: expect.stringContaining('Informe data início e data fim'),
        }),
      );
    });

    expect(financeiroService.fecharPeriodoFolhaIndividual).not.toHaveBeenCalled();
  });
});
