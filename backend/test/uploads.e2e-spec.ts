import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { PerfilEnum } from '../src/common/enums';
import * as fs from 'fs';
import * as path from 'path';

describe('Uploads Module (E2E)', () => {
  let app: INestApplication;
  let authToken: string;
  let uploadId: string;

  // Caminho do diretório de uploads
  const uploadsDir = path.join(process.cwd(), 'uploads');

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
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();

    // Criar usuário Encarregado e fazer login
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        nome_completo: 'Encarregado Teste Upload',
        email: 'encarregado.upload@test.com',
        password: 'Senha@123',
        id_perfil: PerfilEnum.ENCARREGADO,
      })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'encarregado.upload@test.com',
        password: 'Senha@123',
      })
      .expect(200);

    authToken = loginResponse.body.access_token;

    // Criar diretório de uploads se não existir
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  });

  afterAll(async () => {
    // Limpar arquivos de teste
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      files.forEach((file) => {
        fs.unlinkSync(path.join(uploadsDir, file));
      });
    }

    await app.close();
  });

  // =============================================
  // CENÁRIO 1: Upload bem-sucedido (Imagem JPEG)
  // =========api/v1/====================================
  it('deve fazer upload de uma imagem JPEG com sucesso', async () => {
    // Criar um buffer de imagem fake (1x1 pixel JPEG)
    const jpegBuffer = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
    ]);

    const response = await request(app.getHttpServer())
      .post('/api/v1/uploads')
      .set('Authorization', `Bearer ${authToken}`)
      .field('tipo', 'medicao')
      .field('descricao', 'Foto de evidência de excedente')
      .attach('file', jpegBuffer, 'evidencia.jpg');

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('url');
    expect(response.body.nome_original).toBe('evidencia.jpg');
    expect(response.body.mimetype).toBe('image/jpeg');
    expect(response.body.url).toContain('/uploads/');

    uploadId = response.body.id;

    // Verificar se o arquivo foi salvo no disco
    const filename = response.body.url.split('/uploads/')[1];
    const filePath = path.join(uploadsDir, filename);
    expect(fs.existsSync(filePath)).toBe(true);
  });

  // =============================================
  // CENÁRIO 2: Upload de arquivo não permitido (PDF)
  // =============================================
  it('deve rejeitar upload de arquivo não permitido (PDF)', async () => {
    const pdfBuffer = Buffer.from('%PDF-1.4');

    const response = await request(app.getHttpServer())
      .post('/api/v1/uploads')
      .set('Authorization', `Bearer ${authToken}`)
      .field('tipo', 'medicao')
      .attach('file', pdfBuffer, 'documento.pdf');

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Tipo de arquivo não permitido');
    expect(response.body).toHaveProperty('tipos_aceitos');
  });

  // =============================================
  // CENÁRIO 3: Upload sem arquivo anexado
  // =============================================
  it('deve rejeitar upload sem arquivo', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/uploads')
      .set('Authorization', `Bearer ${authToken}`)
      .field('tipo', 'medicao');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Forneça "file" (multipart) ou "file_base64" (JSON)');
  });

  // =============================================
  // CENÁRIO 4: Upload sem campo "tipo" obrigatório
  // =============================================
  it('deve rejeitar upload sem campo tipo', async () => {
    const jpegBuffer = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
    ]);

    const response = await request(app.getHttpServer())
      .post('/api/v1/uploads')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', jpegBuffer, 'teste.jpg');

    expect(response.status).toBe(201); // Tipo padrão "outro" quando não informado
  });

  // =============================================
  // CENÁRIO 5: Buscar upload por ID
  // =============================================
  it('deve buscar upload por ID', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/uploads/${uploadId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(uploadId);
    expect(response.body.nome_original).toBe('evidencia.jpg');
    expect(response.body.tipo).toBe('medicao');
  });

  // =============================================
  // CENÁRIO 6: Listar uploads por tipo
  // =============================================
  it('deve listar uploads por tipo', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/uploads?tipo=medicao')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0].tipo).toBe('medicao');
  });

  // =============================================
  // CENÁRIO 7: Listar uploads sem filtro (erro)
  // =============================================
  it('deve rejeitar listagem sem filtro', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/uploads')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Forneça "tipo" ou "id_relacionado"');
  });

  // =============================================
  // CENÁRIO 8: Deletar upload (apenas Gestor/Admin)
  // =============================================
  it('deve rejeitar deleção por Encarregado', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/api/v1/uploads/${uploadId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(403); // Forbidden
  });

  // =============================================
  // CENÁRIO 9: Upload com ID relacionado
  // =============================================
  it('deve fazer upload com id_relacionado', async () => {
    const jpegBuffer = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
    ]);

    const medicaoIdFake = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

    const response = await request(app.getHttpServer())
      .post('/api/v1/uploads')
      .set('Authorization', `Bearer ${authToken}`)
      .field('tipo', 'medicao')
      .field('id_relacionado', medicaoIdFake)
      .field('descricao', 'Foto relacionada à medição específica')
      .attach('file', jpegBuffer, 'medicao-foto.jpg');

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');

    // Buscar por id_relacionado
    const searchResponse = await request(app.getHttpServer())
      .get(`/api/v1/uploads?id_relacionado=${medicaoIdFake}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(searchResponse.status).toBe(200);
    expect(searchResponse.body.length).toBe(1);
    expect(searchResponse.body[0].id_relacionado).toBe(medicaoIdFake);
  });

  // =============================================
  // CENÁRIO 10: Upload de imagem PNG
  // =============================================
  it('deve fazer upload de imagem PNG', async () => {
    // PNG assinatura básica (1x1 pixel transparente)
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
      0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);

    const response = await request(app.getHttpServer())
      .post('/api/v1/uploads')
      .set('Authorization', `Bearer ${authToken}`)
      .field('tipo', 'obra')
      .attach('file', pngBuffer, 'planta.png');

    expect(response.status).toBe(201);
    expect(response.body.mimetype).toBe('image/png');
    expect(response.body.nome_original).toBe('planta.png');
  });
});
