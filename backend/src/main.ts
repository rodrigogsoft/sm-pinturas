import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import compression from 'compression';
import { join } from 'path';
import { Response } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // Servir arquivos estáticos (uploads)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Security headers com ajustes para ambiente de desenvolvimento/proxy.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(compression());
  // UTF-8 Charset middleware - ONLY for API routes (don't break Swagger UI)
  app.use((req: any, res: any, next: any) => {
    if (req.path.startsWith('/api/v') || (req.path.startsWith('/api/') && !req.path.includes('/docs'))) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    next();
  });

  // CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN')?.split(',') || '*',
    credentials: configService.get('CORS_CREDENTIALS') === 'true',
  });

  // Global prefix
  app.setGlobalPrefix(configService.get('API_PREFIX') || 'api');

  // Redirect root to API docs
  app.getHttpAdapter().get('/', (req: any, res: any) => {
    res.redirect('/api/docs');
  });

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global validation pipe
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

  // Swagger Documentation
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('SM Pinturas & Construções ERP API')
      .setDescription('API de Gestão de Obras - Sistema ERP SM Pinturas & Construções')
      .setVersion('1.0')
      .addTag('auth', 'Autenticação e Autorização')
      .addTag('usuarios', 'Gestão de Usuários')
      .addTag('obras', 'Gestão de Obras')
      .addTag('clientes', 'Gestão de Clientes')
      .addTag('colaboradores', 'Gestão de Colaboradores')
      .addTag('servicos', 'Catálogo de Serviços')
      .addTag('precos', 'Gestão de Preços')
      .addTag('sessoes', 'Sessões Diárias (RDO)')
      .addTag('alocacoes', 'Alocação de Tarefas')
      .addTag('medicoes', 'Medições e Produção')
      .addTag('financeiro', 'Módulo Financeiro')
      .addTag('notificacoes', 'Sistema de Notificações')
      .addTag('auditoria', 'Logs de Auditoria')
      .addTag('Uploads', 'Upload de Arquivos')
      .addTag('Relatórios', 'Relatórios e Dashboards Financeiros')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Token JWT de autenticação',
          in: 'header',
        },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    const port = configService.get('PORT') || 3000;
    console.log(`📚 Swagger documentation available at: http://localhost:${port}/api/docs`);
  }

  const port = configService.get('PORT') || 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`🌍 Environment: ${configService.get('NODE_ENV')}`);
}

bootstrap();
