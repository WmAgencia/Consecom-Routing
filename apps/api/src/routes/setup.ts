import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomBytes } from 'node:crypto';
import { hash } from '@node-rs/argon2';
import * as schema from '@consecom/db';

const s: any = (schema as any).schema ?? schema;

export function registerSetupRoutes(app: FastifyInstance) {
  // POST /setup - Create initial data (only works if no users exist)
  app.post('/setup', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const existingAdmin = await app.db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, 'admin@consecom.local')
      });
      if (existingAdmin) return reply.status(400).send({ error: 'Already initialized' });

      const passwordHash = await hash('ChangeMe123!');
      await app.db.insert(s.users).values({
        email: 'admin@consecom.local',
        passwordHash,
        name: 'Consecom Admin',
        role: 'superadmin',
        status: 'active',
      });

      const userHash = await hash('Test123!');
      const [user] = await app.db.insert(s.users).values({
        email: 'test@consecom.com.br',
        passwordHash: userHash,
        name: 'Test User',
        role: 'user',
        status: 'active',
      }).returning();

      const [customer] = await app.db.insert(s.customers).values({
        userId: user.id,
        status: 'active',
      }).returning();

      await app.db.insert(s.balances).values({
        customerId: customer.id,
        creditsRemaining: 100000,
        creditsReserved: 0,
        lastUpdated: new Date(),
      });

      const keyPrefix = 'sk_cr_live_';
      const keyRandom = randomBytes(24).toString('base64url');
      const apiKey = keyPrefix + keyRandom;
      const prefix = keyPrefix + keyRandom.slice(0, 12);
      const keyHash = await hash(apiKey);

      await app.db.insert(s.apiKeys).values({
        customerId: customer.id,
        prefix,
        keyHash,
        name: 'Test API Key',
        status: 'active',
      });

      return reply.send({
        success: true,
        admin: { email: 'admin@consecom.local', password: 'ChangeMe123!' },
        user: { email: 'test@consecom.com.br', password: 'Test123!' },
        apiKey,
      });
    } catch (error) {
      return reply.status(500).send({ error: 'Setup failed' });
    }
  });

  // GET /setup - Check status
  app.get('/setup', async (req, reply) => {
    const users = await app.db.query.users.findMany();
    const apiKeys = await app.db.query.apiKeys.findMany();
    return reply.send({
      users: users.length,
      apiKeys: apiKeys.length,
      initialized: users.length > 0,
    });
  });

  // GET /setup/users
  app.get('/setup/users', async (req, reply) => {
    const users = await app.db.query.users.findMany({
      columns: { id: true, email: true, name: true, role: true, status: true, createdAt: true },
    });
    return reply.send({ users });
  });

  // POST /setup/fix-enums
  app.post('/setup/fix-enums', async (req, reply) => {
    try {
      const values = ['puter', 'openrouter', 'poyo'];
      const results: string[] = [];
      const { sql } = await import('drizzle-orm');
      for (const v of values) {
        try {
          await app.db.execute(sql.raw(`ALTER TYPE provider_code ADD VALUE IF NOT EXISTS '${v}'`));
          results.push(`${v}: ok`);
        } catch (err) {
          results.push(`${v}: ${(err as Error).message}`);
        }
      }
      return reply.send({ results });
    } catch (error) {
      return reply.status(500).send({ error: 'Fix enums failed', details: (error as Error).message });
    }
  });

  // POST /setup/create-provider
  app.post('/setup/create-provider', async (req: FastifyRequest<{ Body: { code: string; displayName: string; apiBaseUrl?: string } }>, reply) => {
    try {
      const body = req.body;
      if (!body.code || !body.displayName) return reply.status(400).send({ error: 'code, displayName required' });
      const apiBaseUrl = body.apiBaseUrl ?? `https://api.${body.code}.ai`;
      const [provider] = await app.db.insert(s.providers).values({
        code: body.code,
        displayName: body.displayName,
        status: 'active',
        apiBaseUrl,
        secretRef: body.code,
      }).onConflictDoUpdate({
        target: s.providers.code,
        set: { displayName: body.displayName, status: 'active', apiBaseUrl },
      }).returning();
      return reply.send({ ok: true, provider });
    } catch (error) {
      return reply.status(500).send({ error: 'create-provider failed', details: (error as Error).message });
    }
  });

  // POST /setup/create-model
  app.post('/setup/create-model', async (req: FastifyRequest<{ Body: { code: string; displayName: string; providerCode: string; inputPricePer1kCents: number; outputPricePer1kCents: number } }>, reply) => {
    try {
      const body = req.body;
      if (!body.code || !body.displayName || !body.providerCode) {
        return reply.status(400).send({ error: 'code, displayName, providerCode are required' });
      }
      const provider = await app.db.query.providers.findFirst({
        where: (p, { eq }) => eq(p.code, body.providerCode as any),
      });
      if (!provider) return reply.status(404).send({ error: `Provider ${body.providerCode} not found` });
      const [model] = await app.db.insert(s.models).values({
        code: body.code,
        displayName: body.displayName,
        providerId: provider.id,
        inputPricePer1kCents: body.inputPricePer1kCents ?? 100,
        outputPricePer1kCents: body.outputPricePer1kCents ?? 500,
        status: 'active',
        capabilities: { maxContextTokens: 200000, supportsVision: false, supportsTools: true, supportsStreaming: true },
      }).onConflictDoUpdate({
        target: s.models.code,
        set: {
          providerId: provider.id,
          displayName: body.displayName,
          inputPricePer1kCents: body.inputPricePer1kCents ?? 100,
          outputPricePer1kCents: body.outputPricePer1kCents ?? 500,
          status: 'active',
        },
      }).returning();
      return reply.send({ ok: true, model });
    } catch (error) {
      return reply.status(500).send({ error: 'Create model failed', details: (error as Error).message });
    }
  });

  // POST /setup/rotate-keys
  app.post('/setup/rotate-keys', async (req, reply) => {
    try {
      const { eq } = await import('drizzle-orm');
      const { encryptSecret } = await import('../lib/crypto.js');
      const envMap: Record<string, string | undefined> = {
        anthropic: process.env.ANTHROPIC_API_KEY,
        openrouter: process.env.OPENROUTER_API_KEY,
        puter: process.env.PUTER_AUTH_TOKEN,
        poyo: process.env.POYO_API_KEY,
      };
      const results: any[] = [];
      for (const [code, key] of Object.entries(envMap)) {
        if (!key) { results.push({ code, status: 'skipped (no env var)' }); continue; }
        const [provider] = await app.db.select().from(s.providers).where(eq(s.providers.code, code as any)).limit(1);
        if (!provider) { results.push({ code, status: 'provider not found' }); continue; }
        const encrypted = encryptSecret(key);
        await app.db.delete(s.providerSecrets).where(eq(s.providerSecrets.providerId, provider.id));
        await app.db.insert(s.providerSecrets).values({
          providerId: provider.id,
          encryptedKey: encrypted,
          keyHint: key.slice(-4),
        });
        results.push({ code, status: 'rotated', hint: key.slice(-4) });
      }
      return reply.send({ results });
    } catch (error) {
      return reply.status(500).send({ error: 'rotate failed', details: (error as Error).message });
    }
  });

  // GET /setup/debug-key
  app.get('/setup/debug-key', async (req, reply) => {
    try {
      const { eq } = await import('drizzle-orm');
      const [provider] = await app.db.select().from(s.providers).where(eq(s.providers.code, 'openrouter' as any)).limit(1);
      if (!provider) return reply.status(404).send({ error: 'openrouter provider not found' });
      const [secret] = await app.db.select().from(s.providerSecrets).where(eq(s.providerSecrets.providerId, provider.id)).limit(1);
      if (!secret) return reply.status(404).send({ error: 'no secret stored' });
      const { decryptSecret } = await import('../lib/crypto.js');
      const decrypted = decryptSecret(secret.encryptedKey);
      return reply.send({
        decryptedKeyPrefix: decrypted.slice(0, 20) + '...',
        decryptedKeyLength: decrypted.length,
        envVarPrefix: (process.env.OPENROUTER_API_KEY ?? '').slice(0, 20) + '...',
        envVarLength: (process.env.OPENROUTER_API_KEY ?? '').length,
        match: decrypted === process.env.OPENROUTER_API_KEY,
      });
    } catch (error) {
      return reply.status(500).send({ error: 'debug-key failed', details: (error as Error).message });
    }
  });
}
