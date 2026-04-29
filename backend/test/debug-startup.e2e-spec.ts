import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import request = require('supertest');
import { AppModule } from '../src/app.module';

describe('Debug - App Startup', () => {
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

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    
    console.log('=== App Init ===');
    try {
      await app.init();
      console.log('App initialized successfully');
    } catch (error) {
      console.error('App initialization error:', error);
      throw error;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('should test if uploads module is loaded', async () => {
    const server = app.getHttpServer();

    const usuariosResponse = await request(server).get('/api/v1/usuarios');
    const uploadsResponse = await request(server).get('/api/v1/uploads?tipo=medicao');

    expect([401, 403]).toContain(usuariosResponse.status);
    expect([401, 403]).toContain(uploadsResponse.status);
  });
});
