import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request = require('supertest');
import { AppModule } from '../src/app.module';

describe('Diagnose Routes', () => {
  let app: INestApplication;

  jest.setTimeout(30000);

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_HOST = process.env.DATABASE_HOST || 'localhost';
    process.env.DATABASE_PORT = process.env.DATABASE_PORT || '5432';
    process.env.DATABASE_USER = process.env.DATABASE_USER || 'jb_admin';
    process.env.DATABASE_PASSWORD = process.env.DATABASE_PASSWORD || 'jb_secure_pass_2026';
    process.env.DATABASE_NAME = process.env.DATABASE_NAME || 'jb_pinturas_db';
    process.env.DATABASE_SYNCHRONIZE = 'true';
    process.env.DATABASE_DROP_SCHEMA = 'true';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_key_change_in_production';
    process.env.DATABASE_LOGGING = 'true';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    console.log('\n=== App Initialization ===');
    await app.init();
    console.log('✓ App initialized successfully');
  });

  afterAll(async () => {
    await app.close();
  });

  it('Test different endpoint patterns', async () => {
    const server = app.getHttpServer();
    
    const endpoints = [
      'GET /uploads',
      'GET /api/uploads',
      'GET /api/v1/uploads',
      'POST /uploads',
      'POST /api/uploads',
      'POST /api/v1/uploads',
    ];

    console.log('\n=== Testing Route Patterns ===');
    
    for (const endpoint of endpoints) {
      const [method, path] = endpoint.split(' ');
      try {
        const res = method === 'GET' 
          ? await request(server).get(path)
          : await request(server).post(path);
        
        console.log(`${endpoint}: ${res.status} ${res.statusCode === 404 ? '❌' : '✓'}`);
      } catch (e: any) {
        console.log(`${endpoint}: Error - ${e.message}`);
      }
    }

    // Try to actually upload
    console.log('\n=== Testing Upload POST ===');
    const jpegBuffer = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
    ]);

    const uploadRes = await request(server)
      .post('/api/v1/uploads')
      .field('tipo', 'medicao')
      .attach('file', jpegBuffer, 'test.jpg');

    console.log(`POST /api/v1/uploads: ${uploadRes.status}`);
    console.log('Response:', uploadRes.body);
    console.log('Headers:', uploadRes.headers);

    expect(uploadRes.status).toBeDefined();
  });
});
