'use strict';

/**
 * scripts/migrate.js
 *
 * Applies all pending SQL migration files in src/db/migrations/ in filename order.
 * Applied migrations are tracked in the schema_migrations table.
 *
 * Strategy:
 *   - Uses psql to execute each SQL file (handles multi-statement / BEGIN+COMMIT correctly).
 *   - Uses the pg pool only for tracking (schema_migrations table reads/writes).
 *   - psql binary path is auto-detected from common PostgreSQL install locations,
 *     or can be set via PSQL_BIN env var.
 *
 * Usage:
 *   node scripts/migrate.js            — apply pending migrations
 *   node scripts/migrate.js status     — list applied / pending migrations
 */

require('dotenv').config();

const fs            = require('fs');
const path          = require('path');
const { execFileSync } = require('child_process');
const { Pool }      = require('pg');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'src', 'db', 'migrations');

// ─── Resolve psql binary ──────────────────────────────────────────────────────
function findPsql() {
  if (process.env.PSQL_BIN) return process.env.PSQL_BIN;

  const candidates = [
    'C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe',
    'C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe',
    'C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe',
    '/usr/bin/psql',
    '/usr/local/bin/psql',
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(
    'psql not found. Set PSQL_BIN env var to the full path of your psql executable.'
  );
}

const PSQL_BIN = findPsql();
console.log(`ℹ️   Using psql: ${PSQL_BIN}`);

// ─── pg pool (tracking only) ──────────────────────────────────────────────────
const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id          SERIAL PRIMARY KEY,
      filename    VARCHAR(255) UNIQUE NOT NULL,
      applied_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

async function getApplied(client) {
  const { rows } = await client.query(
    'SELECT filename FROM schema_migrations ORDER BY filename'
  );
  return new Set(rows.map((r) => r.filename));
}

// ─── Execute SQL file via psql ────────────────────────────────────────────────
function runSqlFile(filePath) {
  const env = {
    ...process.env,
    PGPASSWORD: process.env.DB_PASSWORD,
  };

  execFileSync(
    PSQL_BIN,
    [
      '-U', process.env.DB_USER,
      '-h', process.env.DB_HOST,
      '-p', String(parseInt(process.env.DB_PORT, 10) || 5432),
      '-d', process.env.DB_NAME,
      '-v', 'ON_ERROR_STOP=1',   // abort on first SQL error
      '-f', filePath,
    ],
    { env, stdio: ['ignore', 'pipe', 'pipe'] }
  );
}

// ─── Commands ─────────────────────────────────────────────────────────────────
async function runMigrations() {
  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);
    const applied = await getApplied(client);

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    const pending = files.filter((f) => !applied.has(f));

    if (pending.length === 0) {
      console.log('✅  No pending migrations.');
      return;
    }

    for (const file of pending) {
      console.log(`▶  Applying: ${file}`);
      const filePath = path.join(MIGRATIONS_DIR, file);

      runSqlFile(filePath); // throws on any SQL error

      await client.query(
        'INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING',
        [file]
      );
      console.log(`✅  Applied:  ${file}`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

async function showStatus() {
  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);
    const applied = await getApplied(client);

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    console.log('\nMigration Status:');
    console.log('─'.repeat(50));
    for (const f of files) {
      const status = applied.has(f) ? '✅ applied' : '⏳ pending';
      console.log(`  ${status}  ${f}`);
    }
    console.log('─'.repeat(50));
  } finally {
    client.release();
    await pool.end();
  }
}

const command = process.argv[2];
if (command === 'status') {
  showStatus().catch((err) => { console.error(err); process.exit(1); });
} else {
  runMigrations().catch((err) => { console.error(err); process.exit(1); });
}
