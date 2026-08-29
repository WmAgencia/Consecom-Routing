import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  integer,
  bigint,
  numeric,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// =============================================================================
// ENUMS
// =============================================================================

export const userRoleEnum = pgEnum('user_role', ['customer', 'admin', 'superadmin']);
export const userStatusEnum = pgEnum('user_status', ['active', 'suspended', 'pending']);
export const customerStatusEnum = pgEnum('customer_status', ['active', 'suspended', 'banned']);
export const planCodeEnum = pgEnum('plan_code', ['TESTE', 'STARTER', 'PRO', 'POWER']);
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'expired',
  'cancelled',
  'pending_payment',
]);
export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'paid',
  'failed',
  'refunded',
]);
export const paymentGatewayEnum = pgEnum('payment_gateway', ['stripe', 'manual']);
export const apiKeyStatusEnum = pgEnum('api_key_status', ['active', 'revoked', 'expired']);
export const creditReasonEnum = pgEnum('credit_reason', [
  'purchase',
  'usage',
  'refund',
  'admin_adjustment',
  'expiry',
  'reservation_hold',
  'reservation_release',
]);
export const providerCodeEnum = pgEnum('provider_code', [
  'anthropic',
  'openai',
  'google',
  'groq',
]);
export const providerStatusEnum = pgEnum('provider_status', ['active', 'disabled', 'error']);
export const modelStatusEnum = pgEnum('model_status', ['active', 'disabled']);
export const usageStatusEnum = pgEnum('usage_status', ['success', 'error', 'rate_limited']);
export const auditTargetEnum = pgEnum('audit_target', [
  'customer',
  'plan',
  'model',
  'provider',
  'api_key',
  'subscription',
  'credit_balance',
]);

// =============================================================================
// TABLES
// =============================================================================

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    email: varchar('email', { length: 254 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    name: varchar('name', { length: 120 }).notNull(),
    doc: varchar('doc', { length: 20 }),
    role: userRoleEnum('role').notNull().default('customer'),
    status: userStatusEnum('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    emailUnique: uniqueIndex('users_email_unique').on(t.email),
    createdAtIdx: index('users_created_at_idx').on(t.createdAt.desc()),
  }),
);

export const customers = pgTable(
  'customers',
  {
    id: uuid('id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: customerStatusEnum('status').notNull().default('active'),
    rateLimitOverride: integer('rate_limit_override'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index('customers_status_idx').on(t.status),
  }),
);

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    userAgent: text('user_agent'),
    ip: varchar('ip', { length: 64 }),
  },
  (t) => ({
    tokenHashIdx: index('refresh_tokens_token_hash_idx').on(t.tokenHash),
    userIdIdx: index('refresh_tokens_user_id_idx').on(t.userId),
  }),
);

export const plans = pgTable(
  'plans',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    code: planCodeEnum('code').notNull().unique(),
    displayName: varchar('display_name', { length: 80 }).notNull(),
    priceCents: integer('price_cents').notNull(),
    durationDays: integer('duration_days').notNull(),
    credits: bigint('credits', { mode: 'number' }).notNull(),
    rateLimitPerMin: integer('rate_limit_per_min').notNull(),
    modelsAllowed: jsonb('models_allowed').$type<string[]>().notNull(),
    active: boolean('active').notNull().default(true),
    stripePriceId: varchar('stripe_price_id', { length: 120 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    codeIdx: index('plans_code_idx').on(t.code),
  }),
);

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    planId: uuid('plan_id')
      .notNull()
      .references(() => plans.id),
    status: subscriptionStatusEnum('status').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    customerStatusIdx: index('subscriptions_customer_status_idx').on(
      t.customerId,
      t.status,
    ),
    expiresAtIdx: index('subscriptions_expires_at_idx').on(t.expiresAt),
  }),
);

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    subscriptionId: uuid('subscription_id').references(() => subscriptions.id),
    gateway: paymentGatewayEnum('gateway').notNull().default('stripe'),
    gatewayPaymentId: varchar('gateway_payment_id', { length: 200 }).notNull(),
    gatewaySessionId: varchar('gateway_session_id', { length: 200 }),
    amountCents: integer('amount_cents').notNull(),
    currency: varchar('currency', { length: 8 }).notNull().default('BRL'),
    status: paymentStatusEnum('status').notNull().default('pending'),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    rawPayload: jsonb('raw_payload'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    gatewayPaymentIdIdx: uniqueIndex('payments_gateway_payment_id_idx').on(
      t.gatewayPaymentId,
    ),
    customerIdx: index('payments_customer_idx').on(t.customerId, t.createdAt.desc()),
  }),
);

