import { createDb } from '../client.js';
import * as s from '../schema.js';
import { sql } from 'drizzle-orm';
import { hash } from '@node-rs/argon2';
import { createCipheriv, randomBytes, hkdfSync } from 'node:crypto';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config as loadEnv } from 'dotenv';

// Load .env.local from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
loadEnv({ path: resolve(__dirname, '../../../../.env.local') });

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
  // Provider: OpenRouter (gateway com ~5% markup sobre preços oficiais)
  // ---------------------------------------------------------------------------
  try {
    const [openrouter] = await db
      .insert(s.providers)
      .values({
        code: 'openrouter',
        displayName: 'OpenRouter',
        status: 'active',
        apiBaseUrl: 'https://openrouter.ai/api/v1',
        secretRef: 'openrouter',
      })
      .onConflictDoNothing()
      .returning();

    if (openrouter) {
      console.log('[seed] provider openrouter created');
    }
  } catch (err) {
    // Enum 'openrouter' may not exist yet - this is OK, will be added via migration
    console.warn('[seed] openrouter provider skipped (enum may not exist yet)');
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
  // Provider secret — encrypt the OpenRouter API key at rest
  // ---------------------------------------------------------------------------
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (openrouterKey) {
    const providerRow = (
      await db.select().from(s.providers).where(sql`code = 'openrouter'`).limit(1)
    )[0];
    if (providerRow) {
      const encryptedKey = encryptSecret(openrouterKey);
      await db
        .insert(s.providerSecrets)
        .values({
          providerId: providerRow.id,
          encryptedKey,
          keyHint: openrouterKey.slice(-4),
        })
        .onConflictDoNothing();
      console.log(`[seed] openrouter secret stored (hint: ...${openrouterKey.slice(-4)})`);
    }
  } else {
    console.warn('[seed] OPENROUTER_API_KEY not set — provider secret NOT stored');
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

  const anthropicProviderId = (
    await db.select().from(s.providers).where(sql`code = 'anthropic'`).limit(1)
  )[0]?.id;

  if (!anthropicProviderId) {
    throw new Error('Anthropic provider not found after insert');
  }

  const openrouterProviderId = (
    await db.select().from(s.providers).where(sql`code = 'openrouter'`).limit(1)
  )[0]?.id;

  if (!openrouterProviderId) {
    console.warn('[seed] OpenRouter provider not found — skipping openrouter models');
  }

  // Anthropic-direct models (existing models)
  const anthropicModelRows = [
    {
      code: 'claude-sonnet-4-5',
      displayName: 'Claude Sonnet 4.5',
      inputPricePer1kCents: 300,
      outputPricePer1kCents: 1500,
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
      inputPricePer1kCents: 100,
      outputPricePer1kCents: 500,
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
      inputPricePer1kCents: 1500,
      outputPricePer1kCents: 7500,
      status: 'disabled' as const,
      capabilities: {
        maxContextTokens: 200_000,
        supportsVision: true,
        supportsTools: true,
        supportsStreaming: true,
      },
    },
  ];

  for (const m of anthropicModelRows) {
    await db
      .insert(s.models)
      .values({ ...m, providerId: anthropicProviderId })
      .onConflictDoNothing();
  }

  // OpenRouter models (verified against openrouter.ai API — Sonnet 5 33% cheaper than direct!)
  const openrouterModelRows = [
    {
      code: 'claude-sonnet-5-openrouter',
      displayName: 'Claude Sonnet 5 (via OpenRouter)',
      inputPricePer1kCents: 200, // $2/1M (vs $3 direto)
      outputPricePer1kCents: 1000, // $10/1M (vs $15 direto)
      status: 'active' as const,
      capabilities: {
        maxContextTokens: 1_000_000,
        supportsVision: true,
        supportsTools: true,
        supportsStreaming: true,
      },
    },
    {
      code: 'claude-opus-5-openrouter',
      displayName: 'Claude Opus 5 (via OpenRouter)',
      inputPricePer1kCents: 500, // $5/1M (vs $5 direto, mesmo preço)
      outputPricePer1kCents: 2500, // $25/1M (vs $25 direto)
      status: 'active' as const,
      capabilities: {
        maxContextTokens: 1_000_000,
        supportsVision: true,
        supportsTools: true,
        supportsStreaming: true,
      },
    },
    {
      code: 'claude-haiku-4-5-openrouter',
      displayName: 'Claude Haiku 4.5 (via OpenRouter)',
      inputPricePer1kCents: 100, // $1/1M (mesmo preço)
      outputPricePer1kCents: 500, // $5/1M (mesmo preço)
      status: 'active' as const,
      capabilities: {
        maxContextTokens: 200_000,
        supportsVision: true,
        supportsTools: true,
        supportsStreaming: true,
      },
    },
    {
      code: 'claude-fable-5-1-openrouter',
      displayName: 'Claude Fable 5.1 (via OpenRouter)',
      inputPricePer1kCents: 1000, // $10/1M (vs $10 direto)
      outputPricePer1kCents: 5000, // $50/1M (vs $50 direto)
      status: 'active' as const,
      capabilities: {
        maxContextTokens: 1_000_000,
        supportsVision: true,
        supportsTools: true,
        supportsStreaming: true,
      },
    },
    {
      code: 'claude-opus-4-8-openrouter',
      displayName: 'Claude Opus 4.8 (via OpenRouter)',
      inputPricePer1kCents: 500, // $5/1M
      outputPricePer1kCents: 2500, // $25/1M
      status: 'active' as const,
      capabilities: {
        maxContextTokens: 1_000_000,
        supportsVision: true,
        supportsTools: true,
        supportsStreaming: true,
      },
    },
  ];

  console.log(`[seed] ${anthropicModelRows.length} anthropic models upserted`);

  // ---------------------------------------------------------------------------
  // Plans — time-based, unlimited usage during the contracted period.
  // Display names are user-facing; codes (STARTER/PRO/POWER/ENTERPRISE) are
  // the stable enum key.
  // ---------------------------------------------------------------------------
  const allPlans = [
    {
      code: 'STARTER' as const,
      displayName: 'Ilimitado 24h',
      priceCents: 2500,
      durationHours: 24,
      rateLimitPerMin: 30,
      modelsAllowed: [
        'claude-sonnet-4-5',
        'claude-haiku-4-5',
        'claude-sonnet-5-openrouter',
        'claude-haiku-4-5-openrouter',
      ],
      active: true,
    },
    {
      code: 'PRO' as const,
      displayName: 'Ilimitado 3 dias',
      priceCents: 4990,
      durationHours: 72,
      rateLimitPerMin: 60,
      modelsAllowed: [
        'claude-sonnet-4-5',
        'claude-haiku-4-5',
        'claude-sonnet-5-openrouter',
        'claude-opus-5-openrouter',
        'claude-haiku-4-5-openrouter',
      ],
      active: true,
    },
    {
      code: 'POWER' as const,
      displayName: 'Ilimitado 7 dias',
      priceCents: 10990,
      durationHours: 168,
      rateLimitPerMin: 100,
      modelsAllowed: [
        'claude-sonnet-4-5',
        'claude-haiku-4-5',
        'claude-sonnet-5-openrouter',
        'claude-opus-5-openrouter',
        'claude-haiku-4-5-openrouter',
        'claude-fable-5-1-openrouter',
        'claude-opus-4-8-openrouter',
      ],
      active: true,
    },
    {
      code: 'ENTERPRISE' as const,
      displayName: 'Ilimitado 30 dias',
      priceCents: 29990,
      durationHours: 720,
      rateLimitPerMin: 200,
      modelsAllowed: [
        'claude-sonnet-4-5',
        'claude-haiku-4-5',
        'claude-sonnet-5-openrouter',
        'claude-opus-5-openrouter',
        'claude-haiku-4-5-openrouter',
        'claude-fable-5-1-openrouter',
        'claude-opus-4-8-openrouter',
      ],
      active: true,
    },
    {
      code: 'TESTE' as const,
      displayName: 'Teste',
      priceCents: 0,
      durationHours: 72,
      rateLimitPerMin: 10,
      modelsAllowed: [
        'claude-sonnet-4-5',
        'claude-haiku-4-5',
        'claude-sonnet-5-openrouter',
        'claude-haiku-4-5-openrouter',
      ],
      active: false,
    },
  ];
  for (const p of allPlans) {
    await db
      .insert(s.plans)
      .values(p)
      .onConflictDoUpdate({
        target: s.plans.code,
        set: {
          displayName: p.displayName,
          priceCents: p.priceCents,
          durationHours: p.durationHours,
          rateLimitPerMin: p.rateLimitPerMin,
          modelsAllowed: p.modelsAllowed,
          active: p.active,
        },
      });
  }
  console.log(`[seed] ${allPlans.length} plans upserted (4 commercial active)`);

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
