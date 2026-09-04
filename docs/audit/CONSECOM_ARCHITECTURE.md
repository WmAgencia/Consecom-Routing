# Auditoria — Consecom Routing

> Gerado em 2026-09-02 via auditoria read-only.
> Repo: `consecom-routing` (commit atual: 20c1da00a9244570e37d8e635723870175ba9c36)

---

## 1. Monorepo

**Package manager:** pnpm 9.15.0 (definido em `packageManager` do `package.json` raiz e `pnpm-workspace.yaml`)

**Apps:**
| App | Path | Stack |
|---|---|---|
| `@consecom/api` | `apps/api/` | Fastify 5 + Node 24 + TypeScript |
| `@consecom/web` | `apps/web/` | Next.js 14 + Tailwind + TypeScript |

**Packages:**
| Package | Path | Exports |
|---|---|---|
| `@consecom/shared` | `packages/shared/` | Zod schemas, `ProviderAdapter` interface, error codes, rate-limit port |
| `@consecom/db` | `packages/db/` | Drizzle schema (16 tabelas), `createDb`, `tenantScoped` |
| `@consecom/config` | `packages/config/` | Variaveis de ambiente validadas |
| `@consecom/ui` | `packages/ui/` | Helper `cn()` (clsx wrapper) |

**Tooling:**
- `tooling/scripts/` — script smoke-e2e (`smoke-e2e.mjs`)
- `turbo.json` — pipeline Turbo (build, dev, test, lint)
- `drizzle.config.ts` em `packages/db/` — migrations output para `./migrations`

**Orquestracao:** Turbo 2.10.12 (`turbo run dev/build/test`)

---

## 2. API

### Stack

| Camada | Tecnologia |
|---|---|
| Framework | Fastify 5.12.1 |
| Runtime | Node 24+ |
| Validação | Zod 3.25 |
| ORM | Drizzle 0.36 + postgres 3.4 |
| Auth (API keys) | argon2id (`@node-rs/argon2`) |
| Auth (sessions) | JWT via `jose` 5.x (HS256) |
| Logging | Pino 9.x (built-in do Fastify) |
| Billing | Stripe 17.x |
| HTTP client AI | `@anthropic-ai/sdk` 0.32 |
| Encriptacao segredos | AES-256-GCM + HKDF (`node:crypto`) |

### Rotas registradas

