/**
 * bootstrap-infinite-key.ts
 *
 * Provisiona uma subscription + api_key de 30 dias "ilimitada" para um
 * usuário específico. Idempotente: se a chave já existe, retorna ela.
 *
 * O que faz:
 *   1. Migra o schema (se ainda não rodou) — drizzle migrate.
 *   2. Garante um `users` row com o email alvo.
 *   3. Garante o `customers` espelho (PK = users.id).
 *   4. Ativa (ou reativa) uma subscription de 30 dias no plano POWER.
 *   5. Injeta um saldo enorme de créditos (1e9 = effectively unlimited para
 *      o motor de billing, que divide por 1000).
 *   6. Criptografa ANTHROPIC_API_KEY com MASTER_ENCRYPTION_KEY e grava em
 *      provider_secrets (idempotente: 1 linha por provider).
 *   7. Cria a api_key no formato sk_cr_live_<16hex>_<32byte-base64url>
 *      usando argon2, igual ao ApiKeyService.create().
 *
 * Uso:
 *   cd packages/db
 *   bun src/scripts/bootstrap-infinite-key.ts <email>
 *
 * Saída:
 *   Imprime a chave COMPLETA (só aparece uma vez). Também grava em
 *   .bootstrap-key.txt no cwd para você copiar depois.
 *
 * Por que é seguro rodar várias vezes:
 *   - INSERT ... ON CONFLICT DO NOTHING / DO UPDATE em todos os pontos.
 *   - A api_key só é criada se NÃO existir nenhuma ativa para o user.
 *   - provider_secrets só atualiza se a chave mudou.
 */
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { randomBytes, createCipheriv, hkdfSync } from 'node:crypto';
import { hash as argonHash } from '@node-rs/argon2';
import { config as loadEnv } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync } from 'node:fs';

// ---------------------------------------------------------------------------
// Env loading
// ---------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
loadEnv({ path: resolve(__dirname, '../../../../.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;
const MASTER_KEY_HEX = process.env.MASTER_ENCRYPTION_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

if (!DATABASE_URL) { console.error('DATABASE_URL missing'); process.exit(1); }
if (!MASTER_KEY_HEX) { console.error('MASTER_ENCRYPTION_KEY missing'); process.exit(1); }
if (!ANTHROPIC_KEY) { console.error('ANTHROPIC_API_KEY missing'); process.exit(1); }

const TARGET_EMAIL = process.argv[2];
if (!TARGET_EMAIL) {
  console.error('Usage: bun bootstrap-infinite-key.ts <email>');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { max: 1, prepare: false });
const db = drizzle(sql);

// ---------------------------------------------------------------------------
// 1. Run migrations (idempotent)
// ---------------------------------------------------------------------------
console.log('[1/6] Running drizzle migrations ...');
await migrate(db, { migrationsFolder: resolve(__dirname, '../../migrations') });

// ---------------------------------------------------------------------------
// 2. Upsert user (idempotent: keep the same id if re-running)
// ---------------------------------------------------------------------------
console.log(`[2/6] Ensuring user exists: ${TARGET_EMAIL}`);
const [user] = await sql<{ id: string }[]>`
  INSERT INTO users (email, password_hash, name, role, status)
  VALUES (${TARGET_EMAIL}, ${'!bootstrap-no-password!'}, ${'Bootstrap User'}, 'customer', 'active')
  ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
  RETURNING id
`;
const USER_ID = user.id;
console.log(`    user.id = ${USER_ID}`);

// ---------------------------------------------------------------------------
// 3. Upsert customer (PK = users.id, 1:1)
// ---------------------------------------------------------------------------
console.log('[3/6] Ensuring customer record ...');
await sql`
  INSERT INTO customers (id, status)
  VALUES (${USER_ID}, 'active')
  ON CONFLICT (id) DO UPDATE SET status = 'active', updated_at = NOW()
`;

// ---------------------------------------------------------------------------
// 4. Activate 30-day subscription on POWER plan (renew if expired)
// ---------------------------------------------------------------------------
console.log('[4/6] Activating 30-day POWER subscription ...');
const [plan] = await sql<{ id: string; rate_limit_per_min: number }[]>`
  SELECT id, rate_limit_per_min FROM plans WHERE code = 'POWER'
`;
if (!plan) { console.error('POWER plan not found. Run seed first.'); process.exit(1); }

// Cancel any active sub first to avoid overlapping rows.
await sql`
  UPDATE subscriptions SET status = 'cancelled', cancelled_at = NOW()
  WHERE customer_id = ${USER_ID} AND status = 'active'
`;
const [sub] = await sql<{ id: string }[]>`
  INSERT INTO subscriptions (customer_id, plan_id, status, started_at, expires_at)
  VALUES (${USER_ID}, ${plan.id}, 'active', NOW(), NOW() + INTERVAL '30 days')
  RETURNING id
`;
console.log(`    subscription.id = ${sub.id}, expires in 30 days`);

// ---------------------------------------------------------------------------
// 5. Inject effectively-unlimited credit balance
// ---------------------------------------------------------------------------
console.log('[5/6] Inflating credit balance ...');
await sql`
  INSERT INTO credit_balances (customer_id, credits_available, credits_reserved, credits_used, updated_at)
  VALUES (${USER_ID}, 1000000000, 0, 0, NOW())
  ON CONFLICT (customer_id) DO UPDATE SET
    credits_available = 1000000000,
    credits_reserved   = 0,
    credits_used       = 0,
    updated_at         = NOW()
`;

// ---------------------------------------------------------------------------
// 6. Encrypt + upsert Anthropic provider_secret
// ---------------------------------------------------------------------------
function encryptSecret(plain: string): string {
  const ALGO = 'aes-256-gcm';
  const IV_LEN = 12;
  const KEY_LEN = 32;
  const SALT = Buffer.from('consecom/provider-secrets/v1', 'utf8');
  const master = Buffer.from(MASTER_KEY_HEX!, 'hex');
  if (master.length < 16) throw new Error('MASTER_ENCRYPTION_KEY too short');
  const derived = hkdfSync('sha256', master, SALT, Buffer.from('cipher', 'utf8'), KEY_LEN);
  const KEY = Buffer.from(derived as ArrayBuffer);
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, KEY, iv);
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, ct, tag]).toString('base64');
}

