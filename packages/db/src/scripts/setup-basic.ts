import { createDb } from '../client.js';
import * as s from '../schema.js';
import { hash } from '@node-rs/argon2';
import { createCipheriv, randomBytes, hkdfSync } from 'node:crypto';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const db = createDb(url);

// Generate API key
function generateApiKey() {
  const prefix = 'sk_cr_live_';
  const randomPart = randomBytes(24).toString('base64url');
  return prefix + randomPart;
}

function encryptSecret(plaintext: string): string {
  const masterKey = process.env.MASTER_ENCRYPTION_KEY;
  if (!masterKey) throw new Error('MASTER_ENCRYPTION_KEY required');
  const master = Buffer.from(masterKey, 'hex');
  const SALT = Buffer.from('consecom/provider-secrets/v1', 'utf8');
  const derived = hkdfSync('sha256', master, SALT, Buffer.from('cipher', 'utf8'), 32);
  const key = Buffer.from(derived);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, ct, tag]).toString('base64');
}

async function main() {
  console.log('[setup] starting...');

  // 1. Create superadmin
  const adminEmail = 'admin@consecom.local';
  const adminPassword = 'ChangeMe123!';
  const passwordHash = await hash(adminPassword);

  const [admin] = await db.insert(s.users).values({
    email: adminEmail,
    passwordHash,
    name: 'Consecom Admin',
    role: 'superadmin',
    status: 'active',
  }).onConflictDoUpdate({
    target: s.users.email,
    set: { passwordHash, name: 'Consecom Admin', role: 'superadmin', status: 'active' }
  }).returning();

  console.log(`[setup] admin: ${adminEmail} / ${adminPassword}`);

  // 2. Create provider (try anthropic first, skip if fails)
  try {
    await db.insert(s.providers).values({
      code: 'anthropic',
      displayName: 'Anthropic',
      status: 'active',
      apiBaseUrl: 'https://api.anthropic.com',
      secretRef: 'anthropic',
    }).onConflictDoNothing();
    console.log('[setup] provider anthropic created');
  } catch (e) {
    console.log('[setup] provider anthropic already exists, skipping');
  }

  // 3. Create test customer
  const customerEmail = 'test@consecom.com.br';
  const [customer] = await db.insert(s.users).values({
    email: customerEmail,
    passwordHash: await hash('Test123!'),
    name: 'Test User',
    role: 'user',
    status: 'active',
  }).onConflictDoUpdate({
    target: s.users.email,
    set: { name: 'Test User', status: 'active' }
  }).returning();

  // 4. Create customer record
  const [customerRecord] = await db.insert(s.customers).values({
    userId: customer.id,
    status: 'active',
  }).onConflictDoNothing().returning();

  // 5. Create balance
  await db.insert(s.balances).values({
    customerId: customerRecord.id,
    creditsRemaining: 100000,
    creditsReserved: 0,
    lastUpdated: new Date(),
  }).onConflictDoUpdate({
    target: s.balances.customerId,
    set: { creditsRemaining: 100000, creditsReserved: 0, lastUpdated: new Date() }
  });

  // 6. Create API key for test customer
  const keyPrefix = 'sk_cr_live_';
  const keyRandom = randomBytes(24).toString('base64url');
  const apiKey = keyPrefix + keyRandom;
  const prefix = keyPrefix + keyRandom.slice(0, 8);
  const keyHash = await hash(apiKey);

  await db.insert(s.apiKeys).values({
    customerId: customerRecord.id,
    prefix,
    keyHash,
    name: 'Test API Key',
    status: 'active',
  }).onConflictDoNothing();

  console.log(`[setup] test customer: ${customerEmail} / Test123!`);
  console.log(`[setup] API Key: ${apiKey}`);

  console.log('[setup] done!');
  process.exit(0);
}

main().catch((err) => {
  console.error('[setup] failed:', err);
  process.exit(1);
});