| Metodo | Path | Prefixo | Auth | Handler | Arquivo |
|---|---|---|---|---|---|
| GET | `/health` | - | publica | `registerHealthRoutes` | `src/routes/health.ts` |
| GET | `/health/db` | - | publica | `registerHealthRoutes` | `src/routes/health.ts` |
| POST | `/v1/auth/register` | `/v1/auth` | publica | `registerAuthRoutes` | `src/routes/auth.ts` |
| POST | `/v1/auth/login` | `/v1/auth` | publica | `registerAuthRoutes` | `src/routes/auth.ts` |
| POST | `/v1/auth/refresh` | `/v1/auth` | cookie | `registerAuthRoutes` | `src/routes/auth.ts` |
| POST | `/v1/auth/logout` | `/v1/auth` | cookie | `registerAuthRoutes` | `src/routes/auth.ts` |
| GET | `/v1/auth/me` | `/v1/auth` | cookie | `registerAuthRoutes` | `src/routes/auth.ts` |
| POST | `/v1/chat/completions` | `/v1` | Bearer API Key | `registerChatRoutes` | `src/routes/v1/chat.ts` |
| GET | `/v1/models` | `/v1` | Bearer API Key | `registerModelsRoutes` | `src/routes/v1/models.ts` |
| GET | `/v1/api-keys` | `/v1` | cookie | `registerApiKeyRoutes` | `src/routes/v1/api-keys.ts` |
| POST | `/v1/api-keys` | `/v1` | cookie | `registerApiKeyRoutes` | `src/routes/v1/api-keys.ts` |
| DELETE | `/v1/api-keys/:id` | `/v1` | cookie | `registerApiKeyRoutes` | `src/routes/v1/api-keys.ts` |
| GET | `/v1/usage` | `/v1` | cookie | `registerUsageRoutes` | `src/routes/v1/usage.ts` |
| GET | `/v1/billing/plan` | `/v1` | cookie | `registerBillingRoutes` | `src/routes/v1/billing.ts` |
| GET | `/v1/billing/active` | `/v1` | cookie | `registerBillingRoutes` | `src/routes/v1/billing.ts` |
| GET | `/v1/billing/plans` | `/v1` | publica | `registerBillingRoutes` | `src/routes/v1/billing.ts` |
| POST | `/v1/billing/checkout` | `/v1` | cookie | `registerBillingRoutes` | `src/routes/v1/billing.ts` |
| POST | `/v1/webhooks/stripe` | `/v1` | assinatura Stripe | `registerStripeWebhook` | `src/routes/v1/billing.ts` |
| POST | `/v1/admin/login` | `/v1` | publica | `registerAdminAuthRoutes` | `src/routes/admin/auth.ts` |
| POST | `/v1/admin/logout` | `/v1` | admin cookie | `registerAdminAuthRoutes` | `src/routes/admin/auth.ts` |
| POST | `/v1/admin/customers/:customerId/impersonate` | `/v1` | admin cookie | `registerAdminAuthRoutes` | `src/routes/admin/auth.ts` |
| GET | `/v1/admin/dashboard` | `/v1` | admin cookie | `registerAdminApi` | `src/routes/admin/api.ts` |
| GET | `/v1/admin/customers` | `/v1` | admin cookie | `registerAdminApi` | `src/routes/admin/api.ts` |
| GET | `/v1/admin/customers/:id` | `/v1` | admin cookie | `registerAdminApi` | `src/routes/admin/api.ts` |
| POST | `/v1/admin/customers/:id/toggle` | `/v1` | admin cookie | `registerAdminApi` | `src/routes/admin/api.ts` |
| POST | `/v1/admin/customers/:id/activate-plan` | `/v1` | admin cookie | `registerAdminApi` | `src/routes/admin/api.ts` |
| POST | `/v1/admin/customers/:id/api-keys` | `/v1` | admin cookie | `registerAdminApi` | `src/routes/admin/api.ts` |
| POST | `/v1/admin/customers/:id/credits` | `/v1` | admin cookie | `registerAdminApi` | `src/routes/admin/api.ts` |
| POST | `/v1/admin/api-keys/:id/revoke` | `/v1` | admin cookie | `registerAdminApi` | `src/routes/admin/api.ts` |
| GET | `/v1/admin/plans` | `/v1` | admin cookie | `registerAdminApi` | `src/routes/admin/api.ts` |
| POST | `/v1/admin/plans/:id` | `/v1` | admin cookie | `registerAdminApi` | `src/routes/admin/api.ts` |
| GET | `/v1/admin/models` | `/v1` | admin cookie | `registerAdminApi` | `src/routes/admin/api.ts` |
| POST | `/v1/admin/models/:id/toggle` | `/v1` | admin cookie | `registerAdminApi` | `src/routes/admin/api.ts` |
| GET | `/v1/admin/providers` | `/v1` | admin cookie | `registerAdminApi` | `src/routes/admin/api.ts` |
| GET | `/v1/admin/costs` | `/v1` | admin cookie | `registerAdminApi` | `src/routes/admin/api.ts` |
| GET | `/v1/admin/audit-logs` | `/v1` | admin cookie | `registerAdminApi` | `src/routes/admin/api.ts` |

**Total: 35 rotas**

### Providers existentes

| Provider | Arquivo | Modelos | Auth | Streaming |
|---|---|---|---|---|
| `anthropic` | `src/providers/anthropic/adapter.ts` | claude-sonnet-4-5, claude-haiku-4-5, claude-opus-4-5 (disabled) | API key via AES-256-GCM descriptografada por request; fallback para env `ANTHROPIC_API_KEY` em dev | declarado no `capabilities` mas streaming nao implementado (SSE nao existe) |

**Nota:** O enum em `packages/db/src/schema.ts` ja inclui `'openai' | 'google' | 'groq'` como `provider_code_enum`, mas apenas `anthropic` esta implementado.

### Model registry

Os modelos estao definidos em dois lugares:

1. **Banco de dados** — tabela `models` (via seed em `packages/db/src/scripts/seed.ts`):
   - `claude-sonnet-4-5` (active, $3/1M input, $15/1M output)
   - `claude-haiku-4-5` (active, $1/1M input, $5/1M output)
   - `claude-opus-4-5` (disabled, $15/1M input, $75/1M output)

