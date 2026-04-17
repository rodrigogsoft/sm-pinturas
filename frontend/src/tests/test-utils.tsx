// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import type { PropsWithChildren, ReactElement } from 'react';
import { cleanup, render } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, vi } from 'vitest';
import authReducer, { PerfilEnum, type User } from '../store/slices/authSlice';
import obrasReducer from '../store/slices/obrasSlice';
import clientesReducer from '../store/slices/clientesSlice';
import colaboradoresReducer from '../store/slices/colaboradoresSlice';
import uiReducer from '../store/slices/uiSlice';

type TestRootState = {
  auth: ReturnType<typeof authReducer>;
  obras: ReturnType<typeof obrasReducer>;
  clientes: ReturnType<typeof clientesReducer>;
  colaboradores: ReturnType<typeof colaboradoresReducer>;
  ui: ReturnType<typeof uiReducer>;
};

const createInitialState = (user: User | null, isAuthenticated: boolean): TestRootState => ({
  auth: {
    user,
    token: isAuthenticated ? 'token-teste' : null,
    refreshToken: null,
    isAuthenticated,
    loading: false,
  },
  obras: obrasReducer(undefined, { type: '@@INIT' }),
  clientes: clientesReducer(undefined, { type: '@@INIT' }),
  colaboradores: colaboradoresReducer(undefined, { type: '@@INIT' }),
  ui: uiReducer(undefined, { type: '@@INIT' }),
});

if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

if (!('ResizeObserver' in window)) {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  vi.stubGlobal('ResizeObserver', ResizeObserverMock);
}

if (!window.URL.createObjectURL) {
  window.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
}

if (!window.URL.revokeObjectURL) {
  window.URL.revokeObjectURL = vi.fn();
}

if (!window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});

export const makeUser = (perfil: PerfilEnum): User => ({
  id: '11111111-1111-4111-8111-111111111111',
  nome_completo: 'Usuário Teste',
  email: 'teste@jbpinturas.com.br',
  id_perfil: perfil,
  perfil_nome: PerfilEnum[perfil],
  permissoes_modulos: null,
});

export const createTestStore = (
  user: User | null = null,
  isAuthenticated = Boolean(user),
) =>
  configureStore<TestRootState>({
    reducer: {
      auth: authReducer,
      obras: obrasReducer,
      clientes: clientesReducer,
      colaboradores: colaboradoresReducer,
      ui: uiReducer,
    },
    preloadedState: createInitialState(user, isAuthenticated),
  });

export const renderWithProviders = (
  ui: ReactElement,
  {
    route = '/',
    user = makeUser(PerfilEnum.ADMIN),
    isAuthenticated = true,
  }: {
    route?: string;
    user?: User | null;
    isAuthenticated?: boolean;
  } = {},
) => {
  const store = createTestStore(user, isAuthenticated);

  const Wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
    </Provider>
  );

  return {
    store,
    ...render(ui, { wrapper: Wrapper }),
  };
};
