import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import type { Db } from '@consecom/db';
import * as s from '@consecom/db';

/**
 * UsageService — records usage events and request logs.
 * One row per /v1/chat/completions call (success OR error).
 * `request_id` is the trace id that connects the log row to the ledger row.
 */
export class UsageService {
  constructor(private db: Db) {}

  async recordUsage(input: {
    customerId: string;
    apiKeyId: string;
    modelId: string;
    providerId: string;
    requestId: string;
    inputTokens: number;
    outputTokens: number;
    creditsConsumed: number;
    costCents: number;
    latencyMs: number;
    status: 'success' | 'error' | 'rate_limited';
    errorCode?: string;
  }): Promise<void> {
    await this.db.insert(s.usageEvents).values({
      id: randomUUID(),
      customerId: input.customerId,
      apiKeyId: input.apiKeyId,
      modelId: input.modelId,
      providerId: input.providerId,
      requestId: input.requestId,
      inputTokens: input.inputTokens,
      outputTokens: input.outputTokens,
      totalTokens: input.inputTokens + input.outputTokens,
      creditsConsumed: input.creditsConsumed,
      costCents: input.costCents,
      latencyMs: input.latencyMs,
      status: input.status,
      errorCode: input.errorCode ?? null,
    });
  }

  async recordRequest(input: {
    requestId: string;
    customerId: string | null;
    apiKeyId: string | null;
    endpoint: string;
    method: string;
    statusCode: number;
    latencyMs: number;
    errorCode?: string | undefined;
    payloadMeta?: Record<string, unknown> | undefined;
    ip?: string | undefined;
    userAgent?: string | undefined;
  }): Promise<void> {
    await this.db.insert(s.requestLogs).values({
      id: randomUUID(),
      requestId: input.requestId,
      customerId: input.customerId,
      apiKeyId: input.apiKeyId,
      endpoint: input.endpoint,
      method: input.method,
      statusCode: input.statusCode,
      latencyMs: input.latencyMs,
      errorCode: input.errorCode ?? null,
      payloadMeta: input.payloadMeta ?? null,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
    });
  }
}

/** Quick read of a model's row by code. */
export async function findModelByCode(db: Db, code: string) {
  const [m] = await db.select().from(s.models).where(eq(s.models.code, code)).limit(1);
  return m ?? null;
}
