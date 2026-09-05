import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config as loadEnv } from 'dotenv';

// Load .env.local from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
loadEnv({ path: resolve(__dirname, '../../../../.env.local') });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const sql = postgres(url, { max: 1, prepare: false });

// ============================================================================
// PRE-MIGRATE: ensure required enum values exist (DDL is additive, idempotent)
// ============================================================================
console.log('[migrate] ensuring enum values exist...');

async function ensureEnumValue(enumName: string, value: string): Promise<void> {
  try {
    // Check if value exists
    const exists = await sql<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = ${enumName}
        AND e.enumlabel = ${value}
      ) as exists
    `;
    if (exists[0]?.exists) {
      console.log(`[migrate]   ${enumName}.${value} already exists`);
    } else {
      // ADD VALUE cannot run inside transaction, must be autocommit
      await sql.unsafe(`ALTER TYPE ${enumName} ADD VALUE IF NOT EXISTS '${value}'`);
      console.log(`[migrate]   ${enumName}.${value} added`);
    }
  } catch (err) {
    console.warn(`[migrate]   ${enumName}.${value} skipped:`, (err as Error).message);
  }
}

await ensureEnumValue('provider_code', 'puter');
await ensureEnumValue('provider_code', 'openrouter');
await ensureEnumValue('provider_code', 'poyo');

console.log('[migrate] Running migrations from ./migrations ...');
const db = drizzle(sql);
await migrate(db, { migrationsFolder: './migrations' });
console.log('[migrate] Done.');
await sql.end();
