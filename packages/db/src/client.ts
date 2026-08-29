import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema.js';

export type Db = ReturnType<typeof createDb>;

export function createDb(connectionString: string) {
  const client = postgres(connectionString, {
    max: 10,
    idle_timeout: 30,
    connect_timeout: 10,
    prepare: false, // Neon's pooler doesn't support prepared statements yet
    onnotice: () => {},
  });
  return drizzle(client, { schema });
}

export { schema };
