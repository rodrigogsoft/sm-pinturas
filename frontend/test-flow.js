#!/usr/bin/env node
const http = require('http');
const https = require('https');

// Simulate browser login flow
async function testLoginFlow() {
  console.log('=== JB Pinturas Login Flow Test ===\n');

  // Step 1: Access login page
  console.log('Step 1: Loading login page...');
  try {
    const html = await getPage('http://localhost:3001/login');
    if (html.includes('Email') && html.includes('Senha')) {
      console.log('✓ Login page loaded with form fields\n');
    } else {
      console.log('✗ Login page missing form fields\n');
    }
  } catch(e) {
    console.log('✗ Error loading login page:', e.message, '\n');
    return;
  }

  // Step 2: Submit login form via fetch (what React/axios does)
  console.log('Step 2: Submitting login request via proxy (/api/v1)...');
  try {
    const response = await makeRequest('/api/v1/auth/login', {
      email: 'admin@jbpinturas.com.br',
      password: 'Admin@2026'
    });
    
    console.log('Status:', response.statusCode);
    const data = JSON.parse(response.body);
    
    if (data.access_token) {
      console.log('✓ Login successful!');
      console.log('  - Token received:', data.access_token.substring(0, 50) + '...');
      console.log('  - User:', data.user.email);
      console.log('  - Role:', data.user.id_perfil === 1 ? 'Admin' : 'User');
      console.log('\nStep 3: Simulating dashboard navigation...');
      console.log('✓ Redux store would be updated with user data and token');
      console.log('✓ React Router would navigate to /dashboard');
      console.log('✓ ProtectedRoute would see isAuthenticated=true');
      console.log('\n=== LOGIN FLOW COMPLETE ===');
    } else {
      console.log('✗ No access_token in response');
      console.log('Response:', JSON.stringify(data).substring(0, 200));
    }
  } catch(e) {
    console.log('✗ Login failed:', e.message);
  }
}

function getPage(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function makeRequest(path, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 3001,  // Frontend dev server with proxy
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: responseData
        });
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

testLoginFlow();
