import * as dotenv from 'dotenv';
import * as path from 'path';
import { DataSource } from 'typeorm';

const projectRoot = process.cwd();

// Carrega o .env antes de tudo (necessário para o CLI do TypeORM)
dotenv.config({ path: path.join(projectRoot, '.env') });

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'jb_pinturas',
  entities: [path.join(projectRoot, 'src/**/*.entity{.ts,.js}')],
  migrations: [path.join(projectRoot, 'database/migrations/*{.ts,.js}')],
  synchronize: false,
  logging: process.env.DATABASE_LOGGING === 'true',
  ssl: false,
});
