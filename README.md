# Consecom Routing

**SaaS AI API Gateway.** Customers get a single API key and consume AI models
through the Consecom Routing gateway — without ever touching the providers'
keys, billing, or rate limits.

```
Customer
   ↓  Authorization: Bearer sk_cr_live_xxx
Consecom Routing  (auth → subscription → credits → rate limit → model → cost)
   ↓
Provider  (Anthropic in MVP; OpenAI / Google / Groq pluggable later)
```

## Status

**MVP — Phase 1 in progress.** See `docs/SPEC.md` (in this repo) and the
plan in `~/.claude/plans/cached-crafting-llama.md` for the full blueprint.

## Stack

- **Frontend:** Next.js 14 (App Router), Tailwind, shadcn/ui
- **Backend:** Fastify 5, Node 24, TypeScript strict
- **Database:** Postgres (Neon free tier in dev)
- **ORM:** Drizzle + drizzle-kit
- **Auth:** JWT in httpOnly cookie, argon2id passwords
- **Billing:** Stripe (Checkout + webhooks)
- **AI Provider:** Anthropic SDK via a `ProviderAdapter` interface

## Quick start

### Prerequisites
- Node.js >= 24.4
- pnpm >= 9 (`npm install -g pnpm@9`)
- A free [Neon](https://neon.tech) Postgres database
- A [Stripe](https://stripe.com) test account
- An [Anthropic](https://console.anthropic.com) API key

### Setup
```bash
git clone https://github.com/WmAgencia/Consecom-Routing.git
cd Consecom-Routing
pnpm install
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL, JWT_SECRET, MASTER_ENCRYPTION_KEY,
# STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, ANTHROPIC_API_KEY
pnpm db:generate
pnpm db:migrate
pnpm seed
pnpm dev          # web on :3000, api on :3001
```

### Project layout

```
consecom-routing/
├── apps/
│   ├── web/                # Next.js — dashboard + master panel
│   └── api/                # Fastify — gateway + admin API
├── packages/
│   ├── shared/             # Zod schemas, types, ProviderAdapter interface
│   ├── db/                 # Drizzle schema + migrations + queries
│   ├── ui/                 # Shared React components
│   └── config/             # Shared TS / ESLint / Prettier configs
└── tooling/
    └── scripts/            # seed, db:reset, smoke-mvp, load-test
```

## Security

Provider API keys are stored encrypted (AES-256-GCM) and never leave the
backend. Customer API keys are stored as argon2id hashes; the full key is
shown **once** at creation. Multi-tenant isolation is enforced via a
`tenantScoped(db, customerId)` helper that requires `WHERE customer_id = $1`
on every query.

See `docs/SECURITY.md` (coming soon) for the full threat model.

## License

UNLICENSED — proprietary to Consecom / WmAgencia.
