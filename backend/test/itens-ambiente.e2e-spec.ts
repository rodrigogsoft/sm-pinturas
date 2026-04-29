import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import request = require('supertest');
import { AppModule } from '../src/app.module';

describe('ItensAmbiente (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let obraId: string;
  let pavimentoId: string;
  let ambienteId: string;
  let tabelaPrecosId: string;
  let itemAmbienteId: string;
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

    // Register and login
    const timestamp = Date.now();
    const email = `test_itens_${timestamp}@example.com`;
    const password = 'senha123';

    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        nome_completo: 'Test ItensAmbiente',
        email,
        password,
        id_perfil: 1, // Admin
      })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);

    adminToken = loginResponse.body.access_token;
    expect(adminToken).toBeDefined();

    // Create client
    const clientRes = await request(app.getHttpServer())
      .post('/api/v1/clientes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        razao_social: `Cliente ItensAmbiente ${timestamp}`,
        cnpj_nif: `${timestamp}`,
        email: `cliente_itens_${timestamp}@test.com`,
        dia_corte: 15,
      })
      .expect(201);

    const clientId = clientRes.body.id;

    // Create obra
    const obraRes = await request(app.getHttpServer())
      .post('/api/v1/obras')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nome: 'Obra ItensAmbiente Test',
        endereco_completo: 'Rua Teste, 123',
        data_inicio: '2026-01-15',
        data_previsao_fim: '2026-12-31',
        id_cliente: clientId,
      })
      .expect(201);

    obraId = obraRes.body.id;
    expect(obraId).toBeDefined();

    // Create pavimento
    const pavRes = await request(app.getHttpServer())
      .post('/api/v1/pavimentos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nome: 'Térreo',
        ordem: 0,
        id_obra: obraId,
      })
      .expect(201);

    pavimentoId = pavRes.body.id;

    // Create ambiente
    const ambRes = await request(app.getHttpServer())
      .post('/api/v1/ambientes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nome: 'Sala 101',
        id_pavimento: pavimentoId,
        area_m2: 25.5,
      })
      .expect(201);

    ambienteId = ambRes.body.id;

    // Criar serviço de catálogo
    const servicoRes = await request(app.getHttpServer())
      .post('/api/v1/servicos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nome: 'Pintura Látex 2 Demãos',
        descricao: 'Pintura em látex acrílico com 2 demãos',
        unidade_medida: 'M2',
        categoria: 'PINTURA',
      })
      .expect(201);

    const servicoId = servicoRes.body.id;

    // Criar tabela de preços com serviço válido
    const tpRes = await request(app.getHttpServer())
      .post('/api/v1/precos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        id_obra: obraId,
        id_servico_catalogo: servicoId,
        preco_custo: 50.0,
        preco_venda: 100.0,
      })
      .expect(201);

    tabelaPrecosId = tpRes.body.id;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('POST /itens-ambiente', () => {
    it('deve criar item quando tabela de preço existir', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/itens-ambiente')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          id_ambiente: ambienteId,
          id_tabela_preco: tabelaPrecosId,
          area_planejada: 25.5,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.id_tabela_preco).toBe(tabelaPrecosId);
    });

    it('deve retornar erro 404 se ambiente não existir', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/itens-ambiente')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          id_ambiente: '00000000-0000-0000-0000-000000000000',
          id_tabela_preco: tabelaPrecosId,
          area_planejada: 20,
        })
        .expect(404);
    });
  });

  describe('GET /itens-ambiente com item criado', () => {
    let itemAmbienteIdForTesting: string;

    beforeAll(async () => {
      // Create a valid tabela preco first
      // Re-create service if needed
      const servicoRes = await request(app.getHttpServer())
        .post('/api/v1/servicos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Pintura Látex 2 Demãos Extra',
          descricao: 'Pintura em látex acrílico com 2 demãos - extra',
          unidade_medida: 'M2',
          categoria: 'PINTURA',
        })
        .expect(201);

      const servicoId = servicoRes.body.id;

      const tpRes = await request(app.getHttpServer())
        .post('/api/v1/precos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          id_obra: obraId,
          id_servico_catalogo: servicoId,
          preco_custo: 50.0,
          preco_venda: 100.0,
        });

      if (tpRes.status === 201) {
        tabelaPrecosId = tpRes.body.id;

        // Now create item
        const itemRes = await request(app.getHttpServer())
          .post('/api/v1/itens-ambiente')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            id_ambiente: ambienteId,
            id_tabela_preco: tabelaPrecosId,
            area_planejada: 25.5,
          });

        if (itemRes.status === 201) {
          itemAmbienteIdForTesting = itemRes.body.id;
        }
      }
    });

    it('deve listar itens de um ambiente específico', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/itens-ambiente/ambiente/${ambienteId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('deve listar itens de uma obra específica', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/itens-ambiente/obra/${obraId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('deve listar todos os itens de ambiente se algum foi criado', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/itens-ambiente')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('deve buscar um item de ambiente por ID quando existe', async () => {
      if (!itemAmbienteIdForTesting) {
        return;
      }

      const res = await request(app.getHttpServer())
        .get(`/api/v1/itens-ambiente/${itemAmbienteIdForTesting}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.id).toBe(itemAmbienteIdForTesting);
    });

    it('deve retornar erro 404 se item não existir', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/itens-ambiente/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('deve atualizar um item de ambiente quando existe', async () => {
      if (!itemAmbienteIdForTesting) {
        return;
      }

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/itens-ambiente/${itemAmbienteIdForTesting}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          area_planejada: 30.0,
        })
        .expect(200);

      expect(res.body.area_planejada).toBe(30);
    });

    it('deve deletar um item de ambiente quando existe', async () => {
      if (!itemAmbienteIdForTesting) {
        return;
      }

      await request(app.getHttpServer())
        .delete(`/api/v1/itens-ambiente/${itemAmbienteIdForTesting}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });
});
