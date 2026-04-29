import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth E2E', () => {
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
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  const registrarUsuario = async (id_perfil = 4) => {
    const timestamp = `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
    const email = `e2e_${timestamp}@example.com`;
    const password = 'senha123';

    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        nome_completo: 'Usuario E2E',
        email,
        password,
        id_perfil,
      })
      .expect(201);

    return { email, password, registerResponse };
  };

  it('✅ deve negar acesso a /auth/me sem token', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .expect(401);
  });

  it('✅ deve registrar, logar e acessar /auth/me', async () => {
    const { email, password, registerResponse } = await registrarUsuario();

    expect(registerResponse.body).toHaveProperty('id');
    expect(registerResponse.body.email).toBe(email);

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);

    expect(loginResponse.body).toHaveProperty('access_token');

    const token = loginResponse.body.access_token as string;

    const meResponse = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(meResponse.body.email).toBe(email);
  });

  it('✅ deve rejeitar login com senha inválida', async () => {
    const { email } = await registrarUsuario();

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'senha-errada' })
      .expect(401);
  });
});
