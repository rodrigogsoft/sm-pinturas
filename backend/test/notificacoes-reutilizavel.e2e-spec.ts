import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { INestApplication, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Notificacoes Reutilizaveis E2E', () => {
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
    process.env.DATABASE_LOGGING = 'false';
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
    const email = `notificacao_${timestamp}@example.com`;
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

  const criarRegraInAppPorPerfil = async (eventType: string, perfilDestino: number) => {
    const dataSource = app.get(DataSource);
    await dataSource.query(
      `INSERT INTO tb_notification_rules (
        nome,
        event_type,
        perfis_destino,
        ids_usuarios_destino,
        canais,
        prioridade,
        ativo,
        dedupe_window_seconds,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, NULL, 'IN_APP', 'ALTA', true, 1, NOW(), NOW())`,
      [`Regra ${eventType}`, eventType, `${perfilDestino}`],
    );
  };

  it('publica evento de dominio com idempotencia e gera notificacao in-app para o perfil de destino', async () => {
    const admin = await registrarELogar(1);
    const financeiro = await registrarELogar(3);

    const eventType = `E2E_EVENTO_${Date.now()}`;
    await criarRegraInAppPorPerfil(eventType, 3);

    const payload = {
      event_type: eventType,
      source_module: 'e2e',
      entity_type: 'teste',
      entity_id: '11111111-1111-1111-1111-111111111111',
      payload: { detalhe: 'evento de teste' },
      idempotency_key: `idem-${eventType}`,
    };

    const primeiraPublicacao = await request(app.getHttpServer())
      .post('/api/v1/notificacoes/dominio-eventos')
      .set('Authorization', `Bearer ${admin.token}`)
      .send(payload)
      .expect(201);

    expect(primeiraPublicacao.body.event_type).toBe(eventType);
    expect(['PROCESSADO', 'RECEBIDO']).toContain(primeiraPublicacao.body.status);

    const segundaPublicacao = await request(app.getHttpServer())
      .post('/api/v1/notificacoes/dominio-eventos')
      .set('Authorization', `Bearer ${admin.token}`)
      .send(payload)
      .expect(201);

    expect(segundaPublicacao.body.id).toBe(primeiraPublicacao.body.id);

    const minhas = await request(app.getHttpServer())
      .get('/api/v1/notificacoes/minhas/paginado?page=1&limit=10')
      .set('Authorization', `Bearer ${financeiro.token}`)
      .expect(200);

    expect(minhas.body.meta.total).toBeGreaterThan(0);
    expect(Array.isArray(minhas.body.data)).toBe(true);

    const notificacaoGerada = minhas.body.data[0];
    expect(notificacaoGerada.id_evento).toBeTruthy();
    expect(notificacaoGerada.tipo_entidade).toBe(eventType);

    const clicada = await request(app.getHttpServer())
      .post(`/api/v1/notificacoes/${notificacaoGerada.id}/clicar`)
      .set('Authorization', `Bearer ${financeiro.token}`)
      .expect(200);

    expect(clicada.body.clicada).toBe(true);
    expect(clicada.body.clicada_em).toBeTruthy();
  });

  it('permite salvar/listar preferencias e bloqueia acesso de usuario comum a notificacoes de outro usuario', async () => {
    const encarregadoA = await registrarELogar(4);
    const encarregadoB = await registrarELogar(4);

    const prefResponse = await request(app.getHttpServer())
      .post('/api/v1/notificacoes/minhas/preferencias')
      .set('Authorization', `Bearer ${encarregadoA.token}`)
      .send({
        canal: 'PUSH',
        event_type: 'CONTA_PAGAR_ABERTA',
        habilitado: false,
        quiet_hours_inicio: '22:00',
        quiet_hours_fim: '07:00',
      })
      .expect(201);

    expect(Array.isArray(prefResponse.body)).toBe(true);
    expect(prefResponse.body.length).toBeGreaterThan(0);
    expect(prefResponse.body[0].canal).toBe('PUSH');
    expect(prefResponse.body[0].habilitado).toBe(false);

    const listagemPreferencias = await request(app.getHttpServer())
      .get('/api/v1/notificacoes/minhas/preferencias')
      .set('Authorization', `Bearer ${encarregadoA.token}`)
      .expect(200);

    expect(Array.isArray(listagemPreferencias.body)).toBe(true);
    expect(listagemPreferencias.body.length).toBeGreaterThan(0);

    await request(app.getHttpServer())
      .get(`/api/v1/notificacoes/usuario/${encarregadoA.userId}`)
      .set('Authorization', `Bearer ${encarregadoB.token}`)
      .expect(403);
  });

  it('retorna metricas de notificacao para perfil gestor/admin', async () => {
    const gestor = await registrarELogar(2);

    const metricas = await request(app.getHttpServer())
      .get('/api/v1/notificacoes/metricas/resumo')
      .set('Authorization', `Bearer ${gestor.token}`)
      .expect(200);

    expect(metricas.body).toHaveProperty('total_enviadas');
    expect(metricas.body).toHaveProperty('total_lidas');
    expect(metricas.body).toHaveProperty('total_clicadas');
    expect(metricas.body).toHaveProperty('total_falhas');
    expect(metricas.body).toHaveProperty('taxa_falha_percentual');
  });
});
