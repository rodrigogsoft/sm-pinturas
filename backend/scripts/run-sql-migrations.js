const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { Client } = require('pg');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'database', 'migrations');
const TRACK_TABLE = 'tb_sql_migrations';

function getSqlMigrationFiles() {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.toLowerCase().endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));
}

async function ensureTrackingTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${TRACK_TABLE} (
      filename TEXT PRIMARY KEY,
      checksum TEXT NOT NULL,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

function checksum(content) {
  let hash = 0;
  for (let i = 0; i < content.length; i += 1) {
    hash = (hash * 31 + content.charCodeAt(i)) >>> 0;
  }
  return String(hash);
}

async function getExecutedMap(client) {
  const { rows } = await client.query(`SELECT filename, checksum FROM ${TRACK_TABLE}`);
  return new Map(rows.map((row) => [row.filename, row.checksum]));
}

async function hasLegacySchema(client) {
  const { rows } = await client.query(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('tb_perfis', 'tb_usuarios', 'tb_obras')
    ) AS has_schema
  `);

  return Boolean(rows[0]?.has_schema);
}

async function baseline(client, files) {
  for (const file of files) {
    const fullPath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(fullPath, 'utf8');
    const hash = checksum(sql);

    await client.query(
      `INSERT INTO ${TRACK_TABLE} (filename, checksum) VALUES ($1, $2)
       ON CONFLICT (filename) DO UPDATE SET checksum = EXCLUDED.checksum`,
      [file, hash],
    );
  }
}

async function applyMigration(client, file) {
  const fullPath = path.join(MIGRATIONS_DIR, file);
  const sql = fs.readFileSync(fullPath, 'utf8');
  const hash = checksum(sql);

  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query(
      `INSERT INTO ${TRACK_TABLE} (filename, checksum) VALUES ($1, $2)
       ON CONFLICT (filename) DO UPDATE SET checksum = EXCLUDED.checksum, executed_at = NOW()`,
      [file, hash],
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw new Error(`Falha ao aplicar ${file}: ${error.message}`);
  }
}

async function main() {
  const baselineOnly = process.argv.includes('--baseline');

  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT || 5432),
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'postgres',
  });

  await client.connect();

  try {
    await ensureTrackingTable(client);

    const files = getSqlMigrationFiles();
    if (files.length === 0) {
      console.log('Nenhuma migration SQL encontrada.');
      return;
    }

    const executedMap = await getExecutedMap(client);

    if (baselineOnly) {
      await baseline(client, files);
      console.log(`Baseline concluido com ${files.length} arquivo(s).`);
      return;
    }

    if (executedMap.size === 0) {
      const legacySchema = await hasLegacySchema(client);
      if (legacySchema) {
        await baseline(client, files);
        console.log(
          'Banco legado detectado sem rastreamento. Baseline aplicado para evitar reexecucao de migrations antigas.',
        );
        return;
      }
    }

    const pending = files.filter((file) => !executedMap.has(file));

    if (pending.length === 0) {
      console.log('Nenhuma migration pendente.');
      return;
    }

    for (const file of pending) {
      console.log(`Aplicando ${file}...`);
      await applyMigration(client, file);
      console.log(`OK: ${file}`);
    }

    console.log(`Concluido: ${pending.length} migration(s) aplicada(s).`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
