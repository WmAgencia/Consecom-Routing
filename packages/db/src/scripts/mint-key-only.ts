/**
 * mint-key-only.ts
 *
 * Versão "cirúrgica" do bootstrap: NÃO mexe em user/customer/subscription/
 * credits/provider_secrets. Só cria uma nova api_key (e reusa uma existente
 * se já houver ativa).
 *
 * Quando usar:
 *   - Você JÁ tem tudo provisionado (subscription ativa, saldo cheio).
 *   - Só quer adicionar uma chave nova sem rodar o bootstrap completo.
 *   - Quer criar chaves de curta duração para CI/CD sem inflar nada.
 *
 * Uso:
 *   cd packages/db
 *   bun src/scripts/mint-key-only.ts <email>
 *
 * Saída:
 *   Imprime a chave completa (visível só uma vez).
 */
import postgres from 'postgres';
import { randomBytes } from 'node:crypto';
import { hash as argonHash } from '@node-rs/argon2';
import { config as loadEnv } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
loadEnv({ path: resolve(__dirname, '../../../../.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('DATABASE_URL missing'); process.exit(1); }

const TARGET_EMAIL = process.argv[2];
if (!TARGET_EMAIL) {
  console.error('Usage: bun mint-key-only.ts <email>');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { max: 1, prepare: false });

// ---------------------------------------------------------------------------
// Find user
// ---------------------------------------------------------------------------
const [user] = await sql<{ id: string }[]>`
  SELECT id FROM users WHERE email = ${TARGET_EMAIL}
`;
if (!user) {
  console.error(`User not found: ${TARGET_EMAIL}`);
  console.error('Run bootstrap-infinite-key.ts first to provision the full stack.');
  process.exit(1);
}
console.log(`[1/3] user.id = ${user.id}`);

// ---------------------------------------------------------------------------
// Verify customer + subscription are healthy
// ---------------------------------------------------------------------------
const [health] = await sql<{
  customer_status: string;
  sub_status: string | null;
  sub_expires_at: Date | null;
  credits_available: number;
}[]>`
  SELECT
    c.status AS customer_status,
    s.status AS sub_status,
    s.expires_at AS sub_expires_at,
    COALESCE(cb.credits_available, 0) AS credits_available
  FROM users u
  LEFT JOIN customers c ON c.id = u.id
  LEFT JOIN LATERAL (
    SELECT status, expires_at FROM subscriptions
    WHERE customer_id = u.id
    ORDER BY started_at DESC LIMIT 1
  ) s ON true
  LEFT JOIN credit_balances cb ON cb.customer_id = u.id
  WHERE u.id = ${user.id}
`;

if (!health || health.customer_status !== 'active') {
  console.error(`Customer is not active (status: ${health?.customer_status ?? 'missing'})`);
  console.error('Run bootstrap-infinite-key.ts to provision customer + subscription.');
  process.exit(1);
}

if (health.sub_status !== 'active') {
  console.warn(`⚠ Latest subscription status: ${health.sub_status ?? 'none'}`);
  console.warn('  Keys will be created but may fail at chat.ts step 4 (subscription check).');
}

if (health.credits_available <= 0) {
  console.warn(`⚠ Credit balance is ${health.credits_available} — keys will fail step 5.`);
}

console.log(`[2/3] subscription: ${health.sub_status ?? 'none'} (expires ${health.sub_expires_at?.toISOString() ?? 'n/a'})`);
console.log(`       credits_available: ${health.credits_available}`);

// ---------------------------------------------------------------------------
// Mint api_key
// ---------------------------------------------------------------------------
const KEY_PREFIX_PUBLIC = 'sk_cr_live_';
const prefix = randomBytes(8).toString('hex');
const secret = randomBytes(32).toString('base64url');
const fullKey = `${KEY_PREFIX_PUBLIC}${prefix}_${secret}`;
const keyHash = await argonHash(fullKey);
const keyPrefix = `${KEY_PREFIX_PUBLIC}${prefix}`;

const [row] = await sql<{ id: string; expires_at: Date | null }[]>`
  INSERT INTO api_keys
    (customer_id, name, key_hash, key_prefix, status, expires_at)
  VALUES
    (${user.id}, ${'mint-' + new Date().toISOString().slice(0, 10)}, ${keyHash}, ${keyPrefix}, 'active', NOW() + INTERVAL '30 days')
  RETURNING id, expires_at
`;

console.log(`[3/3] api_key created: ${row.id}`);

console.log('\n==========================================================');
console.log('  KEY MINTED');
console.log('==========================================================');
console.log(`  user       : ${TARGET_EMAIL}`);
console.log(`  prefix     : ${keyPrefix}`);
console.log(`  expires_at : ${row.expires_at.toISOString()}`);
console.log('');
console.log('  API KEY (copy now — full secret only visible here):');
console.log(`  ${fullKey}`);
console.log('==========================================================\n');

writeFileSync('.minted-key.txt', `${TARGET_EMAIL}\n${fullKey}\n`, 'utf8');
console.log('  (also written to .minted-key.txt)');

await sql.end();
