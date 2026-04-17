// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { Routes, Route } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { renderWithProviders } from './test-utils';

describe('ProtectedRoute', () => {
  it('redireciona para login quando o usuário não está autenticado', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<div>Login Screen</div>} />
        <Route
          path="/financeiro"
          element={
            <ProtectedRoute>
              <div>Área Financeira</div>
            </ProtectedRoute>
          }
        />
      </Routes>,
      {
        route: '/financeiro',
        user: null,
        isAuthenticated: false,
      },
    );

    expect(await screen.findByText('Login Screen')).toBeInTheDocument();
    expect(screen.queryByText('Área Financeira')).not.toBeInTheDocument();
  });

  it('renderiza o conteúdo quando o usuário está autenticado', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<div>Login Screen</div>} />
        <Route
          path="/financeiro"
          element={
            <ProtectedRoute>
              <div>Área Financeira</div>
            </ProtectedRoute>
          }
        />
      </Routes>,
      {
        route: '/financeiro',
      },
    );

    expect(await screen.findByText('Área Financeira')).toBeInTheDocument();
    expect(screen.queryByText('Login Screen')).not.toBeInTheDocument();
  });
});
