// Quick test of actual axios from node_modules
const axios = require('axios');

// Create axios instance exactly like the frontend does
const api = axios.create({
  baseURL: '/api/v1',  // This won't work in Node.js context without proper setup
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

async function quickTest() {
  console.log('Test 1: Using /api/v1 base URL (relative path)');
  try {
    const response = await api.post('/auth/login', {
      email: 'admin@jbpinturas.com.br',
      password: 'Admin@2026',
    });
    console.log('✓ Success with relative path');
  } catch (error) {
    console.error('✗ Failed with relative path:', error.message);
    
    // Fall back to absolute URL
    console.log('\nTest 2: Using absolute URL');
    const api2 = axios.create({
      baseURL: 'http://localhost:3000/api/v1',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
    
    try {
      const response = await api2.post('/auth/login', {
        email: 'admin@jbpinturas.com.br',
        password: 'Admin@2026',
      });
      console.log('✓ Success with absolute URL');
      console.log('Response status:', response.status);
      console.log('Has access_token:', !!response.data.access_token);
      console.log('User email:', response.data.user?.email);
    } catch (error) {
      console.error('✗ Failed:', error.message);
    }
  }
}

quickTest();