export const stripeEvents = pgTable('stripe_events', {
  eventId: varchar('event_id', { length: 200 }).primaryKey(),
  eventType: varchar('event_type', { length: 120 }).notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }).notNull().defaultNow(),
  payload: jsonb('payload').notNull(),
});

export const apiKeys = pgTable(
  'api_keys',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 60 }).notNull(),
    keyHash: text('key_hash').notNull(),
    keyPrefix: varchar('key_prefix', { length: 40 }).notNull(),
    status: apiKeyStatusEnum('status').notNull().default('active'),
    rateLimitOverride: integer('rate_limit_override'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    requestCount: bigint('request_count', { mode: 'number' }).notNull().default(0),
  },
  (t) => ({
    /** Partial unique index: prefix + status=active. Revoked keys can be re-created. */
    prefixActiveIdx: uniqueIndex('api_keys_prefix_active_idx')
      .on(t.keyPrefix)
      .where(sql`status = 'active'`),
    customerIdx: index('api_keys_customer_idx').on(t.customerId, t.createdAt.desc()),
  }),
);

export const creditLedger = pgTable(
  'credit_ledger',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    delta: bigint('delta', { mode: 'number' }).notNull(),
    reason: creditReasonEnum('reason').notNull(),
    refType: varchar('ref_type', { length: 60 }),
    refId: varchar('ref_id', { length: 120 }),
    balanceAfter: bigint('balance_after', { mode: 'number' }).notNull(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    customerCreatedIdx: index('credit_ledger_customer_created_idx').on(
      t.customerId,
      t.createdAt.desc(),
    ),
  }),
);

export const creditBalances = pgTable('credit_balances', {
  customerId: uuid('customer_id')
    .primaryKey()
    .references(() => customers.id, { onDelete: 'cascade' }),
  creditsAvailable: bigint('credits_available', { mode: 'number' }).notNull().default(0),
  creditsReserved: bigint('credits_reserved', { mode: 'number' }).notNull().default(0),
  creditsUsed: bigint('credits_used', { mode: 'number' }).notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const providers = pgTable(
  'providers',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    code: providerCodeEnum('code').notNull().unique(),
    displayName: varchar('display_name', { length: 80 }).notNull(),
    status: providerStatusEnum('status').notNull().default('active'),
    apiBaseUrl: text('api_base_url').notNull(),
    secretRef: varchar('secret_ref', { length: 120 }),
    pricingConfig: jsonb('pricing_config'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    codeIdx: uniqueIndex('providers_code_idx').on(t.code),
  }),
);

export const providerSecrets = pgTable(
  'provider_secrets',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    providerId: uuid('provider_id')
      .notNull()
      .references(() => providers.id, { onDelete: 'cascade' }),
    encryptedKey: text('encrypted_key').notNull(),
    keyHint: varchar('key_hint', { length: 8 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    rotatedAt: timestamp('rotated_at', { withTimezone: true }),
  },
  (t) => ({
    providerIdx: uniqueIndex('provider_secrets_provider_idx').on(t.providerId),
  }),
);

export const models = pgTable(
  'models',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    code: varchar('code', { length: 120 }).notNull().unique(),
    displayName: varchar('display_name', { length: 120 }).notNull(),
    providerId: uuid('provider_id')
      .notNull()
      .references(() => providers.id),
    inputPricePer1kCents: integer('input_price_per_1k_cents').notNull(),
    outputPricePer1kCents: integer('output_price_per_1k_cents').notNull(),
    status: modelStatusEnum('status').notNull().default('active'),
    capabilities: jsonb('capabilities').$type<{
      maxContextTokens?: number;
      supportsVision?: boolean;
      supportsTools?: boolean;
      supportsStreaming?: boolean;
    }>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    codeIdx: uniqueIndex('models_code_idx').on(t.code),
    providerIdx: index('models_provider_idx').on(t.providerId),
  }),
);

