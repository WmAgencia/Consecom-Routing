import { eq, and, desc, sql } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import { hash as argonHash, verify as argonVerify } from '@node-rs/argon2';
import type { Db } from '@consecom/db';
import * as s from '@consecom/db';
import { errors, type ApiKeyCreated, type ApiKeyPublic } from '@consecom/shared';

const KEY_PREFIX_PUBLIC = 'sk_cr_live_';
const SECRET_BYTES = 32;

export class ApiKeyService {
  constructor(private db: Db) {}

  /** Look up a key by its public prefix (fast indexed lookup). */
  async findByPrefix(presented: string): Promise<(s.ApiKey & { customerStatus: string }) | null> {
    const prefix = this.extractPrefix(presented);
    if (!prefix) return null;

    const rows = await this.db
      .select({
        key: s.apiKeys,
        customer: s.customers,
      })
      .from(s.apiKeys)
      .innerJoin(s.customers, eq(s.apiKeys.customerId, s.customers.id))
      .where(and(eq(s.apiKeys.keyPrefix, prefix), eq(s.apiKeys.status, 'active')))
      .limit(1);

    const row = rows[0];
    if (!row) return null;
    return { ...row.key, customerStatus: row.customer.status };
  }

  /** Verify the presented secret against the stored hash. */
  async verify(presented: string, storedHash: string): Promise<boolean> {
    try {
      return await argonVerify(storedHash, presented);
    } catch {
      return false;
    }
  }

  /** Mint a new key. Returns the FULL key (shown once). */
  async create(
    customerId: string,
    name: string,
    expiresInDays?: number,
  ): Promise<ApiKeyCreated> {
    if (!name.trim()) throw errors.validation('name is required');

    const secret = randomBytes(SECRET_BYTES).toString('base64url');
    const prefix = randomBytes(8).toString('hex'); // 16 chars
    const fullKey = `${KEY_PREFIX_PUBLIC}${prefix}_${secret}`;
    const keyHash = await argonHash(fullKey);
    const keyPrefix = `${KEY_PREFIX_PUBLIC}${prefix}`; // public prefix for lookup

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 86_400_000)
      : null;

    const [row] = await this.db
      .insert(s.apiKeys)
      .values({
        customerId,
        name: name.trim(),
        keyHash,
        keyPrefix,
        status: 'active',
        expiresAt,
        requestCount: 0,
      })
      .returning();
    if (!row) throw errors.internal('api key creation failed');

    return {
      id: row.id,
      name: row.name,
      keyPrefix: row.keyPrefix,
      status: row.status as 'active',
      createdAt: row.createdAt.toISOString(),
      expiresAt: row.expiresAt?.toISOString() ?? null,
      lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
      requestCount: row.requestCount,
      key: fullKey,
    };
  }

  async list(customerId: string): Promise<ApiKeyPublic[]> {
    const rows = await this.db
      .select()
      .from(s.apiKeys)
      .where(eq(s.apiKeys.customerId, customerId))
      .orderBy(desc(s.apiKeys.createdAt));
    return rows.map(toPublic);
  }

  async revoke(customerId: string, keyId: string): Promise<void> {
    const result = await this.db
      .update(s.apiKeys)
      .set({ status: 'revoked', revokedAt: new Date() })
      .where(and(eq(s.apiKeys.id, keyId), eq(s.apiKeys.customerId, customerId)))
      .returning({ id: s.apiKeys.id });
    if (result.length === 0) throw errors.notFound('api key not found');
  }

  /** Bump counters after a successful request. */
  async recordUsage(keyId: string): Promise<void> {
    await this.db
      .update(s.apiKeys)
      .set({
        lastUsedAt: new Date(),
        requestCount: sql`${s.apiKeys.requestCount} + 1`,
      })
      .where(eq(s.apiKeys.id, keyId));
  }

  private extractPrefix(presented: string): string | null {
    // "sk_cr_live_<16 hex chars>" — extract everything up to (and including) the prefix.
    if (!presented.startsWith(KEY_PREFIX_PUBLIC)) return null;
    const without = presented.slice(KEY_PREFIX_PUBLIC.length);
    const firstUnderscore = without.indexOf('_');
    if (firstUnderscore < 0) return null;
    const prefixPart = without.slice(0, firstUnderscore);
    if (prefixPart.length !== 16) return null;
    return `${KEY_PREFIX_PUBLIC}${prefixPart}`;
  }
}

export function toPublic(row: s.ApiKey): ApiKeyPublic {
  return {
    id: row.id,
    name: row.name,
    keyPrefix: row.keyPrefix,
    status: row.status as 'active' | 'revoked' | 'expired',
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt?.toISOString() ?? null,
    lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
    requestCount: row.requestCount,
  };
}

/** Parse the presented Authorization header → the raw key. */
export function extractBearer(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token.trim();
}
