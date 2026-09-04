// Encrypt and store OpenRouter API key in provider_secrets table
// Usage: node packages/db/src/scripts/store-openrouter-secret.mjs

import { createCipheriv, randomBytes, hkdfSync } from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/junin/consecom-routing/packages/db/package.json');
const postgres = require('postgres');

const sql = postgres({
  host: 'db.lvrgonbeumbldzrqegtf.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Eqvpanp.050323',
});

const MASTER_KEY = process.env.MASTER_ENCRYPTION_KEY || 'b2d4a41e0f95975513948397da9ece38b4969035f13083269deb2127d722454b';
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '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';

function encrypt(plaintext) {
  const master = Buffer.from(MASTER_KEY, 'hex');
  const derived = hkdfSync(
    'sha256',
    master,
    Buffer.from('consecom/provider-secrets/v1'),
    Buffer.from('cipher'),
    32,
  );
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(derived), iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, ct, cipher.getAuthTag()]).toString('base64');
}

async function main() {
  // Get provider ID
  const res = await sql`SELECT id FROM providers WHERE code = 'openrouter'`;
  if (res.length === 0) {
    console.error('Provider openrouter not found. Run the seed first.');
    process.exit(1);
  }
  const providerId = res[0].id;

  // Delete existing secret
  await sql`DELETE FROM provider_secrets WHERE provider_id = ${providerId}`;

  // Insert encrypted secret
  const encrypted = encrypt(OPENROUTER_KEY);
  await sql`
    INSERT INTO provider_secrets (id, provider_id, encrypted_key, key_hint, created_at)
    VALUES (gen_random_uuid(), ${providerId}, ${encrypted}, ${OPENROUTER_KEY.slice(-4)}, NOW())
  `;

  console.log(`✓ OpenRouter secret stored (hint: ...${OPENROUTER_KEY.slice(-4)})`);
  await sql.end();
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
