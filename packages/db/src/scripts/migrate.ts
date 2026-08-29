import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const sql = postgres(url, { max: 1, prepare: false });
const db = drizzle(sql);

console.log('[migrate] Running migrations from ./migrations ...');
await migrate(db, { migrationsFolder: './migrations' });
console.log('[migrate] Done.');
await sql.end();
