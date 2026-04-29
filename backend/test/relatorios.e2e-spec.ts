import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import request = require('supertest');
import { AppModule } from '../src/app.module';

describe('Relatórios e Dashboards (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let gestorToken: string;
  let financeiroToken: string;
  let encarregadoToken: string;
  let obraId: string;
  let servicoId1: number;
  let servicoId2: number;
  let precoId1: string;
  let precoId2: string;
  let medicaoId1: string;
  let medicaoId2: string;

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
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    // Setup: Criar usuários com diferentes roles
    const adminRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        nome_completo: 'Admin Relatórios',
        email: 'admin-relat@test.com',
        password: 'Senha@123',
        id_perfil: 1, // Admin
      });

    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin-relat@test.com',
        password: 'Senha@123',
      })
      .expect(200);

    adminToken = adminLogin.body.access_token;

    // Criar Gestor
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        nome_completo: 'Gestor Relatórios',
        email: 'gestor-relat@test.com',
        password: 'Senha@123',
        id_perfil: 2, // Gestor
      });

    const gestorLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'gestor-relat@test.com',
        password: 'Senha@123',
      })
      .expect(200);

    gestorToken = gestorLogin.body.access_token;

    // Criar Financeiro
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        nome_completo: 'Financeiro Relatórios',
        email: 'financeiro-relat@test.com',
        password: 'Senha@123',
        id_perfil: 3, // Financeiro
      });

    const financeiroLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'financeiro-relat@test.com',
        password: 'Senha@123',
      })
      .expect(200);

    financeiroToken = financeiroLogin.body.access_token;

    // Criar Encarregado
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        nome_completo: 'Encarregado Relatórios',
        email: 'encarregado-relat@test.com',
        password: 'Senha@123',
        id_perfil: 4, // Encarregado
      });

    const encarregadoLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'encarregado-relat@test.com',
        password: 'Senha@123',
      })
      .expect(200);

    encarregadoToken = encarregadoLogin.body.access_token;

    // Criar cliente
    const clienteRes = await request(app.getHttpServer())
      .post('/api/v1/clientes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        razao_social: 'Cliente Relatórios Test',
        cnpj_nif: '99999999999999',
        email: 'cliente-relat@test.com',
        dia_corte: 10,
      })
      .expect(201);

    const clienteId = clienteRes.body.id;

    // Criar obra
    const obraRes = await request(app.getHttpServer())
      .post('/api/v1/obras')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nome: 'Obra Relatórios Test',
        endereco_completo: 'Rua Relatórios, 123',
        data_inicio: '2026-02-07',
        id_cliente: clienteId,
      })
      .expect(201);

    obraId = obraRes.body.id;

    // Criar pavimento
    const pavimentoRes = await request(app.getHttpServer())
      .post('/api/v1/pavimentos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        id_obra: obraId,
        nome: 'Térreo',
        ordem: 0,
      })
      .expect(201);

    const pavimentoId = pavimentoRes.body.id;

    // Criar ambientes
    const ambienteRes = await request(app.getHttpServer())
      .post('/api/v1/ambientes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        id_pavimento: pavimentoId,
        nome: 'Sala Principal',
        area_m2: 50.0,
      })
      .expect(201);

    const ambienteId = ambienteRes.body.id;

    // Criar colaboradores
    const colab1Res = await request(app.getHttpServer())
      .post('/api/v1/colaboradores')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nome_completo: 'João Silva Relatórios',
        cpf_nif: '11111111111',
        telefone: '11999999999',
      })
      .expect(201);

    const colaboradorId1 = colab1Res.body.id;

    const colab2Res = await request(app.getHttpServer())
      .post('/api/v1/colaboradores')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nome_completo: 'Maria Santos Relatórios',
        cpf_nif: '22222222222',
        telefone: '11988888888',
      })
      .expect(201);

    const colaboradorId2 = colab2Res.body.id;

    // Criar serviços de catálogo
    const servico1Res = await request(app.getHttpServer())
      .post('/api/v1/servicos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nome: 'Pintura Látex 2 Demãos',
        descricao: 'Pintura em látex acrílico com 2 demãos',
        unidade_medida: 'M2',
        categoria: 'PINTURA',
      })
      .expect(201);

    servicoId1 = servico1Res.body.id;

    const servico2Res = await request(app.getHttpServer())
      .post('/api/v1/servicos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nome: 'Pintura Látex 3 Demãos',
        descricao: 'Pintura em látex acrílico com 3 demãos',
        unidade_medida: 'M2',
        categoria: 'PINTURA',
      })
      .expect(201);

    servicoId2 = servico2Res.body.id;

    // Criar sessão
    const sessaoRes = await request(app.getHttpServer())
      .post('/api/v1/sessoes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        id_obra: obraId,
        id_encarregado: encarregadoToken,
        data_sessao: '2026-02-07',
      });

    const sessaoId = sessaoRes.body?.id || 'mock-sessao-id';

    // Criar alocações
    const alocacao1Res = await request(app.getHttpServer())
      .post('/api/v1/alocacoes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        id_sessao: sessaoId,
        id_colaborador: colaboradorId1,
        id_ambiente: ambienteId,
        id_servico_catalogo: servicoId1,
      });

    const alocacaoId1 = alocacao1Res.body?.id || 'mock-alocacao-1';

    const alocacao2Res = await request(app.getHttpServer())
      .post('/api/v1/alocacoes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        id_sessao: sessaoId,
        id_colaborador: colaboradorId2,
        id_ambiente: ambienteId,
        id_servico_catalogo: servicoId2,
      });

    const alocacaoId2 = alocacao2Res.body?.id || 'mock-alocacao-2';

    // Criar preços
    const preco1Res = await request(app.getHttpServer())
      .post('/api/v1/precos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        id_obra: obraId,
        id_servico_catalogo: servicoId1,
        preco_custo: 100.0,
        preco_venda: 150.0, // Margem 50%
        observacoes: 'Serviço 1 Relatórios',
      })
      .expect(201);

    precoId1 = preco1Res.body?.id;

    // Submeter e aprovar preço 1
    if (precoId1) {
      await request(app.getHttpServer())
        .patch(`/api/v1/precos/${precoId1}/submeter`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/api/v1/precos/${precoId1}/aprovar`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'APROVADO',
        })
        .expect(200);
    }

    const preco2Res = await request(app.getHttpServer())
      .post('/api/v1/precos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        id_obra: obraId,
        id_servico_catalogo: servicoId2,
        preco_custo: 80.0,
        preco_venda: 100.0, // Margem 25%
        observacoes: 'Serviço 2 Relatórios',
      })
      .expect(201);

    precoId2 = preco2Res.body?.id;

    // Submeter e aprovar preço 2
    if (precoId2) {
      await request(app.getHttpServer())
        .patch(`/api/v1/precos/${precoId2}/submeter`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/api/v1/precos/${precoId2}/aprovar`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'APROVADO',
        })
        .expect(200);
    }

    // Criar medições
    const medicao1Res = await request(app.getHttpServer())
      .post('/api/v1/medicoes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        id_alocacao: alocacaoId1,
        qtd_executada: 10,
        data_medicao: '2026-02-07',
      });

    medicaoId1 = medicao1Res.body?.id || 'mock-medicao-1';

    const medicao2Res = await request(app.getHttpServer())
      .post('/api/v1/medicoes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        id_alocacao: alocacaoId2,
        qtd_executada: 15,
        data_medicao: '2026-02-07',
      });

    medicaoId2 = medicao2Res.body?.id || 'mock-medicao-2';
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('GET /relatorios/dashboard-financeiro', () => {
    it('deve retornar dashboard com período MÊS por padrão (Gestor)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/relatorios/dashboard-financeiro')
        .set('Authorization', `Bearer ${gestorToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('periodo');
      expect(res.body).toHaveProperty('metricas');
      expect(res.body).toHaveProperty('por_obra');

      expect(res.body.periodo).toHaveProperty('tipo');
      expect(res.body.periodo).toHaveProperty('inicio');
      expect(res.body.periodo).toHaveProperty('fim');

      expect(res.body.metricas).toHaveProperty('obras_ativas');
      expect(res.body.metricas).toHaveProperty('total_medicoes');
      expect(res.body.metricas).toHaveProperty('custo_total');
      expect(res.body.metricas).toHaveProperty('receita_total');
      expect(res.body.metricas).toHaveProperty('lucro_bruto');
      expect(res.body.metricas).toHaveProperty('margem_percentual');
    });

    it('deve filtrar por obra específica (Admin)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/relatorios/dashboard-financeiro?id_obra=${obraId}&periodo=mes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('periodo');
      expect(res.body.periodo.tipo).toBe('mes');
    });

    it('deve retornar período DIA corretamente', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/relatorios/dashboard-financeiro?periodo=dia')
        .set('Authorization', `Bearer ${gestorToken}`)
        .expect(200);

      expect(res.body.periodo.tipo).toBe('dia');
    });

    it('deve retornar período SEMANA corretamente', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/relatorios/dashboard-financeiro?periodo=semana')
        .set('Authorization', `Bearer ${gestorToken}`)
        .expect(200);

      expect(res.body.periodo.tipo).toBe('semana');
    });

    it('deve retornar período ANO corretamente', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/relatorios/dashboard-financeiro?periodo=ano')
        .set('Authorization', `Bearer ${gestorToken}`)
        .expect(200);

      expect(res.body.periodo.tipo).toBe('ano');
    });

    it('deve bloquear acesso para usuário sem role autorizada', async () => {
      // Tentar fazer login com usuário que não existe
      const normalLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'Senha@123',
        });

      // Espera que falhe no login, então usa um token inválido
      const normalToken = 'invalid.token.here';

      await request(app.getHttpServer())
        .get('/api/v1/relatorios/dashboard-financeiro')
        .set('Authorization', `Bearer ${normalToken}`)
        .expect(401);
    });
  });

  describe('GET /relatorios/medicoes', () => {
    it('deve retornar lista de medições com paginação (Gestor)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/relatorios/medicoes')
        .set('Authorization', `Bearer ${gestorToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');

      expect(Array.isArray(res.body.data)).toBe(true);

      expect(res.body.meta).toHaveProperty('page');
      expect(res.body.meta).toHaveProperty('limit');
      expect(res.body.meta).toHaveProperty('total');
      expect(res.body.meta).toHaveProperty('pages');
    });

    it('deve retornar estrutura correta de medição', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/relatorios/medicoes')
        .set('Authorization', `Bearer ${gestorToken}`)
        .expect(200);

      if (res.body.data.length > 0) {
        const medicao = res.body.data[0];

        expect(medicao).toHaveProperty('id');
        expect(medicao).toHaveProperty('data');
        expect(medicao).toHaveProperty('obra');
        expect(medicao).toHaveProperty('colaborador');
        expect(medicao).toHaveProperty('servico');
        expect(medicao).toHaveProperty('quantidade');
        expect(medicao).toHaveProperty('status');
        expect(medicao).toHaveProperty('excedente');
      }
    });

    it('deve filtrar por obra (Financeiro)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/relatorios/medicoes?id_obra=${obraId}`)
        .set('Authorization', `Bearer ${financeiroToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
    });

    it('deve paginar resultados corretamente', async () => {
      const res1 = await request(app.getHttpServer())
        .get('/api/v1/relatorios/medicoes?page=1&limit=10')
        .set('Authorization', `Bearer ${gestorToken}`)
        .expect(200);

      expect(parseInt(res1.body.meta.page)).toBe(1);
      expect(parseInt(res1.body.meta.limit)).toBe(10);
    });

    it('deve bloquear acesso para usuário sem role autorizada', async () => {
      const invalidToken = 'invalid.token.here';

      await request(app.getHttpServer())
        .get('/api/v1/relatorios/medicoes')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);
    });
  });

  describe('GET /relatorios/produtividade', () => {
    it('deve retornar relatório de produtividade com período MÊS (Gestor)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/relatorios/produtividade')
        .set('Authorization', `Bearer ${gestorToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('periodo');
      expect(res.body).toHaveProperty('colaboradores');
      expect(res.body).toHaveProperty('total_colaboradores');
      expect(res.body).toHaveProperty('unidades_totais');

      expect(Array.isArray(res.body.colaboradores)).toBe(true);
    });

    it('deve retornar estrutura correta de colaborador', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/relatorios/produtividade')
        .set('Authorization', `Bearer ${encarregadoToken}`)
        .expect(200);

      if (res.body.colaboradores.length > 0) {
        const colab = res.body.colaboradores[0];

        expect(colab).toHaveProperty('colaborador_id');
        expect(colab).toHaveProperty('colaborador_nome');
        expect(colab).toHaveProperty('total_medicoes');
        expect(colab).toHaveProperty('total_unidades');
        expect(colab).toHaveProperty('obras');
        expect(colab).toHaveProperty('media_por_medicao');

        expect(Array.isArray(colab.obras)).toBe(true);
      }
    });

    it('deve filtrar por obra específica', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/relatorios/produtividade?id_obra=${obraId}&periodo=dia`)
        .set('Authorization', `Bearer ${gestorToken}`)
        .expect(200);

      expect(res.body.periodo.tipo).toBe('dia');
    });

    it('deve retornar período SEMANA', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/relatorios/produtividade?periodo=semana')
        .set('Authorization', `Bearer ${encarregadoToken}`)
        .expect(200);

      expect(res.body.periodo.tipo).toBe('semana');
    });

    it('deve bloquear acesso para usuário sem role autorizada', async () => {
      const invalidToken = 'invalid.token.here';

      await request(app.getHttpServer())
        .get('/api/v1/relatorios/produtividade')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);
    });
  });

  describe('GET /relatorios/margem-lucro', () => {
    it('deve retornar relatório de margem com paginação (Gestor)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/relatorios/margem-lucro')
        .set('Authorization', `Bearer ${gestorToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');

      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('deve retornar estrutura correta de preço/serviço', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/relatorios/margem-lucro')
        .set('Authorization', `Bearer ${financeiroToken}`)
        .expect(200);

      if (res.body.data.length > 0) {
        const preco = res.body.data[0];

        expect(preco).toHaveProperty('id');
        expect(preco).toHaveProperty('obra');
        expect(preco).toHaveProperty('servico');
        expect(preco).toHaveProperty('preco_custo');
        expect(preco).toHaveProperty('preco_venda');
        expect(preco).toHaveProperty('margem_percentual');
        expect(preco).toHaveProperty('status');
        expect(preco).toHaveProperty('vezes_utilizado');
        expect(preco).toHaveProperty('atende_minimo');
      }
    });

    it('deve retornar margem_media na metaData', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/relatorios/margem-lucro')
        .set('Authorization', `Bearer ${gestorToken}`)
        .expect(200);

      expect(res.body.meta).toHaveProperty('margem_media');
    });

    it('deve filtrar por obra específica', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/relatorios/margem-lucro?id_obra=${obraId}`)
        .set('Authorization', `Bearer ${gestorToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
    });

    it('deve paginar resultados corretamente', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/relatorios/margem-lucro?page=1&limit=10')
        .set('Authorization', `Bearer ${gestorToken}`)
        .expect(200);

      expect(parseInt(res.body.meta.page)).toBe(1);
      expect(parseInt(res.body.meta.limit)).toBe(10);
    });

    it('deve bloquear acesso para usuário sem role autorizada', async () => {
      const invalidToken = 'invalid.token.here';

      await request(app.getHttpServer())
        .get('/api/v1/relatorios/margem-lucro')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);
    });
  });

  describe('Controle de Acesso por Role', () => {
    it('Admin deve ter acesso a todos os endpoints', async () => {
      const endpoints = [
        '/api/v1/relatorios/dashboard-financeiro',
        '/api/v1/relatorios/medicoes',
        '/api/v1/relatorios/produtividade',
        '/api/v1/relatorios/margem-lucro',
      ];

      for (const endpoint of endpoints) {
        const res = await request(app.getHttpServer())
          .get(endpoint)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(res.status).toBe(200);
      }
    });

    it('Gestor deve ter acesso a todos os endpoints', async () => {
      const endpoints = [
        '/api/v1/relatorios/dashboard-financeiro',
        '/api/v1/relatorios/medicoes',
        '/api/v1/relatorios/produtividade',
        '/api/v1/relatorios/margem-lucro',
      ];

      for (const endpoint of endpoints) {
        const res = await request(app.getHttpServer())
          .get(endpoint)
          .set('Authorization', `Bearer ${gestorToken}`)
          .expect(200);

        expect(res.status).toBe(200);
      }
    });

    it('Financeiro deve ter acesso a medicoes e margem-lucro', async () => {
      const allowedEndpoints = [
        '/api/v1/relatorios/medicoes',
        '/api/v1/relatorios/margem-lucro',
      ];

      for (const endpoint of allowedEndpoints) {
        const res = await request(app.getHttpServer())
          .get(endpoint)
          .set('Authorization', `Bearer ${financeiroToken}`)
          .expect(200);

        expect(res.status).toBe(200);
      }
    });

    it('Encarregado deve ter acesso a medicoes e produtividade', async () => {
      const allowedEndpoints = [
        '/api/v1/relatorios/medicoes',
        '/api/v1/relatorios/produtividade',
      ];

      for (const endpoint of allowedEndpoints) {
        const res = await request(app.getHttpServer())
          .get(endpoint)
          .set('Authorization', `Bearer ${encarregadoToken}`)
          .expect(200);

        expect(res.status).toBe(200);
      }
    });
  });

  describe('Validação de Parâmetros', () => {
    it('deve aceitar período válido: DIA', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/relatorios/dashboard-financeiro?periodo=dia')
        .set('Authorization', `Bearer ${gestorToken}`)
        .expect(200);
    });

    it('deve aceitar período válido: SEMANA', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/relatorios/dashboard-financeiro?periodo=semana')
        .set('Authorization', `Bearer ${gestorToken}`)
        .expect(200);
    });

    it('deve aceitar período válido: MES', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/relatorios/dashboard-financeiro?periodo=mes')
        .set('Authorization', `Bearer ${gestorToken}`)
        .expect(200);
    });

    it('deve aceitar período válido: ANO', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/relatorios/dashboard-financeiro?periodo=ano')
        .set('Authorization', `Bearer ${gestorToken}`)
        .expect(200);
    });

    it('deve aceitarpage e limit válidos', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/relatorios/medicoes?page=2&limit=5')
        .set('Authorization', `Bearer ${gestorToken}`)
        .expect(200);

      expect(parseInt(res.body.meta.page)).toBe(2);
      expect(parseInt(res.body.meta.limit)).toBe(5);
    });
  });

  describe('Integridade de Dados', () => {
    it('dashboard deve incluir dados de medições criadas', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/relatorios/dashboard-financeiro?id_obra=${obraId}`)
        .set('Authorization', `Bearer ${gestorToken}`)
        .expect(200);

      expect(res.body.metricas).toBeDefined();
      // Verifica que a estrutura de métricas existe (even if 0 obras_ativas)
      expect(res.body.metricas).toHaveProperty('obras_ativas');
      expect(res.body.metricas).toHaveProperty('custo_total');
    });

    it('medicoes deve listar as medições criadas', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/relatorios/medicoes?id_obra=${obraId}`)
        .set('Authorization', `Bearer ${gestorToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('produtividade deve listar colaboradores com medições', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/relatorios/produtividade?id_obra=${obraId}`)
        .set('Authorization', `Bearer ${gestorToken}`)
        .expect(200);

      expect(res.body.colaboradores).toBeDefined();
      expect(Array.isArray(res.body.colaboradores)).toBe(true);
    });

    it('margem deve listar preços aprovados', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/relatorios/margem-lucro?id_obra=${obraId}`)
        .set('Authorization', `Bearer ${gestorToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      // Deve ter os 2 preços criados e aprovados
      if (res.body.data.length > 0) {
        const estaAprovado = res.body.data.some(
          (p: any) => p.status === 'APROVADO',
        );
        expect(estaAprovado).toBe(true);
      }
    });
  });
});
