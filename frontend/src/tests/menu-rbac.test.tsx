// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { createTheme } from '@mui/material/styles';
import { Layout } from '../components/Layout';
import { PerfilEnum } from '../store/slices/authSlice';
import { makeUser, renderWithProviders } from './test-utils';

vi.mock('../hooks/useHighContrast', () => ({
  useHighContrastTheme: () => ({
    theme: createTheme(),
    highContrast: false,
    setHighContrast: vi.fn(),
  }),
}));

vi.mock('../components/AccessibilityModeToggle', () => ({
  AccessibilityModeToggle: () => <div data-testid="accessibility-toggle" />,
}));

vi.mock('../components/AuthSessionsDialog', () => ({
  AuthSessionsDialog: () => null,
}));

vi.mock('../services/api', () => ({
  authAPI: {
    logout: vi.fn(),
  },
}));

describe('Menu RBAC', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderLayout = (perfil: PerfilEnum) =>
    renderWithProviders(
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="dashboard" element={<div>Dashboard carregado</div>} />
        </Route>
      </Routes>,
      {
        route: '/dashboard',
        user: makeUser(perfil),
      },
    );

  it('mostra menus administrativos apenas para ADMIN', async () => {
    renderLayout(PerfilEnum.ADMIN);

    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Usuários')).toBeInTheDocument();
    expect(screen.getByText('Permissões')).toBeInTheDocument();
    expect(screen.getByText('Configurações')).toBeInTheDocument();
  });

  it('restringe menus administrativos para FINANCEIRO', async () => {
    renderLayout(PerfilEnum.FINANCEIRO);

    expect(await screen.findByText('Financeiro')).toBeInTheDocument();
    expect(screen.getByText('Clientes')).toBeInTheDocument();
    expect(screen.queryByText('Usuários')).not.toBeInTheDocument();
    expect(screen.queryByText('Permissões')).not.toBeInTheDocument();
    expect(screen.queryByText('Configurações')).not.toBeInTheDocument();
    expect(screen.queryByText('Colaboradores')).not.toBeInTheDocument();
  });

  it('permite menus operacionais para ENCARREGADO e bloqueia financeiro', async () => {
    renderLayout(PerfilEnum.ENCARREGADO);

    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Colaboradores')).toBeInTheDocument();
    expect(screen.getByText('Obras')).toBeInTheDocument();
    expect(screen.getByText('Preço')).toBeInTheDocument();
    expect(screen.queryByText('Financeiro')).not.toBeInTheDocument();
    expect(screen.queryByText('Clientes')).not.toBeInTheDocument();
    expect(screen.queryByText('Usuários')).not.toBeInTheDocument();
  });

  it('mostra Preço quando permissao granular estiver ativa mesmo com perfil fora do enum', async () => {
    const userComPerfilCustomizado = {
      ...makeUser(PerfilEnum.ENCARREGADO),
      id_perfil: 99 as PerfilEnum,
      perfil_nome: 'ENCARREGADO_CUSTOM',
      permissoes_modulos: {
        precos: {
          ativo: true,
          acoes: { visualizar: true },
        },
      },
    };

    renderWithProviders(
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="dashboard" element={<div>Dashboard carregado</div>} />
        </Route>
      </Routes>,
      {
        route: '/dashboard',
        user: userComPerfilCustomizado,
      },
    );

    expect(await screen.findByText('Preço')).toBeInTheDocument();
  });
});
