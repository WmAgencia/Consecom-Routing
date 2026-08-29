import 'dotenv/config';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const sql = postgres(url, { max: 1, prepare: false });

console.log('[reset] Dropping all tables in public schema ...');
await sql.unsafe(`
  DROP SCHEMA public CASCADE;
  CREATE SCHEMA public;
  GRANT ALL ON SCHEMA public TO public;
`);
console.log('[reset] Done. Now run `pnpm db:migrate` to recreate the schema.');
await sql.end();
