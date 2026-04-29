import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import request = require('supertest');
import { AppModule } from '../src/app.module';

describe('Fluxo Completo E2E', () => {
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

  it('deve executar fluxo completo: obra -> sessao -> alocacao -> medicao -> lote -> pagamento', async () => {
    const timestamp = Date.now();

    // 1) Criar usuarios
    const adminEmail = `admin_${timestamp}@example.com`;
    const encarregadoEmail = `enc_${timestamp}@example.com`;
    const financeiroEmail = `fin_${timestamp}@example.com`;
    const gestorEmail = `gestor_${timestamp}@example.com`;
    const password = 'senha123';

    const adminUser = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        nome_completo: 'Admin E2E',
        email: adminEmail,
        password,
        id_perfil: 1,
      })
      .expect(201);

    const encarregadoUser = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        nome_completo: 'Encarregado E2E',
        email: encarregadoEmail,
        password,
        id_perfil: 4,
      })
      .expect(201);

    const financeiroUser = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        nome_completo: 'Financeiro E2E',
        email: financeiroEmail,
        password,
        id_perfil: 3,
      })
      .expect(201);

    const gestorUser = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        nome_completo: 'Gestor E2E',
        email: gestorEmail,
        password,
        id_perfil: 2,
      })
      .expect(201);

    // 2) Login usuarios
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password })
      .expect(200);

    const encarregadoLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: encarregadoEmail, password })
      .expect(200);

    const financeiroLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: financeiroEmail, password })
      .expect(200);

    const gestorLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: gestorEmail, password })
      .expect(200);

    const adminToken = adminLogin.body.access_token as string;
    const encarregadoToken = encarregadoLogin.body.access_token as string;
    const financeiroToken = financeiroLogin.body.access_token as string;
    const gestorToken = gestorLogin.body.access_token as string;

    const idEncarregado = encarregadoUser.body.id as string;
    const idFinanceiro = financeiroUser.body.id as string;
    const idGestor = gestorUser.body.id as string;

    // 3) Criar cliente
    const clienteResponse = await request(app.getHttpServer())
      .post('/api/v1/clientes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        razao_social: `Cliente E2E ${timestamp}`,
        cnpj_nif: `${timestamp}`,
        email: `cliente_${timestamp}@example.com`,
        dia_corte: 10,
      })
      .expect(201);

    const idCliente = clienteResponse.body.id as string;

    // 4) Criar obra com pavimento e ambiente
    const obraResponse = await request(app.getHttpServer())
      .post('/api/v1/obras')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nome: `Obra E2E ${timestamp}`,
        endereco_completo: 'Rua Teste, 123',
        data_inicio: '2026-02-07',
        id_cliente: idCliente,
        pavimentos: [
          {
            nome: 'Terreo',
            ordem: 0,
            ambientes: [
              { nome: 'Sala 101', area_m2: 25.5 },
            ],
          },
        ],
      })
      .expect(201);

    const ambienteId = obraResponse.body.pavimentos?.[0]?.ambientes?.[0]?.id as string;
    expect(ambienteId).toBeDefined();

    // 5) Criar colaborador
    const colaboradorResponse = await request(app.getHttpServer())
      .post('/api/v1/colaboradores')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nome_completo: `Colab E2E ${timestamp}`,
        cpf_nif: `${timestamp}01`,
        email: `colab_${timestamp}@example.com`,
      })
      .expect(201);

    const idColaborador = colaboradorResponse.body.id as string;

    // 6) Criar serviço e preço aprovado para liberar medição
    const servicoResponse = await request(app.getHttpServer())
      .post('/api/v1/servicos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nome: `Servico E2E ${timestamp}`,
        descricao: 'Servico para fluxo completo E2E',
        unidade_medida: 'M2',
        categoria: 'PINTURA',
      })
      .expect(201);

    const idServico = Number(servicoResponse.body.id);

    const precoResponse = await request(app.getHttpServer())
      .post('/api/v1/precos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        id_obra: obraResponse.body.id,
        id_servico_catalogo: idServico,
        preco_custo: 100,
        preco_venda: 140,
        observacoes: 'Preco E2E aprovado',
      })
      .expect(201);

    const idPreco = precoResponse.body.id as string;

    await request(app.getHttpServer())
      .patch(`/api/v1/precos/${idPreco}/submeter`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/precos/${idPreco}/aprovar`)
      .set('Authorization', `Bearer ${gestorToken}`)
      .send({ status: 'APROVADO', observacoes: 'Aprovado no fluxo E2E' })
      .expect(200);

    // 7) Criar sessao (v1)
    const sessaoResponse = await request(app.getHttpServer())
      .post('/api/v1/sessoes')
      .set('Authorization', `Bearer ${encarregadoToken}`)
      .send({
        id_encarregado: idEncarregado,
        id_obra: obraResponse.body.id,
        data_sessao: '2026-02-07',
        hora_inicio: '2026-02-07T08:00:00Z',
        assinatura_url: 'https://example.com/assinatura-e2e.png',
      })
      .expect(201);

    const idSessao = sessaoResponse.body.id as string;

    // 8) Criar alocacao (v1)
    const alocacaoResponse = await request(app.getHttpServer())
      .post('/api/v1/alocacoes')
      .set('Authorization', `Bearer ${encarregadoToken}`)
      .send({
        id_sessao: idSessao,
        id_ambiente: ambienteId,
        id_colaborador: idColaborador,
        id_servico_catalogo: idServico,
        hora_inicio: '2026-02-07T08:30:00Z',
      })
      .expect(201);

    const idAlocacao = alocacaoResponse.body.id as string;

    // 9) Criar medicao (v1)
    const medicaoResponse = await request(app.getHttpServer())
      .post('/api/v1/medicoes')
      .set('Authorization', `Bearer ${encarregadoToken}`)
      .send({
        id_alocacao: idAlocacao,
        qtd_executada: 10.0,
        area_planejada: 20.0,
        data_medicao: '2026-02-07',
      })
      .expect(201);

    const idMedicao = medicaoResponse.body.id as string;

    // 10) Criar lote (v1)
    const loteResponse = await request(app.getHttpServer())
      .post('/api/v1/financeiro/lotes')
      .set('Authorization', `Bearer ${financeiroToken}`)
      .send({
        descricao: `Lote E2E ${timestamp}`,
        data_competencia: '2026-02-07',
        medicoes_ids: [idMedicao],
        id_criado_por: idFinanceiro,
      })
      .expect(201);

    const idLote = loteResponse.body.id as string;

    // 11) Enviar para aprovacao (v1)
    await request(app.getHttpServer())
      .post(`/api/v1/financeiro/lotes/${idLote}/enviar-aprovacao`)
      .set('Authorization', `Bearer ${financeiroToken}`)
      .expect(200);

    // 12) Aprovar lote (v1)
    await request(app.getHttpServer())
      .post(`/api/v1/financeiro/lotes/${idLote}/aprovar`)
      .set('Authorization', `Bearer ${gestorToken}`)
      .send({ id_aprovado_por: idGestor })
      .expect(200);

    // 13) Processar pagamento (v1)
    await request(app.getHttpServer())
      .post(`/api/v1/financeiro/lotes/${idLote}/processar-pagamento`)
      .set('Authorization', `Bearer ${financeiroToken}`)
      .send({
        data_pagamento: '2026-02-07',
        tipo_pagamento: 'PIX',
        id_processado_por: idFinanceiro,
      })
      .expect(200);
  });
});
