import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as path from 'path';

export const typeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const databaseType = configService.get<string>('DATABASE_TYPE') || 'postgres';

  // Configuração para SQLite (desenvolvimento rápido)
  if (databaseType === 'sqlite') {
    return {
      type: 'sqlite',
      database: configService.get<string>('DATABASE_PATH') || path.join(process.cwd(), 'jb_pinturas.db'),
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
      synchronize: configService.get('DATABASE_SYNCHRONIZE') === 'true',
      dropSchema: configService.get('DATABASE_DROP_SCHEMA') === 'true',
      logging: configService.get('DATABASE_LOGGING') === 'true',
    };
  }

  // Configuração padrão para PostgreSQL (produção)
  return {
    type: 'postgres',
    host: configService.get<string>('DATABASE_HOST') || 'localhost',
    port: parseInt(configService.get<string>('DATABASE_PORT') || '5432', 10),
    username: configService.get<string>('DATABASE_USER') || 'postgres',
    password: configService.get<string>('DATABASE_PASSWORD') || 'postgres',
    database: configService.get<string>('DATABASE_NAME') || 'jb_pinturas',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    synchronize: configService.get('DATABASE_SYNCHRONIZE') === 'true',
    dropSchema: configService.get('DATABASE_DROP_SCHEMA') === 'true',
    logging: configService.get('DATABASE_LOGGING') === 'true',
    ssl: false,
    extra: {
      max: 20,
      connectionTimeoutMillis: 5000,
    },
  };
};