2. **Codigo-fonte** — `src/providers/anthropic/adapter.ts` (hardcoded em `DEFAULT_MODELS`):
   - Mesmos 3 modelos com capacidades e precos declarados estaticamente

### Router / dispatch

**Arquivo principal:** `src/lib/provider-registry.ts`

**Classe:** `ProviderRegistry` — factory de adapters. O metodo `get(code)` retorna o adapter correspondente.

**Arquivo principal de roteamento:** `src/routes/v1/chat.ts:52` (`registerChatRoutes`)

**Logica de seleca:** O router atual **nao faz selacao dinamica de provider**. Esta hardcoded:

```typescript
// chat.ts linha 168
const apiKey = await providers.getApiKey('anthropic');
resp = await anthropicAdapter.chat(internalReq, { apiKey, requestId, signal });
```

O modelo determina qual provider usar? **Nao.** Esta 100% hardcoded para `anthropic`. O `ProviderRegistry.get()` aceita `'anthropic' | 'openai' | 'google' | 'groq'` como parametro, mas o chat route so passa `'anthropic'`.

### Auth

| Tipo | Metodo | Onde |
|---|---|---|
| API Key (cliente) | Bearer token + argon2id verify | `POST /v1/chat/completions`, `GET /v1/models` |
| Session (web) | JWT em cookie httpOnly (`__consecom_session`) | `POST /v1/auth/*`, `GET /v1/usage`, `GET /v1/billing/*`, CRUD api-keys |
| Admin session | JWT em cookie separado (`__consecom_admin`) | `/v1/admin/*` |
| Admin impersonation | Token gerado `base64url` (15min TTL) | `/v1/admin/customers/:customerId/impersonate` |
| Webhook | Assinatura `stripe-signature` | `POST /v1/webhooks/stripe` |

**JWT config:**
- Algoritmo: HS256
- Access TTL: 900s (15 min)
- Refresh TTL: 604800s (7 dias)
- Issuer: `consecom` (session), `consecom-admin` (admin)

### Rate limit

**Implementacao:** `InMemoryRateLimiter` em `src/services/rate-limit.ts`

