import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { INestApplication, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Lotes de Pagamento E2E', () => {
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
    };
  };

  const criarMedicaoLegada = async (
    idUsuarioEncarregado: string,
    statusPreco: 'APROVADO' | 'PENDENTE' = 'APROVADO',
  ) => {
    const dataSource = app.get(DataSource);
    const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const cpf = suffix.padStart(11, '0').slice(-11);
    const cnpj = suffix.padStart(14, '0').slice(-14);

    const [cliente] = await dataSource.query(
      `INSERT INTO tb_clientes (razao_social, cnpj_nif, email, dia_corte, deletado, created_at, updated_at)
       VALUES ($1, $2, $3, $4, false, NOW(), NOW())
       RETURNING id`,
      [`Cliente Lote ${suffix}`, cnpj, `cliente_lote_${suffix}@example.com`, 10],
    );

    const [obra] = await dataSource.query(
      `INSERT INTO tb_obras (nome, endereco_completo, status, data_inicio, id_cliente, deletado, created_at, updated_at)
       VALUES ($1, $2, 'ATIVA', $3, $4, false, NOW(), NOW())
       RETURNING id`,
      [`Obra Lote ${suffix}`, 'Av. Financeiro, 100', '2026-04-01', cliente.id],
    );

    const [servico] = await dataSource.query(
      `INSERT INTO tb_servicos_catalogo (nome, unidade_medida, categoria, deletado, created_at, updated_at)
       VALUES ($1, 'M2', 'PINTURA', false, NOW(), NOW())
       RETURNING id`,
      [`Pintura Interna ${suffix}`],
    );

    await dataSource.query(
      `INSERT INTO tb_tabela_precos (
        id_obra, id_servico_catalogo, preco_custo, preco_venda, margem_percentual,
        status_aprovacao, deletado, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, false, NOW(), NOW())`,
      [obra.id, servico.id, 20, 50, 60, statusPreco],
    );

    const [pavimento] = await dataSource.query(
      `INSERT INTO tb_pavimentos (id_obra, nome, ordem, deletado, created_at, updated_at)
       VALUES ($1, $2, $3, false, NOW(), NOW())
       RETURNING id`,
      [obra.id, 'Pavimento Único', 1],
    );

    const [ambiente] = await dataSource.query(
      `INSERT INTO tb_ambientes (id_pavimento, nome, area_m2, deletado, created_at, updated_at)
       VALUES ($1, $2, $3, false, NOW(), NOW())
       RETURNING id`,
      [pavimento.id, 'Ambiente Lote', 10],
    );

    const [colaborador] = await dataSource.query(
      `INSERT INTO tb_colaboradores (nome_completo, cpf_nif, email, ativo, deletado, created_at, updated_at)
       VALUES ($1, $2, $3, true, false, NOW(), NOW())
       RETURNING id`,
      [`Colaborador Lote ${suffix}`, cpf, `colab_lote_${suffix}@example.com`],
    );

    const [sessao] = await dataSource.query(
      `INSERT INTO tb_sessoes_diarias (id_encarregado, id_obra, data_sessao, hora_inicio, status, deletado, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), 'ABERTA', false, NOW(), NOW())
       RETURNING id`,
      [idUsuarioEncarregado, obra.id, '2026-04-01'],
    );

    const [alocacao] = await dataSource.query(
      `INSERT INTO tb_alocacoes_tarefa (
        id_sessao, id_ambiente, id_item_ambiente, id_colaborador, id_servico_catalogo,
        status, hora_inicio, deletado, created_at, updated_at
      ) VALUES ($1, $2, NULL, $3, $4, 'EM_ANDAMENTO', NOW(), false, NOW(), NOW())
       RETURNING id`,
      [sessao.id, ambiente.id, colaborador.id, servico.id],
    );

    const [medicao] = await dataSource.query(
      `INSERT INTO tb_medicoes (
        id_alocacao, qtd_executada, status_pagamento, valor_calculado, data_medicao,
        id_obra, deletado, created_at, updated_at, deleted_at
      ) VALUES ($1, $2, 'ABERTO', $3, $4, $5, false, NOW(), NOW(), NULL)
       RETURNING id`,
      [alocacao.id, 10, 500, '2026-04-01', obra.id],
    );

    return {
      medicaoId: medicao.id as string,
      obraId: obra.id as string,
    };
  };

  it('bloqueia criação de lote para FINANCEIRO quando há preço pendente (RN02)', async () => {
    const financeiro = await registrarELogar(3);
    const medicao = await criarMedicaoLegada(financeiro.userId, 'PENDENTE');

    const response = await request(app.getHttpServer())
      .post('/api/v1/financeiro/lotes')
      .set('Authorization', `Bearer ${financeiro.token}`)
      .send({
        descricao: 'Lote bloqueado RN02',
        data_competencia: '2026-04-30',
        medicoes_ids: [medicao.medicaoId],
        id_criado_por: financeiro.userId,
      })
      .expect(403);

    expect(response.body.message).toContain('RN02');
    expect(response.body.codigo).toBe('PRECOS_PENDENTES_BLOQUEIO');
  });

  it('permite ADMIN forçar criação do lote com justificativa quando houver preço pendente', async () => {
    const admin = await registrarELogar(1);
    const medicao = await criarMedicaoLegada(admin.userId, 'PENDENTE');

    const response = await request(app.getHttpServer())
      .post('/api/v1/financeiro/lotes')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        descricao: 'Lote admin com bypass',
        data_competencia: '2026-04-30',
        medicoes_ids: [medicao.medicaoId],
        id_criado_por: admin.userId,
        justificativa_bypass_admin: 'Urgência aprovada para teste E2E',
      })
      .expect(201);

    expect(response.body.status).toBe('ABERTO');
    expect(response.body.qtd_medicoes).toBe(1);
  });

  it('bloqueia processamento de pagamento sem aprovação prévia do lote', async () => {
    const financeiro = await registrarELogar(3);
    const medicao = await criarMedicaoLegada(financeiro.userId, 'APROVADO');

    const criacao = await request(app.getHttpServer())
      .post('/api/v1/financeiro/lotes')
      .set('Authorization', `Bearer ${financeiro.token}`)
      .send({
        descricao: 'Lote sem aprovação prévia',
        data_competencia: '2026-04-30',
        medicoes_ids: [medicao.medicaoId],
        id_criado_por: financeiro.userId,
      })
      .expect(201);

    const loteId = criacao.body.id as string;

    const pagamento = await request(app.getHttpServer())
      .post(`/api/v1/financeiro/lotes/${loteId}/processar-pagamento`)
      .set('Authorization', `Bearer ${financeiro.token}`)
      .send({
        data_pagamento: '2026-05-02',
        tipo_pagamento: 'PIX',
      })
      .expect(400);

    expect(pagamento.body.message).toContain('aprovado por um gestor');

    const dataSource = app.get(DataSource);
    await dataSource.query(
      `UPDATE tb_lotes_pagamento
       SET deletado = true,
           updated_at = NOW()
       WHERE id = $1`,
      [loteId],
    );
  });

  it('executa o ciclo completo do lote: criar, enviar, aprovar e pagar', async () => {
    const financeiro = await registrarELogar(3);
    const gestor = await registrarELogar(2);
    const medicao = await criarMedicaoLegada(financeiro.userId, 'APROVADO');

    const criacao = await request(app.getHttpServer())
      .post('/api/v1/financeiro/lotes')
      .set('Authorization', `Bearer ${financeiro.token}`)
      .send({
        descricao: 'Lote ciclo completo',
        data_competencia: '2026-04-30',
        medicoes_ids: [medicao.medicaoId],
        id_criado_por: financeiro.userId,
      })
      .expect(201);

    expect(criacao.body.status).toBe('ABERTO');
    expect(Number(criacao.body.valor_total)).toBe(500);
    expect(criacao.body.qtd_medicoes).toBe(1);

    const loteId = criacao.body.id as string;

    const enviado = await request(app.getHttpServer())
      .post(`/api/v1/financeiro/lotes/${loteId}/enviar-aprovacao`)
      .set('Authorization', `Bearer ${financeiro.token}`)
      .expect(200);

    expect(enviado.body.status).toBe('ABERTO');

    const aprovado = await request(app.getHttpServer())
      .post(`/api/v1/financeiro/lotes/${loteId}/aprovar`)
      .set('Authorization', `Bearer ${gestor.token}`)
      .send({})
      .expect(200);

    expect(aprovado.body.status).toBe('ABERTO');
    expect(aprovado.body.id_aprovado_por).toBe(gestor.userId);

    const pago = await request(app.getHttpServer())
      .post(`/api/v1/financeiro/lotes/${loteId}/processar-pagamento`)
      .set('Authorization', `Bearer ${financeiro.token}`)
      .send({
        data_pagamento: '2026-05-02',
        tipo_pagamento: 'PIX',
        observacoes: 'Pagamento validado no E2E',
      })
      .expect(200);

    expect(pago.body.status).toBe('PAGO');
    expect(pago.body.tipo_pagamento).toBe('PIX');

    const medicoesDoLote = await request(app.getHttpServer())
      .get(`/api/v1/financeiro/lotes/${loteId}/medicoes`)
      .set('Authorization', `Bearer ${financeiro.token}`)
      .expect(200);

    expect(Array.isArray(medicoesDoLote.body)).toBe(true);
    expect(medicoesDoLote.body).toHaveLength(1);
    expect(medicoesDoLote.body[0].status_pagamento).toBe('PAGO');
    expect(medicoesDoLote.body[0].id_lote_pagamento).toBe(loteId);
  });

  it('cancela lote e libera medição para ABERTO', async () => {
    const financeiro = await registrarELogar(3);
    const gestor = await registrarELogar(2);
    const medicao = await criarMedicaoLegada(financeiro.userId, 'APROVADO');

    const criacao = await request(app.getHttpServer())
      .post('/api/v1/financeiro/lotes')
      .set('Authorization', `Bearer ${financeiro.token}`)
      .send({
        descricao: 'Lote para cancelamento',
        data_competencia: '2026-06-15',
        medicoes_ids: [medicao.medicaoId],
        id_criado_por: financeiro.userId,
      })
      .expect(201);

    const loteId = criacao.body.id as string;

    const cancelado = await request(app.getHttpServer())
      .post(`/api/v1/financeiro/lotes/${loteId}/cancelar`)
      .set('Authorization', `Bearer ${gestor.token}`)
      .expect(200);

    expect(cancelado.body.status).toBe('CANCELADO');

    const dataSource = app.get(DataSource);
    const [medicaoAtualizada] = await dataSource.query(
      `SELECT status_pagamento, id_lote_pagamento
       FROM tb_medicoes
       WHERE id = $1`,
      [medicao.medicaoId],
    );

    expect(medicaoAtualizada.status_pagamento).toBe('ABERTO');
    expect(medicaoAtualizada.id_lote_pagamento).toBeNull();
  });

  it('retorna agregados corretos no dashboard para lotes pagos e cancelados', async () => {
    const financeiro = await registrarELogar(3);
    const gestor = await registrarELogar(2);
    const medicaoPago = await criarMedicaoLegada(financeiro.userId, 'APROVADO');
    const medicaoCancelado = await criarMedicaoLegada(financeiro.userId, 'APROVADO');

    const lotePago = await request(app.getHttpServer())
      .post('/api/v1/financeiro/lotes')
      .set('Authorization', `Bearer ${financeiro.token}`)
      .send({
        descricao: 'Lote dashboard pago',
        data_competencia: '2026-07-15',
        medicoes_ids: [medicaoPago.medicaoId],
        id_criado_por: financeiro.userId,
      })
      .expect(201);

    const loteCancelado = await request(app.getHttpServer())
      .post('/api/v1/financeiro/lotes')
      .set('Authorization', `Bearer ${financeiro.token}`)
      .send({
        descricao: 'Lote dashboard cancelado',
        data_competencia: '2026-07-15',
        medicoes_ids: [medicaoCancelado.medicaoId],
        id_criado_por: financeiro.userId,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/financeiro/lotes/${lotePago.body.id}/enviar-aprovacao`)
      .set('Authorization', `Bearer ${financeiro.token}`)
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/financeiro/lotes/${lotePago.body.id}/aprovar`)
      .set('Authorization', `Bearer ${gestor.token}`)
      .send({})
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/financeiro/lotes/${lotePago.body.id}/processar-pagamento`)
      .set('Authorization', `Bearer ${financeiro.token}`)
      .send({
        data_pagamento: '2026-07-20',
        tipo_pagamento: 'PIX',
      })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/financeiro/lotes/${loteCancelado.body.id}/cancelar`)
      .set('Authorization', `Bearer ${gestor.token}`)
      .expect(200);

    const dashboard = await request(app.getHttpServer())
      .get('/api/v1/financeiro/dashboard')
      .set('Authorization', `Bearer ${financeiro.token}`)
      .expect(200);

    expect(dashboard.body.total_lotes).toBe(5);
    expect(dashboard.body.total_pago).toBe(1000);
    expect(dashboard.body.total_pendente).toBe(0);
    expect(dashboard.body.por_status.pago).toBe(2);
    expect(dashboard.body.por_status.cancelado).toBe(2);
    expect(dashboard.body.por_status.aberto).toBe(1);
  });
});
