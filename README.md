# Consecom Routing

**SaaS AI API Gateway.** Customers get a single API key and consume AI models
through the Consecom Routing gateway — without ever touching the providers'
keys, billing, or rate limits.

```
Customer
   ↓  Authorization: Bearer sk_cr_live_xxx
Consecom Routing  (auth → subscription → credits → rate limit → model → cost)
   ↓
Provider  (Consexom Nexxus proxy in MVP; OpenAI / Google / Groq pluggable)
```

## Status

**MVP completo.** Todas as 6 fases do spec implementadas e commitadas.

| Fase | Escopo | Estado |
|---|---|---|
| 1 | Scaffold + DB + auth | ✅ |
| 2 | Gateway + pipeline 12 passos | ✅ |
| 3 | Dashboard do cliente | ✅ |
| 4 | Stripe checkout + webhook | ✅ |
| 5 | Master Panel | ✅ |
| 6 | Polimento + testes + docs | ✅ |

17 testes unitários passando (5 no `@consecom/shared`, 12 no `@consecom/api`).
Build verde em todos os packages. Smoke E2E script pronto.

## Stack

- **Frontend:** Next.js 14 (App Router), Tailwind, TypeScript
- **Backend:** Fastify 5, Node 24, TypeScript strict
- **Database:** Postgres (Neon free tier em dev)
- **ORM:** Drizzle + drizzle-kit (16 tabelas, 14 do spec + 2 internas)
- **Auth:** JWT em cookie httpOnly, argon2id para senhas, namespaces separados para customer e admin
- **Billing:** Stripe (Checkout + webhooks com idempotência via `stripe_events`)
- **AI Provider:** SDK Anthropic apontando para proxy proprietário via `baseURL`
- **Rate limit:** in-memory sliding window atrás de `RateLimiterPort` (swap-in point p/ Redis)
- **Testes:** Vitest
- **Deploy:** Vercel (web) + Railway/Render (api)

## Quick start

### Pré-requisitos

- Node.js ≥ 24.4
- pnpm ≥ 9 (`npm install -g pnpm@9`)
- Postgres (Neon free tier é o mais simples)
- Conta Stripe com chave de teste
- Chave do provider Nexxus (já configurada no `.env.local` de dev)

### Setup

```bash
git clone https://github.com/WmAgencia/Consecom-Routing.git
cd Consecom-Routing
pnpm install
cp .env.example .env.local
# Editar .env.local com DATABASE_URL, JWT_SECRET, MASTER_ENCRYPTION_KEY,
# STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID_TESTE
pnpm db:migrate     # cria as 16 tabelas
pnpm seed           # popula provider, modelos, plano TESTE, superadmin
pnpm dev            # web:3000, api:3001
```

### Smoke test

```bash
# Em outro terminal, com a API rodando:
node tooling/scripts/smoke-e2e.mjs
```

Roda ~10 verificações de auth, models, e chat. Se o DB não estiver disponível,
executa apenas os checks independentes (health, /health/db com 503).

## Estrutura do projeto

```
consecom-routing/
├── apps/
│   ├── api/                # Fastify — gateway + admin API
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── health.ts
│   │   │   │   ├── auth.ts                  # /v1/auth/{register,login,me,logout,refresh}
│   │   │   │   ├── v1/
│   │   │   │   │   ├── chat.ts              # O pipeline de 12 passos
│   │   │   │   │   ├── models.ts            # /v1/models
│   │   │   │   │   ├── api-keys.ts          # CRUD de API keys
│   │   │   │   │   ├── usage.ts             # /v1/usage
│   │   │   │   │   └── billing.ts           # /v1/billing/* + webhook
│   │   │   │   └── admin/
│   │   │   │       ├── auth.ts              # /v1/admin/{login,logout,impersonate}
│   │   │   │       └── api.ts               # /v1/admin/{dashboard,customers,plans,...}
│   │   │   ├── services/
│   │   │   │   ├── api-key.ts               # argon2 + show-once
│   │   │   │   ├── credits.ts               # reserve/confirm/refund em FOR UPDATE
│   │   │   │   ├── subscription.ts          # gate de assinatura ativa
│   │   │   │   ├── usage.ts                 # usage_events + request_logs
│   │   │   │   ├── rate-limit.ts            # sliding window in-memory
│   │   │   │   └── billing.ts               # Stripe checkout + webhook
│   │   │   ├── providers/
│   │   │   │   └── anthropic/adapter.ts     # SDK Anthropic via Nexxus proxy
│   │   │   └── lib/
│   │   │       ├── auth.ts                  # JWT customer
│   │   │       ├── admin-auth.ts            # JWT admin (namespace separado)
│   │   │       ├── crypto.ts                # AES-256-GCM + HKDF
│   │   │       ├── provider-registry.ts     # factory de adapters
│   │   │       ├── stripe.ts                # singleton Stripe
│   │   │       └── errors.ts                # error handler padronizado
│   │   └── package.json
│   └── web/                # Next.js — dashboard cliente + master panel
│       └── src/app/
│           ├── (landing, register, login, docs)
│           ├── dashboard/   # 6 sub-rotas
│           └── admin/       # 5 sub-rotas
└── packages/
    ├── shared/             # Zod schemas, ProviderAdapter, error codes
    ├── db/                 # Drizzle schema + 16 tabelas + tenantScoped
    ├── ui/                 # cn() helper (base p/ shadcn)
    └── config/             # env config com checks dev/prod
```