- Sliding window in-memory por chave (`apikey:<id>`)
- Background sweep a cada 60s limpa registros com mais de 5min
- Limite por API key: definido no plano (`rateLimitPerMin`), com override por customer
- Headers de resposta: `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

**Swap point para Redis:** A interface `RateLimiterPort` em `packages/shared/src/rate-limit.ts` e o decorator `app.decorate('rateLimiter', rateLimiter)` em `src/main.ts:69` permitem troca por uma implementacao Redis sem alterar rotas.

### Creditos

| Componente | Detalhes |
|---|---|
| Tabela | `credit_balances` (materializada), `credit_ledger` (append-only log) |
| Servico | `CreditService` em `src/services/credits.ts` |
| Operacao | Reserve → Confirm/Refund (transacao `SELECT FOR UPDATE`) |
| Margem de seguranca | 1.5x (50% a mais que o worst-case) |
| Endpoints | Nenhum endpoint REST dedicado — operacoes sao internas ao chat pipeline |

Pipeline (12 passos em `src/routes/v1/chat.ts`):
1. Parse Zod → 2. Bearer lookup → 3. argon2.verify → 4. Subscription check
5. Balance pre-flight → 6. Rate limit → 7. Model allowed? → 8. Reserve credits
9. Call Anthropic → 10+11. Record usage + Confirm/Refund → 12. Return OpenAI shape

### Usage tracking

| Componente | Detalhes |
|---|---|
| Tabelas | `usage_events` (por chamada), `request_logs` (por requisicao HTTP) |
| Servico | `UsageService` em `src/services/usage.ts` |
| Campos logados | tokens, credits, cost, latency, status, errorCode, ip, userAgent |
| Endpoints | `GET /v1/usage` (cliente, com balance) |

### Billing

| Componente | Detalhes |
|---|---|
| Gateway | Stripe Checkout (`mode: 'payment'`) |
| Webhook | `checkout.session.completed`, `checkout.session.expired`, `payment_intent.payment_failed` |
| Idempotencia | Tabela `stripe_events` (por `eventId`) |
| Planos | 4 planos comerciais: STARTER (24h), PRO (3d), POWER (7d), ENTERPRISE (30d) |
| Precos | R$25 / R$49.90 / R$109.90 / R$299.90 |
| Ativacao manual | Admin pode ativar plano via `/v1/admin/customers/:id/activate-plan` (sem Stripe) |
| Checkout REST | `POST /v1/billing/checkout` — **temporariamente desativado** (stripe desabilitado) |

---

## 3. Web

### Framework

**Next.js 14.2.18** (App Router), TypeScript, Tailwind CSS 3.4, React 18.3

### Rotas (page.tsx / page.ts)

**Landing / Publico:**
- `src/app/page.tsx` — landing page principal
- `src/app/docs/page.tsx` — documentacao da API
- `src/app/login/page.tsx` — login de cliente
- `src/app/register/page.tsx` — registro de cliente
- `src/app/comunidade/page.tsx` — pagina comunidade

**Dashboard (cliente):**
- `src/app/dashboard/page.tsx` — dashboard principal
- `src/app/dashboard/layout.tsx` — layout com sidebar
- `src/app/dashboard/api-keys/page.tsx` — gerenciar chaves
- `src/app/dashboard/billing/page.tsx` — planos e checkout
- `src/app/dashboard/usage/page.tsx` — historico de uso
- `src/app/dashboard/models/page.tsx` — modelos disponiveis
- `src/app/dashboard/settings/page.tsx` — configuracoes

**Admin (Master Panel):**
- `src/app/admin/page.tsx` — dashboard admin
- `src/app/admin/layout.tsx` — layout admin
- `src/app/admin/login/page.tsx` — login admin separado
- `src/app/admin/customers/page.tsx` — lista de clientes
- `src/app/admin/customers/[id]/page.tsx` — detalhe de cliente
- `src/app/admin/plans/page.tsx` — gerenciar planos
- `src/app/admin/models/page.tsx` — gerenciar modelos
- `src/app/admin/costs/page.tsx` — analise de custos
- `src/app/admin/audit-logs/page.tsx` — logs de auditoria

**API routes (Next.js Route Handlers):**
- `src/app/api/auth/logout/route.ts` — logout do cliente
- `src/app/api/admin/logout/route.ts` — logout admin
- `src/app/api/admin/proxy/[...path]/route.ts` — proxy interno (cookie forwarding para a API via rede privada Railway)

**Total: 20+ paginas**

### Como o dashboard chama a API

`src/lib/api.ts` — `apiFetch<T>()`:
```typescript
const API_BASE = process.env.PUBLIC_API_URL ?? 'http://localhost:3001';
// Server-side: extrai cookies da request (Next.js cookies())
// Fetch: ${API_BASE}${path} com cookie header forwardado
```

### Auth no web

- Sessions em cookie httpOnly (`__consecom_session`) — mesmo cookie usado pela API
- `requireSession()` em `src/lib/api.ts:36` — server-side guard que redireciona para `/login` se 401
- Admin usa cookie separado `__consecom_admin`

---

## 4. Database

### ORM

**Drizzle ORM 0.36** + `postgres` 3.4 (driver) + `drizzle-kit` 0.28 (CLI de migrations)

### Tabelas (16 no total)

| Tabela | Colunas principais | Enum(s) |
|---|---|---|
| `users` | id, email, passwordHash, name, doc, role, status, deletedAt | user_role, user_status |
| `customers` | id (FK→users), status, rateLimitOverride, notes | customer_status |
| `refresh_tokens` | id, userId, tokenHash, expiresAt, revokedAt | - |
| `plans` | id, code, displayName, priceCents, durationHours, rateLimitPerMin, modelsAllowed, active | plan_code |
| `subscriptions` | id, customerId, planId, status, startedAt, expiresAt, cancelledAt | subscription_status |
| `payments` | id, customerId, subscriptionId, gateway, gatewayPaymentId, amountCents, currency, status, paidAt | payment_status, payment_gateway |
| `stripe_events` | eventId (PK), eventType, payload | - |
| `api_keys` | id, customerId, name, keyHash, keyPrefix, status, expiresAt, lastUsedAt, requestCount | api_key_status |
| `credit_balances` | customerId (PK), creditsAvailable, creditsReserved, creditsUsed | - |
| `credit_ledger` | id, customerId, delta, reason, refType, refId, balanceAfter, description | credit_reason |
| `providers` | id, code, displayName, status, apiBaseUrl, secretRef | provider_code, provider_status |
| `provider_secrets` | id, providerId, encryptedKey, keyHint, rotatedAt | - |
| `models` | id, code, displayName, providerId, inputPricePer1kCents, outputPricePer1kCents, status, capabilities | model_status |
| `usage_events` | id, customerId, apiKeyId, modelId, providerId, requestId, inputTokens, outputTokens, creditsConsumed, costCents, latencyMs, status | usage_status |
| `request_logs` | id, requestId, customerId, apiKeyId, endpoint, method, statusCode, latencyMs, errorCode, payloadMeta, ip, userAgent | - |
| `audit_logs` | id, adminUserId, action, targetType, targetId, metadata | audit_target |

### Migrations

- **Local:** `packages/db/migrations/` (gerado por `drizzle-kit generate`)
- **Comando dev:** `pnpm db:migrate` → `pnpm --filter @consecom/db migrate`
- **Seed:** `pnpm seed` → `packages/db/src/scripts/seed.ts` — popula providers, modelos, planos, superadmin

---

## 5. Pacotes compartilhados

| Package | Exports principais |
|---|---|
| `@consecom/shared` | `errors` (ErrorCode + ConsecomError), schemas Zod (`LoginSchema`, `RegisterSchema`, `ChatCompletionRequestSchema`, etc.), `ProviderAdapter` interface + `ChatRequest`/`ChatResponse`/`CostBreakdown`/`ModelDescriptor`/`AdapterContext`, `RateLimiterPort` + `RateLimitResult`, helpers `fromOpenAI`/`toOpenAI`/`estimateMaxCostCents` |
| `@consecom/db` | `createDb()`, `schema` (todas as tabelas + tipos inferidos), `tenantScoped()` |
| `@consecom/config` | `config` objeto com `ports`, `publicUrls`, `cookie`, `jwt`, `masterEncryptionKey`, `stripe`, `cors`, `rateLimits`; valida JWT_SECRET e MASTER_ENCRYPTION_KEY em prod |
| `@consecom/ui` | `cn()` helper (wrappa `clsx` + `tailwind-merge`) |

---

## 6. Variaveis de ambiente

| Var | Dominio | Onde e usada |
|---|---|---|
| `DATABASE_URL` | DB | `apps/api/src/main.ts`, `packages/db/src/client.ts` |
| `NODE_ENV` | Server | `packages/config/src/index.ts` (para checks dev/prod) |
| `API_PORT` | Server | `packages/config/src/index.ts` → `apps/api/src/main.ts` |
| `WEB_PORT` | Server | `packages/config/src/index.ts` |
| `PUBLIC_WEB_URL` | URL | `apps/api/src/services/billing.ts`, `packages/config` |
| `PUBLIC_API_URL` | URL | `packages/config`, `apps/web/src/lib/api.ts` |
| `COOKIE_DOMAIN` | Auth | `packages/config/src/index.ts` → `apps/api/src/main.ts` |
| `COOKIE_SECURE` | Auth | `packages/config/src/index.ts` → `apps/api/src/main.ts` |
| `JWT_SECRET` | Auth | `packages/config/src/index.ts` → `apps/api/src/lib/auth.ts`, `apps/api/src/lib/admin-auth.ts` |
| `JWT_ACCESS_TTL_SECONDS` | Auth | `packages/config/src/index.ts` |
| `JWT_REFRESH_TTL_SECONDS` | Auth | `packages/config/src/index.ts` |
| `MASTER_ENCRYPTION_KEY` | Crypto | `apps/api/src/lib/crypto.ts` (AES-256-GCM); valida em prod |
| `STRIPE_SECRET_KEY` | Billing | `apps/api/src/lib/stripe.ts`, `packages/config/src/index.ts` |
| `STRIPE_WEBHOOK_SECRET` | Billing | `apps/api/src/services/billing.ts` |
| `STRIPE_PRICE_ID_TESTE` | Billing | seed + billing |
| `STRIPE_PRICE_ID_STARTER` | Billing | `apps/api/src/services/billing.ts` |
| `STRIPE_PRICE_ID_PRO` | Billing | `apps/api/src/services/billing.ts` |
| `STRIPE_PRICE_ID_POWER` | Billing | `apps/api/src/services/billing.ts` |
| `STRIPE_PRICE_ID_ENTERPRISE` | Billing | `apps/api/src/services/billing.ts` |
| `ANTHROPIC_API_KEY` | Provider | `apps/api/src/lib/provider-registry.ts` (fallback dev) |
| `ANTHROPIC_BASE_URL` | Provider | `apps/api/src/providers/anthropic/adapter.ts` (default: api.anthropic.com) |
| `CORS_ALLOWED_ORIGINS` | CORS | `packages/config/src/index.ts` → `apps/api/src/main.ts` |
| `LOG_LEVEL` | Observabilidade | `apps/api/src/main.ts` (Fastify/Pino logger) |
| `SEED_ADMIN_PASSWORD` | Dev/Seed | `packages/db/src/scripts/seed.ts` (default: `ChangeMe123!`) |
| `NEXT_PUBLIC_API_URL` | Web | `apps/web/src/lib/api.ts` (browser-accessible API base) |

**Arquivos `.env*` encontrados:**
- `.env.example` — template com todas as vars
- `.env.local` — dev local (gitignored)
- `.env.production.example` — template de producao (Railway)
- `.env.production` — segredos reais de prod (gitignored)
- `apps/api/.env.local` — env da API (gitignored)
- `packages/db/.env.local` — herdado pelo seed

---

## 7. Testes

| Package | Framework | Local | Cobertura |
|---|---|---|---|
| `@consecom/api` | Vitest 2.1 | `apps/api/src/services/__tests__/` + `apps/api/src/lib/__tests__/` | 17 testes (rate-limit, api-key, crypto) |
| `@consecom/shared` | Vitest | `packages/shared/src/**/__tests__/` | 5 testes (providers, errors) |
| `@consecom/db` | Vitest | `packages/db/` | configurado mas nenhum teste encontrado |
| E2E smoke | Node script | `tooling/scripts/smoke-e2e.mjs` | Health, auth, models, chat completions |

**Comandos:**
```bash
pnpm test          # vitest run em todos os packages
node tooling/scripts/smoke-e2e.mjs  # smoke E2E contra API rodando
```

**Playwright:** NAO encontrado. Sem testes E2E automatizados de UI.

---

## 8. CI/CD

**GitHub Actions:** NAO ENCONTRADO em `.github/workflows/`

**Deploy:** Railway (2 servicos) + Vercel (historico)

| Servico | Plataforma | Root | Variavel chave |
|---|---|---|---|
| API | Railway | `apps/api/` | `DATABASE_URL` via Postgres plugin reference |
| Web | Railway | `apps/web/` | `NEXT_PUBLIC_API_URL`, `API_URL` (internal Railway network) |

**Railway configs:**
- `apps/api/railway.toml` + `apps/api/nixpacks.toml`
- `apps/web/railway.toml` + `apps/web/nixpacks.toml`
- Custom domains: `api.routing.consecom.com.br` e `routing.consecom.com.br`

**Vercel:** `.vercel/` presente (deploy historico provavelmente via Vercel)

**Build:**
```bash
pnpm build    # turbo run build (todos os packages)
# API: tsc build → output não especificado claramente (parece usar tsx inline)
# Web: next build com output: 'standalone'
```

---

## 9. Observabilidade

| Camada | Ferramenta | Onde |
|---|---|---|
| Logs | Pino (built-in Fastify) | `apps/api/src/main.ts:36` — nivel configuravel via `LOG_LEVEL` |
| Redacao | Pino redact | Authorization header, cookie, set-cookie |
| Error tracking | **NAO ENCONTRADO** | Sem Sentry, sem Datadog |
| Metricas | **NAO ENCONTRADO** | Sem Prometheus, sem OpenTelemetry |
| Tracing | **NAO ENCONTRADO** | Sem Jaeger, sem Zipkin |
| Health check | `/health` + `/health/db` | `apps/api/src/routes/health.ts` |

---

## 10. Pontos de extensao para novos providers

### 1. `packages/shared/src/providers/index.ts` — ProviderAdapter interface

Arquivo: `packages/shared/src/providers/index.ts`

A interface que todo provider deve implementar:
```typescript
export interface ProviderAdapter {
  readonly id: 'anthropic' | 'openai' | 'google' | 'groq';
  readonly displayName: string;
  chat(req: ChatRequest, ctx: AdapterContext): Promise<ChatResponse>;
  estimateCost(req: ChatRequest, resp: ChatResponse): CostBreakdown;
  listModels(): ModelDescriptor[];
}
```
**Ponto de injecao:** copiar esta interface e implementar em `apps/api/src/providers/<nome>/adapter.ts`.

### 2. `apps/api/src/lib/provider-registry.ts:26` — get()

Arquivo: `apps/api/src/lib/provider-registry.ts`

```typescript
get(code: 'anthropic' | 'openai' | 'google' | 'groq'): ProviderAdapter {
  const a = this.adapters.get(code);
  if (!a) throw new Error(`provider not registered: ${code}`);
  return a;
}
```
**Ponto de injecao:** adicionar `this.adapters.set('openai', new OpenAIAdapter(...))` no constructor. O `getApiKey()` ja suporta qualquer provider code.

### 3. `apps/api/src/routes/v1/chat.ts:168` — chamada hardcoded do Anthropic

Arquivo: `apps/api/src/routes/v1/chat.ts:168`

```typescript
const apiKey = await providers.getApiKey('anthropic');
resp = await anthropicAdapter.chat(internalReq, { apiKey, requestId, signal });
```
**Ponto de injecao:** este e o ponto de selacao dinamica. Trocar `'anthropic'` por uma funcao `selectProvider(model)` que olhe a tabela `models` + `providers` e retorne o provider correto.

### 4. `apps/api/src/routes/v1/models.ts:30-36` — query de modelos por provider

Arquivo: `apps/api/src/routes/v1/models.ts`

```typescript
const allModels = await db.select().from(s.models)
  .where(eq(s.models.status, 'active'));