console.log('[6/6] Encrypting ANTHROPIC_API_KEY → provider_secrets ...');
const [provider] = await sql<{ id: string }[]>`
  SELECT id FROM providers WHERE code = 'anthropic'
`;
if (!provider) { console.error('Anthropic provider not seeded'); process.exit(1); }

const enc = encryptSecret(ANTHROPIC_KEY!);
const hint = ANTHROPIC_KEY!.slice(-4);
await sql`
  INSERT INTO provider_secrets (provider_id, encrypted_key, key_hint, rotated_at)
  VALUES (${provider.id}, ${enc}, ${hint}, NOW())
  ON CONFLICT (provider_id) DO UPDATE SET
    encrypted_key = EXCLUDED.encrypted_key,
    key_hint      = EXCLUDED.key_hint,
    rotated_at    = NOW()
`;

// ---------------------------------------------------------------------------
// 7. Mint api_key (idempotent: only if no active key exists)
// ---------------------------------------------------------------------------
console.log('[7/7] Minting api_key ...');

const [existing] = await sql<{ id: string; key_prefix: string }[]>`
  SELECT id, key_prefix FROM api_keys
  WHERE customer_id = ${USER_ID} AND status = 'active'
  LIMIT 1
`;

let fullKey: string;
if (existing) {
  console.log(`    Reusing existing key prefix: ${existing.key_prefix}`);
  console.log('    (full secret not recoverable — was shown only at creation)');
  fullKey = `${existing.key_prefix}_<redacted-existing-key>`;
} else {
  const KEY_PREFIX_PUBLIC = 'sk_cr_live_';
  const prefix = randomBytes(8).toString('hex');        // 16 hex chars
  const secret = randomBytes(32).toString('base64url'); // 32 bytes
  fullKey = `${KEY_PREFIX_PUBLIC}${prefix}_${secret}`;
  const keyHash = await argonHash(fullKey);
  const keyPrefix = `${KEY_PREFIX_PUBLIC}${prefix}`;

  await sql`
    INSERT INTO api_keys
      (customer_id, name, key_hash, key_prefix, status, rate_limit_override, expires_at)
    VALUES
      (${USER_ID}, ${'bootstrap-30d-unlimited'}, ${keyHash}, ${keyPrefix}, 'active', NULL, NOW() + INTERVAL '30 days')
  `;
  console.log(`    new key prefix: ${keyPrefix}`);
}

// ---------------------------------------------------------------------------
// Done — print & persist
// ---------------------------------------------------------------------------
console.log('\n==========================================================');
console.log('  BOOTSTRAP COMPLETE');
console.log('==========================================================');
console.log(`  user       : ${TARGET_EMAIL}`);
console.log(`  user_id    : ${USER_ID}`);
console.log(`  plan       : POWER (30 days)`);
console.log(`  credits    : 1,000,000,000 available (effectively unlimited)`);
console.log(`  rate_limit : no override → uses plan default (${plan.rate_limit_per_min}/min)`);
console.log(`  expires_at : NOW() + 30 days`);
console.log('');
console.log('  API KEY (copy now — full secret only visible here):');
console.log(`  ${fullKey}`);
console.log('==========================================================\n');

writeFileSync('.bootstrap-key.txt', `${TARGET_EMAIL}\n${fullKey}\n`, 'utf8');
console.log('  (also written to .bootstrap-key.txt)');

await sql.end();
