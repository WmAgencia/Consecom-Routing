import postgres from 'postgres';
import { config as loadEnv } from 'dotenv';
import { randomBytes, createCipheriv, hkdfSync } from 'node:crypto';

loadEnv({ path: '../../apps/api/.env.local' });

const DB_URL = process.env.DATABASE_URL!;
const PUTER_TOKEN = process.env.PUTER_AUTH_TOKEN!;
const MASTER_KEY = process.env.MASTER_ENCRYPTION_KEY!;

if (!PUTER_TOKEN) { console.error('PUTER_AUTH_TOKEN not set'); process.exit(1); }
if (!MASTER_KEY || MASTER_KEY.length < 16) { console.error('MASTER_ENCRYPTION_KEY invalid'); process.exit(1); }

// AES-256-GCM + HKDF as used by lib/crypto.ts
function encrypt(plaintext: string, masterKey: string): string {
  const master = Buffer.from(masterKey, 'hex');
  if (master.length < 16) throw new Error('MASTER_ENCRYPTION_KEY must be >= 16 bytes');
  // HKDF-SHA256 — mirrors apps/api/src/lib/crypto.ts
  const SALT = Buffer.from('consecom/provider-secrets/v1', 'utf8');
  const derived = hkdfSync('sha256', master, SALT, Buffer.from('cipher', 'utf8'), 32);
  const key = Buffer.from(derived);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // iv ‖ ciphertext ‖ authTag  in base64 — matches seed.ts exactly
  return Buffer.concat([iv, ct, tag]).toString('base64');
}

const sql = postgres(DB_URL, { max: 1, prepare: false });

// Find puter provider
const [provider] = await sql`SELECT id FROM providers WHERE code = 'puter'`;
if (!provider) { console.error('puter provider not found'); process.exit(1); }

// Delete existing secret
await sql`DELETE FROM provider_secrets WHERE provider_id = ${provider.id}`;

// Insert with correct encryption
const encrypted = encrypt(PUTER_TOKEN, MASTER_KEY);
await sql`
  INSERT INTO provider_secrets (provider_id, encrypted_key, key_hint, created_at)
  VALUES (${provider.id}, ${encrypted}, ${PUTER_TOKEN.slice(-4)}, NOW())
`;
console.log('Puter secret updated successfully');

await sql.end();
