// Mock Authentication Service
// Use this when backend is not available for testing UI/UX

export const mockAuthLogin = async (email: string, senha: string) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Accept any email/password for demo
  if (!email || !senha) {
    throw {
      message: 'Email e senha são obrigatórios',
      status: 400,
    };
  }

  const mockAccessToken = 'mock_access_token_' + Date.now() + '_' + Math.random().toString(36).substring(7);
  const mockRefreshToken = 'mock_refresh_token_' + Date.now() + '_' + Math.random().toString(36).substring(7);
  const mockUser = {
    id: 'mock-user-' + Date.now(),
    nome_completo: email.split('@')[0].toUpperCase(),
    email: email,
    id_perfil: 1,
  };

  // Return structure that matches the real API response
  return {
    access_token: mockAccessToken,
    refresh_token: mockRefreshToken,
    user: mockUser,
  };
};

export const mockAuthProfile = async () => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return {
    id_usuario: 'mock-user-123',
    nome_completo: 'Admin User',
    email: 'admin@example.com',
    id_perfil: 1,
    perfil_nome: 'admin',
  };
};
