# Railway Deploy

Monorepo deploys as **two services** from the same GitHub repo, each rooted at
its own app folder.

## 1. Create services

In Railway → New Project → Deploy from GitHub repo:

| Service | Source Config |
|---|---|
| `api` | Root Directory: `apps/api` |
| `web` | Root Directory: `apps/web` |

Railway reads `railway.toml` + `nixpacks.toml` from each service's root to
build with Node 24 + pnpm.

## 2. Add Postgres

Railway → + New → Database → Postgres. Copy the `DATABASE_URL` from the
plugin's Variables tab. In the `api` service Variables tab, click **Add
Reference Variable** → select `DATABASE_URL` from the Postgres plugin.

## 3. Run migrations + seed

After the `api` service has the `DATABASE_URL` linked, run once from the
Railway shell (or from local pointing at the production DB):

```bash
pnpm --filter @consecom/db migrate
pnpm --filter @consecom/db seed
```

This creates the 4 plans (Ilimitado 24h / 3d / 7d / 30d) and the
`admin@consecom.local` superadmin (default password `ChangeMe123!` — change
immediately after first login).

## 4. Custom domains

In Railway, for each service → **Settings** → **Networking** → **Custom
Domain** → Add:

- `api` service → `api.routing.consecom.com.br`
- `web` service → `routing.consecom.com.br`

Railway returns a CNAME target (e.g. `g05ns7.up.railway.app`) + a TXT
verification record. Add these in **Hostinger hPanel → DNS Zone Editor** for
`consecom.com.br`:

| Type | Host | Value |
|---|---|---|
| CNAME | `api.routing` | `<railway-cname>.up.railway.app` |
| CNAME | `routing` | `<railway-cname>.up.railway.app` |
| TXT | `_railway-verification.api.routing` | `<verification-token>` |
| TXT | `_railway-verification.routing` | `<verification-token>` |

Wait ~5min for Railway to verify; SSL (Let's Encrypt) auto-provisions once
the CNAME resolves.

## 5. Service Variables (Railway dashboard)

See [`.env.production.example`](.env.production.example) for the full list.
The two most important ones:

- **api service** → `PUBLIC_API_URL=https://api.routing.consecom.com.br`
- **web service** →
  - `PUBLIC_API_URL=https://api.routing.consecom.com.br` (for browser rewrites)
  - `API_URL=http://api.railway.internal:3001` (for the server-side admin proxy)

The `API_URL` is the internal Railway hostname — server-to-server traffic
stays on the Wireguard private network, never hits the public edge.

## 6. Verify

- `https://routing.consecom.com.br` → loads the marketing/dashboard
- `https://routing.consecom.com.br/admin/login` → login works
- Ativar / Gerar / Revogar from `/admin/customers/<id>` works without 401
- `https://api.routing.consecom.com.br/health` → `{ ok: true }`

## Notes

- `apps/api/src/env-loader.ts` loads `.env.local` from the cwd / parent dirs
  if it exists; otherwise it no-ops. In Railway there's no `.env.local` —
  env vars come from the platform, dotenv is silent.
- The API runs with `node --import tsx/esm src/main.ts` (not `node dist/`).
  The workspace packages `@consecom/db` and `@consecom/shared` ship as
  TypeScript source (`"main": "./src/index.ts"`), so tsx transpiles on the
  fly. This matches the local dev runtime exactly — what works locally
  works on Railway.
- The Web app builds with `output: 'standalone'` (Next.js), producing
  `.next/standalone/apps/web/server.js` which is what Railway runs.
- Cookies are `httpOnly: true`, `secure: true`, `sameSite: 'lax'`. The
  `__consecom_admin` cookie is scoped to `api.routing.consecom.com.br` (the
  origin that set it). The Next.js Route Handler at
  `/api/admin/proxy/[...path]` reads the cookie server-side and forwards it,
  so the browser never needs to send the cookie cross-subdomain.
- CORS is not required because the browser never calls the API directly —
  all `/v1/*` traffic is rewritten server-side by Next.js.
