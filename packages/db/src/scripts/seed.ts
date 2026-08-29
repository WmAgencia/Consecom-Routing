import { createDb } from '../client.js';
import * as s from '../schema.js';
import { sql } from 'drizzle-orm';
import { hash } from '@node-rs/argon2';
import { createCipheriv, randomBytes, hkdfSync } from 'node:crypto';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// Load .env.local from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../../.env.local') });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const db = createDb(url);

/**
 * Encrypt a provider API key for storage using AES-256-GCM.
 * Mirrors apps/api/src/lib/crypto.ts (kept inline so seed has no API dep).
 */
function encryptSecret(plaintext: string): string {
  const masterKey = process.env.MASTER_ENCRYPTION_KEY;
  if (!masterKey) throw new Error('MASTER_ENCRYPTION_KEY required for seed');
  const master = Buffer.from(masterKey, 'hex');
  // HKDF-SHA256 (matches the api/lib/crypto.ts derivation)
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
  console.log('[seed] starting ...');

  // ---------------------------------------------------------------------------
  // Providers
  // ---------------------------------------------------------------------------
  const [anthropic] = await db
    .insert(s.providers)
    .values({
      code: 'anthropic',
      displayName: 'Anthropic',
      status: 'active',
      apiBaseUrl: 'https://api.anthropic.com',
      secretRef: 'anthropic',
    })
    .onConflictDoNothing()
    .returning();

  if (anthropic) {
    console.log('[seed] provider anthropic created');
  }

  // ---------------------------------------------------------------------------
  // Provider secret — encrypt the Anthropic API key at rest
  // ---------------------------------------------------------------------------
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    const providerRow = (
      await db.select().from(s.providers).where(sql`code = 'anthropic'`).limit(1)
    )[0];
    if (providerRow) {
      const encryptedKey = encryptSecret(anthropicKey);
      await db
        .insert(s.providerSecrets)
        .values({
          providerId: providerRow.id,
          encryptedKey,
          keyHint: anthropicKey.slice(-4),
        })
        .onConflictDoNothing();
      console.log(`[seed] provider secret stored (hint: ...${anthropicKey.slice(-4)})`);
    }
  } else {
    console.warn('[seed] ANTHROPIC_API_KEY not set — provider secret NOT stored');
  }

  // ---------------------------------------------------------------------------
  // Models — Sonnet + Haiku available on TESTE; Opus disabled (future plans)
  // Prices in cents per 1k tokens (USD)
  // ---------------------------------------------------------------------------
  const modelRows = [
    {
      code: 'claude-sonnet-4-5',
      displayName: 'Claude Sonnet 4.5',
      inputPricePer1kCents: 300, // $3 / 1M input
      outputPricePer1kCents: 1500, // $15 / 1M output
      status: 'active' as const,
      capabilities: {
        maxContextTokens: 200_000,
        supportsVision: true,
        supportsTools: true,
        supportsStreaming: true,
      },
    },
    {
      code: 'claude-haiku-4-5',
      displayName: 'Claude Haiku 4.5',
      inputPricePer1kCents: 100, // $1 / 1M input
      outputPricePer1kCents: 500, // $5 / 1M output
      status: 'active' as const,
      capabilities: {
        maxContextTokens: 200_000,
        supportsVision: true,
        supportsTools: true,
        supportsStreaming: true,
      },
    },
    {
      code: 'claude-opus-4-5',
      displayName: 'Claude Opus 4.5',
      inputPricePer1kCents: 1500, // $15 / 1M input
      outputPricePer1kCents: 7500, // $75 / 1M output
      status: 'disabled' as const,
      capabilities: {
        maxContextTokens: 200_000,
        supportsVision: true,
        supportsTools: true,
        supportsStreaming: true,
      },
    },
  ];

  const providerId = (
    await db.select().from(s.providers).where(sql`code = 'anthropic'`).limit(1)
  )[0]?.id;

  if (!providerId) {
    throw new Error('Anthropic provider not found after insert');
  }

  for (const m of modelRows) {
    await db
      .insert(s.models)
      .values({ ...m, providerId })
      .onConflictDoNothing();
  }
  console.log(`[seed] ${modelRows.length} models upserted`);

  // ---------------------------------------------------------------------------
  // Plans — TESTE is the only active plan in MVP
  // ---------------------------------------------------------------------------
  await db
    .insert(s.plans)
    .values({
      code: 'TESTE',
      displayName: 'Teste',
      priceCents: 3000, // R$30
      durationDays: 3,
      credits: 100_000,
      rateLimitPerMin: 10,
      modelsAllowed: ['claude-sonnet-4-5', 'claude-haiku-4-5'],
      active: true,
    })
    .onConflictDoNothing();

  // Future plans — placeholders for Phase 5+
  for (const p of [
    {
      code: 'STARTER' as const,
      displayName: 'Starter',
      priceCents: 5900,
      durationDays: 30,
      credits: 1_000_000,
      rateLimitPerMin: 30,
      modelsAllowed: ['claude-sonnet-4-5', 'claude-haiku-4-5'],
      active: false,
    },
    {
      code: 'PRO' as const,
      displayName: 'Pro',
      priceCents: 9900,
      durationDays: 30,
      credits: 5_000_000,
      rateLimitPerMin: 60,
      modelsAllowed: ['claude-sonnet-4-5', 'claude-haiku-4-5', 'claude-opus-4-5'],
      active: false,
    },
    {
      code: 'POWER' as const,
      displayName: 'Power',
      priceCents: 19900,
      durationDays: 30,
      credits: 20_000_000,
      rateLimitPerMin: 100,
      modelsAllowed: ['claude-sonnet-4-5', 'claude-haiku-4-5', 'claude-opus-4-5'],
      active: false,
    },
  ]) {
    await db.insert(s.plans).values(p).onConflictDoNothing();
  }
  console.log('[seed] 4 plans upserted (only TESTE active)');

  // ---------------------------------------------------------------------------
  // Superadmin user
  // ---------------------------------------------------------------------------
  const adminEmail = 'admin@consecom.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';

  const existingAdmin = await db
    .select()
    .from(s.users)
    .where(sql`email = ${adminEmail}`)
    .limit(1);

  if (existingAdmin.length === 0) {
    const passwordHash = await hash(adminPassword);
    await db.insert(s.users).values({
      email: adminEmail,
      passwordHash,
      name: 'Consecom Admin',
      role: 'superadmin',
      status: 'active',
    });
    console.log(`[seed] superadmin created: ${adminEmail} / ${adminPassword}`);
    console.log('[seed] ⚠️  Change the admin password in production');
  } else {
    console.log('[seed] superadmin already exists, skipping');
  }

  console.log('[seed] done.');
  process.exit(0);
}

main().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