## Arquitetura

### Pipeline de uma requisição (12 passos)

```
POST /v1/chat/completions
  │
  ├─ 1. Parse + validate request body (Zod)
  ├─ 2. Extract Bearer + lookup API key by prefix (índice)
  ├─ 3. argon2.verify the presented secret
  ├─ 4. Check subscription is active and not expired
  ├─ 5. Check credit balance > 0
  ├─ 6. Rate-limit consume (per api_key)
  ├─ 7. Validate model is allowed on the plan
  ├─ 8. Reserve credits (worst-case estimate × safety margin)
  ├─ 9. Call provider adapter (Anthropic / Nexxus proxy)
  ├─10. Record usage event (tokens, cost, latency)
  ├─11. Confirm reservation: deduct actual cost, release unused hold
  └─12. Log request + return OpenAI-compatible response
```

Qualquer falha no passo 9 faz `refund()` da reserva e registra um usage event com `status=error`. Sem race condition: o desconto é em transação `SELECT FOR UPDATE`.

### Multi-tenancy

`tenantScoped(db, customerId)` é o chokepoint para queries de customer.
Toda query que toca dados do cliente passa por ele, garantindo `WHERE customer_id = $1`.

### Separação de segredos

| Quem vê | O quê |
|---|---|
| Cliente | API key (mostrada 1x), saldo de créditos, próprio uso |
| Frontend web | Própria API key, saldo, uso — **nunca** vê secrets de provider |
| API backend | API key em cookie, secrets de provider descriptografados por request |
| Banco | API key = hash argon2; provider key = AES-256-GCM criptografado |

`MASTER_ENCRYPTION_KEY` é obrigatório em produção; o app se recusa a bootar com o valor padrão de dev.

### Provider abstraction

```typescript
interface ProviderAdapter {
  readonly id: 'anthropic' | 'openai' | 'google' | 'groq';
  readonly displayName: string;
  chat(req: ChatRequest, ctx: AdapterContext): Promise<ChatResponse>;
  estimateCost(req: ChatRequest, resp: ChatResponse): CostBreakdown;
  listModels(): ModelDescriptor[];
}
```

Adicionar OpenAI/Google/Groq = 1 arquivo em `apps/api/src/providers/<name>/adapter.ts` + 1 row em `providers`. O resto do sistema é provider-agnostic.

## Segurança

- ✅ API Keys com argon2id, show-once
- ✅ Provider keys criptografadas (AES-256-GCM + HKDF)
- ✅ Multi-tenancy enforced via `tenantScoped`
- ✅ CORS allowlist, Helmet headers, body size limit (1MB)
- ✅ Error responses padronizados (sem stack leak)
- ✅ Audit log em toda ação admin
- ✅ Stripe webhook signature verification + idempotência
- ✅ Rate limit por API key (configurável por plano)
- ✅ `FOR UPDATE` em qualquer operação de crédito
- ✅ `.env*` no `.gitignore` desde o commit 1

## Comandos úteis

```bash
pnpm dev              # web:3000 + api:3001
pnpm build            # build de todos os packages
pnpm typecheck        # tsc --noEmit em todos
pnpm test             # vitest em todos
pnpm db:generate      # drizzle-kit generate (cria SQL migrations)
pnpm db:migrate       # aplica migrations no DATABASE_URL
pnpm db:reset         # DROP + recreate schema (DESTRUTIVO)
pnpm seed             # popula provider, modelos, plano, superadmin
node tooling/scripts/smoke-e2e.mjs   # smoke E2E
```

## Não-objetivos (fora do MVP)

- Múltiplos providers ativos (só Anthropic/Nexxus hoje — adapter pronto p/ somar outros)
- Fallback entre providers
- LiteLLM
- Usage-based billing (cobrança variável)
- Projetos dentro de um customer
- Webhooks outbound
- Planos mensais recorrentes
- SSO / OAuth / 2FA
- Mobile app, i18n

## Próximos passos (pós-MVP)

Multi-provider simultâneo, fallback A→B→C, model routing inteligente
(custo/disponibilidade/latência), usage-based billing, projetos por cliente,
webhooks outbound, planos recorrentes, dashboard analytics, Sentry, load test.

## Licença

UNLICENSED — proprietário de Consecom / WmAgencia.
