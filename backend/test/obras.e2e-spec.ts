import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import request = require('supertest');
import { AppModule } from '../src/app.module';

describe('Obras E2E', () => {
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

  it('deve criar cliente e obra com pavimentos/ambientes', async () => {
    const timestamp = Date.now();
    const email = `admin_${timestamp}@example.com`;
    const password = 'senha123';

    // Register admin
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        nome_completo: 'Admin E2E',
        email,
        password,
        id_perfil: 1,
      })
      .expect(201);

    // Login
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);

    const token = loginResponse.body.access_token as string;

    // Create cliente
    const clienteResponse = await request(app.getHttpServer())
      .post('/api/v1/clientes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        razao_social: `Cliente E2E ${timestamp}`,
        cnpj_nif: `${timestamp}`,
        email: `cliente_${timestamp}@example.com`,
        dia_corte: 10,
      })
      .expect(201);

    const id_cliente = clienteResponse.body.id as string;

    // Create obra with pavimentos/ambientes
    const obraResponse = await request(app.getHttpServer())
      .post('/api/v1/obras')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nome: `Obra E2E ${timestamp}`,
        endereco_completo: 'Rua Teste, 123',
        data_inicio: '2026-02-07',
        id_cliente,
        pavimentos: [
          {
            nome: 'Terreo',
            ordem: 0,
            ambientes: [
              { nome: 'Sala 101', area_m2: 25.5 },
              { nome: 'Sala 102', area_m2: 20.0 },
            ],
          },
        ],
      })
      .expect(201);

    expect(obraResponse.body).toHaveProperty('id');

    // Get obra
    const obraId = obraResponse.body.id as string;
    await request(app.getHttpServer())
      .get(`/api/v1/obras/${obraId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
