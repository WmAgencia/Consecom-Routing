/**
 * tenantScoped — the chokepoint for multi-tenant isolation.
 *
 * Every query function in this codebase that touches customer data MUST
 * receive a `ScopedDb` and use it instead of the raw `Db`. The wrapper
 * provides convenience methods that enforce `WHERE customer_id = $1`.
 *
 * Why this exists: a missing WHERE clause is the #1 cause of tenant data
 * leaks in SaaS apps. Centralizing the filter here makes that class of
 * bug impossible.
 */
import { eq, and, type SQL } from 'drizzle-orm';
import type { Db } from '../client.js';
import * as s from '../schema.js';

export interface ScopedDb {
  /** The raw db handle for queries that don't have a customer_id (admin, joins) */
  raw: Db;
  readonly customerId: string;

  // Read helpers
  getCustomer(): Promise<s.Customer | null>;
  getActiveSubscription(): Promise<{ subscription: s.Subscription; plan: s.Plan } | null>;
  getApiKeys(): Promise<s.ApiKey[]>;
  getApiKeyByPrefix(prefix: string): Promise<s.ApiKey | null>;
  getCreditBalance(): Promise<s.CreditBalance | null>;
  getCreditLedger(limit?: number): Promise<s.CreditLedgerEntry[]>;
  getUsageEvents(limit?: number): Promise<s.UsageEvent[]>;
  getRequestLogs(limit?: number): Promise<s.RequestLog[]>;

  // Write helpers
  insertCreditLedger(
    entry: Omit<s.CreditLedgerEntry, 'id' | 'customerId' | 'createdAt' | 'balanceAfter'> & {
      balanceAfter: number;
    },
  ): Promise<s.CreditLedgerEntry>;
  updateCreditBalance(delta: {
    available?: number;
    reserved?: number;
    used?: number;
  }): Promise<void>;
  revokeApiKey(id: string): Promise<void>;
}

export function tenantScoped(db: Db, customerId: string): ScopedDb {
  const _eqCustomer = (col: typeof s.customers.id) => eq(col, customerId);
  const _andEq = <T>(col: T) => and(_eqCustomer(col as typeof s.customers.id)) as SQL;

  return {
    raw: db,
    customerId,

    async getCustomer() {
      const rows = await db
        .select()
        .from(s.customers)
        .where(_eqCustomer(s.customers.id))
        .limit(1);
      return rows[0] ?? null;
    },

    async getActiveSubscription() {
      const rows = await db
        .select({ subscription: s.subscriptions, plan: s.plans })
        .from(s.subscriptions)
        .innerJoin(s.plans, eq(s.subscriptions.planId, s.plans.id))
        .where(
          and(
            eq(s.subscriptions.customerId, customerId),
            eq(s.subscriptions.status, 'active'),
          ),
        )
        .orderBy(s.subscriptions.startedAt)
        .limit(1);
      return rows[0] ?? null;
    },

    async getApiKeys() {
      return db
        .select()
        .from(s.apiKeys)
        .where(eq(s.apiKeys.customerId, customerId))
        .orderBy(s.apiKeys.createdAt);
    },

    async getApiKeyByPrefix(prefix: string) {
      const rows = await db
        .select()
        .from(s.apiKeys)
        .where(and(eq(s.apiKeys.keyPrefix, prefix), eq(s.apiKeys.customerId, customerId)))
        .limit(1);
      return rows[0] ?? null;
    },

    async getCreditBalance() {
      const rows = await db
        .select()
        .from(s.creditBalances)
        .where(eq(s.creditBalances.customerId, customerId))
        .limit(1);
      return rows[0] ?? null;
    },

    async getCreditLedger(limit = 100) {
      return db
        .select()
        .from(s.creditLedger)
        .where(eq(s.creditLedger.customerId, customerId))
        .orderBy(s.creditLedger.createdAt)
        .limit(limit);
    },

    async getUsageEvents(limit = 100) {
      return db
        .select()
        .from(s.usageEvents)
        .where(eq(s.usageEvents.customerId, customerId))
        .orderBy(s.usageEvents.createdAt)
        .limit(limit);
    },

    async getRequestLogs(limit = 100) {
      return db
        .select()
        .from(s.requestLogs)
        .where(eq(s.requestLogs.customerId, customerId))
        .orderBy(s.requestLogs.createdAt)
        .limit(limit);
    },

    async insertCreditLedger(entry) {
      const rows = await db
        .insert(s.creditLedger)
        .values({ ...entry, customerId })
        .returning();
      const row = rows[0];
      if (!row) throw new Error('credit_ledger insert returned no rows');
      return row;
    },

    async updateCreditBalance(delta) {
      // Read-modify-write wrapped in a transaction by callers when atomicity matters
      const existing = await db
        .select()
        .from(s.creditBalances)
        .where(eq(s.creditBalances.customerId, customerId))
        .for('update')
        .limit(1);
      const cur = existing[0];
      if (!cur) {
        await db.insert(s.creditBalances).values({
          customerId,
          creditsAvailable: delta.available ?? 0,
          creditsReserved: delta.reserved ?? 0,
          creditsUsed: delta.used ?? 0,
        });
        return;
      }
      await db
        .update(s.creditBalances)
        .set({
          creditsAvailable: cur.creditsAvailable + (delta.available ?? 0),
          creditsReserved: cur.creditsReserved + (delta.reserved ?? 0),
          creditsUsed: cur.creditsUsed + (delta.used ?? 0),
          updatedAt: new Date(),
        })
        .where(eq(s.creditBalances.customerId, customerId));
    },

    async revokeApiKey(id: string) {
      await db
        .update(s.apiKeys)
        .set({ status: 'revoked', revokedAt: new Date() })
        .where(and(eq(s.apiKeys.id, id), eq(s.apiKeys.customerId, customerId)));
    },
  };
}