const providerMap = new Map(
  (await db.select().from(s.providers)).map((p) => [p.id, p])
);
```
Ja faca o mapeamento provider->models. **Ponto de extensao:** adicionar filtro por `providerId` para `/v1/models?provider=openai`.

### 5. `packages/db/src/schema.ts:50-55` — enum provider_code + seed

Arquivo: `packages/db/src/schema.ts`

```typescript
export const providerCodeEnum = pgEnum('provider_code', [
  'anthropic', 'openai', 'google', 'groq',
]);
```
**Ponto de injecao:** o enum ja inclui todos os 4 providers. Para adicionar um novo provider, alem de implementar o adapter, basta inserir uma row em `providers` via seed ou migration.

---

## Riscos / debitos tecnicos observados

1. **Sem CI/CD em GitHub Actions.** Deploy einteiramente via Railway. Nao ha pipelines de lint/test/build em PR.

2. **Rate limiter em memoria (single-instance).** `InMemoryRateLimiter` perde estado em restart e nao funciona em multiplas instancias. Critico para escalar horizontalmente. Ja existe `RateLimiterPort` como swap point.

3. **Streaming SSE nao implementado.** O campo `stream: true` e aceito no schema mas o adapter nao trata — todas as respostas sao JSON. A interface `ProviderAdapter` tem `stream` em `ChatRequest` mas nenhum codigo o processa.

4. **Model registry duplicado.** Modelos estao definidos tanto em `src/providers/anthropic/adapter.ts` (hardcoded `DEFAULT_MODELS`) quanto na tabela `models` (via seed). Risco de dessincronizacao.

5. **Checkout desabilitado temporariamente.** `POST /v1/billing/checkout` lanca erro 500 com mensagem indicando desativacao temporaria. Plano atual e "tempo ilimitado" sem Stripe.

6. **Sem observabilidade.** Sem Sentry, sem metricas, sem tracing. Dificil diagnosticar erros em producao.

7. **Vercel + Railway (multi-plataforma).** O README menciona Vercel para web, mas ha arquivos `.vercel/` e `railway.toml`. Arquitetura de deploy pode estar confusa.

8. **Secret do Anthropic em fallback de env.** Se nao houver `provider_secrets` no DB, o sistema cai para `process.env.ANTHROPIC_API_KEY`. Funciona em dev, mas em prod pode ser um vetor de bypass se a criptografia nao estiver configurada corretamente.

9. **Sem testes E2E de UI.** Apenas smoke test via script Node. Sem Playwright/Cypress para o dashboard.

10. **Router hardcoded para Anthropic.** O sistema so chama `anthropic`. O enum, a interface e o registry suportam multiplos providers, mas o chat route nunca seleciona dinamicamente.
