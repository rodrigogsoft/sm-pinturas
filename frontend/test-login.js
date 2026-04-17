// Test script to verify login flow
const axios = require('axios');

const api1 = axios.create({
  baseURL: '/api/v1',  // Relative path through proxy
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

const api2 = axios.create({
  baseURL: 'http://localhost:3000/api/v1',  // Direct (will fail in Docker)
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

async function testLogin(apiClient, description) {
  try {
    console.log(`\n=== Testing with ${description} ===`);
    const response = await apiClient.post('/auth/login', {
      email: 'admin@jbpinturas.com.br',
      password: 'Admin@2026',
    });

    console.log('✓ Login successful!');
    console.log('Status:', response.status);
    console.log('Response structure:', {
      access_token: typeof response.data.access_token,
      refresh_token: typeof response.data.refresh_token,
      user: {
        id: response.data.user.id,
        nome_completo: response.data.user.nome_completo,
        email: response.data.user.email,
        id_perfil: response.data.user.id_perfil,
      }
    });
  } catch (error) {
    console.error('✗ Login failed!');
    console.error('Error:', error.message);
  }
}

(async () => {
  await testLogin(api1, 'relative path /api/v1 (proxy)');
  await testLogin(api2, 'direct http://localhost:3000/api/v1');
})();