export const usageEvents = pgTable(
  'usage_events',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    apiKeyId: uuid('api_key_id')
      .notNull()
      .references(() => apiKeys.id, { onDelete: 'cascade' }),
    modelId: uuid('model_id')
      .notNull()
      .references(() => models.id),
    providerId: uuid('provider_id')
      .notNull()
      .references(() => providers.id),
    requestId: varchar('request_id', { length: 60 }).notNull().unique(),
    inputTokens: integer('input_tokens').notNull(),
    outputTokens: integer('output_tokens').notNull(),
    totalTokens: integer('total_tokens').notNull(),
    creditsConsumed: bigint('credits_consumed', { mode: 'number' }).notNull(),
    costCents: integer('cost_cents').notNull(),
    latencyMs: integer('latency_ms').notNull(),
    status: usageStatusEnum('status').notNull(),
    errorCode: varchar('error_code', { length: 60 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    customerCreatedIdx: index('usage_events_customer_created_idx').on(
      t.customerId,
      t.createdAt.desc(),
    ),
    modelCreatedIdx: index('usage_events_model_created_idx').on(
      t.modelId,
      t.createdAt.desc(),
    ),
    requestIdIdx: uniqueIndex('usage_events_request_id_idx').on(t.requestId),
  }),
);

export const requestLogs = pgTable(
  'request_logs',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    requestId: varchar('request_id', { length: 60 }).notNull().unique(),
    customerId: uuid('customer_id').references(() => customers.id, {
      onDelete: 'set null',
    }),
    apiKeyId: uuid('api_key_id').references(() => apiKeys.id, {
      onDelete: 'set null',
    }),
    endpoint: varchar('endpoint', { length: 200 }).notNull(),
    method: varchar('method', { length: 10 }).notNull(),
    statusCode: integer('status_code').notNull(),
    latencyMs: integer('latency_ms').notNull(),
    errorCode: varchar('error_code', { length: 60 }),
    payloadMeta: jsonb('payload_meta'),
    ip: varchar('ip', { length: 64 }),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    customerCreatedIdx: index('request_logs_customer_created_idx').on(
      t.customerId,
      t.createdAt.desc(),
    ),
    statusCreatedIdx: index('request_logs_status_created_idx').on(
      t.statusCode,
      t.createdAt.desc(),
    ),
  }),
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    adminUserId: uuid('admin_user_id')
      .notNull()
      .references(() => users.id),
    action: varchar('action', { length: 80 }).notNull(),
    targetType: auditTargetEnum('target_type').notNull(),
    targetId: varchar('target_id', { length: 120 }),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    adminCreatedIdx: index('audit_logs_admin_created_idx').on(
      t.adminUserId,
      t.createdAt.desc(),
    ),
    targetIdx: index('audit_logs_target_idx').on(t.targetType, t.targetId),
  }),
);

// Inferred row types — exported for use across packages
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type Plan = typeof plans.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type CreditLedgerEntry = typeof creditLedger.$inferSelect;
export type CreditBalance = typeof creditBalances.$inferSelect;
export type Provider = typeof providers.$inferSelect;
export type ProviderSecret = typeof providerSecrets.$inferSelect;
export type Model = typeof models.$inferSelect;
export type UsageEvent = typeof usageEvents.$inferSelect;
export type NewUsageEvent = typeof usageEvents.$inferInsert;
export type RequestLog = typeof requestLogs.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
