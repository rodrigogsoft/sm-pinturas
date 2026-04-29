import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { INestApplication, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('RN02 - Bloqueio de Faturamento (e2e)', () => {
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
    const email = `rn02_${timestamp}@example.com`;
    const password = 'senha123';

    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        nome_completo: `Perfil RN02 ${id_perfil}`,
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
      [`Cliente RN02 ${suffix}`, cnpj, `cliente_rn02_${suffix}@example.com`, 10],
    );

    const [obra] = await dataSource.query(
      `INSERT INTO tb_obras (nome, endereco_completo, status, data_inicio, id_cliente, deletado, created_at, updated_at)
       VALUES ($1, $2, 'ATIVA', $3, $4, false, NOW(), NOW())
       RETURNING id`,
      [`Obra RN02 ${suffix}`, 'Rua RN02, 100', '2026-04-01', cliente.id],
    );

    const [servico] = await dataSource.query(
      `INSERT INTO tb_servicos_catalogo (nome, unidade_medida, categoria, deletado, created_at, updated_at)
       VALUES ($1, 'M2', 'PINTURA', false, NOW(), NOW())
       RETURNING id`,
      [`Servico RN02 ${suffix}`],
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
      [pavimento.id, 'Ambiente RN02', 10],
    );

    const [colaborador] = await dataSource.query(
      `INSERT INTO tb_colaboradores (nome_completo, cpf_nif, email, ativo, deletado, created_at, updated_at)
       VALUES ($1, $2, $3, true, false, NOW(), NOW())
       RETURNING id`,
      [`Colaborador RN02 ${suffix}`, cpf, `colab_rn02_${suffix}@example.com`],
    );

    const [sessao] = await dataSource.query(
      `INSERT INTO tb_sessoes_diarias (id_encarregado, id_obra, data_sessao, hora_inicio, status, assinatura_url, deletado, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), 'ABERTA', 'https://example.com/assinatura-rn02.png', false, NOW(), NOW())
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

  describe('Cenário 1: Lote sem preços pendentes', () => {
    it('deve permitir criar lote quando NÃO há preços pendentes', async () => {
      const financeiro = await registrarELogar(3);
      const medicao = await criarMedicaoLegada(financeiro.userId, 'APROVADO');

      const response = await request(app.getHttpServer())
        .post('/api/v1/financeiro/lotes')
        .set('Authorization', `Bearer ${financeiro.token}`)
        .send({
          descricao: 'Lote RN02 - Sem Pendências',
          data_competencia: '2026-04-30',
          medicoes_ids: [medicao.medicaoId],
          id_criado_por: financeiro.userId,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });
  });

  describe('Cenário 2: Financeiro bloqueado por preços pendentes', () => {
    it('deve bloquear Financeiro de criar lote com preços pendentes (RN02)', async () => {
      const financeiro = await registrarELogar(3);
      const medicao = await criarMedicaoLegada(financeiro.userId, 'PENDENTE');

      const response = await request(app.getHttpServer())
        .post('/api/v1/financeiro/lotes')
        .set('Authorization', `Bearer ${financeiro.token}`)
        .send({
          descricao: 'Lote RN02 - Com Pendências',
          data_competencia: '2026-04-30',
          medicoes_ids: [medicao.medicaoId],
          id_criado_por: financeiro.userId,
        })
        .expect(403);

      expect(response.body.message).toContain('RN02');
      expect(response.body.codigo).toBe('PRECOS_PENDENTES_BLOQUEIO');
    });
  });

  describe('Cenário 3: Admin SEM justificativa bloqueado', () => {
    it('deve bloquear Admin de criar lote SEM justificativa mesmo com preços pendentes', async () => {
      const admin = await registrarELogar(1);
      const medicao = await criarMedicaoLegada(admin.userId, 'PENDENTE');

      const response = await request(app.getHttpServer())
        .post('/api/v1/financeiro/lotes')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          descricao: 'Lote RN02 - Admin Sem Justificativa',
          data_competencia: '2026-04-30',
          medicoes_ids: [medicao.medicaoId],
          id_criado_por: admin.userId,
        })
        .expect(403);

      expect(response.body.message).toContain('RN02');
      expect(response.body.instrucao).toContain('justificativa');
    });
  });

  describe('Cenário 4: Admin COM justificativa permitido', () => {
    it('deve permitir Admin criar lote COM justificativa mesmo com preços pendentes', async () => {
      const admin = await registrarELogar(1);
      const medicao = await criarMedicaoLegada(admin.userId, 'PENDENTE');

      const response = await request(app.getHttpServer())
        .post('/api/v1/financeiro/lotes')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          descricao: 'Lote RN02 - Admin Com Justificativa',
          data_competencia: '2026-04-30',
          medicoes_ids: [medicao.medicaoId],
          id_criado_por: admin.userId,
          justificativa_bypass_admin: 'Urgência do cliente, preços serão revisados posteriormente',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });
  });
});
