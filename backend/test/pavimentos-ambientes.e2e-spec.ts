import { INestApplication, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request = require('supertest');
import { AppModule } from '../src/app.module';

describe('Pavimentos e Ambientes (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let obraId: string;
  let pavimentoId: string;
  let ambienteId: string;
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

    // Registrar e fazer login como Admin
    const timestamp = Date.now();
    const email = `admin_pav_${timestamp}@example.com`;
    const password = 'senha123';

    // Register as Admin
    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        nome_completo: 'Admin Pavimentos Test',
        email,
        password,
        id_perfil: 1, // Admin
      })
      .expect(201);

    expect(registerResponse.body).toHaveProperty('id');
    expect(registerResponse.body.email).toBe(email);

    // Login
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);

    expect(loginResponse.body).toHaveProperty('access_token');

    adminToken = loginResponse.body.access_token;
    expect(adminToken).toBeDefined();

    // Criar cliente
    const clientRes = await request(app.getHttpServer())
      .post('/api/v1/clientes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        razao_social: `Cliente Pavimentos Test ${Date.now()}`,
        cnpj_nif: `${Date.now()}`,
        email: `cliente_pav_${Date.now()}@test.com`,
        dia_corte: 15,
      })
      .expect(201);

    const clientId = clientRes.body.id;

    // Criar obra base
    const obraRes = await request(app.getHttpServer())
      .post('/api/v1/obras')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nome: 'Obra Pavimentos Test',
        endereco_completo: 'Rua Teste, 123',
        data_inicio: '2026-01-15',
        data_previsao_fim: '2026-12-31',
        id_cliente: clientId,
      });

    obraId = obraRes.body.id;
    expect(obraId).toBeDefined();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Pavimentos', () => {
    describe('POST /pavimentos', () => {
      it('deve criar um novo pavimento', async () => {
        const res = await request(app.getHttpServer())
          .post('/api/v1/pavimentos')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            nome: 'Térreo',
            ordem: 0,
            id_obra: obraId,
          });

        expect(res.status).toBe(201);
        expect(res.body.id).toBeDefined();
        expect(res.body.nome).toBe('Térreo');
        expect(res.body.ordem).toBe(0);
        pavimentoId = res.body.id;
      });

      it('deve retornar erro 404 se obra não existir', async () => {
        const res = await request(app.getHttpServer())
          .post('/api/v1/pavimentos')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            nome: 'Pavimento Erro',
            ordem: 1,
            id_obra: '00000000-0000-0000-0000-000000000000',
          });

        expect(res.status).toBe(404);
      });
    });

    describe('GET /pavimentos', () => {
      it('deve listar todos os pavimentos', async () => {
        const res = await request(app.getHttpServer())
          .get('/api/v1/pavimentos')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
      });
    });

    describe('GET /pavimentos/:id', () => {
      it('deve buscar um pavimento por ID', async () => {
        const res = await request(app.getHttpServer())
          .get(`/api/v1/pavimentos/${pavimentoId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(pavimentoId);
        expect(res.body.nome).toBe('Térreo');
      });

      it('deve retornar erro 404 se pavimento não existir', async () => {
        const res = await request(app.getHttpServer())
          .get('/api/v1/pavimentos/00000000-0000-0000-0000-000000000000')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(404);
      });
    });

    describe('GET /pavimentos/obra/:id_obra', () => {
      it('deve listar pavimentos de uma obra específica', async () => {
        const res = await request(app.getHttpServer())
          .get(`/api/v1/pavimentos/obra/${obraId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.some((p: any) => p.id === pavimentoId)).toBe(true);
      });
    });

    describe('PATCH /pavimentos/:id', () => {
      it('deve atualizar um pavimento', async () => {
        const res = await request(app.getHttpServer())
          .patch(`/api/v1/pavimentos/${pavimentoId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            nome: '1º Pavimento',
            ordem: 1,
          });

        expect(res.status).toBe(200);
        expect(res.body.nome).toBe('1º Pavimento');
        expect(res.body.ordem).toBe(1);
      });
    });
  });

  describe('Ambientes', () => {
    describe('POST /ambientes', () => {
      it('deve criar um novo ambiente', async () => {
        const res = await request(app.getHttpServer())
          .post('/api/v1/ambientes')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            nome: 'Sala 101',
            id_pavimento: pavimentoId,
            area_m2: 25.5,
            descricao: 'Sala comercial',
          });

        expect(res.status).toBe(201);
        expect(res.body.id).toBeDefined();
        expect(res.body.nome).toBe('Sala 101');
        expect(res.body.area_m2).toBe(25.5);
        ambienteId = res.body.id;
      });

      it('deve retornar erro 404 se pavimento não existir', async () => {
        const res = await request(app.getHttpServer())
          .post('/api/v1/ambientes')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            nome: 'Ambiente Erro',
            id_pavimento: '00000000-0000-0000-0000-000000000000',
            area_m2: 20,
          });

        expect(res.status).toBe(404);
      });
    });

    describe('GET /ambientes', () => {
      it('deve listar todos os ambientes', async () => {
        const res = await request(app.getHttpServer())
          .get('/api/v1/ambientes')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
      });
    });

    describe('GET /ambientes/:id', () => {
      it('deve buscar um ambiente por ID', async () => {
        const res = await request(app.getHttpServer())
          .get(`/api/v1/ambientes/${ambienteId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(ambienteId);
        expect(res.body.nome).toBe('Sala 101');
      });
    });

    describe('GET /ambientes/pavimento/:id_pavimento', () => {
      it('deve listar ambientes de um pavimento específico', async () => {
        const res = await request(app.getHttpServer())
          .get(`/api/v1/ambientes/pavimento/${pavimentoId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.some((a: any) => a.id === ambienteId)).toBe(true);
      });
    });

    describe('GET /ambientes/obra/:id_obra', () => {
      it('deve listar ambientes de uma obra específica', async () => {
        const res = await request(app.getHttpServer())
          .get(`/api/v1/ambientes/obra/${obraId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
      });
    });

    describe('PATCH /ambientes/:id', () => {
      it('deve atualizar um ambiente', async () => {
        const res = await request(app.getHttpServer())
          .patch(`/api/v1/ambientes/${ambienteId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            nome: 'Sala 102',
            area_m2: 30.0,
          });

        expect(res.status).toBe(200);
        expect(res.body.nome).toBe('Sala 102');
        expect(res.body.area_m2).toBe(30);
      });
    });

    describe('DELETE /ambientes/:id', () => {
      it('deve deletar um ambiente', async () => {
        // Criar um ambiente para deletar
        const createRes = await request(app.getHttpServer())
          .post('/api/v1/ambientes')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            nome: 'Sala para Deletar',
            id_pavimento: pavimentoId,
          });

        const toDeletId = createRes.body.id;

        const res = await request(app.getHttpServer())
          .delete(`/api/v1/ambientes/${toDeletId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.message).toContain('deletado');
      });
    });
  });

  describe('DELETE /pavimentos/:id', () => {
    it('deve deletar um pavimento', async () => {
      // Criar um pavimento para deletar
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/pavimentos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Pavimento para Deletar',
          ordem: 99,
          id_obra: obraId,
        });

      const toDeletId = createRes.body.id;

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/pavimentos/${toDeletId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('deletado');
    });
  });
});
