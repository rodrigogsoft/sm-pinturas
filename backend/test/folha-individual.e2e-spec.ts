import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { INestApplication, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Folha Individual E2E', () => {
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

  const registrarELogar = async (id_perfil: number) => {
    const timestamp = `${Date.now()}_${id_perfil}_${Math.random().toString(16).slice(2, 8)}`;
    const email = `perfil_${timestamp}@example.com`;
    const password = 'senha123';

    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        nome_completo: `Perfil ${id_perfil}`,
        email,
        password,
        id_perfil,
      })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);

    return {
      token: loginResponse.body.access_token as string,
      userId: loginResponse.body.user?.id as string,
      email,
    };
  };

  const criarMedicaoAberta = async (idUsuarioEncarregado: string, dataMedicao: string) => {
    const dataSource = app.get(DataSource);
    const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const cpf = suffix.padStart(11, '0').slice(-11);
    const cnpj = suffix.padStart(14, '0').slice(-14);

    const [cliente] = await dataSource.query(
      `INSERT INTO tb_clientes (razao_social, cnpj_nif, email, dia_corte, deletado, created_at, updated_at)
       VALUES ($1, $2, $3, $4, false, NOW(), NOW())
       RETURNING id`,
      [`Cliente E2E ${suffix}`, cnpj, `cliente_${suffix}@example.com`, 15],
    );

    const [obra] = await dataSource.query(
      `INSERT INTO tb_obras (nome, endereco_completo, status, data_inicio, id_cliente, deletado, created_at, updated_at)
       VALUES ($1, $2, 'ATIVA', $3, $4, false, NOW(), NOW())
       RETURNING id`,
      [`Obra E2E ${suffix}`, 'Rua Teste, 123', dataMedicao, cliente.id],
    );

    const [pavimento] = await dataSource.query(
      `INSERT INTO tb_pavimentos (id_obra, nome, ordem, deletado, created_at, updated_at)
       VALUES ($1, $2, $3, false, NOW(), NOW())
       RETURNING id`,
      [obra.id, 'Térreo', 1],
    );

    const [ambiente] = await dataSource.query(
      `INSERT INTO tb_ambientes (id_pavimento, nome, area_m2, deletado, created_at, updated_at)
       VALUES ($1, $2, $3, false, NOW(), NOW())
       RETURNING id`,
      [pavimento.id, 'Sala E2E', 25],
    );

    const [itemAmbiente] = await dataSource.query(
      `INSERT INTO tb_itens_ambiente (id_ambiente, nome_elemento, area_planejada, area_medida_total, progresso, status, deletado, created_at, updated_at)
       VALUES ($1, $2, $3, 0, 0, 'ABERTO', false, NOW(), NOW())
       RETURNING id`,
      [ambiente.id, 'Parede principal', 25],
    );

    const [colaborador] = await dataSource.query(
      `INSERT INTO tb_colaboradores (nome_completo, cpf_nif, email, ativo, deletado, created_at, updated_at)
       VALUES ($1, $2, $3, true, false, NOW(), NOW())
       RETURNING id`,
      [`Colaborador E2E ${suffix}`, cpf, `colaborador_${suffix}@example.com`],
    );

    const [sessao] = await dataSource.query(
      `INSERT INTO tb_sessoes_diarias (id_encarregado, id_obra, data_sessao, hora_inicio, status, deletado, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), 'ABERTA', false, NOW(), NOW())
       RETURNING id`,
      [idUsuarioEncarregado, obra.id, dataMedicao],
    );

    const [alocacaoItem] = await dataSource.query(
      `INSERT INTO tb_alocacoes_itens (id_sessao, id_ambiente, id_item_ambiente, id_colaborador, status, hora_inicio, deletado, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'EM_ANDAMENTO', NOW(), false, NOW(), NOW())
       RETURNING id`,
      [sessao.id, ambiente.id, itemAmbiente.id, colaborador.id],
    );

    const [medicao] = await dataSource.query(
      `INSERT INTO tb_medicoes_colaborador (id_alocacao_item, id_colaborador, id_item_ambiente, qtd_executada, status_pagamento, data_medicao, deletado, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'ABERTO', $5, false, NOW(), NOW())
       RETURNING id`,
      [alocacaoItem.id, colaborador.id, itemAmbiente.id, 12.5, dataMedicao],
    );

    return {
      medicaoId: medicao.id as string,
      obraId: obra.id as string,
      colaboradorId: colaborador.id as string,
    };
  };

  it('bloqueia acesso sem autenticação', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/financeiro/folha-individual')
      .expect(401);
  });

  it('permite acesso para FINANCEIRO e retorna a estrutura esperada', async () => {
    const { token } = await registrarELogar(3);

    const response = await request(app.getHttpServer())
      .get('/api/v1/financeiro/folha-individual')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toHaveProperty('filtros');
    expect(response.body).toHaveProperty('paginacao');
    expect(response.body).toHaveProperty('totais');
    expect(response.body).toHaveProperty('itens');
    expect(Array.isArray(response.body.itens)).toBe(true);
  });

  it('nega acesso para ENCARREGADO', async () => {
    const { token } = await registrarELogar(4);

    await request(app.getHttpServer())
      .get('/api/v1/financeiro/folha-individual')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('permite fechamento para FINANCEIRO, mas retorna 400 quando não há medições abertas no período', async () => {
    const { token } = await registrarELogar(3);

    const response = await request(app.getHttpServer())
      .post('/api/v1/financeiro/folha-individual/fechar-periodo')
      .set('Authorization', `Bearer ${token}`)
      .send({
        data_inicio: '2026-03-01',
        data_fim: '2026-03-31',
        id_criado_por: '11111111-1111-4111-8111-111111111111',
      })
      .expect(400);

    expect(response.body.message).toContain('Nenhuma medicao aberta encontrada');
  });

  it('nega reabertura de período para FINANCEIRO', async () => {
    const { token } = await registrarELogar(3);

    await request(app.getHttpServer())
      .patch('/api/v1/financeiro/folha-individual/reabrir-periodo')
      .set('Authorization', `Bearer ${token}`)
      .send({
        data_inicio: '2026-03-01',
        data_fim: '2026-03-31',
      })
      .expect(403);
  });

  it('permite reabertura para GESTOR e valida período inválido', async () => {
    const { token } = await registrarELogar(2);

    const response = await request(app.getHttpServer())
      .patch('/api/v1/financeiro/folha-individual/reabrir-periodo')
      .set('Authorization', `Bearer ${token}`)
      .send({
        data_inicio: '2026-03-31',
        data_fim: '2026-03-01',
      })
      .expect(400);

    expect(response.body.message).toContain('data_fim deve ser maior ou igual a data_inicio');
  });
  it('gera lote ao fechar o período e reabre corretamente as medições', async () => {
    const dataInicio = '2026-04-10';
    const dataFim = '2026-04-10';
    const financeiro = await registrarELogar(3);

    const { medicaoId } = await criarMedicaoAberta(financeiro.userId, dataInicio);

    const fechamento = await request(app.getHttpServer())
      .post('/api/v1/financeiro/folha-individual/fechar-periodo')
      .set('Authorization', `Bearer ${financeiro.token}`)
      .send({
        data_inicio: dataInicio,
        data_fim: dataFim,
        id_criado_por: financeiro.userId,
      })
      .expect(201);

    expect(fechamento.body.total_medicoes_fechadas).toBe(1);
    expect(fechamento.body.lotes_gerados).toHaveLength(1);
    expect(fechamento.body.lotes_gerados[0].qtd_medicoes).toBe(1);

    const consultaFechada = await request(app.getHttpServer())
      .get('/api/v1/financeiro/folha-individual')
      .query({ data_inicio: dataInicio, data_fim: dataFim })
      .set('Authorization', `Bearer ${financeiro.token}`)
      .expect(200);

    expect(consultaFechada.body.itens).toHaveLength(1);
    expect(consultaFechada.body.itens[0].status).toBe('ABERTO');
    expect(consultaFechada.body.itens[0].medicoes_ids).toContain(medicaoId);

    const gestor = await registrarELogar(2);

    const reabertura = await request(app.getHttpServer())
      .patch('/api/v1/financeiro/folha-individual/reabrir-periodo')
      .set('Authorization', `Bearer ${gestor.token}`)
      .send({
        data_inicio: dataInicio,
        data_fim: dataFim,
      })
      .expect(200);

    expect(reabertura.body.total_medicoes_reabertas).toBe(1);

    const consultaReaberta = await request(app.getHttpServer())
      .get('/api/v1/financeiro/folha-individual')
      .query({ data_inicio: dataInicio, data_fim: dataFim })
      .set('Authorization', `Bearer ${financeiro.token}`)
      .expect(200);

    expect(consultaReaberta.body.itens).toHaveLength(1);
    expect(consultaReaberta.body.itens[0].status).toBe('ABERTO');
    expect(consultaReaberta.body.itens[0].medicoes_ids).toContain(medicaoId);
  });

  it('aplica paginação e filtros da visão agregada e processa pagamento em massa', async () => {
    const dataBase = '2026-05-11';
    const financeiro = await registrarELogar(3);

    const medicao1 = await criarMedicaoAberta(financeiro.userId, dataBase);
    const medicao2 = await criarMedicaoAberta(financeiro.userId, dataBase);

    const consultaPaginada = await request(app.getHttpServer())
      .get('/api/v1/financeiro/folha-individual')
      .query({
        data_inicio: dataBase,
        data_fim: dataBase,
        status: 'ABERTO',
        page: 1,
        limit: 1,
      })
      .set('Authorization', `Bearer ${financeiro.token}`)
      .expect(200);

    expect(consultaPaginada.body.paginacao.total_registros).toBe(2);
    expect(consultaPaginada.body.paginacao.total_paginas).toBe(2);
    expect(consultaPaginada.body.itens).toHaveLength(1);

    const nomeColaborador = consultaPaginada.body.itens[0].nome_colaborador as string;

    const consultaFiltrada = await request(app.getHttpServer())
      .get('/api/v1/financeiro/folha-individual')
      .query({
        data_inicio: dataBase,
        data_fim: dataBase,
        colaborador: nomeColaborador,
      })
      .set('Authorization', `Bearer ${financeiro.token}`)
      .expect(200);

    expect(consultaFiltrada.body.itens).toHaveLength(1);
    expect(consultaFiltrada.body.itens[0].nome_colaborador).toBe(nomeColaborador);

    const processamento = await request(app.getHttpServer())
      .post('/api/v1/financeiro/folha-individual/processar-pagamento')
      .set('Authorization', `Bearer ${financeiro.token}`)
      .send({
        medicoes_ids: [medicao1.medicaoId, medicao2.medicaoId],
        data_pagamento: dataBase,
        tipo_pagamento: 'PIX',
        observacoes: 'Pagamento em massa E2E',
      })
      .expect(200);

    expect(processamento.body.total_solicitadas).toBe(2);
    expect(processamento.body.total_processadas).toBe(2);

    const consultaPago = await request(app.getHttpServer())
      .get('/api/v1/financeiro/folha-individual')
      .query({
        data_inicio: dataBase,
        data_fim: dataBase,
        status: 'PAGO',
      })
      .set('Authorization', `Bearer ${financeiro.token}`)
      .expect(200);

    expect(consultaPago.body.paginacao.total_registros).toBe(2);
    expect(consultaPago.body.itens.every((item: { status: string }) => item.status === 'PAGO')).toBe(true);
  });
});
