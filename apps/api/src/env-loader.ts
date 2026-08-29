/**
 * Load .env.local from the project root in a portable way.
 *
 * Resolution order:
 *   1. `<cwd>/.env.local`
 *   2. `<cwd>/../../.env.local`  (monorepo workspaces where CWD = apps/api)
 *   3. `<cwd>/../.env.local`     (monorepo workspaces where CWD = apps/web)
 *
 * If none exist, no-op. In production (Railway, Vercel, Docker, etc.)
 * env vars are injected by the platform — dotenv is intentionally silent.
 */
import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const candidates = [
  resolve(process.cwd(), '.env.local'),
  resolve(process.cwd(), '../../.env.local'),
  resolve(process.cwd(), '../.env.local'),
];

for (const candidate of candidates) {
  if (existsSync(candidate)) {
    loadEnv({ path: candidate });
    break;
  }
}
